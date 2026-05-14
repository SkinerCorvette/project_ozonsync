import datetime
import os
import uuid

from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from extensions import db
from models import SupportTicket, SupportMessage, SupportAttachment
from helpers import admin_required, log_activity
from time_utils import app_now

bp = Blueprint('support', __name__)

ALLOWED_CATEGORIES = {
    'catalog': 'Каталог товаров',
    'cart': 'Корзина',
    'order': 'Заказы',
    'account': 'Учётная запись',
    'sync': 'Синхронизация',
    'other': 'Другое',
}
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip'}
MAX_FILES_PER_MESSAGE = 5


def is_admin():
    return getattr(current_user, 'role', 'user') == 'admin'


def get_ticket_or_404(ticket_id):
    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return None, (jsonify({'message': 'Обращение не найдено.'}), 404)
    if not is_admin() and ticket.user_id != current_user.id:
        return None, (jsonify({'message': 'Недостаточно прав для просмотра обращения.'}), 403)
    return ticket, None


def validate_category(category):
    return category if category in ALLOWED_CATEGORIES else 'other'


def file_allowed(filename):
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def save_attachments(ticket, message):
    files = request.files.getlist('attachments') or request.files.getlist('files')
    saved = []
    if len(files) > MAX_FILES_PER_MESSAGE:
        raise ValueError(f'Можно прикрепить не более {MAX_FILES_PER_MESSAGE} файлов за один раз.')

    upload_folder = current_app.config['SUPPORT_UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)

    for file in files:
        if not file or not file.filename:
            continue
        original = file.filename
        if not file_allowed(original):
            raise ValueError(f'Файл "{original}" имеет неподдерживаемый формат.')
        safe_name = secure_filename(original) or 'attachment'
        stored = f"ticket_{ticket.id}_msg_{message.id}_{uuid.uuid4().hex}_{safe_name}"
        path = os.path.join(upload_folder, stored)
        file.save(path)
        size_bytes = os.path.getsize(path)
        relative_url = f"/static/uploads/support/{stored}"
        attachment = SupportAttachment(
            ticket_id=ticket.id,
            message_id=message.id,
            user_id=current_user.id,
            original_filename=original,
            stored_filename=stored,
            file_url=relative_url,
            mime_type=file.mimetype,
            size_bytes=size_bytes,
        )
        db.session.add(attachment)
        saved.append(attachment)
    return saved


@bp.route('/api/support/unread_count', methods=['GET'])
@login_required
def support_unread_count():
    if is_admin():
        unread = db.session.query(db.func.sum(SupportTicket.unread_for_admin)).scalar() or 0
        open_count = SupportTicket.query.filter_by(status='open').count()
    else:
        unread = db.session.query(db.func.sum(SupportTicket.unread_for_user)).filter(SupportTicket.user_id == current_user.id).scalar() or 0
        open_count = SupportTicket.query.filter_by(user_id=current_user.id, status='open').count()
    return jsonify({'unread': int(unread), 'open_count': int(open_count)}), 200


@bp.route('/api/support/tickets', methods=['GET'])
@login_required
def list_tickets():
    status = request.args.get('status')
    query = SupportTicket.query
    if not is_admin():
        query = query.filter_by(user_id=current_user.id)
    if status in {'open', 'closed'}:
        query = query.filter_by(status=status)
    tickets = query.order_by(SupportTicket.updated_at.desc()).all()
    viewer_role = 'admin' if is_admin() else 'user'
    return jsonify({'tickets': [ticket.to_dict(viewer_role=viewer_role) for ticket in tickets]}), 200


@bp.route('/api/support/tickets', methods=['POST'])
@login_required
def create_ticket():
    title = (request.form.get('title') or '').strip()
    category = validate_category(request.form.get('category') or 'other')
    description = (request.form.get('description') or '').strip()

    if not title:
        return jsonify({'message': 'Введите заголовок обращения.'}), 400
    if len(title) > 160:
        return jsonify({'message': 'Заголовок слишком длинный. Максимум 160 символов.'}), 400
    if not description:
        return jsonify({'message': 'Опишите проблему.'}), 400

    ticket = SupportTicket(
        user_id=current_user.id,
        title=title,
        category=category,
        description=description,
        status='open',
        unread_for_admin=1,
        unread_for_user=0,
    )
    db.session.add(ticket)
    db.session.flush()

    message = SupportMessage(
        ticket_id=ticket.id,
        user_id=current_user.id,
        body=description,
        is_admin=is_admin(),
    )
    db.session.add(message)
    db.session.flush()

    try:
        save_attachments(ticket, message)
    except ValueError as exc:
        db.session.rollback()
        return jsonify({'message': str(exc)}), 400

    log_activity('support_ticket_create', 'support_ticket', f'Создано обращение №{ticket.id}: {ticket.title}', ticket.id)
    db.session.commit()
    return jsonify(ticket.to_dict(include_messages=True, viewer_role='admin' if is_admin() else 'user')), 201


@bp.route('/api/support/tickets/<int:ticket_id>', methods=['GET'])
@login_required
def get_ticket(ticket_id):
    ticket, error = get_ticket_or_404(ticket_id)
    if error:
        return error

    if is_admin():
        ticket.unread_for_admin = 0
        viewer_role = 'admin'
    else:
        ticket.unread_for_user = 0
        viewer_role = 'user'
    db.session.commit()
    return jsonify(ticket.to_dict(include_messages=True, viewer_role=viewer_role)), 200


@bp.route('/api/support/tickets/<int:ticket_id>/messages', methods=['POST'])
@login_required
def add_message(ticket_id):
    ticket, error = get_ticket_or_404(ticket_id)
    if error:
        return error

    if ticket.status == 'closed':
        return jsonify({'message': 'Обращение закрыто. Новые сообщения недоступны.'}), 400

    body = (request.form.get('message') or request.form.get('body') or '').strip()
    has_files = any(file and file.filename for file in request.files.getlist('attachments')) or any(file and file.filename for file in request.files.getlist('files'))
    if not body and not has_files:
        return jsonify({'message': 'Введите сообщение или прикрепите файл.'}), 400

    message = SupportMessage(
        ticket_id=ticket.id,
        user_id=current_user.id,
        body=body,
        is_admin=is_admin(),
    )
    db.session.add(message)
    db.session.flush()

    try:
        save_attachments(ticket, message)
    except ValueError as exc:
        db.session.rollback()
        return jsonify({'message': str(exc)}), 400

    ticket.updated_at = app_now()
    if is_admin():
        ticket.unread_for_user += 1
    else:
        ticket.unread_for_admin += 1

    log_activity('support_message_create', 'support_ticket', f'Добавлено сообщение в обращение №{ticket.id}', ticket.id)
    db.session.commit()
    return jsonify(ticket.to_dict(include_messages=True, viewer_role='admin' if is_admin() else 'user')), 201


@bp.route('/api/support/tickets/<int:ticket_id>/status', methods=['PUT'])
@login_required
@admin_required
def update_ticket_status(ticket_id):
    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'message': 'Обращение не найдено.'}), 404

    data = request.get_json() or {}
    status = data.get('status')
    if status not in {'open', 'closed'}:
        return jsonify({'message': 'Некорректный статус обращения.'}), 400

    old_status = ticket.status
    ticket.status = status
    ticket.updated_at = app_now()
    ticket.closed_at = app_now() if status == 'closed' else None
    if status == 'closed':
        ticket.unread_for_user += 1

    log_activity('support_ticket_status', 'support_ticket', f'Статус обращения №{ticket.id}: {old_status} → {status}', ticket.id)
    db.session.commit()
    return jsonify(ticket.to_dict(include_messages=True, viewer_role='admin')), 200


@bp.route('/api/support/attachments/<int:attachment_id>', methods=['GET'])
@login_required
def get_attachment(attachment_id):
    attachment = SupportAttachment.query.get(attachment_id)
    if not attachment:
        return jsonify({'message': 'Файл не найден.'}), 404

    ticket = SupportTicket.query.get(attachment.ticket_id)
    if not ticket:
        return jsonify({'message': 'Обращение не найдено.'}), 404
    if not is_admin() and ticket.user_id != current_user.id:
        return jsonify({'message': 'Недостаточно прав для просмотра файла.'}), 403

    return send_from_directory(
        current_app.config['SUPPORT_UPLOAD_FOLDER'],
        attachment.stored_filename,
        as_attachment=False,
        download_name=attachment.original_filename,
    )
