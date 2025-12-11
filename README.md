# Comfimage

一个基于 ComfyUI 的 AI 图像生成 Web 应用。

## 项目简介

Comfimage是一个简单的 Web 界面，用于通过 ComfyUI 生成 AI 图像。用户可以输入提示词、调整图像尺寸并设置种子值，后端 Flask 应用与 ComfyUI API 交互以生成图像。

## 功能特性

- 支持自定义提示词生成图像
- 可调节图像宽度和高度
- 支持种子设置以复现生成结果
- 实时显示生成进度
- 提供生成的图像预览
- 用户管理系统（数据库存储）
- 命令行用户管理工具

## 环境要求

- Python 3.8+
- ComfyUI (安装并运行)
- 已配置的工作流文件 `z_image_turbo.json`

## 安装步骤

1. 克隆或下载此项目到本地。

2. 安装依赖：
   ```
   pip install -r requirements.txt
   ```

3. 确保 ComfyUI 已安装并运行在 `http://127.0.0.1:8188`。

4. 修改 `src/app.py` 中的 `COMFYUI_OUTPUT_DIR` 路径指向你的 ComfyUI 输出目录。

5. 确保 `config/z_image_turbo.json` 工作流文件在项目目录下。

## 使用方法

1. 启动 Flask 应用：
   ```
   python scripts/run.py
   ```

2. 管理用户（可选）：
   ```
   # 查看所有用户
   python scripts/manage_users.py list

   # 创建新用户
   python scripts/manage_users.py create username

   # 修改密码
   python scripts/manage_users.py password username
   ```

2. 在浏览器中访问 `http://localhost:5000`。

3. 在界面中输入提示词，调整尺寸和种子值。

4. 点击 "生成图片" 按钮。

5. 等待生成完成，查看结果图像。

## 配置说明

- **COMFYUI_API_URL**: ComfyUI API 地址，默认 `http://127.0.0.1:8188`
- **COMFYUI_OUTPUT_DIR**: ComfyUI 输出目录路径，需要根据你的实际路径调整
- **workflows**: 工作流模板文件 `config/z_image_turbo.json`

## 用户管理

系统使用数据库存储用户信息，默认创建以下用户：
- `admin` / `password`
- `user1` / `pass1`

使用命令行工具管理用户：
```bash
python scripts/manage_users.py --help
```

## 文件结构

```
comfimage/
├── docs/                    # 文档
│   └── USER_MANAGEMENT.md   # 用户管理指南
├── scripts/                 # 脚本工具
│   ├── run.py              # 应用启动脚本
│   └── manage_users.py     # 用户管理工具
├── src/                    # 源代码
│   ├── __init__.py
│   └── app.py              # Flask 后端应用
├── static/                 # 前端静态文件
│   ├── index.html          # 用户界面
│   └── script.js           # 前端逻辑
├── config/                 # 配置文件
│   └── z_image_turbo.json  # ComfyUI 工作流配置
├── instance/               # 实例数据
│   └── users.db            # 用户数据库
├── requirements.txt        # Python 依赖
├── README.md               # 项目说明
└── .gitignore             # Git 忽略文件
```

## 许可证

此项目仅供学习和个人使用。
