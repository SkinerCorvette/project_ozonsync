import datetime
import uuid

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from extensions import db
from models import Order, Payment
from helpers import admin_required, log_activity
from time_utils import app_now

bp = Blueprint('payments', __name__)

PAYMENT_METHODS = {'test_card', 'cash_on_delivery'}
PAYMENT_STATUSES = {'pending', 'paid', 'failed', 'refunded', 'cancelled', 'cash_on_delivery', 'not_paid'}


def _get_order_or_404(order_id):
    order = Order.query.get(order_id)
    if not order:
        return None, (jsonify({"message": "Заказ не найден."}), 404)
    if current_user.role != 'admin' and order.user_id != current_user.id:
        return None, (jsonify({"message": "Недостаточно прав."}), 403)
    return order, None


def _ensure_payment(order):
    payment = order.latest_payment()
    if payment:
        return payment

    status = order.payment_status or ('cash_on_delivery' if order.payment_method == 'cash_on_delivery' else 'pending')
    payment = Payment(
        order_id=order.id,
        amount=order.total_amount,
        method=order.payment_method or 'test_card',
        provider='demo',
        status=status,
        expires_at=app_now() + datetime.timedelta(minutes=30) if (order.payment_method or 'test_card') == 'test_card' else None,
    )
    db.session.add(payment)
    return payment


@bp.route('/api/orders/<int:order_id>/payment', methods=['GET'])
@login_required
def get_order_payment(order_id):
    order, error = _get_order_or_404(order_id)
    if error:
        return error
    payment = _ensure_payment(order)
    db.session.commit()
    return jsonify({"order": order.to_dict(include_items=True), "payment": payment.to_dict()}), 200


@bp.route('/api/orders/<int:order_id>/pay', methods=['POST'])
@login_required
def pay_order(order_id):
    order, error = _get_order_or_404(order_id)
    if error:
        return error

    if order.status == 'cancelled':
        return jsonify({"message": "Нельзя оплатить отменённый заказ."}), 400

    if order.payment_method == 'cash_on_delivery':
        return jsonify({"message": "Для этого заказа выбрана оплата при получении."}), 400

    payment = _ensure_payment(order)
    if order.payment_status == 'paid' or payment.status == 'paid':
        return jsonify({"order": order.to_dict(include_items=True), "payment": payment.to_dict()}), 200

    data = request.get_json() or {}
    card_number = ''.join(ch for ch in str(data.get('card_number') or '') if ch.isdigit())
    card_holder = (data.get('card_holder') or '').strip()
    expiry = (data.get('expiry') or '').strip()
    cvv = ''.join(ch for ch in str(data.get('cvv') or '') if ch.isdigit())

    if len(card_number) != 16:
        return jsonify({"message": "Введите 16 цифр номера карты. Пример: 4111 1111 1111 1111."}), 400
    if len(cvv) not in (3, 4):
        return jsonify({"message": "Введите CVV/CVC из 3 или 4 цифр. Пример: 123."}), 400
    if not expiry or '/' not in expiry:
        return jsonify({"message": "Введите срок действия карты в формате ММ/ГГ. Пример: 12/28."}), 400
    if not card_holder:
        return jsonify({"message": "Введите имя держателя карты."}), 400

    now = app_now()
    payment.updated_at = now
    payment.amount = order.total_amount
    payment.method = 'test_card'
    payment.provider = 'demo'

    # Демонстрационный сценарий: карта, оканчивающаяся на 0000, имитирует отказ оплаты.
    if card_number.endswith('0000'):
        payment.status = 'failed'
        payment.error_message = 'Демонстрационный отказ платежа.'
        order.payment_status = 'failed'
        order.updated_at = now
        log_activity('payment_failed', 'payment', f'Оплата заказа №{order.id} не прошла', payment.id)
        db.session.commit()
        return jsonify({"message": "Оплата не прошла. Проверьте данные карты или используйте другую карту."}), 400

    payment.status = 'paid'
    payment.error_message = None
    payment.transaction_id = f'DEMO-{uuid.uuid4().hex[:12].upper()}'
    payment.paid_at = now
    order.payment_status = 'paid'
    order.updated_at = now
    if order.status == 'new':
        order.status = 'confirmed'

    log_activity('payment_success', 'payment', f'Заказ №{order.id} оплачен на сумму {order.total_amount} ₽', payment.id)
    db.session.commit()
    return jsonify({"order": order.to_dict(include_items=True), "payment": payment.to_dict()}), 200


@bp.route('/api/orders/<int:order_id>/payment_status', methods=['PUT'])
@login_required
@admin_required
def update_payment_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"message": "Заказ не найден."}), 404

    data = request.get_json() or {}
    new_status = data.get('payment_status')
    new_method = data.get('payment_method') or order.payment_method or 'test_card'

    if new_status not in PAYMENT_STATUSES:
        return jsonify({"message": "Некорректный статус оплаты."}), 400
    if new_method not in PAYMENT_METHODS:
        return jsonify({"message": "Некорректный способ оплаты."}), 400

    old_status = order.payment_status
    old_method = order.payment_method
    now = app_now()
    
    if old_status == 'paid' and new_status != old_status:
        return jsonify({"message": "Нельзя изменить статус оплаты уже оплаченного заказа."}), 400
    
    if order.status == 'cancelled' and new_status != old_status:
        return jsonify({"message": "Нельзя изменить статус оплаты отменённого заказа."}), 400

    order.payment_status = new_status
    order.payment_method = new_method
    order.updated_at = now

    payment = _ensure_payment(order)
    payment.status = new_status
    payment.method = new_method
    payment.amount = order.total_amount
    payment.updated_at = now
    if new_status == 'paid' and not payment.paid_at:
        payment.paid_at = now
        payment.transaction_id = payment.transaction_id or f'MANUAL-{uuid.uuid4().hex[:10].upper()}'
    if new_status in {'failed', 'cancelled', 'refunded'}:
        payment.error_message = None if new_status == 'refunded' else payment.error_message

    log_activity(
        'payment_status_update',
        'payment',
        f'Оплата заказа №{order.id}: {old_method}/{old_status} → {new_method}/{new_status}',
        payment.id,
    )
    db.session.commit()
    return jsonify({"order": order.to_dict(include_items=True), "payment": payment.to_dict()}), 200
