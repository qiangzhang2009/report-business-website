document.addEventListener('DOMContentLoaded', function() {
    // -------------------------------------------------------------------------
    // --- 1. Element Cache & Utilities ---
    // -------------------------------------------------------------------------
    const elements = {
        // --- Free Report Flow (index.html) ---
        topicInput: document.getElementById('topic-input'),
        freeReportBtn: document.getElementById('trigger-payment-modal-btn'), // This ID is used for the free report button on index.html
        outputContainer: document.getElementById('report-output-container'),
        reportOutput: document.getElementById('report-output'),
        loader: document.querySelector('#report-output-container .loader'),

        // --- Paid Report Flow (services.html) ---
        paidReportBtn: document.getElementById('trigger-payment-modal-from-services-btn'),
        paymentModal: document.getElementById('payment-modal'),
        paymentModalCloseBtn: document.querySelector('#payment-modal .modal-close'),
        confirmPaymentBtn: document.getElementById('confirm-payment-btn'),
        missionControlModal: document.getElementById('mission-control-modal'),
        missionModalCloseBtn: document.querySelector('#mission-control-modal .modal-close'),
        missionInput: document.getElementById('mission-input'),
        executeMissionBtn: document.getElementById('execute-mission-btn'),
        missionLoader: document.getElementById('mission-loader')
    };

    function openModal(modal) {
        if (modal) modal.style.display = 'flex';
    }

    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    // -------------------------------------------------------------------------
    // --- 2. Core AI & Reporting Logic ---
    // -------------------------------------------------------------------------

    async function getAIReport(topic) {
        if (!topic) throw new Error('报告主题不能为空。');
        
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            // Use the 'report' key for server-generated friendly error HTML, otherwise use 'error'
            const errorMessage = err.report || err.error || `AI服务暂时遇到问题 (错误码: ${response.status})`;
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        if (!data.report) throw new Error('AI服务返回了意料之外的数据格式。');
        
        return data.report;
    }

    // -------------------------------------------------------------------------
    // --- 3. User Flow Handlers & Event Listeners ---
    // -------------------------------------------------------------------------

    // --- Flow 1: Free Report Generation (on index.html) ---
    async function handleFreeReport() {
        // This function is ONLY for the free report button on the main page.
        if (!elements.topicInput || !elements.outputContainer || !elements.loader || !elements.reportOutput) {
            console.error("Could not find all required elements for free report generation.");
            return;
        }

        const topic = elements.topicInput.value.trim();
        if (!topic) {
            alert('请输入您感兴趣的行业或产品！');
            elements.topicInput.focus();
            return;
        }

        elements.outputContainer.style.display = 'block';
        elements.loader.style.display = 'block';
        elements.reportOutput.style.display = 'none';
        // Scroll smoothly to the output container
        elements.outputContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        try {
            const reportHTML = await getAIReport(topic);
            elements.reportOutput.innerHTML = reportHTML;
        } catch (error) {
            // The error message from getAIReport might be HTML, so we render it.
            elements.reportOutput.innerHTML = `<div class="report-card error-card"><h4>报告生成失败</h4><div>${error.message}</div></div>`;
        } finally {
            elements.loader.style.display = 'none';
            elements.reportOutput.style.display = 'block';
        }
    }

    // --- Flow 2: Paid Report Generation (on services.html) ---
    function openPaidFlow() {
        // This function is ONLY for the paid report buttons (e.g., on services.html)
        openModal(elements.paymentModal);
    }

    function handlePaymentConfirmation() {
        closeModal(elements.paymentModal);
        openModal(elements.missionControlModal);
        if (elements.missionInput) elements.missionInput.focus();
    }

    async function executePaidMission() {
        if (!elements.missionInput || !elements.missionLoader || !elements.executeMissionBtn) return;

        const topic = elements.missionInput.value.trim();
        if (!topic) {
            alert('请输入您的报告任务目标！');
            elements.missionInput.focus();
            return;
        }

        elements.missionLoader.style.display = 'block';
        elements.executeMissionBtn.disabled = true;

        try {
            const reportHTML = await getAIReport(topic);
            const reportWindow = window.open("", "_blank");
            if (reportWindow) {
                reportWindow.document.write(reportHTML);
                reportWindow.document.close();
            } else {
                alert("无法打开新窗口，请检查您的浏览器是否阻止了弹出窗口。");
            }
        } catch (error) {
            // Here, we use a simple alert as we don't have a dedicated output area.
            alert(`报告生成失败: ${error.message}`);
        } finally {
            elements.missionLoader.style.display = 'none';
            elements.executeMissionBtn.disabled = false;
            closeModal(elements.missionControlModal);
        }
    }

    // --- Attach Listeners Safely ---
    // The script runs on all pages, so we check if the element exists before adding a listener.
    if (elements.freeReportBtn) {
        elements.freeReportBtn.addEventListener('click', handleFreeReport);
    }
    if (elements.paidReportBtn) {
        elements.paidReportBtn.addEventListener('click', openPaidFlow);
    }
    if (elements.confirmPaymentBtn) {
        elements.confirmPaymentBtn.addEventListener('click', handlePaymentConfirmation);
    }
    if (elements.executeMissionBtn) {
        elements.executeMissionBtn.addEventListener('click', executePaidMission);
    }
    
    // --- Shared Modal Close Logic ---
    [elements.paymentModalCloseBtn, elements.missionModalCloseBtn].forEach(btn => {
        if(btn) {
            btn.addEventListener('click', () => {
                closeModal(elements.paymentModal);
                closeModal(elements.missionControlModal);
            });
        }
    });

    [elements.paymentModal, elements.missionControlModal].forEach(modal => {
        if(modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });

    console.log("InsightGen AI Script v4 (Production) loaded successfully.");
});