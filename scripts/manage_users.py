#!/usr/bin/env python3
"""
用户管理脚本
用于方便地添加、删除、修改用户
"""
import argparse
import sys
from getpass import getpass
import sys
import os
# 添加项目根目录到Python路径
# scripts目录的父目录即为项目根目录
project_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, project_root)
from src.app import app
from src.models import db, User
from werkzeug.security import generate_password_hash

def create_user(username, password):
    """创建新用户"""
    if User.query.filter_by(username=username).first():
        print(f"用户 '{username}' 已存在!")
        return False

    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    print(f"用户 '{username}' 创建成功!")
    return True

def delete_user(username):
    """删除用户"""
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"用户 '{username}' 不存在!")
        return False

    db.session.delete(user)
    db.session.commit()
    print(f"用户 '{username}' 删除成功!")
    return True

def change_password(username, new_password):
    """修改用户密码"""
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"用户 '{username}' 不存在!")
        return False

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    print(f"用户 '{username}' 密码修改成功!")
    return True

def list_users():
    """列出所有用户"""
    users = User.query.all()
    if not users:
        print("没有用户!")
        return

    print("当前用户列表:")
    for user in users:
        print(f"  - {user.username}")

def main():
    parser = argparse.ArgumentParser(description='用户管理工具')
    subparsers = parser.add_subparsers(dest='command', help='可用命令')

    # 创建用户
    create_parser = subparsers.add_parser('create', help='创建新用户')
    create_parser.add_argument('username', help='用户名')
    create_parser.add_argument('--password', help='密码 (如果不提供会提示输入)')

    # 删除用户
    delete_parser = subparsers.add_parser('delete', help='删除用户')
    delete_parser.add_argument('username', help='用户名')

    # 修改密码
    password_parser = subparsers.add_parser('password', help='修改用户密码')
    password_parser.add_argument('username', help='用户名')
    password_parser.add_argument('--new-password', help='新密码 (如果不提供会提示输入)')

    # 列出用户
    subparsers.add_parser('list', help='列出所有用户')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    with app.app_context():
        if args.command == 'create':
            password = args.password
            if not password:
                password = getpass("请输入密码: ")
                confirm = getpass("请再次输入密码: ")
                if password != confirm:
                    print("密码不匹配!")
                    sys.exit(1)
            create_user(args.username, password)

        elif args.command == 'delete':
            if input(f"确定要删除用户 '{args.username}' 吗? (y/N): ").lower() == 'y':
                delete_user(args.username)
            else:
                print("操作已取消")

        elif args.command == 'password':
            new_password = args.new_password
            if not new_password:
                new_password = getpass("请输入新密码: ")
                confirm = getpass("请再次输入新密码: ")
                if new_password != confirm:
                    print("密码不匹配!")
                    sys.exit(1)
            change_password(args.username, new_password)

        elif args.command == 'list':
            list_users()

if __name__ == '__main__':
    main()
