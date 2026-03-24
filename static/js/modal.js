/**
 * 模态框模块
 */
import { showCopyToast, fetchImageAsFile, scrollToTop } from './utils.js';
import { updateModelUI } from './model.js';
import { imageInput, imagePreview, uploadPlaceholder, uploadDeleteBtn } from './upload.js';
import { MODEL_DEFAULT_PROMPTS } from './config.js';

// DOM 元素
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-image');
const closeBtn = document.getElementById('close-modal');
const editBtn = document.getElementById('edit-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const resultImage = document.getElementById('result-image');

/**
 * 初始化模态框模块
 */
export function initModal() {
    // 点击结果图片打开模态框
    resultImage.onclick = () => {
        modal.style.display = 'block';
        modalImg.src = resultImage.src;
    };

    // 关闭按钮
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // 点击背景关闭
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // 复制按钮
    copyBtn.onclick = handleCopy;

    // 编辑按钮
    editBtn.onclick = handleEdit;

    // 下载按钮
    downloadBtn.onclick = handleDownload;
}

/**
 * 处理复制
 */
async function handleCopy() {
    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const response = await fetch(modalImg.src);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            showCopyToast('图片已复制');
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(modalImg.src);
            showCopyToast('图片URL已复制');
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = modalImg.src;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyToast('图片URL已复制');
        }
    } catch (error) {
        alert('复制失败：' + error.message + '。请尝试升级浏览器或使用下载功能。');
    }
}

/**
 * 处理编辑
 */
async function handleEdit() {
    modal.style.display = 'none';

    document.getElementById('model').value = 'flux2_klein_edit';
    updateModelUI('flux2_klein_edit');
    document.getElementById('prompt').value = MODEL_DEFAULT_PROMPTS['flux2_klein_edit'];
    document.getElementById('seed').value = '';

    await fetchImageAsFile(modalImg.src, imageInput, imagePreview, uploadPlaceholder, uploadDeleteBtn);
    scrollToTop();
}

/**
 * 处理下载
 */
function handleDownload() {
    const link = document.createElement('a');
    link.href = modalImg.src;
    link.download = modalImg.src.split('/').pop() || 'generated_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 显示模态框并设置图片
 * @param {string} imageSrc
 */
export function showModal(imageSrc) {
    modal.style.display = 'block';
    modalImg.src = imageSrc;
}