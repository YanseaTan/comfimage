import json
import random
import requests
import time
import os
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, '..', 'static')
CONFIG_DIR = os.path.join(BASE_DIR, '..', 'config')

app = Flask(__name__, static_folder='../static')

# --- 配置 ---
COMFYUI_API_URL = "http://127.0.0.1:8188"
# !!! 重要: 请将此路径修改为你 ComfyUI 的实际输出目录 !!!
# 通常是在 ComfyUI 文件夹下的 'output' 文件夹
# 如果你的 app.py 和 ComfyUI 文件夹在同一级目录，路径可能如下：
COMFYUI_OUTPUT_DIR = r"../../../comfyui/output" 
# 使用 r"" 可以避免 Windows 路径中的反斜杠问题

# 加载工作流模板
# 注意：现在我们使用的是 API 格式的 JSON 文件
try:
    with open(os.path.join(CONFIG_DIR, 'z_image_turbo.json'), 'r', encoding='utf-8') as f:
        workflow_template = json.load(f)
except FileNotFoundError:
    print("错误: z_image_turbo.json 文件未找到。请确保它在正确的目录下。")
    workflow_template = None

@app.route('/')
def index():
    return send_from_directory(STATIC_DIR, 'index.html')

@app.route('/script.js')
def script_js():
    return send_from_directory(STATIC_DIR, 'script.js')

@app.route('/generate', methods=['POST'])
def generate_image():
    if not workflow_template:
        return jsonify({"error": "服务器端工作流模板未加载"}), 500

    data = request.json
    prompt_text = data.get('prompt', '')
    width = data.get('width', 512)
    height = data.get('height', 512)
    seed_input = data.get('seed', '')

    if seed_input == '' or not seed_input.isdigit():
        seed = random.randint(0, 2**32 - 1)
        print(f"使用随机种子: {seed}")
    else:
        seed = int(seed_input)
        print(f"使用指定种子: {seed}")

    workflow = json.loads(json.dumps(workflow_template))

    # --- 注入正向提示词 (API 格式) ---
    # 节点ID: 6, 类型: CLIPTextEncode
    # 在 API 格式中，参数在 inputs 对象里
    prompt_node_id = "6"
    if prompt_node_id in workflow and "inputs" in workflow[prompt_node_id]:
        workflow[prompt_node_id]["inputs"]["text"] = prompt_text
    else:
        return jsonify({"error": f"无法在工作流中找到正向提示词节点 (ID: {prompt_node_id})"}), 400

    # --- 注入图片尺寸 (API 格式) ---
    # 节点ID: 13, 类型: EmptySD3LatentImage
    # 在 API 格式中，参数在 inputs 对象里
    empty_latent_node_id = "13"
    if empty_latent_node_id in workflow and "inputs" in workflow[empty_latent_node_id]:
        workflow[empty_latent_node_id]["inputs"]["width"] = width
        workflow[empty_latent_node_id]["inputs"]["height"] = height
    else:
        return jsonify({"error": f"无法在工作流中找到尺寸节点 (ID: {empty_latent_node_id})"}), 400

    # --- 注入种子 (API 格式) ---
    # 节点ID: 3, 类型: KSampler
    # 在 API 格式中，参数在 inputs 对象里
    ksampler_node_id = "3"
    if ksampler_node_id in workflow and "inputs" in workflow[ksampler_node_id]:
        workflow[ksampler_node_id]["inputs"]["seed"] = seed
    else:
        return jsonify({"error": f"无法在工作流中找到KSampler节点 (ID: {ksampler_node_id})"}), 400

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
                save_image_node_id = "9"
                if save_image_node_id in outputs:
                    image_info = outputs[save_image_node_id]["images"][0]
                    filename = image_info['filename']
                    subfolder = image_info.get('subfolder', '')
                    
                    # *** 关键改动在这里 ***
                    # 构建一个指向我们自己 Flask 服务的 URL
                    # 使用 <path:subpath> 来处理可能存在的子文件夹
                    image_path = f"{subfolder}/{filename}" if subfolder else filename
                    image_url = f"/image/{image_path}"
                    
                    print(f"任务完成! 图片URL: {image_url}")
                    return jsonify({"image_url": image_url})
                else:
                    return jsonify({"error": f"无法在工作流输出中找到图片节点 (ID: {save_image_node_id})"}), 500
        
        time.sleep(1)

# *** 新增：用于提供图片服务的路由 ***
@app.route('/image/<path:subpath>')
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


if __name__ == '__main__':
    # 确保监听所有网络接口
    app.run(host='0.0.0.0', port=5000, debug=True)
