/**
 * 视频生成模块（minimax_h3_t2v_turbo 文生视频 / minimax_h3_i2v_turbo 图生视频）
 */
import { VIDEO_DEFAULT_PROMPTS } from './config.js';
import { generateVideo } from './api.js';
import { createUploader } from './upload.js';
import { createProgress } from './progress.js';
import { pollTask, savePendingTask, getPendingTask, clearPendingTask } from './task.js';
import { fetchImageAsFile, scrollToTop } from './utils.js';

// DOM 元素
const videoForm = document.getElementById('video-generate-form');
const videoMode = document.getElementById('video-mode');
const videoPrompt = document.getElementById('video-prompt');
const videoAspectRatio = document.getElementById('video-aspect-ratio');
const videoAspectGroup = document.getElementById('video-aspect-group');
const videoDuration = document.getElementById('video-duration');
const videoSeed = document.getElementById('video-seed');
const videoUploadGroup = document.getElementById('video-upload-group');
const videoGenerateBtn = document.getElementById('video-generate-btn');
const resultVideo = document.getElementById('result-video');
const videoResult = document.getElementById('video-result');
const videoDownloadBtn = document.getElementById('video-download-btn');
const videoHistoryContainer = document.getElementById('video-history-container');

// 上传控件实例（图生视频必填，文生视频隐藏）
const videoUploader = createUploader({
    inputId: 'video-image',
    areaId: 'video-upload-area',
    placeholderId: 'video-upload-placeholder',
    previewId: 'video-image-preview',
    deleteBtnId: 'video-upload-delete-btn',
    onChange: updateVideoGenerateBtnState
});

// 进度条实例（视频耗时长，使用慢速）
const videoProgress = createProgress({
    containerId: 'video-progress-container',
    barId: 'video-progress-bar',
    textId: 'video-progress-text',
    btnId: 'video-generate-btn'
});

// 状态
let videoHistory = [];

/**
 * 初始化视频模块
 */
export function initVideo() {
    videoUploader.init();

    // 模式切换
    videoMode.addEventListener('change', () => {
        updateVideoModeUI();
        videoSeed.value = '';
    });

    // 表单提交
    videoForm.addEventListener('submit', handleVideoGenerate);

    // 下载按钮
    videoDownloadBtn.addEventListener('click', handleVideoDownload);

    // 设置默认模式与提示词
    updateVideoModeUI();

    // 恢复未完成的视频生成任务（刷新页面/切后台回来）
    resumeVideoTask();
}

/**
 * 恢复未完成的视频生成任务
 * 页面加载时若 localStorage 中有未完成任务，不重新提交，直接恢复轮询
 */
function resumeVideoTask() {
    const taskId = getPendingTask('video');
    if (!taskId) return;

    videoProgress.reset();
    videoResult.style.display = 'none';
    videoProgress.start(true);
    startVideoPolling(taskId, null);
}

/**
 * 更新视频模式 UI（文生视频隐藏上传区，图生视频显示且必填）
 */
function updateVideoModeUI() {
    const model = videoMode.value;
    const isI2V = model === 'minimax_h3_i2v_turbo';

    videoUploadGroup.style.display = isI2V ? 'block' : 'none';
    // 比例仅文生视频可选（图生视频分辨率由首帧图片自动计算）
    videoAspectGroup.style.display = isI2V ? 'none' : 'block';
    videoPrompt.value = VIDEO_DEFAULT_PROMPTS[model] || '';
    if (!isI2V) {
        videoUploader.reset();
    }
    updateVideoGenerateBtnState();
}

/**
 * 更新生成按钮状态（图生视频无首帧时禁用）
 */
function updateVideoGenerateBtnState() {
    const isI2V = videoMode.value === 'minimax_h3_i2v_turbo';
    videoGenerateBtn.disabled = isI2V && !videoUploader.getFile();
}

/**
 * 处理视频生成（异步：提交后返回 task_id，轮询等待结果）
 */
async function handleVideoGenerate(event) {
    event.preventDefault();

    const model = videoMode.value;
    const prompt = videoPrompt.value;
    // 图生视频分辨率由首帧图片自动计算，不传比例
    const aspectRatio = model === 'minimax_h3_i2v_turbo' ? '' : videoAspectRatio.value;
    const duration = videoDuration.value;
    const seed = videoSeed.value;
    const image = videoUploader.getFile();

    // UI 状态更新
    videoProgress.reset();
    videoResult.style.display = 'none';

    // 启动进度条（慢速，视频生成需要几分钟）
    videoProgress.start(true);

    try {
        const { data } = await generateVideo({ model, prompt, aspectRatio, duration, seed, image });

        // 提交成功：记录任务 id 并开始轮询
        savePendingTask(data.task_id, 'video');
        startVideoPolling(data.task_id, { model, prompt, aspect_ratio: aspectRatio, duration, seed });

    } catch (error) {
        alert(`提交失败: ${error.message}`);
        console.error('Error:', error);
        videoProgress.stop();
    }
}

