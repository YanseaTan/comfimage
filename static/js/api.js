/**
 * API 请求封装模块
 */
import { baseUrl, VIDEO_MODEL } from './config.js';

/**
 * 检查认证状态
 * @returns {Promise<{logged_in: boolean, user: string|null}>}
 */
export async function checkAuthStatus() {
    const response = await fetch(baseUrl + '/auth-status');
    return response.json();
}

/**
 * 登录
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ok: boolean, data: object}>}
 */
export async function login(username, password) {
    const response = await fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    return { ok: response.ok, data };
}

/**
 * 修改密码
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<{ok: boolean, data: object}>}
 */
export async function changePassword(oldPassword, newPassword) {
    const response = await fetch(baseUrl + '/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    const data = await response.json();
    return { ok: response.ok, data };
}

/**
 * 解析非 2xx 响应为错误并抛出
 */
async function throwIfNotOk(response) {
    if (!response.ok) {
        const responseText = await response.text();
        try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.error || '服务器错误');
        } catch {
            throw new Error(responseText || '服务器返回了无效响应');
        }
    }
}

/**
 * 查询异步任务状态
 * @param {string} taskId
 * @returns {Promise<{status: string, result: object|null, error: string|null}>}
 * status: pending / running / done / error / not_found
 */
export async function fetchTaskStatus(taskId) {
    const response = await fetch(baseUrl + '/api/task/' + taskId);
    if (response.status === 404) {
        return { status: 'not_found', result: null, error: null };
    }
    await throwIfNotOk(response);
    return response.json();
}

/**
 * 生成视频（异步：返回 task_id）
 * @param {object} params
 * @param {string} params.model
 * @param {string} params.prompt
 * @param {string} params.aspectRatio
 * @param {number|string} params.duration
 * @param {string} params.seed
 * @param {File|null} params.image
 * @returns {Promise<{ok: boolean, data: {task_id: string}}>}
 */
export async function generateVideo({ model, prompt, aspectRatio, duration, seed, image }) {
    const formData = new FormData();
    formData.append('model', model || VIDEO_MODEL);
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', aspectRatio);
    formData.append('duration', duration);
    formData.append('seed', seed || '');
    if (image) {
        formData.append('image', image);
    }

    const response = await fetch(baseUrl + '/generate', {
        method: 'POST',
        body: formData
    });

    await throwIfNotOk(response);

    const data = await response.json();
    return { ok: true, data };
}

/**
 * 生成图片（异步：返回 task_id）
 * @param {object} params
 * @param {string} params.model
 * @param {string} params.prompt
 * @param {string} params.width
 * @param {string} params.height
 * @param {string} params.seed
 * @param {File|null} params.image
 * @returns {Promise<{ok: boolean, data: {task_id: string}}>}
 */
export async function generateImage({ model, prompt, width, height, seed, image }) {
    let requestBody;
    let headers = {};

    if (model === 'flux2_klein_edit') {
        const formData = new FormData();
        formData.append('model', model);
        formData.append('prompt', prompt);
        formData.append('seed', seed);
        if (image) {
            formData.append('image', image);
        }
        requestBody = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
            model,
            prompt,
            width: parseInt(width),
            height: parseInt(height),
            seed
        });
    }

    const response = await fetch(baseUrl + '/generate', {
        method: 'POST',
        headers,
        body: requestBody
    });

    await throwIfNotOk(response);

    const data = await response.json();
    return { ok: true, data };
}

/**
 * 登出
 */
export function logout() {
    window.location.href = baseUrl + '/logout';
}