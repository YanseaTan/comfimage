<div align="center"><img src="static/title.png" width="300" alt="Comfimage Title"></div>

# Comfimage

一个基于 ComfyUI 的 AI 图像生成 Web 应用。

## 项目简介

Comfimage 是一个现代化的 Web 界面，用于通过 ComfyUI 生成和编辑 AI 图像。采用前后端分离架构，前端使用原生 HTML/CSS/JavaScript，后端使用 Flask 框架。支持多种 AI 模型，包括文本到图像生成和图像编辑功能。

## 功能特性

- 🔐 **用户管理系统**：支持多用户登录、密码修改、动态用户管理
- 🎨 **多模型支持**：
  - **z_image_turbo**：快速图像生成模型
  - **flux2_klein_t2i**：Flux 文本到图像生成模型
  - **flux2_klein_edit**：Flux 图像编辑模型，支持上传图像进行风格转换
- 📐 **参数调节**：可调节图像宽度、高度（512-2048px），支持自定义种子
- 🎲 **种子控制**：支持种子设置以复现生成结果
- 📊 **实时进度**：生成过程中显示实时进度条，根据模型类型调整进度速度
- 🖼️ **图像预览**：支持全屏查看、复制图片、下载图片
- 📚 **历史记录**：保存生成历史，支持参数回填和一键编辑
- 🌙 **深色主题**：支持明暗主题切换，设置自动保存
- 📱 **响应式设计**：适配不同屏幕尺寸
- 🖍️ **图像上传**：支持拖拽或点击上传图像用于编辑功能
- 🔄 **一键编辑**：从历史记录或预览图片直接进入编辑模式

## 环境要求

- **Python**: 3.8 或更高版本
- **ComfyUI**: 已安装并运行在本地
- **依赖包**: Flask 2.3.3, requests 2.31.0, Flask-HTTPAuth 4.8.0, Flask-SQLAlchemy 3.1.1
- **浏览器**: 支持现代 JavaScript 的浏览器（Chrome, Firefox, Safari, Edge）

## 安装步骤

1. **克隆项目**：
   ```bash
   git clone <repository-url>
   cd comfimage
   ```

2. **创建虚拟环境**（推荐）：
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **安装依赖**：
   ```bash
   pip install -r requirements.txt
   ```

4. **配置 ComfyUI**：
   - 确保 ComfyUI 已安装并运行在 `http://127.0.0.1:8188`
   - 修改 `src/app.py` 中的 `COMFYUI_OUTPUT_DIR` 路径：
     ```python
     COMFYUI_OUTPUT_DIR = r"C:\path\to\your\comfyui\output"
     ```

5. **准备工作流文件**：
   - 确保以下配置文件存在于 `config/` 目录：
     - `z_image_turbo.json`：快速图像生成工作流
     - `flux2_klein_t2i.json`：Flux 文本到图像生成工作流
     - `flux2_klein_edit.json`：Flux 图像编辑工作流
   - 这些文件包含对应的 ComfyUI 工作流配置

## 快速开始

### 本地开发

1. **启动应用**：
   ```bash
   python scripts/run.py
   ```

   可选参数：
   ```bash
   # 指定基础URL路径（用于nginx反向代理）
   python scripts/run.py --base_url /comfimage
   ```

2. **访问应用**：
   在浏览器中打开 `http://localhost:5000`

### 用户管理

系统默认创建两个用户账号：
- 用户名: `admin`, 密码: `password`
- 用户名: `user1`, 密码: `pass1`

使用命令行工具管理用户：
```bash
# 查看帮助
python scripts/manage_users.py --help

# 列出所有用户
python scripts/manage_users.py list

# 创建新用户
python scripts/manage_users.py create newuser

# 修改密码
python scripts/manage_users.py password admin
```

### 使用界面

1. **登录**：使用上述账号登录系统
2. **选择模型**：
   - **z_image_turbo**：快速生成高质量图像
   - **flux2_klein_t2i**：使用Flux模型从文本生成图像，支持更高分辨率
   - **flux2_klein_edit**：上传现有图像进行风格编辑和转换
3. **生成图像**：
   - 在提示词框输入描述（支持中英文）
   - 对于文本生成模型：选择图像尺寸（宽度和高度，512-2048px）
   - 对于图像编辑模型：上传要编辑的图像，系统会自动调整尺寸
   - 可选：设置种子值以复现结果
   - 点击"生成图片"按钮
4. **查看结果**：
   - 等待进度条完成（编辑模型进度稍慢）
   - 点击生成图像进入全屏查看模式
   - 在全屏模式下可复制图片到剪贴板或下载图片
   - 点击"编辑"按钮可直接进入编辑模式重新处理当前图片
