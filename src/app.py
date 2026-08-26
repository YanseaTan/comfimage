"""
Flask 应用入口
"""
import os

from flask import Flask
from werkzeug.security import generate_password_hash

from src.config import BASE_PATH
from src.models import db, User
from src.auth import auth_bp
from src.routes import main_bp
from src.comfyui import generate_image, get_task_status


def create_app():
    """创建 Flask 应用"""
    app = Flask(__name__, static_folder='../static')
    app.secret_key = 'your-secret-key-here'  # 用于session，请更改为复杂密钥

    # 数据库配置
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # 初始化数据库
    db.init_app(app)

    # 注册蓝图
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)

    # 注册生成图片路由（需要在蓝图之外，因为它需要特殊的处理）
    app.route('/generate', methods=['POST'])(generate_image)
    # 异步任务状态查询
    app.route('/api/task/<task_id>', methods=['GET'])(get_task_status)

    return app


# 创建应用实例
app = create_app()


def init_db():
    """初始化数据库"""
    with app.app_context():
        db.create_all()
        # 创建默认用户
        if not User.query.filter_by(username='admin').first():
            admin_user = User(username='admin', password_hash=generate_password_hash('password'))
            db.session.add(admin_user)
        if not User.query.filter_by(username='user1').first():
            user1 = User(username='user1', password_hash=generate_password_hash('pass1'))
            db.session.add(user1)
        db.session.commit()
        print("数据库初始化完成")


if __name__ == '__main__':
    init_db()
    # 确保监听所有网络接口
    app.run(host='127.0.0.1', port=5000, debug=False)