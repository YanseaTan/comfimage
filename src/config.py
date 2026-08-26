"""
配置模块
包含路径配置、ComfyUI 配置、模型配置
"""
import json
import os

# 项目路径配置
BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, '..', 'static')
CONFIG_DIR = os.path.join(BASE_DIR, '..', 'config')

# 从环境变量获取基础路径（nginx location路径），默认为空字符串（本地开发使用）
BASE_PATH = os.getenv('BASE_PATH', '')

# --- ComfyUI 配置 ---
COMFYUI_API_URL = "http://127.0.0.1:8188"
# !!! 重要: 请将此路径修改为你 ComfyUI 的实际输出目录 !!!
# 通常是在 ComfyUI 文件夹下的 'output' 文件夹
COMFYUI_OUTPUT_DIR = r"../../../comfyui_v2/ComfyUI/output"
COMFYUI_INPUT_DIR = r"../../../comfyui_v2/ComfyUI/input"

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
    },
    'minimax_h3_i2v_turbo': {
        'file': 'minimax_h3_i2v_turbo.json',
        'prompt_node': '131',
        'prompt_key': 'prompt',        # 视频节点提示词键为 "prompt"，图片为 "text"
        'load_image_node': '139',      # 首帧上传注入点（必填）
        'seed_node': '129',
        'seed_key': 'noise_seed',
        'save_node': '92',
        'duration_node': '133',        # PrimitiveFloat，生成长度（秒）
        # 无 aspect_ratio_node：分辨率由模板内 GetImageSize 节点按首帧图片自动计算
        'is_video': True
    },
    'minimax_h3_t2v_turbo': {
        'file': 'minimax_h3_t2v_turbo.json',
        'prompt_node': '131',
        'prompt_key': 'prompt',
        'seed_node': '129',
        'seed_key': 'noise_seed',
        'save_node': '92',
        'duration_node': '133',
        'aspect_ratio_node': '115',
        'is_video': True
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