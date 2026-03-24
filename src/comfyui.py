"""
ComfyUI 集成模块
包含工作流处理和图片生成功能
"""
import json
import random
import time

import requests
from flask import jsonify, request

from src.config import (
    BASE_PATH,
    COMFYUI_API_URL,
    MODEL_CONFIGS,
    workflow_templates
)
from src.auth import login_required


@login_required
def generate_image():
    """生成图片"""
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