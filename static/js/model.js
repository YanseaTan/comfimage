/**
 * 模型选择模块
 */
import { MODEL_DEFAULT_PROMPTS } from './config.js';
import { updateGenerateBtnState, resetImageUpload } from './upload.js';

// DOM 元素
const modelSelect = document.getElementById('model');
const resolutionGroup = document.getElementById('resolution-group');
const imageUploadGroup = document.getElementById('image-upload-group');

/**
 * 初始化模型模块
 */
export function initModel() {
    // 页面加载时设置默认模型的提示词
    window.addEventListener('load', () => {
        updateModelUI(modelSelect.value);
    });

    // 模型选择变化处理
    modelSelect.addEventListener('change', () => {
        updateModelUI(modelSelect.value);
        document.getElementById('seed').value = '';
    });
}

/**
 * 更新模型 UI
 * @param {string} selectedModel
 */
export function updateModelUI(selectedModel) {
    const promptInput = document.getElementById('prompt');

    if (selectedModel === 'flux2_klein_edit') {
        resolutionGroup.style.display = 'none';
        imageUploadGroup.style.display = 'block';
        document.getElementById('image').required = true;
    } else {
        resolutionGroup.style.display = 'flex';
        imageUploadGroup.style.display = 'none';
        document.getElementById('image').required = false;
        resetImageUpload();
    }

    // 设置默认提示词
    promptInput.value = MODEL_DEFAULT_PROMPTS[selectedModel] || '';

    updateGenerateBtnState();
}

/**
 * 获取当前选中的模型
 * @returns {string}
 */
export function getSelectedModel() {
    return modelSelect.value;
}