document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generate-form');
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const loadingDiv = document.getElementById('loading');
    const historyContainer = document.getElementById('history-container');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeBtn = document.getElementById('close-modal');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const themeToggle = document.getElementById('theme-toggle');

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

        // UI 状态更新
        generateBtn.disabled = true;
        generateBtn.textContent = '生成中...';
        loadingDiv.style.display = 'block';
        resultImage.style.display = 'none';

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

        } catch (error) {
            alert(`生成失败: ${error.message}`);
            console.error('Error:', error);
        } finally {
            // 恢复 UI 状态
            generateBtn.disabled = false;
            generateBtn.textContent = '生成图片';
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
