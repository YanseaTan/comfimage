document.addEventListener('DOMContentLoaded', () => {
    // 使用动态注入的base路径
    const baseUrl = window.BASE_PATH || '';

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

    const form = document.getElementById('generate-form');
    const generateBtn = document.getElementById('generate-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const resultImage = document.getElementById('result-image');
    const loadingDiv = document.getElementById('loading');
    const historyContainer = document.getElementById('history-container');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeBtn = document.getElementById('close-modal');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const modelSelect = document.getElementById('model');
    const resolutionGroup = document.getElementById('resolution-group');
    const imageUploadGroup = document.getElementById('image-upload-group');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const uploadArea = document.getElementById('upload-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadDeleteBtn = document.getElementById('upload-delete-btn');

    // 检查认证状态
    function checkAuthStatus() {
        fetch(baseUrl + '/auth-status')
            .then(response => response.json())
            .then(data => {
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
            })
            .catch(error => {
                console.error('Auth check failed:', error);
                loginContainer.style.display = 'flex';
                mainContainer.style.display = 'none';
                userMenu.style.display = 'none';
            });
    }

    // 处理登录表单
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('login-password').value;

        // 清除之前的错误信息
        document.getElementById('login-error').style.display = 'none';

        try {
            const response = await fetch(baseUrl + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                checkAuthStatus(); // 重新检查状态并自动切换到主界面
            } else {
                const data = await response.json();
                document.getElementById('login-error').textContent = data.error;
                document.getElementById('login-error').style.display = 'block';
            }
        } catch (error) {
            document.getElementById('login-error').textContent = '登录失败: ' + error.message;
            document.getElementById('login-error').style.display = 'block';
        }
    });

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

    // 修改密码按钮点击
    changePasswordBtn.addEventListener('click', () => {
        userMenuDropdown.classList.remove('show');
        changePasswordModal.classList.add('show');
        // 清空表单
        changePasswordForm.reset();
        document.getElementById('change-password-error').style.display = 'none';
    });

    // 登出按钮点击
    logoutBtn.addEventListener('click', () => {
        userMenuDropdown.classList.remove('show');
        window.location.href = baseUrl + '/logout';
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

    // 修改密码表单提交
    changePasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('change-password-error');

        // 清除之前的错误信息
        errorDiv.style.display = 'none';

        // 验证新密码和确认密码是否匹配
        if (newPassword !== confirmPassword) {
            errorDiv.textContent = '新密码和确认密码不匹配';
            errorDiv.style.display = 'block';
            return;
        }

        // 验证新密码长度
        if (newPassword.length < 4) {
            errorDiv.textContent = '新密码长度至少为4个字符';
            errorDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch(baseUrl + '/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            if (response.ok) {
                alert('密码修改成功！');
                changePasswordModal.classList.remove('show');
            } else {
                const data = await response.json();
                errorDiv.textContent = data.error || '密码修改失败';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = '网络错误，请稍后重试';
            errorDiv.style.display = 'block';
        }
    });

    // 初始化
    checkAuthStatus();

    // 处理模型切换的UI更新
    function updateModelUI(selectedModel) {
        if (selectedModel === 'flux2_klein_edit') {
            resolutionGroup.style.display = 'none';
            imageUploadGroup.style.display = 'block';
            document.getElementById('image').required = true;
            // 设置默认提示词
            document.getElementById('prompt').value = '将画面风格变为迪士尼3D动画风格';
        } else {
            resolutionGroup.style.display = 'flex';
            imageUploadGroup.style.display = 'none';
            document.getElementById('image').required = false;
            // 清除预览图片
            resetImageUpload();
            // 恢复默认提示词
            document.getElementById('prompt').value = '一只橘猫和一只虎斑狸花猫在草坪上玩耍';
        }
    }

    // 模型选择变化处理
    modelSelect.addEventListener('change', () => {
        const selectedModel = modelSelect.value;
        updateModelUI(selectedModel);
    });

    // 重置图片上传区域
    function resetImageUpload() {
        imageInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        uploadDeleteBtn.style.display = 'none';
    }

    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 点击预览图片重新选择文件（阻止事件冒泡，避免重复触发）
    imagePreview.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止事件冒泡到父元素
        imageInput.click();
    });

    // 图片上传预览
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                uploadDeleteBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
        // 如果没有选择文件（取消选择），保持当前状态不变
    });

    // 删除按钮点击事件
    uploadDeleteBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // 阻止事件冒泡
        resetImageUpload();
    });

    // 从localStorage加载主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // 主题切换
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

    // 存储历史记录的数组
    let generationHistory = [];

    // 进度条相关变量
    let progressInterval = null;

    // 更新进度条显示的函数
    function updateProgress(percent) {
        progressBar.style.width = percent + '%';
        progressText.textContent = Math.round(percent) + '%';
    }

    // 启动进度条动画
    function startProgress() {
        let percent = 0;
        progressInterval = setInterval(() => {
            // 模拟进度增长：前90%较快，最后10%等待实际完成
            if (percent < 90) {
                percent += Math.random() * 5; // 每次增加0-5%
                if (percent > 90) percent = 90;
            }
            updateProgress(percent);
        }, 500);
    }

    // 停止进度条并完成
    function completeProgress() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        updateProgress(100);
        // 短暂延时后切换回按钮
        setTimeout(() => {
            progressContainer.style.display = 'none';
            generateBtn.style.display = 'block';
        }, 500);
    }

    // 更新历史记录显示
    function updateHistory() {
        historyContainer.innerHTML = '';
        generationHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.style.position = 'relative';

            // 删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '×';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '0.5rem';
            deleteBtn.style.right = '0.5rem';
            deleteBtn.style.color = 'gray';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '1.5rem';
            deleteBtn.style.fontWeight = 'bold';
            deleteBtn.onclick = () => {
                if (confirm('确定要删除此记录吗？')) {
                    generationHistory.splice(index, 1);
                    updateHistory();
                }
            };

            const thumb = document.createElement('img');
            thumb.src = item.image_url;
            thumb.alt = `Generated Image ${index + 1}`;
            thumb.style.maxWidth = '200px';
            thumb.style.borderRadius = '4px';
            thumb.style.cursor = 'pointer';
            thumb.onclick = () => {
                resultImage.src = item.image_url;
                resultImage.style.display = 'block';
                // 回填参数
                document.getElementById('model').value = item.model;
                document.getElementById('prompt').value = item.prompt;
                document.getElementById('width').value = item.width;
                document.getElementById('height').value = item.height;
                document.getElementById('seed').value = item.seed || '';
                // 更新UI以反映模型变化
                updateModelUI(item.model);
            };

            const params = document.createElement('div');
            params.style.marginTop = '0.5rem';
            if (item.model === 'flux2_klein_edit') {
                params.innerHTML = `<strong>模型:</strong> ${item.model}<br>
                                    <strong>提示词:</strong> ${item.prompt}<br>
                                    <strong>种子:</strong> ${item.seed || '随机'}`;
            } else {
                params.innerHTML = `<strong>模型:</strong> ${item.model}<br>
                                    <strong>提示词:</strong> ${item.prompt}<br>
                                    <strong>尺寸:</strong> ${item.width}x${item.height}<br>
                                    <strong>种子:</strong> ${item.seed || '随机'}`;
            }

            historyItem.appendChild(deleteBtn);
            historyItem.appendChild(thumb);
            historyItem.appendChild(params);
            historyContainer.appendChild(historyItem);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 从表单获取所有值
        const model = document.getElementById('model').value;
        const prompt = document.getElementById('prompt').value;
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const seed = document.getElementById('seed').value;

        // UI 状态更新：隐藏按钮，显示进度条
        generateBtn.style.display = 'none';
        progressContainer.style.display = 'block';
        loadingDiv.style.display = 'block';
        resultImage.style.display = 'none';

        // 重置并启动进度条
        updateProgress(0);
        startProgress();

        let requestBody;
        let headers = {};

        if (model === 'flux2_klein_edit') {
            // 对于图像编辑，使用FormData发送文件
            const formData = new FormData();
            formData.append('model', model);
            formData.append('prompt', prompt);
            formData.append('seed', seed);
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }
            requestBody = formData;
            // 不设置Content-Type，让浏览器自动设置multipart/form-data
        } else {
            // 对于其他模型，使用JSON
            headers['Content-Type'] = 'application/json';
            requestBody = JSON.stringify({
                model: model,
                prompt: prompt,
                width: parseInt(width),
                height: parseInt(height),
                seed: seed
            });
        }

        try {
            const response = await fetch(baseUrl + '/generate', {
                method: 'POST',
                headers: headers,
                body: requestBody
            });

            if (!response.ok) {
                let errorMessage = '服务器错误';
                const responseText = await response.text();
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // 如果不是JSON，使用文本
                    errorMessage = responseText || '服务器返回了无效响应';
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // 显示图片
            resultImage.src = data.image_url;
            resultImage.style.display = 'block';

            // 添加到历史记录
            generationHistory.unshift({
                model: model,
                prompt: prompt,
                width: model === 'flux2_klein_edit' ? '自动' : width,
                height: model === 'flux2_klein_edit' ? '自动' : height,
                seed: seed,
                image_url: data.image_url
            });

            // 更新历史显示
            updateHistory();

            // 完成进度条
            completeProgress();

        } catch (error) {
            alert(`生成失败: ${error.message}`);
            console.error('Error:', error);
            // 停止进度条并显示按钮
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            progressContainer.style.display = 'none';
            generateBtn.style.display = 'block';
        } finally {
            // 恢复其他UI状态
            loadingDiv.style.display = 'none';
        }
    });

    // 点击result-image打开全屏模态框
    resultImage.onclick = function() {
        modal.style.display = "block";
        modalImg.src = this.src;
    }

    // 点击关闭按钮隐藏模态框
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // 点击模态框背景隐藏模态框
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }

    // 显示复制提示
    function showCopyToast(message) {
        const toast = document.createElement('span');
        toast.textContent = message;
        toast.className = 'copy-toast';
        toast.style.top = '30px';
        toast.style.right = '200px'; // 在复制按钮旁边
        document.getElementById('image-modal').appendChild(toast);
        // 动画结束后移除
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    // 复制图片
    copyBtn.onclick = async function() {
        try {
            // 尝试复制图片blob（现代浏览器支持）
            if (navigator.clipboard && window.ClipboardItem) {
                const response = await fetch(modalImg.src);
                const blob = await response.blob();
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                showCopyToast('图片已复制');
            } else if (navigator.clipboard) {
                // 后备方法：复制图片URL到文本剪贴板
                await navigator.clipboard.writeText(modalImg.src);
                showCopyToast('图片URL已复制');
            } else {
                // 兼容老浏览器：使用execCommand复制URL
                const textArea = document.createElement('textarea');
                textArea.value = modalImg.src;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showCopyToast('图片URL已复制');
            }
        } catch (error) {
            alert('复制失败：' + error.message + '。请尝试升级浏览器或使用下载功能。');
        }
    }

    // 下载图片
    downloadBtn.onclick = function() {
        const link = document.createElement('a');
        link.href = modalImg.src;
        link.download = modalImg.src.split('/').pop() || 'generated_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
