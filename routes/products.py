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

bp = Blueprint('products', __name__)


@bp.route('/api/products/<string:offer_id>', methods=['GET'])
@login_required
def get_product_detail(offer_id):
    product = Product.query.filter_by(offer_id=offer_id).first()

    if not product:
        return jsonify({"message": "Товар не найден"}), 404

    return jsonify(product.to_dict()), 200


@bp.route('/api/products_local', methods=['GET'])
@login_required
def get_products_local():
    # Параметры фильтрации
    search = request.args.get('q', type=str, default=None)
    min_price = request.args.get('min_price', type=float, default=None)
    max_price = request.args.get('max_price', type=float, default=None)

    # Параметры пагинации
    page = request.args.get('page', type=int, default=1)
    per_page = request.args.get('per_page', type=int, default=10) # сколько товаров на странице
    
    sort_by = request.args.get('sort_by', type=str, default='last_synced')
    sort_dir = request.args.get('sort_dir', type=str, default='desc')

    include_hidden = request.args.get('include_hidden', type=int, default=0)  # 0=обычные, 1=архив

    query = Product.query.filter_by(is_hidden=(include_hidden == 1))

    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)
        
    sort_column_map = {
        'price': Product.price,
        'name': Product.name,
        'last_synced': Product.last_synced
    }
    sort_col = sort_column_map.get(sort_by, Product.last_synced)

    # Направление сортировки
    if sort_dir == 'asc':
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    products = [p.to_dict() for p in pagination.items]

    return jsonify({
        "products": products,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total_pages": pagination.pages,
        "total_items": pagination.total
    }), 200


@bp.route('/api/products_local', methods=['POST']) #добавление продукта
@login_required
@admin_required
def create_product_local():
    data = request.get_json() or {}

    name = data.get('name')
    offer_id = data.get('offer_id')
    product_id = data.get('product_id')  
    price = data.get('price')
    stock = data.get('stock')
    image_url = data.get('image_url')
    
    if not name or not str(name).strip():
        return jsonify({"message": "Название товара обязательно."}), 400

    name = str(name).strip()

    if len(name) > 120:
        return jsonify({"message": "Название слишком длинное. Максимум 120 символов."}), 400

    if offer_id and len(offer_id) > 80:
        return jsonify({"message": "Offer ID слишком длинный. Максимум 80 символов."}), 400

    # product_id может быть числом, но если приходит строкой — ограничим длину
    if isinstance(product_id, str) and len(product_id) > 20:
        return jsonify({"message": "Product ID слишком длинный. Максимум 20 символов."}), 400

    if image_url and len(image_url) > 400:
        return jsonify({"message": "URL изображения слишком длинный. Максимум 400 символов."}), 400

    if not offer_id:
        # Локальные товары (добавленные пользователем) помечаем префиксом, которого не бывает у озона
        offer_id = f"LOCAL-{int(datetime.datetime.now().timestamp() * 1000)}"

    # Проверим уникальность offer_id
    if Product.query.filter_by(offer_id=offer_id).first():
        return jsonify({"message": "Товар c таким offer_id уже существует."}), 409

    # product_id: если не передали, сгенерируем уникальное число
    if not product_id:
        product_id = int(datetime.datetime.now().timestamp() * 1000)

    # Проверим уникальность product_id
    if Product.query.filter_by(product_id=product_id).first():
        return jsonify({"message": "Товар c таким product_id уже существует."}), 409

    try:
        price_text = str(price).strip() if price is not None else ""

        if price_text and len(price_text) > 15:
            return jsonify({"message": "Цена слишком длинная. Максимум 15 символов."}), 400

        price_value = float(price_text) if price_text else None
    except (TypeError, ValueError):
        return jsonify({"message": "Некорректное значение цены."}), 400

    stock_text = str(stock).strip() if stock is not None else ""

    if not stock_text:
        stock_value = None
    else:
        if len(stock_text) > 15:
            return jsonify({"message": "Остаток слишком длинный. Максимум 15 символов."}), 400

        if not stock_text.isdigit():
            return jsonify({"message": "Остаток должен быть целым числом (0 или больше)."}), 400

    stock_value = int(stock_text)

    new_product = Product(
        product_id=product_id,
        offer_id=offer_id,
        name=name,
        price=price_value,
        stock=stock_value,
        image_url=image_url,
        last_synced=app_now(),
        source='local'
    )

    db.session.add(new_product)
    db.session.flush()  # чтобы появился new_product.id

    after = product_snapshot(new_product)
    log_product_change(new_product, action="create_local", before=None, after=after)
    log_activity('product_create', 'product', f'Создан локальный товар {new_product.offer_id}', new_product.id)

    db.session.commit()
    return jsonify(new_product.to_dict()), 201


