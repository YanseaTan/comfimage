"""
数据库模型模块
包含 SQLAlchemy 初始化和 User 模型
"""
from flask_sqlalchemy import SQLAlchemy

# 初始化数据库
db = SQLAlchemy()


class User(db.Model):
    """用户模型"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'