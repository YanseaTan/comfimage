/**
 * 主入口文件
 */
import { initAuth } from './js/auth.js';
import { initModel, getSelectedModel, updateModelUI } from './js/model.js';
import { initUpload, getImageFile, getImagePreviewSrc } from './js/upload.js';
import { initModal } from './js/modal.js';
import { startProgress, completeProgress, resetProgress, stopProgress } from './js/progress.js';
import { addHistory } from './js/history.js';
import { generateImage } from './js/api.js';

// DOM 元素
const form = document.getElementById('generate-form');
const resultImage = document.getElementById('result-image');
const loadingDiv = document.getElementById('loading');
const themeToggle = document.getElementById('theme-toggle');

/**
 * 初始化应用
 */
function init() {
    // 初始化各模块
    initAuth();
    initModel();
    initUpload();
    initModal();

    // 主题切换
    initTheme();

    // 表单提交
    form.addEventListener('submit', handleGenerate);
}

/**
 * 初始化主题
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });
}

/**
 * 处理图片生成
 */
async function handleGenerate(event) {
    event.preventDefault();

    const model = getSelectedModel();
    const prompt = document.getElementById('prompt').value;
    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;
    const seed = document.getElementById('seed').value;
    const image = getImageFile();

    // UI 状态更新
    resetProgress();
    loadingDiv.style.display = 'block';
    resultImage.style.display = 'none';

    // 启动进度条
    startProgress(model === 'flux2_klein_edit');

    try {
        const { data } = await generateImage({ model, prompt, width, height, seed, image });

        // 显示图片
        resultImage.src = data.image_url;
        resultImage.style.display = 'block';

        // 添加到历史记录
        addHistory({
            model,
            prompt,
            width: model === 'flux2_klein_edit' ? null : width,
            height: model === 'flux2_klein_edit' ? null : height,
            seed: data.seed || seed,
            image_url: data.image_url,
            original_image: model === 'flux2_klein_edit' ? getImagePreviewSrc() : null
        });

        completeProgress();

    } catch (error) {
        alert(`生成失败: ${error.message}`);
        console.error('Error:', error);
        stopProgress();
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);