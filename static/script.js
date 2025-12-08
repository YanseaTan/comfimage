document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
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

    // 检查认证状态
    function checkAuthStatus() {
        fetch('/auth-status')
            .then(response => response.json())
            .then(data => {
                if (data.logged_in) {
                    loginContainer.style.display = 'none';
                    mainContainer.style.display = 'flex';
                    userInfo.textContent = data.user;
                } else {
                    loginContainer.style.display = 'flex';
                    mainContainer.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Auth check failed:', error);
                loginContainer.style.display = 'flex';
                mainContainer.style.display = 'none';
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
            const response = await fetch('/login', {
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

    // 初始化
    checkAuthStatus();

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
                document.getElementById('prompt').value = item.prompt;
                document.getElementById('width').value = item.width;
                document.getElementById('height').value = item.height;
                document.getElementById('seed').value = item.seed || '';
            };

            const params = document.createElement('div');
            params.style.marginTop = '0.5rem';
            params.innerHTML = `<strong>提示词:</strong> ${item.prompt}<br>
                                <strong>尺寸:</strong> ${item.width}x${item.height}<br>
                                <strong>种子:</strong> ${item.seed || '随机'}`;

            historyItem.appendChild(deleteBtn);
            historyItem.appendChild(thumb);
            historyItem.appendChild(params);
            historyContainer.appendChild(historyItem);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 从表单获取所有值
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

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // 发送包含所有新参数的 JSON
                body: JSON.stringify({
                    prompt: prompt,
                    width: parseInt(width), // 确保是数字
                    height: parseInt(height), // 确保是数字
                    seed: seed // 可以是字符串，后端会处理
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '服务器错误');
            }

            const data = await response.json();

            // 显示图片
            resultImage.src = data.image_url;
            resultImage.style.display = 'block';

            // 添加到历史记录
            generationHistory.unshift({
                prompt: prompt,
                width: width,
                height: height,
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
