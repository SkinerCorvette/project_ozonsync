import os
import json
import datetime
import requests

from flask import Blueprint, jsonify, request, render_template
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import func, or_

from extensions import db
from models import Product, ProductChange, SyncLog, User, CartItem, Order, OrderItem, ActivityLog
from helpers import admin_required, log_activity, product_issue_summary, csv_response, product_snapshot, log_product_change
from time_utils import app_now

bp = Blueprint('sync', __name__)

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')
OZON_API_URL = "https://api-seller.ozon.ru"

if not OZON_CLIENT_ID or not OZON_API_KEY:
    print("⚠️ Предупреждение: OZON_CLIENT_ID или OZON_API_KEY не найдены.")
    


@bp.route('/api/products', methods=['GET'])
@login_required
@admin_required
def get_ozon_products():
    if not OZON_CLIENT_ID or not OZON_API_KEY:
        return jsonify({
            "message": "Ключи Ozon API не настроены. Проверьте файл .env.",
            "products": []
        }), 500

    headers = {
        "Client-Id": OZON_CLIENT_ID,
        "Api-Key": OZON_API_KEY,
        "Content-Type": "application/json"
    }

    products_to_frontend = []
    overwrite_manual = request.args.get('overwrite_manual', default=0, type=int) == 1
    overwrite_hidden = request.args.get('overwrite_hidden', default=0, type=int) == 1
    
    log = SyncLog(
        status='in_progress',
        user_id=current_user.id,
        started_at=app_now()
    )
    db.session.add(log)
    db.session.flush()

    try:
        # Получаем список offer_id товаров с помощью v3/product/list
        list_products_url = f"{OZON_API_URL}/v3/product/list"
        list_products_payload = {
            "filter": {"visibility": "ALL"},
            "last_id": "",
            "limit": 50
        }

        response_list = requests.post(list_products_url, headers=headers, json=list_products_payload)
        response_list.raise_for_status()
        ozon_list_data = response_list.json()

        if not isinstance(ozon_list_data, dict):
            print(f"Ошибка: Неожиданный формат ответа от Ozon API (v3/product/list). Ожидался dict, получено: {type(ozon_list_data)}")
            raise ValueError("Неожиданный формат ответа от Ozon API (v3/product/list)")

        products_raw_from_ozon = ozon_list_data.get('result', {}).get('items', [])

        if not isinstance(products_raw_from_ozon, list):
            print(f"Ошибка: Неожиданный формат данных в 'result.items' от Ozon API (v3/product/list). Ожидался list, получено: {type(products_raw_from_ozon)}")
            products_raw_from_ozon = [] 

        if not products_raw_from_ozon:
            return jsonify({"products": []})

        offer_ids_from_ozon = []
        for item in products_raw_from_ozon:
            if isinstance(item, dict) and 'offer_id' in item:
                offer_ids_from_ozon.append(item['offer_id'])
            else:
                print(f"Предупреждение: Пропущен элемент в списке товаров Ozon (v3/product/list) из-за некорректного формата или отсутствия 'offer_id': {item}")

        if not offer_ids_from_ozon:
            return jsonify({"products": []})

        # Получение детальной информации о товарах по айдишникам с первого эндпоинта
        info_products_url = f"{OZON_API_URL}/v3/product/info/list"
        info_products_payload = {"offer_id": offer_ids_from_ozon}

        response_info = requests.post(info_products_url, headers=headers, json=info_products_payload)
        response_info.raise_for_status()
        ozon_info_data = response_info.json()

        if not isinstance(ozon_info_data, dict):
            print(f"Ошибка: Неожиданный формат ответа от Ozon API (v3/product/info/list). Ожидался dict, получено: {type(ozon_info_data)}")
            raise ValueError("Неожиданный формат ответа от Ozon API (v3/product/info/list)")

        detailed_products_map = {}
        ozon_items_info = ozon_info_data.get('items', [])

        if not isinstance(ozon_items_info, list):
            print(f"Ошибка: Неожиданный формат данных в 'items' от Ozon API (v3/product/info/list). Ожидался list, получено: {type(ozon_items_info)}")
            ozon_items_info = [] 

        for item in ozon_items_info:
            if isinstance(item, dict) and 'offer_id' in item:
                detailed_products_map[item['offer_id']] = item
            else:
                print(f"Предупреждение: Пропущен элемент в списке детальной информации Ozon (v3/product/info/list) из-за некорректного формата или отсутствия 'offer_id': {item}")


        # Сохранение/обновление данных в БД и подготовка для фронта
        for ozon_item in products_raw_from_ozon:
            if not isinstance(ozon_item, dict) or 'offer_id' not in ozon_item:
                print(f"Предупреждение: Пропускаем элемент из списка товаров Ozon (v3/product/list) из-за некорректного формата: {ozon_item}")
                continue

            current_offer_id = ozon_item['offer_id']
            detail = detailed_products_map.get(current_offer_id)

            product_name = 'Название не указано'
            product_price_value = None
            product_image_url = None
            product_stock = None

            if detail: 
                product_name = detail.get('name') if isinstance(detail.get('name'), str) else 'Название не указано'
                potential_price = detail.get('price')
                if isinstance(potential_price, str):
                    try:
                        product_price_value = float(potential_price)
                    except ValueError:
                        print(f"Предупреждение: Не удалось преобразовать цену '{potential_price}' в число для offer_id {current_offer_id}.")
                elif isinstance(potential_price, (int, float)): 
                    product_price_value = float(potential_price)
                else:
                    print(f"Предупреждение: Некорректный формат цены для offer_id {current_offer_id}. Получено: {potential_price} (тип: {type(potential_price)})")

                potential_image_url = detail.get('primary_image')
                if isinstance(potential_image_url, str) and potential_image_url:
                    product_image_url = potential_image_url
                else:
                    images_list = detail.get('images')
                    if isinstance(images_list, list) and images_list:
                        first_image_url_candidate = images_list[0]
                        if isinstance(first_image_url_candidate, str) and first_image_url_candidate:
                            product_image_url = first_image_url_candidate
                        else:
                            print(f"Предупреждение: Некорректный формат первого элемента в списке 'images' для offer_id {current_offer_id}. Получено: {first_image_url_candidate} (тип: {type(first_image_url_candidate)})")
                    else:
                        print(f"Предупреждение: Нет поля 'primary_image' и список 'images' пуст или некорректен для offer_id {current_offer_id}.")
                        
                stocks_block = detail.get('stocks')
                if isinstance(stocks_block, dict):
                    stocks_list = stocks_block.get('stocks')
                    if isinstance(stocks_list, list):
                        total = 0
                        has_any = False
                        for s in stocks_list:
                            if not isinstance(s, dict):
                                continue
                            present = s.get('present', 0)
                            reserved = s.get('reserved', 0)

                            try:
                                present = int(present)
                            except (TypeError, ValueError):
                                present = 0

                            try:
                                reserved = int(reserved)
                            except (TypeError, ValueError):
                                reserved = 0

                            total += max(present - reserved, 0)
                            has_any = True

                        product_stock = total if has_any else None

            else: 
                print(f"Предупреждение: Детальная информация не найдена для offer_id: {current_offer_id}. Попытка взять из БД.")
            

            # Поиск товара в БД
            existing_product = Product.query.filter_by(offer_id=current_offer_id).first()

            if existing_product:
                # 1) Скрытые товары: не трогаем, если пользователь не разрешил overwrite_hidden
                if existing_product.is_hidden and not overwrite_hidden:
                    continue

                # 2) Ручные правки: не трогаем, если пользователь не разрешил overwrite_manual
                if existing_product.is_manual and not overwrite_manual:
                    continue

                # Если overwrite_hidden включен — возвращаем товар из архива
                if existing_product.is_hidden and overwrite_hidden:
                    existing_product.is_hidden = False

                # Если overwrite_manual включен — сбрасываем ручной флаг
                if existing_product.is_manual and overwrite_manual:
                    existing_product.is_manual = False

                # Обновляем данные с Ozon
                existing_product.product_id = ozon_item.get('product_id')
                existing_product.name = product_name
                existing_product.price = product_price_value
                existing_product.image_url = product_image_url
                existing_product.last_synced = app_now()
                existing_product.stock = product_stock

                print(f"Updated product: {current_offer_id}")
                products_to_frontend.append(existing_product.to_dict())
                    
            else:
                # Если еще в бд не существует, создаем
                new_product = Product(
                    product_id=ozon_item.get('product_id'),
                    offer_id=current_offer_id,
                    name=product_name,
                    price=product_price_value,
                    stock=product_stock,
                    image_url=product_image_url,
                    last_synced=app_now(),
                    is_hidden=False,
                    is_manual=False,
                    source='ozon'
                )
                db.session.add(new_product)
                print(f"Added new product: {current_offer_id}")
                products_to_frontend.append(new_product.to_dict())

        db.session.commit()
        
        log.status = 'success'
        log.updated_count = len(products_to_frontend)
        log.finished_at = app_now()
        log_activity('sync_success', 'sync_log', f'Синхронизация с Ozon завершена. Обновлено товаров: {len(products_to_frontend)}', log.id)
        db.session.commit()

    except requests.exceptions.RequestException as e:
        print(f"Ошибка при запросе к Ozon API: {e}")
        
        log.status = 'error'
        log.error_message = str(e)
        log.updated_count = len(products_to_frontend)
        log.finished_at = app_now()
        db.session.commit()
        
        print("Произошла ошибка с Ozon API, попытка загрузить товары из базы данных.")
        try:
            products_from_db = Product.query.order_by(Product.last_synced.desc()).limit(50).all()
            if products_from_db:
                products_to_frontend = [p.to_dict() for p in products_from_db]
                return jsonify({"products": products_to_frontend})
            else:
                return jsonify({"error": f"Ошибка с подключением к Ozon API: {str(e)}. В базе данных нет данных.", "products": []}), 500
        except Exception as db_e:
            print(f"Ошибка при попытке получить данные из БД после сбоя Ozon: {db_e}")
            return jsonify({"error": f"Ошибка подключения к Ozon API: {str(e)}. Также не удалось получить данные из БД.", "products": []}), 500

    except Exception as e:
        print(f"Неизвестная ошибка на сервере: {e}")
        log.status = 'error'
        log.error_message = str(e)
        log.updated_count = len(products_to_frontend)
        log.finished_at = app_now()
        db.session.commit()
        # Пробуем вернуть из БД
        print("Произошла внутренняя ошибка, попытка загрузить товары из базы данных.")
        try:
            products_from_db = Product.query.order_by(Product.last_synced.desc()).limit(50).all()
            if products_from_db:
                products_to_frontend = [p.to_dict() for p in products_from_db]
                return jsonify({"products": products_to_frontend})
            else:
                return jsonify({"error": f"Произошла внутренняя ошибка сервера: {str(e)}. В базе данных нет данных.", "products": []}), 500
        except Exception as db_e:
            print(f"Ошибка при попытке получить данные из БД после внутренней ошибки: {db_e}")
            return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}. Также не удалось получить данные из БД.", "products": []}), 500

    return jsonify({"products": products_to_frontend})


@bp.route('/api/sync_logs', methods=['GET']) #работа с логами синхронизаций под действующую учетную запись
@login_required
@admin_required
def get_sync_logs():
    limit = request.args.get('limit', type=int, default=10)

    logs_query = SyncLog.query.filter_by(user_id=current_user.id).order_by(
        SyncLog.started_at.desc()
    ).limit(limit)

    logs = []
    for log in logs_query.all():
        logs.append({
            "id": log.id,
            "started_at": log.started_at.isoformat() if log.started_at else None,
            "finished_at": log.finished_at.isoformat() if log.finished_at else None,
            "status": log.status,
            "updated_count": log.updated_count,
            "error_message": log.error_message,
        })

    return jsonify({"logs": logs}), 200
