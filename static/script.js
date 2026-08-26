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
import { pollTask, savePendingTask, getPendingTask, clearPendingTask } from './js/task.js';
import { initTabs } from './js/tabs.js';
import { initVideo } from './js/video.js';

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
    initTabs();
    initVideo();

    // 主题切换
    initTheme();

    // 表单提交
    form.addEventListener('submit', handleGenerate);

    // 恢复未完成的生成任务（刷新页面/切后台回来）
    resumeImageTask();
}

/**
 * 恢复未完成的图片生成任务
 * 页面加载时若 localStorage 中有未完成任务，不重新提交，直接恢复轮询
 */
function resumeImageTask() {
    const taskId = getPendingTask('image');
    if (!taskId) return;

    resetProgress();
    loadingDiv.style.display = 'block';
    resultImage.style.display = 'none';
    startProgress(false);
    startImagePolling(taskId, null);
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
 * 处理图片生成（异步：提交后返回 task_id，轮询等待结果）
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

        // 提交成功：记录任务 id 并开始轮询
        savePendingTask(data.task_id, 'image');
        startImagePolling(data.task_id, { model, prompt, width, height, seed });

    } catch (error) {
        alert(`提交失败: ${error.message}`);
        console.error('Error:', error);
        stopProgress();
        loadingDiv.style.display = 'none';
    }
}

/**
 * 轮询图片生成任务
 * @param {string} taskId
 * @param {object|null} formParams - 提交时的表单参数；null 表示从历史恢复（不写历史记录）
 */
function startImagePolling(taskId, formParams) {
    pollTask(taskId, {
        onDone: (result) => {
            clearPendingTask('image');

            // 显示图片
            resultImage.src = result.image_url;
            resultImage.style.display = 'block';

            if (formParams) {
                // 添加到历史记录
                addHistory({
                    model: formParams.model,
                    prompt: formParams.prompt,
                    width: formParams.model === 'flux2_klein_edit' ? null : formParams.width,
                    height: formParams.model === 'flux2_klein_edit' ? null : formParams.height,
                    seed: result.seed || formParams.seed,
                    image_url: result.image_url,
                    original_image: formParams.model === 'flux2_klein_edit' ? getImagePreviewSrc() : null
                });
            }

            completeProgress();
            loadingDiv.style.display = 'none';
        },
        onError: (message) => {
            clearPendingTask('image');
            alert(`生成失败: ${message}`);
            console.error('Error:', message);
            stopProgress();
            loadingDiv.style.display = 'none';
        },
        onNotFound: () => {
            // 任务不存在（如服务重启导致内存任务丢失）：静默清除，不打扰用户
            clearPendingTask('image');
            stopProgress();
            loadingDiv.style.display = 'none';
        }
    });
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);