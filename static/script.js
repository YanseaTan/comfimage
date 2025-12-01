document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generate-form');
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const loadingDiv = document.getElementById('loading');

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
});