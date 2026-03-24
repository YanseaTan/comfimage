/**
 * 历史记录模块
 */
import { updateModelUI, getSelectedModel } from './model.js';
import { fetchImageAsFile } from './utils.js';
import { scrollToTop } from './utils.js';
import { imageInput, imagePreview, uploadPlaceholder, uploadDeleteBtn } from './upload.js';
import { MODEL_DEFAULT_PROMPTS } from './config.js';

// DOM 元素
const resultImage = document.getElementById('result-image');
const historyContainer = document.getElementById('history-container');

// 状态
let generationHistory = [];

/**
 * 添加历史记录
 * @param {object} item
 */
export function addHistory(item) {
    generationHistory.unshift(item);
    renderHistory();
}

/**
 * 渲染历史记录
 */
export function renderHistory() {
    historyContainer.innerHTML = '';

    generationHistory.forEach((item, index) => {
        const historyItem = createHistoryItem(item, index);
        historyContainer.appendChild(historyItem);
    });
}

/**
 * 创建历史记录项
 * @param {object} item
 * @param {number} index
 * @returns {HTMLElement}
 */
function createHistoryItem(item, index) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.style.position = 'relative';

    // 编辑按钮
    const editBtn = createEditButton(item);
    // 删除按钮
    const deleteBtn = createDeleteButton(index);
    // 缩略图
    const thumb = createThumbnail(item);
    // 参数信息
    const params = createParamsDiv(item);

    historyItem.appendChild(editBtn);
    historyItem.appendChild(deleteBtn);
    historyItem.appendChild(thumb);
    historyItem.appendChild(params);

    return historyItem;
}

/**
 * 创建编辑按钮
 */
function createEditButton(item) {
    const btn = document.createElement('span');
    btn.textContent = '编辑';
    btn.className = 'history-action-btn';
    btn.style.cssText = 'position: absolute; top: 0.9rem; right: 3rem; cursor: pointer; font-size: 1rem;';

    btn.onclick = async () => {
        document.getElementById('model').value = 'flux2_klein_edit';
        updateModelUI('flux2_klein_edit');
        document.getElementById('prompt').value = MODEL_DEFAULT_PROMPTS['flux2_klein_edit'];
        document.getElementById('seed').value = '';

        await fetchImageAsFile(item.image_url, imageInput, imagePreview, uploadPlaceholder, uploadDeleteBtn);
        scrollToTop();
    };

    return btn;
}

/**
 * 创建删除按钮
 */
function createDeleteButton(index) {
    const btn = document.createElement('span');
    btn.textContent = '×';
    btn.className = 'history-action-btn';
    btn.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; cursor: pointer; font-size: 1.5rem; font-weight: bold;';

    btn.onclick = () => {
        if (confirm('确定要删除此记录吗？')) {
            generationHistory.splice(index, 1);
            renderHistory();
        }
    };

    return btn;
}

/**
 * 创建缩略图
 */
function createThumbnail(item) {
    const thumb = document.createElement('img');
    thumb.src = item.image_url;
    thumb.alt = 'Generated Image';
    thumb.style.cssText = 'max-width: 200px; border-radius: 4px; cursor: pointer;';

    thumb.onclick = async () => {
        resultImage.src = item.image_url;
        resultImage.style.display = 'block';

        // 回填参数
        document.getElementById('model').value = item.model;
        updateModelUI(item.model);
        document.getElementById('prompt').value = item.prompt;

        if (item.model !== 'flux2_klein_edit') {
            document.getElementById('width').value = item.width;
            document.getElementById('height').value = item.height;
        }
        document.getElementById('seed').value = item.seed || '';

        // 如果是编辑模型，复制原始图像
        if (item.model === 'flux2_klein_edit' && item.original_image) {
            await fetchImageAsFile(item.original_image, imageInput, imagePreview, uploadPlaceholder, uploadDeleteBtn);
        }

        scrollToTop();
    };

    return thumb;
}

/**
 * 创建参数信息 div
 */
function createParamsDiv(item) {
    const params = document.createElement('div');
    params.style.marginTop = '0.5rem';

    if (item.model === 'flux2_klein_edit') {
        params.innerHTML = `<strong>模型:</strong> ${item.model}<br>
                            <strong>提示词:</strong> ${item.prompt}<br>
                            <strong>种子:</strong> ${item.seed || '随机'}`;
    } else {
        params.innerHTML = `<strong>模型:</strong> ${item.model}<br>
                            <strong>提示词:</strong> ${item.prompt}<br>
                            <strong>尺寸:</strong> ${item.width}x${item.height}<br>
                            <strong>种子:</strong> ${item.seed || '随机'}`;
    }

    return params;
}