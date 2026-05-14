import json
import datetime
from functools import wraps
from flask import jsonify, Response
from flask_login import current_user
from sqlalchemy import or_

from extensions import db
from models import Product, ProductChange, ActivityLog
from time_utils import app_now


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401
        if getattr(current_user, "role", "user") != "admin":
            return jsonify({"error": "Forbidden"}), 403
        return f(*args, **kwargs)
    return wrapper

def log_activity(action: str, entity_type: str, description: str, entity_id: int | None = None):
    try:
        entry = ActivityLog(
            user_id=current_user.id if current_user.is_authenticated else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            created_at=app_now()
        )
        db.session.add(entry)
    except Exception as e:
        print('⚠️ Не удалось записать общий журнал действий:', e)

def product_issue_summary(limit_per_group=6):
    """Возвращает агрегированную информацию о проблемах каталога."""
    now = app_now()
    stale_cutoff = now - datetime.timedelta(days=14)

    categories = [
        {
            "key": "without_image",
            "title": "Без изображения",
            "description": "Товары без фото хуже воспринимаются покупателем и требуют заполнения карточки.",
            "query": Product.query.filter(Product.is_hidden == False).filter(or_(Product.image_url.is_(None), Product.image_url == '')),
            "severity": "high",
        },
        {
            "key": "out_of_stock",
            "title": "Нулевой остаток",
            "description": "Товары есть в каталоге, но недоступны к покупке из-за отсутствия на складе.",
            "query": Product.query.filter(Product.is_hidden == False, Product.stock == 0),
            "severity": "high",
        },
        {
            "key": "without_price",
            "title": "Без цены",
            "description": "Такие позиции нельзя корректно продавать и включать в заказ.",
            "query": Product.query.filter(Product.is_hidden == False).filter(or_(Product.price.is_(None), Product.price <= 0)),
            "severity": "high",
        },
        {
            "key": "manual",
            "title": "Ручные правки",
            "description": "Товары изменены локально и могут быть защищены от перезаписи при синхронизации.",
            "query": Product.query.filter(Product.is_hidden == False, Product.is_manual == True),
            "severity": "medium",
        },
        {
            "key": "local",
            "title": "Локальные товары",
            "description": "Позиции созданы вручную в локальном магазине и отсутствуют в выгрузке Ozon.",
            "query": Product.query.filter(Product.is_hidden == False, Product.source == 'local'),
            "severity": "medium",
        },
        {
            "key": "stale",
            "title": "Давно не обновлялись",
            "description": "Товары не синхронизировались более 14 дней или не имеют даты синхронизации.",
            "query": Product.query.filter(Product.is_hidden == False).filter(or_(Product.last_synced.is_(None), Product.last_synced < stale_cutoff)),
            "severity": "low",
        },
        {
            "key": "hidden",
            "title": "В архиве",
            "description": "Скрытые товары исключены из активной витрины, но доступны администратору.",
            "query": Product.query.filter(Product.is_hidden == True),
            "severity": "low",
        },
    ]

    result = []
    for category in categories:
        q = category["query"]
        items = q.order_by(Product.last_synced.desc()).limit(limit_per_group).all()
        result.append({
            "key": category["key"],
            "title": category["title"],
            "description": category["description"],
            "severity": category["severity"],
            "count": q.count(),
            "items": [p.to_dict() for p in items],
        })
    return result

def csv_response(filename, rows, headers):
    import csv
    import io

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.DictWriter(output, fieldnames=headers, delimiter=';')
    writer.writeheader()
    for row in rows:
        writer.writerow({key: row.get(key, '') for key in headers})

    return Response(
        output.getvalue(),
        mimetype='text/csv; charset=utf-8',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def product_snapshot(p: Product):
    """Снимок полей товара для истории."""
    return {
        "product_id": str(p.product_id) if p.product_id is not None else None,
        "offer_id": p.offer_id,
        "name": p.name,
        "price": float(p.price) if p.price is not None else None,
        "stock": p.stock,
        "image_url": p.image_url,
        "is_hidden": bool(p.is_hidden),
        "is_manual": bool(p.is_manual),
        "source": getattr(p, "source", None),
        "last_synced": p.last_synced.isoformat() if p.last_synced else None,
    }

def log_product_change(product: Product, action: str, before: dict | None, after: dict | None):
    """Записывает изменение товара в таблицу product_changes."""
    try:
        entry = ProductChange(
            product_id=product.id,
            offer_id=product.offer_id,
            user_id=current_user.id if current_user.is_authenticated else None,
            action=action,
            before_json=json.dumps(before, ensure_ascii=False) if before else None,
            after_json=json.dumps(after, ensure_ascii=False) if after else None,
            changed_at=app_now()
        )
        db.session.add(entry)
    except Exception as e:
        print("⚠️ Не удалось записать историю изменения:", e)
