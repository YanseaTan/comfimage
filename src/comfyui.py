"""
ComfyUI 集成模块
包含工作流处理和图片/视频生成功能（异步任务模式）
"""
import io
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
from src.tasks import create_task, get_task, start_task, update_task


class GenerationError(Exception):
    """生成过程中的可预期错误（消息直接透传给前端）"""


def _fail(message):
    """抛出可预期错误（由线程包装写为任务 error）"""
    raise GenerationError(message)


@login_required
def generate_image():
    """生成图片/视频（异步：立即返回 task_id，后台线程执行）"""
    # 支持JSON和FormData
    if request.content_type.startswith('multipart/form-data'):
        model = request.form.get('model', 'z_image_turbo')
        prompt_text = request.form.get('prompt', '')
        seed_input = request.form.get('seed', '')
        image_file = request.files.get('image')
        width = request.form.get('width', 512)
        height = request.form.get('height', 512)
        aspect_ratio = request.form.get('aspect_ratio', '')
        duration = request.form.get('duration', '')
    else:
        data = request.json
        model = data.get('model', 'z_image_turbo')
        prompt_text = data.get('prompt', '')
        seed_input = data.get('seed', '')
        width = data.get('width', 512)
        height = data.get('height', 512)
        image_file = None
        aspect_ratio = data.get('aspect_ratio', '')
        duration = data.get('duration', '')

    # 同步校验（不进线程，立即返回错误）
    if model not in MODEL_CONFIGS or not workflow_templates[model]:
        return jsonify({"error": f"模型 {model} 未配置或模板未加载"}), 500

    config = MODEL_CONFIGS[model]

    # 图生视频必须上传首帧
    if config.get('is_video') and 'load_image_node' in config and not image_file:
        return jsonify({"error": "图生视频需要上传首帧图片"}), 400
    # 图像编辑必须上传图片
    if model == 'flux2_klein_edit' and 'load_image_node' in config and not image_file:
        return jsonify({"error": "图像编辑模型需要上传图像"}), 400

    # 图片文件流在线程外读取（线程内不能访问 Flask request）
    image_bytes = image_file.stream.read() if image_file else None

    # 创建异步任务，立即返回
    task_id = create_task()
    params = {
        'model': model,
        'config': config,
        'prompt_text': prompt_text,
        'seed_input': seed_input,
        'width': width,
        'height': height,
        'aspect_ratio': aspect_ratio,
        'duration': duration,
        'image_bytes': image_bytes,
        'image_filename': image_file.filename if image_file else None,
        'image_mimetype': image_file.mimetype if image_file else None,
    }
    start_task(_run_generation, task_id, (params,))
    print(f"任务 {task_id} 已提交后台执行: {model}")
    return jsonify({"task_id": task_id})


@login_required
def get_task_status(task_id):
    """查询异步任务状态"""
    task = get_task(task_id)
    if task is None:
        return jsonify({"error": "任务不存在"}), 404
    return jsonify({
        "status": task['status'],
        "result": task['result'],
        "error": task['error']
    })


def _run_generation(task_id, params):
    """后台线程执行体：图片或视频生成"""
    update_task(task_id, status='running')

    model = params['model']
    config = params['config']
    workflow = json.loads(json.dumps(workflow_templates[model]))

    if config.get('is_video'):
        result = _generate_video(config, workflow, params)
    else:
        result = _generate_image(config, workflow, params)

    update_task(task_id, status='done', result=result)
    print(f"任务 {task_id} 完成")


def _inject(workflow, node_id, key, value, description):
    """注入参数到工作流节点，节点不存在时抛错"""
    if node_id in workflow and "inputs" in workflow[node_id]:
        workflow[node_id]["inputs"][key] = value
    else:
        _fail(f"无法在工作流中找到{description}节点 (ID: {node_id})")


def _upload_image(image_bytes, filename, mimetype, description):
    """上传图片到 ComfyUI，返回文件名"""
    upload_response = requests.post(
        f"{COMFYUI_API_URL}/upload/image",
        files={'image': (filename, io.BytesIO(image_bytes), mimetype)}
    )
    if upload_response.status_code != 200:
        _fail(f"上传{description}到ComfyUI失败: {upload_response.text}")
    name = upload_response.json().get('name')
    if not name:
        _fail("ComfyUI未返回文件名")
    print(f"{description}上传到ComfyUI: {name}")
    return name


def _resolve_seed(seed_input):
    """种子解析：空/非数字则随机"""
    if seed_input == '' or not seed_input.isdigit():
        seed = random.randint(0, 2**32 - 1)
        print(f"使用随机种子: {seed}")
    else:
        seed = int(seed_input)
        print(f"使用指定种子: {seed}")
    return seed


def _submit_workflow(workflow):
    """提交工作流到 ComfyUI，返回 prompt_id"""
    response = requests.post(f"{COMFYUI_API_URL}/prompt", json={"prompt": workflow})
    if response.status_code != 200:
        _fail(f"ComfyUI API 提交失败: {response.text}")
    prompt_id = response.json().get('prompt_id')
    if not prompt_id:
        _fail("未能从 ComfyUI 获取 prompt_id")
    return prompt_id


