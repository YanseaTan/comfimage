/**
 * 图片上传模块
 */

// DOM 元素
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('image-preview');
const uploadArea = document.getElementById('upload-area');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const uploadDeleteBtn = document.getElementById('upload-delete-btn');
const generateBtn = document.getElementById('generate-btn');

/**
 * 初始化上传模块
 */
export function initUpload() {
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 点击预览图片重新选择文件
    imagePreview.addEventListener('click', (event) => {
        event.stopPropagation();
        imageInput.click();
    });

    // 图片上传预览
    imageInput.addEventListener('change', handleImageChange);

    // 删除按钮
    uploadDeleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        resetImageUpload();
    });
}

/**
 * 处理图片选择变化
 */
function handleImageChange() {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            uploadDeleteBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
    updateGenerateBtnState();
}

/**
 * 重置图片上传区域
 */
export function resetImageUpload() {
    imageInput.value = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    uploadPlaceholder.style.display = 'flex';
    uploadDeleteBtn.style.display = 'none';
    updateGenerateBtnState();
}

/**
 * 更新生成按钮状态
 */
export function updateGenerateBtnState() {
    const modelSelect = document.getElementById('model');
    if (modelSelect.value === 'flux2_klein_edit') {
        const hasImage = imageInput.files.length > 0;
        generateBtn.disabled = !hasImage;
    } else {
        generateBtn.disabled = false;
    }
}

/**
 * 获取图片文件
 * @returns {File|null}
 */
export function getImageFile() {
    return imageInput.files[0] || null;
}

/**
 * 获取图片预览 URL
 * @returns {string}
 */
export function getImagePreviewSrc() {
    return imagePreview.src;
}

// 导出 DOM 元素供其他模块使用
export { imageInput, imagePreview, uploadPlaceholder, uploadDeleteBtn };