5. **历史记录**：
   - 查看所有生成历史，按时间倒序排列
   - 点击历史图片可回填生成参数
   - 点击"编辑"按钮可将历史图片作为输入进入编辑模式
   - 点击删除按钮可移除不需要的历史记录

### 主题切换

界面右上角提供主题切换按钮，支持明暗主题切换，设置会自动保存到本地存储。

### 图像编辑功能

- **上传图像**：点击或拖拽图像到上传区域
- **预览功能**：上传后可预览图像，点击预览图可重新选择
- **编辑提示词**：系统提供默认编辑提示词，如"将画面风格变为迪士尼3D动画风格"
- **一键编辑**：从历史记录或结果图片直接进入编辑模式，无需重新上传

## 部署说明

### 使用 Nginx 反向代理

1. **配置 Nginx**：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /comfimage/ {
           proxy_pass http://127.0.0.1:5000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /comfimage/static/ {
           alias /path/to/comfimage/static/;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

2. **启动应用**：
   ```bash
   python scripts/run.py --base_url /comfimage
   ```

### 生产环境部署

1. **使用 Gunicorn**：
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 127.0.0.1:5000 src:app
   ```

2. **设置环境变量**：
   ```bash
   export FLASK_ENV=production
   ```

## API 文档

### 认证接口

- `POST /login` - 用户登录
- `POST /logout` - 用户登出
- `GET /auth-status` - 检查登录状态
- `POST /change-password` - 修改密码

### 图像生成接口

- `POST /generate` - 生成图像（需要登录）
- `GET /image/<path>` - 获取生成的图像（需要登录）

## 开发指南

### 项目结构说明

- `src/app.py`: 主应用文件，包含 Flask 路由和 ComfyUI 集成
- `static/`: 前端静态文件
  - `index.html`: 主页面，包含完整的 UI
  - `script.js`: 前端交互逻辑
- `scripts/`: 工具脚本
  - `run.py`: 应用启动脚本
  - `manage_users.py`: 用户管理工具
- `config/`: 配置文件
- `docs/`: 项目文档

### 代码风格

项目遵循以下代码规范：
- 使用中文注释
- 函数和变量使用 snake_case 命名
- 常量使用 UPPER_CASE 命名
- 导入语句按标准库、第三方库、本地导入分组

### 扩展开发

如需添加新功能：
1. 在 `src/app.py` 中添加新的路由
2. 更新前端 `static/script.js` 添加相应交互
3. 如需要新页面，修改 `static/index.html`
4. 更新工作流配置 `config/z_image_turbo.json`

## 配置说明

### 核心配置

- **COMFYUI_API_URL**: ComfyUI API 地址，默认 `http://127.0.0.1:8188`
- **COMFYUI_OUTPUT_DIR**: ComfyUI 输出目录路径，需根据实际路径调整
- **BASE_PATH**: 基础URL路径，用于反向代理部署

### 工作流配置

- **z_image_turbo.json**: 快速图像生成工作流模板
- **flux2_klein_t2i.json**: Flux 文本到图像生成工作流模板
- **flux2_klein_edit.json**: Flux 图像编辑工作流模板
- 支持自定义节点ID映射和参数注入
- 可根据需要修改生成参数和模型配置

## 故障排除

### 常见问题

1. **ComfyUI 连接失败**
   - 检查 ComfyUI 是否正在运行
   - 确认 API 地址和端口正确
   - 检查防火墙设置

2. **图像生成失败**
   - 确认工作流文件存在且格式正确
   - 检查输出目录权限
   - 查看 ComfyUI 控制台错误信息

3. **用户登录问题**
   - 确认数据库文件存在
   - 检查密码是否正确
   - 重置数据库：删除 `instance/users.db` 并重启应用

### 日志查看

应用运行时会输出关键信息到控制台，包括：
- 用户登录状态
- 图像生成进度
- API 调用结果
- 错误信息

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

1. Fork 项目
2. 创建特性分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

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
│   ├── z_image_turbo.json      # 快速图像生成工作流配置
│   ├── flux2_klein_t2i.json    # Flux 文本到图像工作流配置
│   └── flux2_klein_edit.json   # Flux 图像编辑工作流配置
├── instance/               # 实例数据
│   └── users.db            # 用户数据库
├── requirements.txt        # Python 依赖
├── README.md               # 项目说明
└── .gitignore             # Git 忽略文件
```

## 许可证

此项目仅供学习和个人使用。
