/**
 * 配置模块
 */

// 从 window 获取动态注入的 base 路径
export const baseUrl = window.BASE_PATH || '';

// 模型默认提示词配置
export const MODEL_DEFAULT_PROMPTS = {
    'z_image_turbo': '阳光洒在少女的脸颊上',
    'flux2_klein_t2i': '使用梵高绘画风格绘制星空下的草原与河流',
    'flux2_klein_edit': '将画面风格变为迪士尼3D动画风格'
};