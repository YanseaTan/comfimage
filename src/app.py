import json
import os
import random
import time
from functools import wraps

import requests
from flask import Flask, jsonify, redirect, request, send_from_directory, session, url_for
from flask_httpauth import HTTPBasicAuth
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# 项目路径配置
BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, '..', 'static')
CONFIG_DIR = os.path.join(BASE_DIR, '..', 'config')

# 从环境变量获取基础路径（nginx location路径），默认为空字符串（本地开发使用）
BASE_PATH = os.getenv('BASE_PATH', '')

# Flask应用配置
app = Flask(__name__, static_folder='../static')
app.secret_key = 'your-secret-key-here'  # 用于session，请更改为复杂密钥

# 数据库配置
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库和认证
db = SQLAlchemy(app)
auth = HTTPBasicAuth()

# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

@auth.verify_password
def verify_password(username, password):
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return username
    return None

# --- 配置 ---
COMFYUI_API_URL = "http://127.0.0.1:8188"
# !!! 重要: 请将此路径修改为你 ComfyUI 的实际输出目录 !!!
# 通常是在 ComfyUI 文件夹下的 'output' 文件夹
# 如果你的 app.py 和 ComfyUI 文件夹在同一级目录，路径可能如下：
COMFYUI_OUTPUT_DIR = r"../../../comfyui/output"
COMFYUI_INPUT_DIR = r"../../../comfyui/input"
# 使用 r"" 可以避免 Windows 路径中的反斜杠问题

# 模型配置映射
MODEL_CONFIGS = {
    'z_image_turbo': {
        'file': 'z_image_turbo.json',
        'prompt_node': '6',
        'latent_node': '13',
        'seed_node': '3',
        'save_node': '9'
    },
    'flux2_klein_t2i': {
        'file': 'flux2_klein_t2i.json',
        'prompt_node': '96',
        'width_node': '88',
        'height_node': '89',
        'seed_node': '90',
        'save_node': '78'
    },
    'flux2_klein_edit': {
        'file': 'flux2_klein_edit.json',
        'prompt_node': '110',
        'load_image_node': '76',
        'seed_node': '102',
        'save_node': '9'
    }
}

# 加载工作流模板缓存
workflow_templates = {}
for model, config in MODEL_CONFIGS.items():
    try:
        with open(os.path.join(CONFIG_DIR, config['file']), 'r', encoding='utf-8') as f:
            workflow_templates[model] = json.load(f)
        print(f"加载 {model} 工作流模板成功")
    except FileNotFoundError:
        print(f"错误: {config['file']} 文件未找到。")
        workflow_templates[model] = None

def login_required(func):
    """装饰器：检查用户是否登录"""
    @wraps(func)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "未登录"}), 401
        return func(*args, **kwargs)
    return decorated_function

