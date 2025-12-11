# 用户管理指南

## 概述

用户管理系统已从硬编码改为数据库存储，现在支持动态添加、删除和修改用户。

## 默认用户

系统会自动创建以下默认用户：
- `admin` / `password`
- `user1` / `pass1`

## 使用命令行工具管理用户

### 1. 查看所有用户
```bash
python manage_users.py list
```

### 2. 创建新用户
```bash
# 方式1：命令行指定密码
python manage_users.py create username --password password

# 方式2：交互式输入密码（更安全）
python manage_users.py create username
```

### 3. 修改用户密码
```bash
# 方式1：命令行指定新密码
python manage_users.py password username --new-password newpassword

# 方式2：交互式输入新密码（更安全）
python manage_users.py password username
```

### 4. 删除用户
```bash
python manage_users.py delete username
```
删除操作会要求确认，请输入 `y` 确认删除。

## 示例操作

```bash
# 查看当前用户
python manage_users.py list

# 创建新用户 alice
python manage_users.py create alice
# 会提示输入密码和确认密码

# 修改 alice 的密码
python manage_users.py password alice
# 会提示输入新密码和确认密码

# 删除用户 alice
python manage_users.py delete alice
# 会提示确认删除
```

## 安全注意事项

- 密码会被安全哈希存储
- 删除用户操作需要确认
- 建议定期修改默认密码
- 生产环境建议使用强密码

## 文件结构

- `instance/users.db`: SQLite 数据库文件
- `manage_users.py`: 用户管理脚本
- `app/app.py`: 主应用文件（已集成数据库用户验证）
