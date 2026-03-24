/**
 * 认证模块
 */
import { checkAuthStatus, login as apiLogin, changePassword as apiChangePassword, logout as apiLogout } from './api.js';

// DOM 元素
const loginContainer = document.getElementById('login-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const userMenu = document.getElementById('user-menu');
const userMenuToggle = document.getElementById('user-menu-toggle');
const userMenuDropdown = document.getElementById('user-menu-dropdown');
const changePasswordBtn = document.getElementById('change-password-btn');
const logoutBtn = document.getElementById('logout-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordClose = document.getElementById('change-password-close');
const changePasswordForm = document.getElementById('change-password-form');

/**
 * 初始化认证模块
 */
export function initAuth() {
    // 用户菜单切换
    userMenuToggle.addEventListener('click', () => {
        userMenuDropdown.classList.toggle('show');
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', (event) => {
        if (!userMenu.contains(event.target)) {
            userMenuDropdown.classList.remove('show');
        }
    });

    // 修改密码按钮
    changePasswordBtn.addEventListener('click', () => {
        userMenuDropdown.classList.remove('show');
        changePasswordModal.classList.add('show');
        changePasswordForm.reset();
        document.getElementById('change-password-error').style.display = 'none';
    });

    // 登出按钮
    logoutBtn.addEventListener('click', () => {
        userMenuDropdown.classList.remove('show');
        apiLogout();
    });

    // 修改密码弹窗关闭
    changePasswordClose.addEventListener('click', () => {
        changePasswordModal.classList.remove('show');
    });

    // 点击弹窗背景关闭
    changePasswordModal.addEventListener('click', (event) => {
        if (event.target === changePasswordModal) {
            changePasswordModal.classList.remove('show');
        }
    });

    // 登录表单
    loginForm.addEventListener('submit', handleLogin);

    // 修改密码表单
    changePasswordForm.addEventListener('submit', handleChangePassword);

    // 初始检查认证状态
    checkAuth();
}

/**
 * 检查并更新认证状态
 */
export async function checkAuth() {
    try {
        const data = await checkAuthStatus();
        if (data.logged_in) {
            loginContainer.style.display = 'none';
            mainContainer.style.display = 'flex';
            document.getElementById('user-info').textContent = data.user;
            userMenu.style.display = 'block';
        } else {
            loginContainer.style.display = 'flex';
            mainContainer.style.display = 'none';
            userMenu.style.display = 'none';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        loginContainer.style.display = 'flex';
        mainContainer.style.display = 'none';
        userMenu.style.display = 'none';
    }
}

/**
 * 处理登录
 */
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.style.display = 'none';

    const { ok, data } = await apiLogin(username, password);

    if (ok) {
        checkAuth();
    } else {
        errorDiv.textContent = data.error;
        errorDiv.style.display = 'block';
    }
}

/**
 * 处理修改密码
 */
async function handleChangePassword(event) {
    event.preventDefault();
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorDiv = document.getElementById('change-password-error');

    errorDiv.style.display = 'none';

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = '新密码和确认密码不匹配';
        errorDiv.style.display = 'block';
        return;
    }

    if (newPassword.length < 4) {
        errorDiv.textContent = '新密码长度至少为4个字符';
        errorDiv.style.display = 'block';
        return;
    }

    const { ok, data } = await apiChangePassword(oldPassword, newPassword);

    if (ok) {
        alert('密码修改成功！');
        changePasswordModal.classList.remove('show');
    } else {
        errorDiv.textContent = data.error || '密码修改失败';
        errorDiv.style.display = 'block';
    }
}