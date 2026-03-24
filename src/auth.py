"""
认证模块
包含用户认证、登录、登出、修改密码功能
"""
from functools import wraps

from flask import Blueprint, jsonify, redirect, request, session
from flask_httpauth import HTTPBasicAuth
from werkzeug.security import check_password_hash, generate_password_hash

from src.config import BASE_PATH
from src.models import User

# 创建认证蓝图
auth_bp = Blueprint('auth', __name__)

# HTTP Basic Auth（用于 API 认证）
http_auth = HTTPBasicAuth()


@http_auth.verify_password
def verify_password(username, password):
    """验证用户密码"""
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return username
    return None


def login_required(func):
    """装饰器：检查用户是否登录"""
    @wraps(func)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "未登录"}), 401
        return func(*args, **kwargs)
    return decorated_function


@auth_bp.route('/login', methods=['POST'])
def login():
    """处理登录"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if verify_password(username, password):
        session['user'] = username
        return jsonify({"message": "登录成功"})
    return jsonify({"error": "用户名或密码错误"}), 401


@auth_bp.route('/logout')
def logout():
    """处理登出"""
    session.pop('user', None)
    return redirect(BASE_PATH + '/')


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """修改密码"""
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not old_password or not new_password:
        return jsonify({"error": "旧密码和新密码都是必需的"}), 400

    if len(new_password) < 4:
        return jsonify({"error": "新密码长度至少为4个字符"}), 400

    username = session.get('user')
    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password_hash, old_password):
        return jsonify({"error": "旧密码不正确"}), 401

    user.password_hash = generate_password_hash(new_password)
    from src.models import db
    db.session.commit()

    return jsonify({"message": "密码修改成功"})


@auth_bp.route('/auth-status')
def auth_status():
    """检查登录状态"""
    return jsonify({"logged_in": 'user' in session, "user": session.get('user')})