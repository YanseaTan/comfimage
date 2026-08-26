/**
 * 进度条模块（工厂化，支持多实例）
 */

/**
 * 创建进度条实例
 * @param {object} options
 * @param {string} options.containerId 进度条容器 id
 * @param {string} options.barId       进度条填充 id
 * @param {string} options.textId      进度文字 id
 * @param {string} options.btnId       提交按钮 id（进度条显示时隐藏按钮）
 * @returns {object} { start, complete, reset, stop }
 */
export function createProgress({ containerId, barId, textId, btnId }) {
    const container = document.getElementById(containerId);
    const bar = document.getElementById(barId);
    const text = document.getElementById(textId);
    const btn = document.getElementById(btnId);

    // 状态
    let progressInterval = null;

    /**
     * 更新进度条显示
     * @param {number} percent
     */
    function updateProgress(percent) {
        bar.style.width = percent + '%';
        text.textContent = Math.round(percent) + '%';
    }

    /**
     * 启动进度条动画
     * @param {boolean} isSlow - 是否慢速（长任务使用）
     */
    function start(isSlow = false) {
        let percent = 0;
        const speedMultiplier = isSlow ? 0.5 : 1;

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
    function complete() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        updateProgress(100);
        setTimeout(() => {
            container.style.display = 'none';
            btn.style.display = 'block';
        }, 500);
    }

    /**
     * 重置并显示进度条
     */
    function reset() {
        updateProgress(0);
        btn.style.display = 'none';
        container.style.display = 'block';
    }

    /**
     * 停止进度条并显示按钮（错误时使用）
     */
    function stop() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        container.style.display = 'none';
        btn.style.display = 'block';
    }

    return { start, complete, reset, stop };
}

// 默认实例（图片表单），保持向后兼容
const imageProgress = createProgress({
    containerId: 'progress-container',
    barId: 'progress-bar',
    textId: 'progress-text',
    btnId: 'generate-btn'
});

/**
 * 启动进度条动画
 * @param {boolean} isEditModel - 是否为编辑模型
 */
export function startProgress(isEditModel = false) {
    imageProgress.start(isEditModel);
}

/**
 * 停止进度条并完成
 */
export function completeProgress() {
    imageProgress.complete();
}

/**
 * 重置并显示进度条
 */
export function resetProgress() {
    imageProgress.reset();
}

/**
 * 停止进度条并显示按钮（错误时使用）
 */
export function stopProgress() {
    imageProgress.stop();
}
