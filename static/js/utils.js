/**
 * 工具函数模块
 */

/**
 * 显示复制提示
 * @param {string} message - 提示消息
 */
export function showCopyToast(message) {
    const toast = document.createElement('span');
    toast.textContent = message;
    toast.className = 'copy-toast';
    toast.style.top = '30px';
    toast.style.right = '200px';
    document.getElementById('image-modal').appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

/**
 * 从 URL 获取图片并转换为 File 对象
 * @param {string} url - 图片 URL
 * @param {HTMLInputElement} imageInput - 文件输入元素
 * @param {HTMLImageElement} imagePreview - 预览图片元素
 * @param {HTMLElement} uploadPlaceholder - 上传占位元素
 * @param {HTMLElement} uploadDeleteBtn - 删除按钮元素
 * @returns {Promise<boolean>} - 是否成功
 */
export async function fetchImageAsFile(url, imageInput, imagePreview, uploadPlaceholder, uploadDeleteBtn) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], 'edit_image.png', { type: blob.type });
        const dt = new DataTransfer();
        dt.items.add(file);
        imageInput.files = dt.files;
        imageInput.dispatchEvent(new Event('change'));
        return true;
    } catch (error) {
        console.error('下载图像失败:', error);
        // 后备：只设置预览
        imagePreview.src = url;
        imagePreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        uploadDeleteBtn.style.display = 'block';
        return false;
    }
}

/**
 * 滚动到页面顶部
 */
export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}