/**
 * 进度条模块
 */

// DOM 元素
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const generateBtn = document.getElementById('generate-btn');

// 状态
let progressInterval = null;

/**
 * 更新进度条显示
 * @param {number} percent
 */
function updateProgress(percent) {
    progressBar.style.width = percent + '%';
    progressText.textContent = Math.round(percent) + '%';
}

/**
 * 启动进度条动画
 * @param {boolean} isEditModel - 是否为编辑模型
 */
export function startProgress(isEditModel = false) {
    let percent = 0;
    const speedMultiplier = isEditModel ? 0.5 : 1;

    progressInterval = setInterval(() => {
        if (percent < 90) {
            percent += Math.random() * 5 * speedMultiplier;
            if (percent > 90) percent = 90;
        }
        updateProgress(percent);
    }, 500);
}

/**
 * 停止进度条并完成
 */
export function completeProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    updateProgress(100);
    setTimeout(() => {
        progressContainer.style.display = 'none';
        generateBtn.style.display = 'block';
    }, 500);
}

/**
 * 重置并显示进度条
 */
export function resetProgress() {
    updateProgress(0);
    generateBtn.style.display = 'none';
    progressContainer.style.display = 'block';
}

/**
 * 停止进度条并显示按钮（错误时使用）
 */
export function stopProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    progressContainer.style.display = 'none';
    generateBtn.style.display = 'block';
}