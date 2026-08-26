/**
 * 异步任务轮询模块
 * 提交生成后返回 task_id，前端轮询状态；配合 localStorage 在刷新/切后台后恢复
 */
import { fetchTaskStatus } from './api.js';

// 轮询间隔（毫秒）
const DEFAULT_INTERVAL = 2000;
// localStorage 键前缀
const PENDING_KEY_PREFIX = 'pending_task_';

/**
 * 轮询任务状态直到 done / error / not_found
 * @param {string} taskId
 * @param {object} options
 * @param {Function} options.onDone - 成功回调，参数为 result（{image_url|video_url, seed}）
 * @param {Function} options.onError - 失败回调，参数为错误消息
 * @param {Function} options.onNotFound - 任务不存在回调（如服务重启导致任务丢失；未提供则静默停止）
 * @param {number} options.interval - 轮询间隔 ms，默认 2000
 * @returns {Function} 停止轮询函数
 */
export function pollTask(taskId, { onDone, onError, onNotFound, interval = DEFAULT_INTERVAL } = {}) {
    let timer = null;

    const stopPolling = () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    };

    async function check() {
        let task;
        try {
            task = await fetchTaskStatus(taskId);
        } catch (err) {
            // 网络错误（断网/断链）时继续轮询，连接恢复后自动拿到结果
            return;
        }

        if (task.status === 'done') {
            stopPolling();
            onDone(task.result);
        } else if (task.status === 'error') {
            stopPolling();
            onError(task.error || '任务失败');
        } else if (task.status === 'not_found') {
            stopPolling();
            if (onNotFound) {
                onNotFound();
            }
        }
        // pending / running 继续等待
    }

    timer = setInterval(check, interval);
    check(); // 立即查一次
    return stopPolling;
}

/**
 * 保存未完成任务 id（用于刷新/切后台后恢复轮询）
 * @param {string} taskId
 * @param {string} key - 任务类别，如 'image' / 'video'
 */
export function savePendingTask(taskId, key) {
    localStorage.setItem(PENDING_KEY_PREFIX + key, taskId);
}

/**
 * 获取未完成任务 id
 * @param {string} key
 * @returns {string|null}
 */
export function getPendingTask(key) {
    return localStorage.getItem(PENDING_KEY_PREFIX + key);
}

/**
 * 清除未完成任务 id
 * @param {string} key
 */
export function clearPendingTask(key) {
    localStorage.removeItem(PENDING_KEY_PREFIX + key);
}