def _wait_comfyui(config, prompt_id):
    """轮询 ComfyUI 任务状态，返回输出节点内容；任务失败抛错"""
    while True:
        history_response = requests.get(f"{COMFYUI_API_URL}/history/{prompt_id}")
        if history_response.status_code == 200:
            history = history_response.json()
            if prompt_id in history:
                entry = history[prompt_id]
                # 失败检测（提取 execution_error 消息）
                if entry.get('status', {}).get('status_str') == 'error':
                    error_msg = '未知错误'
                    for m in entry.get('status', {}).get('messages', []):
                        if m and m[0] == 'execution_error':
                            error_msg = m[1].get('message', error_msg)
                    _fail(f"ComfyUI 任务失败: {error_msg}")
                save_node_id = config['save_node']
                outputs = entry.get('outputs', {})
                if save_node_id in outputs:
                    return outputs[save_node_id]
        time.sleep(1)


def _generate_image(config, workflow, params):
    """图片生成执行体（原同步逻辑移入线程）"""
    model = params['model']
    prompt_text = params['prompt_text']
    seed_input = params['seed_input']
    width = params['width']
    height = params['height']
    image_bytes = params['image_bytes']

    # 处理图像上传（仅flux2_klein_edit）
    if model == 'flux2_klein_edit' and 'load_image_node' in config:
        filename = _upload_image(image_bytes, params['image_filename'], params['image_mimetype'], "图像")
        _inject(workflow, config['load_image_node'], 'image', filename, 'LoadImage')

    # 注入种子
    seed = _resolve_seed(seed_input)
    seed_key = config.get('seed_key', "noise_seed" if model.startswith('flux2') else "seed")
    _inject(workflow, config['seed_node'], seed_key, seed, '种子')

    # 注入提示词
    prompt_key = config.get('prompt_key', 'text')
    _inject(workflow, config['prompt_node'], prompt_key, prompt_text, '提示词')

    # 注入图片尺寸
    if model == 'flux2_klein_edit':
        pass  # 编辑模型不手动设置尺寸，由workflow自动获取
    elif 'latent_node' in config:
        _inject(workflow, config['latent_node'], 'width', width, '尺寸')
        _inject(workflow, config['latent_node'], 'height', height, '尺寸')
    else:
        _inject(workflow, config['width_node'], 'value', width, '宽度')
        _inject(workflow, config['height_node'], 'value', height, '高度')

    # 提交并轮询
    prompt_id = _submit_workflow(workflow)
    outputs = _wait_comfyui(config, prompt_id)

    image_info = outputs["images"][0]
    filename = image_info['filename']
    subfolder = image_info.get('subfolder', '')
    image_path = f"{subfolder}/{filename}" if subfolder else filename
    image_url = f"{BASE_PATH}/image/{image_path}"
    print(f"任务完成! 图片URL: {image_url}")
    return {"image_url": image_url, "seed": seed}


def _generate_video(config, workflow, params):
    """视频生成执行体（minimax_h3_i2v_turbo / minimax_h3_t2v_turbo）"""
    prompt_text = params['prompt_text']
    seed_input = params['seed_input']
    aspect_ratio = params['aspect_ratio']
    duration = params['duration']
    image_bytes = params['image_bytes']

    # 1. 首帧处理：图生视频（配置了 load_image_node，已由视图层校验必传），文生视频无此节点
    if 'load_image_node' in config:
        filename = _upload_image(image_bytes, params['image_filename'], params['image_mimetype'], "首帧")
        _inject(workflow, config['load_image_node'], 'image', filename, 'LoadImage')

    # 2. 注入种子
    seed = _resolve_seed(seed_input)
    seed_key = config.get('seed_key', 'noise_seed')
    _inject(workflow, config['seed_node'], seed_key, seed, '种子')

    # 3. 注入提示词（键为 "prompt"）
    prompt_key = config.get('prompt_key', 'prompt')
    _inject(workflow, config['prompt_node'], prompt_key, prompt_text, '提示词')

    # 4. 注入视频比例（仅配置了比例节点的模型需要；I2V 由首帧图片自动计算分辨率，不注入）
    aspect_ratio_node = config.get('aspect_ratio_node')
    if aspect_ratio and aspect_ratio_node:
        _inject(workflow, aspect_ratio_node, 'aspect_ratio', aspect_ratio, '比例')

    # 5. 注入生成长度（秒，仅合法整数才覆盖，否则保留模板默认 5）
    if duration and str(duration).isdigit():
        _inject(workflow, config['duration_node'], 'value', int(duration), '时长')

    # 6. 提交并轮询
    prompt_id = _submit_workflow(workflow)
    outputs = _wait_comfyui(config, prompt_id)

    # 解析输出：SaveVideo 的结果在 videos 或 gifs 键下（取决于格式），兼容 images
    save_node_id = config['save_node']
    for key in ('videos', 'gifs', 'images'):
        media_list = outputs.get(key)
        if media_list:
            media = media_list[0]
            filename = media['filename']
            subfolder = media.get('subfolder', '')
            video_path = f"{subfolder}/{filename}" if subfolder else filename
            video_url = f"{BASE_PATH}/video/{video_path}"
            print(f"视频任务完成! 视频URL: {video_url}")
            return {"video_url": video_url, "seed": seed}
    _fail(f"无法在工作流输出中找到视频节点 (ID: {save_node_id})")