@bp.route('/api/products_local/<string:offer_id>', methods=['PUT']) # редактирование товара
@login_required
@admin_required
def update_product_local(offer_id):
    product = Product.query.filter_by(offer_id=offer_id).first()

    if not product:
        return jsonify({"message": "Товар не найден."}), 404
    
    before = product_snapshot(product)

    data = request.get_json() or {}
    name = data.get('name')
    price = data.get('price')
    if 'stock' in data:
        stock_raw = data.get('stock')
        stock_text = str(stock_raw).strip() if stock_raw is not None else ""

        if stock_text == "":
            product.stock = None
        else:
            if len(stock_text) > 15:
                return jsonify({"message": "Остаток слишком длинный. Максимум 15 символов."}), 400

            if not stock_text.isdigit():
                return jsonify({"message": "Остаток должен быть целым числом (0 или больше)."}), 400

        product.stock = int(stock_text)
        image_url = data.get('image_url')
    
    if name is not None and len(name) > 120:
        return jsonify({"message": "Название слишком длинное. Максимум 120 символов."}), 400

    if image_url is not None and image_url and len(image_url) > 400:
        return jsonify({"message": "URL изображения слишком длинный. Максимум 400 символов."}), 400

    if name is not None:
        product.name = name

    if price is not None:
        price_text = str(price).strip()

        if price_text and len(price_text) > 15:
            return jsonify({"message": "Цена слишком длинная. Максимум 15 символов."}), 400

        try:
            product.price = float(price_text) if price_text else None
        except (TypeError, ValueError):
            return jsonify({"message": "Некорректное значение цены."}), 400

    if image_url is not None:
        product.image_url = image_url

    product.last_synced = app_now()
    product.is_manual = True
    
    after = product_snapshot(product)
    
    log_product_change(
        product,
        action="update",
        before=before,
        after=after
    )
    log_activity('product_update', 'product', f'Изменён товар {product.offer_id}', product.id)

    db.session.commit()

    return jsonify(product.to_dict()), 200


@bp.route('/api/products_local/<string:offer_id>', methods=['DELETE']) # удаление (скрытие) товара
@login_required
@admin_required
def delete_product_local(offer_id):
    product = Product.query.filter_by(offer_id=offer_id).first()

    if not product:
        return jsonify({"message": "Товар не найден."}), 404
    
    before = product_snapshot(product)

    product.is_hidden = True
    
    after = product_snapshot(product)
    log_product_change(product, action="delete", before=before, after=after)
    log_activity('product_delete', 'product', f'Товар {product.offer_id} перемещён в архив', product.id)
    db.session.commit()

    return jsonify({"message": "Товар удалён."}), 200


@bp.route('/api/products/<string:offer_id>/changes', methods=['GET'])
@login_required
def get_product_changes(offer_id):
    limit = request.args.get('limit', type=int, default=50)

    changes = ProductChange.query.filter_by(offer_id=offer_id).order_by(
        ProductChange.changed_at.desc()
    ).limit(limit).all()

    return jsonify({"changes": [c.to_dict() for c in changes]}), 200


@bp.route('/api/products_local/<string:offer_id>/restore', methods=['PUT'])
@login_required
@admin_required
def restore_product_local(offer_id):
    product = Product.query.filter_by(offer_id=offer_id).first()
    if not product:
        return jsonify({"message": "Товар не найден."}), 404

    before = product_snapshot(product)

    product.is_hidden = False
    product.last_synced = app_now()

    after = product_snapshot(product)
    log_product_change(product, action="restore", before=before, after=after)
    log_activity('product_restore', 'product', f'Товар {product.offer_id} восстановлен из архива', product.id)

    db.session.commit()
    return jsonify(product.to_dict()), 200
