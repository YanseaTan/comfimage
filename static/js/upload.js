/**
 * 图片上传模块（工厂化，支持多实例）
 */

/**
 * 创建上传控件实例
 * @param {object} options
 * @param {string} options.inputId       文件输入元素 id
 * @param {string} options.areaId        上传区域元素 id
 * @param {string} options.placeholderId 占位元素 id
 * @param {string} options.previewId     预览图元素 id
 * @param {string} options.deleteBtnId   删除按钮元素 id
 * @param {Function} [options.onChange]  文件选择/重置后的回调（如按钮状态更新）
 * @returns {object} { init, reset, getFile, getPreviewSrc, elements }
 */
export function createUploader(options) {
    const elements = {
        input: document.getElementById(options.inputId),
        area: document.getElementById(options.areaId),
        placeholder: document.getElementById(options.placeholderId),
        preview: document.getElementById(options.previewId),
        deleteBtn: document.getElementById(options.deleteBtnId)
    };

    /**
     * 处理图片选择变化
     */
    function handleImageChange() {
        const file = elements.input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                elements.preview.src = e.target.result;
                elements.preview.style.display = 'block';
                elements.placeholder.style.display = 'none';
                elements.deleteBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
        if (options.onChange) {
            options.onChange();
        }
    }

    /**
     * 初始化上传模块
     */
    function init() {
        // 点击上传区域触发文件选择
        elements.area.addEventListener('click', () => {
            elements.input.click();
        });

        // 点击预览图片重新选择文件
        elements.preview.addEventListener('click', (event) => {
            event.stopPropagation();
            elements.input.click();
        });

        // 图片上传预览
        elements.input.addEventListener('change', handleImageChange);

        // 删除按钮
        elements.deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            reset();
        });
    }

    /**
     * 重置上传区域
     */
    function reset() {
        elements.input.value = '';
        elements.preview.src = '';
        elements.preview.style.display = 'none';
        elements.placeholder.style.display = 'flex';
        elements.deleteBtn.style.display = 'none';
        if (options.onChange) {
            options.onChange();
        }
    }

    /**
     * 获取图片文件
     * @returns {File|null}
     */
    function getFile() {
        return elements.input.files[0] || null;
    }

    /**
     * 获取图片预览 URL
     * @returns {string}
     */
    function getPreviewSrc() {
        return elements.preview.src;
    }

    return { init, reset, getFile, getPreviewSrc, elements };
}

// 默认实例（图片表单），保持向后兼容
const imageUploader = createUploader({
    inputId: 'image',
    areaId: 'upload-area',
    placeholderId: 'upload-placeholder',
    previewId: 'image-preview',
    deleteBtnId: 'upload-delete-btn',
    onChange: updateGenerateBtnState
});

// 图片表单的生成按钮（供状态更新使用）
const generateBtn = document.getElementById('generate-btn');

/**
 * 初始化图片上传模块
 */
export function initUpload() {
    imageUploader.init();
}

/**
 * 重置图片上传区域
 */
export function resetImageUpload() {
    imageUploader.reset();
}

/**
 * 更新生成按钮状态
 */
export function updateGenerateBtnState() {
    const modelSelect = document.getElementById('model');
    if (modelSelect.value === 'flux2_klein_edit') {
        const hasImage = imageUploader.getFile();
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
    return imageUploader.getFile();
}

/**
 * 获取图片预览 URL
 * @returns {string}
 */
export function getImagePreviewSrc() {
    return imageUploader.getPreviewSrc();
}

// 导出 DOM 元素供其他模块使用
export const { input: imageInput, preview: imagePreview, placeholder: uploadPlaceholder, deleteBtn: uploadDeleteBtn } = imageUploader.elements;