/**
 * 轮询视频生成任务
 * @param {string} taskId
 * @param {object|null} formParams - 提交时的表单参数；null 表示从历史恢复（不写历史记录）
 */
function startVideoPolling(taskId, formParams) {
    pollTask(taskId, {
        onDone: (result) => {
            clearPendingTask('video');

            // 显示视频
            resultVideo.src = result.video_url;
            videoResult.style.display = 'block';

            if (formParams) {
                // 添加到历史记录
                videoHistory.unshift({
                    model: formParams.model,
                    prompt: formParams.prompt,
                    aspect_ratio: formParams.aspect_ratio,
                    duration: formParams.duration,
                    seed: result.seed || formParams.seed,
                    video_url: result.video_url,
                    first_frame_url: videoUploader.getPreviewSrc() || null
                });
                renderVideoHistory();
            }

            videoProgress.complete();
        },
        onError: (message) => {
            clearPendingTask('video');
            alert(`生成失败: ${message}`);
            console.error('Error:', message);
            videoProgress.stop();
        },
        onNotFound: () => {
            // 任务不存在（如服务重启导致内存任务丢失）：静默清除，不打扰用户
            clearPendingTask('video');
            videoProgress.stop();
        }
    });
}

/**
 * 处理视频下载
 */
function handleVideoDownload() {
    const link = document.createElement('a');
    link.href = resultVideo.src;
    link.download = resultVideo.src.split('/').pop() || 'generated_video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 渲染视频历史记录
 */
function renderVideoHistory() {
    videoHistoryContainer.innerHTML = '';

    videoHistory.forEach((item, index) => {
        const historyItem = createVideoHistoryItem(item, index);
        videoHistoryContainer.appendChild(historyItem);
    });
}

/**
 * 创建视频历史记录项
 * @param {object} item
 * @param {number} index
 * @returns {HTMLElement}
 */
function createVideoHistoryItem(item, index) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.style.position = 'relative';

    // 删除按钮
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'history-action-btn';
    deleteBtn.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; cursor: pointer; font-size: 1.5rem; font-weight: bold;';
    deleteBtn.onclick = () => {
        if (confirm('确定要删除此记录吗？')) {
            videoHistory.splice(index, 1);
            renderVideoHistory();
        }
    };

    // 视频预览
    const video = document.createElement('video');
    video.src = item.video_url;
    video.controls = true;
    video.preload = 'metadata';
    video.style.cssText = 'max-width: 200px; border-radius: 4px; cursor: pointer;';
    video.onclick = () => {
        resultVideo.src = item.video_url;
        videoResult.style.display = 'block';
        fillFormFromHistory(item);
        scrollToTop();
    };

    // 参数信息
    const params = document.createElement('div');
    params.style.marginTop = '0.5rem';
    const modelName = item.model === 'minimax_h3_i2v_turbo' ? '图生视频' : '文生视频';
    params.innerHTML = `<strong>模式:</strong> ${modelName}<br>
                        <strong>提示词:</strong> <span title="${item.prompt}">${item.prompt}</span><br>
                        <strong>比例:</strong> ${item.aspect_ratio || '自动(随首帧)'}<br>
                        <strong>时长:</strong> ${item.duration} 秒<br>
                        <strong>种子:</strong> ${item.seed || '随机'}`;

    historyItem.appendChild(deleteBtn);
    historyItem.appendChild(video);
    historyItem.appendChild(params);

    return historyItem;
}

/**
 * 从历史记录回填表单
 * @param {object} item
 */
async function fillFormFromHistory(item) {
    videoMode.value = item.model;
    updateVideoModeUI();
    videoPrompt.value = item.prompt;
    videoAspectRatio.value = item.aspect_ratio;
    videoDuration.value = item.duration;
    videoSeed.value = item.seed || '';

    // 恢复首帧预览（图生视频）
    if (item.model === 'minimax_h3_i2v_turbo' && item.first_frame_url) {
        await fetchImageAsFile(
            item.first_frame_url,
            videoUploader.elements.input,
            videoUploader.elements.preview,
            videoUploader.elements.placeholder,
            videoUploader.elements.deleteBtn
        );
    }
}
