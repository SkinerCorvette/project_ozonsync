import os
import json
import datetime
import requests

from flask import Blueprint, jsonify, request, render_template
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import func, or_

from extensions import db
from models import Product, ProductChange, SyncLog, User, CartItem, Order, OrderItem, ActivityLog, Payment, SupportTicket
from helpers import admin_required, log_activity, product_issue_summary, csv_response, product_snapshot, log_product_change

bp = Blueprint('analytics', __name__)


@bp.route('/api/dashboard_stats')
@login_required
def dashboard_stats():
    total = Product.query.count()
    active = Product.query.filter_by(is_hidden=False).count()
    hidden = Product.query.filter_by(is_hidden=True).count()
    manual = Product.query.filter_by(is_manual=True).count()
    local = Product.query.filter_by(source='local').count()
    out_of_stock = Product.query.filter(Product.stock == 0).count()
    without_image = Product.query.filter(or_(Product.image_url.is_(None), Product.image_url == '')).count()
    without_price = Product.query.filter(or_(Product.price.is_(None), Product.price <= 0)).count()

    avg_price = db.session.query(db.func.avg(Product.price)).scalar()
    avg_price = round(float(avg_price), 2) if avg_price else 0

    orders_query = Order.query if current_user.role == 'admin' else Order.query.filter_by(user_id=current_user.id)
    orders_total = orders_query.count()
    orders_new = orders_query.filter(Order.status == 'new').count()
    orders_paid = orders_query.filter(Order.payment_status == 'paid').count()
    payments_pending = orders_query.filter(Order.payment_status.in_(['pending', 'failed'])).count()

    revenue_query = db.session.query(db.func.sum(Order.total_amount))
    paid_revenue_query = db.session.query(db.func.sum(Order.total_amount)).filter(Order.payment_status == 'paid')
    if current_user.role != 'admin':
        revenue_query = revenue_query.filter(Order.user_id == current_user.id)
        paid_revenue_query = paid_revenue_query.filter(Order.user_id == current_user.id)
    revenue = revenue_query.scalar() or 0
    paid_revenue = paid_revenue_query.scalar() or 0

    support_open = SupportTicket.query.filter_by(status='open').count() if current_user.role == 'admin' else SupportTicket.query.filter_by(user_id=current_user.id, status='open').count()

    return jsonify({
        "total": total,
        "active": active,
        "hidden": hidden,
        "manual": manual,
        "local": local,
        "out_of_stock": out_of_stock,
        "without_image": without_image,
        "without_price": without_price,
        "avg_price": avg_price,
        "orders_total": orders_total,
        "orders_new": orders_new,
        "orders_paid": orders_paid,
        "payments_pending": payments_pending,
        "support_open": support_open,
        "revenue": round(float(revenue), 2),
        "paid_revenue": round(float(paid_revenue), 2)
    })


@bp.route('/api/activity_logs', methods=['GET'])
@login_required
@admin_required
def get_activity_logs():
    limit = request.args.get('limit', type=int, default=50)
    logs = (ActivityLog.query
            .filter(ActivityLog.action != 'cart_update')
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
            .all())
    return jsonify({"logs": [log.to_dict() for log in logs]}), 200


@bp.route('/api/catalog_warnings', methods=['GET'])
@login_required
@admin_required
def get_catalog_warnings():
    limit_per_group = request.args.get('limit', type=int, default=6)
    limit_per_group = min(max(limit_per_group, 1), 20)
    categories = product_issue_summary(limit_per_group=limit_per_group)
    total_issues = sum(category['count'] for category in categories if category['key'] != 'hidden')
    return jsonify({"total_issues": total_issues, "categories": categories}), 200


@bp.route('/api/export/products', methods=['GET'])
@login_required
@admin_required
def export_products_csv():
    mode = request.args.get('mode', 'active')
    query = Product.query
    if mode == 'archive':
        query = query.filter(Product.is_hidden == True)
        filename = 'archive_products.csv'
    elif mode == 'all':
        filename = 'all_products.csv'
    else:
        query = query.filter(Product.is_hidden == False)
        filename = 'active_products.csv'

    products = query.order_by(Product.name.asc()).all()
    rows = []
    for p in products:
        rows.append({
            'id': p.id,
            'product_id': p.product_id,
            'offer_id': p.offer_id,
            'name': p.name,
            'price': float(p.price) if p.price is not None else '',
            'stock': p.stock if p.stock is not None else '',
            'source': p.source,
            'is_manual': 'Да' if p.is_manual else 'Нет',
            'is_hidden': 'Да' if p.is_hidden else 'Нет',
            'last_synced': p.last_synced.isoformat() if p.last_synced else '',
            'image_url': p.image_url or '',
        })
    headers = ['id', 'product_id', 'offer_id', 'name', 'price', 'stock', 'source', 'is_manual', 'is_hidden', 'last_synced', 'image_url']
    log_activity('export_products', 'report', f'Выгружен CSV-отчёт по товарам: {mode}')
    db.session.commit()
    return csv_response(filename, rows, headers)


@bp.route('/api/export/orders', methods=['GET'])
@login_required
@admin_required
def export_orders_csv():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    rows = []
    for order in orders:
        rows.append({
            'order_id': order.id,
            'username': order.user.username if order.user else '',
            'status': order.status,
            'payment_status': order.payment_status,
            'payment_method': order.payment_method,
            'customer_name': order.customer_name,
            'customer_phone': order.customer_phone,
            'total_amount': float(order.total_amount) if order.total_amount is not None else 0,
            'items_count': len(order.items),
            'created_at': order.created_at.isoformat() if order.created_at else '',
            'updated_at': order.updated_at.isoformat() if order.updated_at else '',
            'comment': order.customer_comment or '',
        })
    headers = ['order_id', 'username', 'status', 'payment_status', 'payment_method', 'customer_name', 'customer_phone', 'total_amount', 'items_count', 'created_at', 'updated_at', 'comment']
    log_activity('export_orders', 'report', 'Выгружен CSV-отчёт по заказам')
    db.session.commit()
    return csv_response('orders_report.csv', rows, headers)


@bp.route('/api/export/catalog_warnings', methods=['GET'])
@login_required
@admin_required
def export_catalog_warnings_csv():
    categories = product_issue_summary(limit_per_group=100000)
    rows = []
    for category in categories:
        for item in category['items']:
            rows.append({
                'issue_type': category['title'],
                'severity': category['severity'],
                'offer_id': item.get('offer_id'),
                'name': item.get('name'),
                'price': item.get('price') if item.get('price') is not None else '',
                'stock': item.get('stock') if item.get('stock') is not None else '',
                'source': item.get('source'),
                'is_manual': 'Да' if item.get('is_manual') else 'Нет',
                'is_hidden': 'Да' if item.get('is_hidden') else 'Нет',
                'last_synced': item.get('last_synced') or '',
            })
    headers = ['issue_type', 'severity', 'offer_id', 'name', 'price', 'stock', 'source', 'is_manual', 'is_hidden', 'last_synced']
    log_activity('export_catalog_warnings', 'report', 'Выгружен CSV-отчёт по проблемным товарам')
    db.session.commit()
    return csv_response('catalog_warnings.csv', rows, headers)
