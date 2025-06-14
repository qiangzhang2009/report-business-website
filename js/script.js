document.addEventListener('DOMContentLoaded', function() {
    // -------------------------------------------------------------------------
    // --- 1. SETUP: 全局元素获取 和 UI工具函数 ---
    // -------------------------------------------------------------------------

    // --- 核心DOM元素 ---
    const topicInput = document.getElementById('topic-input');
    const outputContainer = document.getElementById('report-output-container');
    const reportOutput = document.getElementById('report-output');
    const loader = outputContainer ? outputContainer.querySelector('.loader') : null;
    const triggerReportBtn = document.getElementById('trigger-payment-modal-btn'); 

    // --- 支付弹窗相关元素 ---
    const paymentModal = document.getElementById('payment-modal');
    const paymentModalCloseBtn = paymentModal ? paymentModal.querySelector('.modal-close') : null;
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');

    // --- 工具函数：打开/关闭弹窗 ---
    function openModal(modal) {
        if (!modal) return;
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('visible');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    // --- 工具函数：平滑滚动 ---
    document.querySelectorAll('.nav-menu a, .btn').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.getElementById(href.substring(1));
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // -------------------------------------------------------------------------
    // --- 2. CORE LOGIC: 调用AI引擎并显示报告 ---
    // -------------------------------------------------------------------------

    /**
     * 调用后端的AI云函数来获取市场报告
     * @param {string} topic 用户输入的市场主题
     * @returns {Promise<string>} 返回AI生成的HTML报告内容
     */
    async function getAIReport(topic) {
        try {
            // 注意：这里的URL是相对路径，它会自动指向Vercel部署的同域名下的API路由
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic: topic }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // 如果返回的不是json，防止解析错误
                console.error('API Error:', errorData);
                // 向用户显示一个更友好的错误信息
                throw new Error(`AI服务暂时遇到问题，请稍后再试。(错误码: ${response.status})`);
            }

            const data = await response.json();
            if (!data.report) {
                 throw new Error('AI服务返回了意料之外的数据格式。');
            }
            return data.report; // API应该返回 { report: "<html>..." } 格式的数据
        } catch (error) {
            console.error('Fetch Error:', error);
            // 抛出网络层或解析层的错误
            throw new Error(error.message || '网络连接失败，无法联系到AI服务器。请检查您的网络连接。');
        }
    }

    /**
     * 主流程函数：当用户确认支付后触发
     */
    async function handleReportGeneration() {
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('请输入您感兴趣的行业或产品！');
            topicInput.focus();
            return;
        }

        // 关闭支付弹窗
        closeModal(paymentModal);

        // 准备UI：滚动到输出区域，显示加载动画
        outputContainer.style.display = 'block';
        loader.style.display = 'block';
        reportOutput.innerHTML = ''; // 清空旧内容
        reportOutput.style.display = 'none';
        outputContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        try {
            // 调用AI引擎
            const reportHTML = await getAIReport(topic);
            
            // 成功：显示报告
            reportOutput.innerHTML = reportHTML;
        } catch (error) {
            // 失败：显示错误信息
            reportOutput.innerHTML = `
                <div class="report-card" style="border-color: #e74c3c; padding: 20px; text-align: left;">
                    <h4 style="color: #c0392b;"><i class="fas fa-exclamation-triangle"></i> 报告生成失败</h4>
                    <p style="color: #555;">${error.message}</p>
                    <p style="color: #777; font-size: 14px;">您可以尝试刷新页面后重试，或者通过邮件联系我们。</p>
                </div>
            `;
        } finally {
            // 无论成功失败，最后都要隐藏加载动画，显示输出区域
            loader.style.display = 'none';
            reportOutput.style.display = 'block';
        }
    }


    // -------------------------------------------------------------------------
    // --- 3. EVENT LISTENERS: 将逻辑绑定到用户操作 ---
    // -------------------------------------------------------------------------

    // 点击"立即生成体验版报告"按钮 -> 打开支付弹窗
    if (triggerReportBtn) {
        triggerReportBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止任何默认行为
            const topic = topicInput.value.trim();
            if (!topic) {
                alert('请先输入您感兴趣的行业或产品！');
                topicInput.focus();
                return;
            }
            openModal(paymentModal);
        });
    }

    // 点击"我已完成支付"按钮 -> 触发报告生成流程
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', handleReportGeneration);
    }

    // 点击支付弹窗的关闭按钮 -> 关闭弹窗
    if (paymentModalCloseBtn) {
        paymentModalCloseBtn.addEventListener('click', () => closeModal(paymentModal));
    }

    // 点击弹窗外部的灰色区域 -> 关闭弹窗
    if (paymentModal) {
        paymentModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(paymentModal);
            }
        });
    }
}); 