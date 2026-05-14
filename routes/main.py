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

bp = Blueprint('main', __name__)


@bp.route("/")
def index():
    return render_template("index.html")
