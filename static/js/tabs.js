/**
 * Tab 导航模块
 */
export function initTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach((b) => {
                b.classList.toggle('active', b === btn);
            });
            document.querySelectorAll('.tab-panel').forEach((panel) => {
                // 激活面板清空内联样式以回落 CSS 的 display:flex(gap 间距依赖 flex 布局)
                panel.style.display = panel.dataset.panel === target ? '' : 'none';
            });
        });
    });
}
