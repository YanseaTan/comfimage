document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generate-form');
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const loadingDiv = document.getElementById('loading');
    const historyContainer = document.getElementById('history-container');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeBtn = document.getElementById('close-modal');

    // 存储历史记录的数组
    let generationHistory = [];

    // 更新历史记录显示
    function updateHistory() {
        historyContainer.innerHTML = '';
        generationHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.style.border = '1px solid #ccc';
            historyItem.style.padding = '1rem';
            historyItem.style.marginBottom = '1rem';
            historyItem.style.borderRadius = '8px';
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
});
