"""
路由模块
包含页面路由和图片服务
"""
import os

from flask import Blueprint, send_from_directory

from src.config import BASE_PATH, COMFYUI_OUTPUT_DIR, STATIC_DIR
from src.auth import login_required

# 创建主蓝图
main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    """主页"""
    # 动态注入BASE_PATH到index.html
    index_path = os.path.join(STATIC_DIR, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # 替换占位符
    content = content.replace('{{base_path}}', BASE_PATH)
    return content, 200, {'Content-Type': 'text/html'}


@main_bp.route('/script.js')
def script_js():
    """返回前端脚本"""
    return send_from_directory(STATIC_DIR, 'script.js')


@main_bp.route('/favicon.ico')
def favicon():
    """返回网站图标"""
    return send_from_directory(STATIC_DIR, 'favicon.ico', mimetype='image/vnd.microsoft.icon')


@main_bp.route('/js/<path:filename>')
def serve_js(filename):
    """返回 js 目录下的文件"""
    js_dir = os.path.join(STATIC_DIR, 'js')
    response = send_from_directory(js_dir, filename)
    response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    return response


@main_bp.route('/image/<path:subpath>')
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


@main_bp.route('/video/<path:subpath>')
@login_required
def serve_video(subpath):
    """
    从 ComfyUI 的输出目录中提供视频文件。
    路径穿越检查与 /image/ 路由一致。
    """
    # 安全检查：防止路径遍历攻击
    safe_path = os.path.join(COMFYUI_OUTPUT_DIR, subpath)
    if not os.path.abspath(safe_path).startswith(os.path.abspath(COMFYUI_OUTPUT_DIR)):
        return "Invalid file path", 400

    return send_from_directory(COMFYUI_OUTPUT_DIR, subpath)