document.addEventListener('DOMContentLoaded', function() {
    // -------------------------------------------------------------------------
    // --- 1. SETUP & UTILITIES ---
    // -------------------------------------------------------------------------

    // --- DOM Element Cache ---
    const elements = {
        // --- Index Page Elements ---
        topicInput: document.getElementById('topic-input'),
        freeReportBtn: document.getElementById('trigger-payment-modal-btn'),
        outputContainer: document.getElementById('report-output-container'),
        reportOutput: document.getElementById('report-output'),
        loader: document.querySelector('#report-output-container .loader'),

        // --- Services Page Elements ---
        paidReportBtn: document.getElementById('trigger-payment-modal-from-services-btn'),

        // --- Shared Modal Elements ---
        paymentModal: document.getElementById('payment-modal'),
        paymentModalCloseBtn: document.querySelector('#payment-modal .modal-close'),
        confirmPaymentBtn: document.getElementById('confirm-payment-btn'),
        
        missionControlModal: document.getElementById('mission-control-modal'),
        missionModalCloseBtn: document.querySelector('#mission-control-modal .modal-close'),
        missionInput: document.getElementById('mission-input'),
        executeMissionBtn: document.getElementById('execute-mission-btn'),
        missionLoader: document.getElementById('mission-loader')
    };

    // --- Utility Functions ---
    function openModal(modal) {
        if (modal) modal.style.display = 'flex';
    }

    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    // -------------------------------------------------------------------------
    // --- 2. CORE AI & REPORTING LOGIC ---
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
            throw new Error(err.report || `AI服务暂时遇到问题 (错误码: ${response.status})`);
        }
        
        const data = await response.json();
        if (!data.report) throw new Error('AI服务返回了意料之外的数据格式。');
        
        return data.report;
    }

    // -------------------------------------------------------------------------
    // --- 3. USER FLOWS & EVENT LISTENERS ---
    // -------------------------------------------------------------------------

    // --- Flow 1: Free Report Generation (on index.html) ---
    async function handleFreeReport() {
        if (!elements.topicInput || !elements.outputContainer || !elements.loader || !elements.reportOutput) return;

        const topic = elements.topicInput.value.trim();
        if (!topic) {
            alert('请输入您感兴趣的行业或产品！');
            elements.topicInput.focus();
            return;
        }

        elements.outputContainer.style.display = 'block';
        elements.loader.style.display = 'block';
        elements.reportOutput.style.display = 'none';
        elements.outputContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        try {
            const reportHTML = await getAIReport(topic);
            elements.reportOutput.innerHTML = reportHTML;
        } catch (error) {
            elements.reportOutput.innerHTML = `<div class="report-card error-card"><h4>报告生成失败</h4><p>${error.message}</p></div>`;
        } finally {
            elements.loader.style.display = 'none';
            elements.reportOutput.style.display = 'block';
        }
    }

    if (elements.freeReportBtn) {
        elements.freeReportBtn.addEventListener('click', handleFreeReport);
    }

    // --- Flow 2: Paid Report Generation (from services.html) ---
    function openPaidFlow() {
        openModal(elements.paymentModal);
    }

    function handlePaymentConfirmation() {
        closeModal(elements.paymentModal);
        openModal(elements.missionControlModal);
        if (elements.missionInput) elements.missionInput.focus();
    }

    async function executePaidMission() {
        if (!elements.missionInput || !elements.missionLoader) return;

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
            // For paid reports, we open the result in a new tab/window.
            const reportWindow = window.open("", "_blank");
            if(reportWindow){
                reportWindow.document.write(reportHTML);
                reportWindow.document.close();
            } else {
                alert("无法打开新窗口，请检查您的浏览器是否阻止了弹出窗口。");
            }
        } catch (error) {
            alert(`报告生成失败: ${error.message}`);
        } finally {
            elements.missionLoader.style.display = 'none';
            elements.executeMissionBtn.disabled = false;
            closeModal(elements.missionControlModal);
        }
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
    if (elements.paymentModalCloseBtn) {
        elements.paymentModalCloseBtn.addEventListener('click', () => closeModal(elements.paymentModal));
    }
    if (elements.missionModalCloseBtn) {
        elements.missionModalCloseBtn.addEventListener('click', () => closeModal(elements.missionControlModal));
    }
    if (elements.paymentModal) {
        elements.paymentModal.addEventListener('click', (e) => e.target === elements.paymentModal && closeModal(elements.paymentModal));
    }
    if (elements.missionControlModal) {
        elements.missionControlModal.addEventListener('click', (e) => e.target === elements.missionControlModal && closeModal(elements.missionControlModal));
    }
});