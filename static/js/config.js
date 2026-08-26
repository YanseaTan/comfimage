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

// 视频生成配置
export const VIDEO_MODEL = 'minimax_h3_i2v_turbo';
export const VIDEO_MODELS = {
    'minimax_h3_t2v_turbo': '文生视频',
    'minimax_h3_i2v_turbo': '图生视频'
};
export const VIDEO_DEFAULT_PROMPTS = {
    'minimax_h3_t2v_turbo': '镜头缓缓推进，展现壮丽的日落山谷风光',
    'minimax_h3_i2v_turbo': '镜头拉远，女孩转身正对镜头'
};