@app.route('/login', methods=['POST'])
def login():
    """处理登录"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if verify_password(username, password):
        session['user'] = username
        return jsonify({"message": "登录成功"})
    return jsonify({"error": "用户名或密码错误"}), 401

@app.route('/logout')
def logout():
    """处理登出"""
    session.pop('user', None)
    return redirect(BASE_PATH + '/')

@app.route('/change-password', methods=['POST'])
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
    db.session.commit()

    return jsonify({"message": "密码修改成功"})

@app.route('/auth-status')
def auth_status():
    """检查登录状态"""
    return jsonify({"logged_in": 'user' in session, "user": session.get('user')})

@app.route('/')
def index():
    # 动态注入BASE_PATH到index.html
    index_path = os.path.join(STATIC_DIR, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # 替换占位符
    content = content.replace('{{base_path}}', BASE_PATH)
    return content, 200, {'Content-Type': 'text/html'}

@app.route('/script.js')
def script_js():
    return send_from_directory(STATIC_DIR, 'script.js')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(STATIC_DIR, 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/generate', methods=['POST'])
@login_required
def generate_image():
    # 支持JSON和FormData
    if request.content_type.startswith('multipart/form-data'):
        model = request.form.get('model', 'z_image_turbo')
        prompt_text = request.form.get('prompt', '')
        seed_input = request.form.get('seed', '')
        image_file = request.files.get('image')
    else:
        data = request.json
        model = data.get('model', 'z_image_turbo')
        prompt_text = data.get('prompt', '')
        seed_input = data.get('seed', '')
        width = data.get('width', 512)
        height = data.get('height', 512)
        image_file = None

    if model not in MODEL_CONFIGS or not workflow_templates[model]:
        return jsonify({"error": f"模型 {model} 未配置或模板未加载"}), 500

    config = MODEL_CONFIGS[model]
    workflow = json.loads(json.dumps(workflow_templates[model]))

    # 处理图像上传（仅flux2_klein_edit）
    if model == 'flux2_klein_edit' and 'load_image_node' in config:
        if not image_file:
            return jsonify({"error": "图像编辑模型需要上传图像"}), 400
        # 使用ComfyUI的upload API上传图像
        upload_response = requests.post(
            f"{COMFYUI_API_URL}/upload/image",
            files={'image': (image_file.filename, image_file.stream, image_file.mimetype)}
        )
        if upload_response.status_code != 200:
            return jsonify({"error": f"上传图像到ComfyUI失败: {upload_response.text}"}), 500
        upload_data = upload_response.json()
        filename = upload_data.get('name')
        if not filename:
            return jsonify({"error": "ComfyUI未返回文件名"}), 500
        print(f"图像上传到ComfyUI: {filename}")

        # 注入图像路径到LoadImage节点
        load_image_node_id = config['load_image_node']
        if load_image_node_id in workflow and "inputs" in workflow[load_image_node_id]:
            workflow[load_image_node_id]["inputs"]["image"] = filename
        else:
            return jsonify({"error": f"无法在工作流中找到LoadImage节点 (ID: {load_image_node_id})"}), 400

    if seed_input == '' or not seed_input.isdigit():
        seed = random.randint(0, 2**32 - 1)
        print(f"使用随机种子: {seed}")
    else:
        seed = int(seed_input)
        print(f"使用指定种子: {seed}")

    # --- 注入正向提示词 ---
    prompt_node_id = config['prompt_node']
    if prompt_node_id in workflow and "inputs" in workflow[prompt_node_id]:
        workflow[prompt_node_id]["inputs"]["text"] = prompt_text
    else:
        return jsonify({"error": f"无法在工作流中找到正向提示词节点 (ID: {prompt_node_id})"}), 400

    # --- 注入图片尺寸 ---
    if model == 'flux2_klein_edit':
        # 编辑模型不手动设置尺寸，由workflow自动获取
        pass
    elif 'latent_node' in config:
        # z_image_turbo 风格：单个latent节点
        if not request.content_type.startswith('multipart/form-data'):
            latent_node_id = config['latent_node']
            if latent_node_id in workflow and "inputs" in workflow[latent_node_id]:
                workflow[latent_node_id]["inputs"]["width"] = width
                workflow[latent_node_id]["inputs"]["height"] = height
            else:
                return jsonify({"error": f"无法在工作流中找到尺寸节点 (ID: {latent_node_id})"}), 400
    else:
        # flux2 风格：分离的width和height节点
        if not request.content_type.startswith('multipart/form-data'):
            width_node_id = config['width_node']
            height_node_id = config['height_node']
            if width_node_id in workflow and "inputs" in workflow[width_node_id]:
                workflow[width_node_id]["inputs"]["value"] = width
            else:
                return jsonify({"error": f"无法在工作流中找到宽度节点 (ID: {width_node_id})"}), 400
            if height_node_id in workflow and "inputs" in workflow[height_node_id]:
                workflow[height_node_id]["inputs"]["value"] = height
            else:
                return jsonify({"error": f"无法在工作流中找到高度节点 (ID: {height_node_id})"}), 400

    # --- 注入种子 ---
    seed_node_id = config['seed_node']
    seed_key = "noise_seed" if model.startswith('flux2') else "seed"
    if seed_node_id in workflow and "inputs" in workflow[seed_node_id]:
        workflow[seed_node_id]["inputs"][seed_key] = seed
    else:
        return jsonify({"error": f"无法在工作流中找到种子节点 (ID: {seed_node_id})"}), 400

    # 2. 向 ComfyUI 提交任务
    payload = {"prompt": workflow}
    response = requests.post(f"{COMFYUI_API_URL}/prompt", json=payload)
    
    if response.status_code != 200:
        return jsonify({"error": f"ComfyUI API 提交失败: {response.text}"}), 500

    prompt_id = response.json().get('prompt_id')
    if not prompt_id:
        return jsonify({"error": "未能从 ComfyUI 获取 prompt_id"}), 500

    # 3. 轮询 ComfyUI 以检查任务状态
    while True:
        history_response = requests.get(f"{COMFYUI_API_URL}/history/{prompt_id}")
        if history_response.status_code == 200:
            history = history_response.json()
            if prompt_id in history:
                outputs = history[prompt_id]['outputs']
                save_image_node_id = config['save_node']
                if save_image_node_id in outputs:
                    image_info = outputs[save_image_node_id]["images"][0]
                    filename = image_info['filename']
                    subfolder = image_info.get('subfolder', '')
                    
                    # 构建图片URL
                    image_path = f"{subfolder}/{filename}" if subfolder else filename
                    image_url = f"{BASE_PATH}/image/{image_path}"

                    print(f"任务完成! 图片URL: {image_url}")
                    return jsonify({"image_url": image_url, "seed": seed})
                else:
                    return jsonify({"error": f"无法在工作流输出中找到图片节点 (ID: {save_image_node_id})"}), 500
        
        time.sleep(1)

@app.route('/image/<path:subpath>')
@login_required
def serve_image(subpath):
    """
    从 ComfyUI 的输出目录中提供图片文件。
    <path:subpath> 可以匹配包含斜杠的路径，例如 'subfolder/filename.png'
    """
    # 安全检查：防止路径遍历攻击
    # 确保请求的文件在 COMFYUI_OUTPUT_DIR 目录内
    safe_path = os.path.join(COMFYUI_OUTPUT_DIR, subpath)
    if not os.path.abspath(safe_path).startswith(os.path.abspath(COMFYUI_OUTPUT_DIR)):
        return "Invalid file path", 400
        
    return send_from_directory(COMFYUI_OUTPUT_DIR, subpath)


# 数据库初始化函数
def init_db():
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
