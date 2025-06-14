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

    async function getAIReport(topic, isPaid = false) {
        if (!topic) throw new Error('报告主题不能为空。');
        
        const payload = {
            topic: topic,
            isPaid: isPaid // Add a flag to distinguish the request type
        };

        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
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
        console.log("DEBUG: openPaidFlow() function called.");
        if (!elements.paymentModal) {
            console.error("DEBUG CRITICAL: elements.paymentModal is null! Cannot open modal.");
            return;
        }
        console.log("DEBUG: Modal element found, attempting to open.");
        openModal(elements.paymentModal);
    }

    function handlePaymentConfirmation() {
        closeModal(elements.paymentModal);
        openModal(elements.missionControlModal);
        if (elements.missionInput) elements.missionInput.focus();
    }

    async function executePaidMission() {
        if (!elements.missionInput) return;
        const topic = elements.missionInput.value.trim();
        if (!topic) {
            alert('请输入您的报告任务目标！');
            elements.missionInput.focus();
            return;
        }

        const reportWindow = window.open("", "_blank");
        if (!reportWindow) {
            alert("无法打开新窗口，请检查您的浏览器是否已允许本站弹出窗口。");
            return;
        }

        closeModal(elements.missionControlModal);

        try {
            // Step 1: Fetch dynamic metadata
            const metadataResponse = await fetch('/api/get-report-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            if (!metadataResponse.ok) {
                reportWindow.document.body.innerHTML = 'Error: Could not load report metadata.';
                return;
            }
            const metadata = await metadataResponse.json();
            const { logo, sources } = metadata;

            // Step 2: Fetch chapter list
            const chaptersResponse = await fetch('/api/get-report-chapters');
            if (!chaptersResponse.ok) throw new Error('无法获取报告章节结构。');
            const { chapters } = await chaptersResponse.json();

            // Step 3: Build the skeleton of the report in the new window
            const currentYear = new Date().getFullYear();
            const reportTitle = `${topic} - 市场综合调研报告`;
            const subTitle = `全面解析市场机遇与挑战 | ${currentYear}年版`;

            // Dynamically build the report skeleton
            const sourcesHTML = sources.map(source => `<li>${source}</li>`).join('');

            const reportSkeleton = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${reportTitle}</title>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.1.0/dist/chartjs-plugin-datalabels.min.js"></script>
                    <style>
                        :root {
                            --primary-color: #003366;
                            --secondary-color: #00509E;
                            --accent-color: #00AEEF;
                            --text-color-light: #ffffff;
                            --text-color-dark: #333333;
                            --bg-color-light: #f8f9fa;
                            --bg-color-dark: #e9ecef;
                        }
                        body {
                            background-color: var(--bg-color-light);
                            color: var(--text-color-dark);
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                        }
                        .report-container {
                            max-width: 1200px;
                            margin: auto;
                            background-color: white;
                            box-shadow: 0 0 20px rgba(0,0,0,0.1);
                        }
                        .cover {
                            background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
                            color: var(--text-color-light);
                            text-align: center;
                            padding: 80px 40px;
                            position: relative;
                            overflow: hidden;
                        }
                        .cover-logo {
                            position: absolute;
                            top: 20px;
                            left: 20px;
                            font-size: 2em;
                            font-weight: bold;
                            color: rgba(255, 255, 255, 0.8);
                            border: 2px solid rgba(255, 255, 255, 0.8);
                            padding: 5px 10px;
                            border-radius: 5px;
                        }
                        .cover h1 {
                            font-size: 3.5em;
                            margin: 0;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                        }
                        .cover p {
                            font-size: 1.5em;
                            margin-top: 10px;
                            opacity: 0.9;
                        }
                        
                        .data-sources {
                            padding: 40px;
                            background-color: var(--bg-color-dark);
                        }
                        .data-sources h2 {
                            font-size: 2em;
                            color: var(--primary-color);
                            border-bottom: 3px solid var(--primary-color);
                            padding-bottom: 10px;
                            margin-bottom: 20px;
                        }
                        .data-sources ul {
                            list-style: none;
                            padding: 0;
                            column-count: 2;
                            column-gap: 2rem;
                        }
                        .data-sources li {
                            background: white;
                            color: var(--text-color-dark);
                            padding: 1rem;
                            border-radius: 8px;
                            margin-bottom: 1rem;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        }

                        .section {
                            padding: 40px;
                            border-bottom: 1px solid #e0e0e0;
                            background-color: #ffffff;
                        }
                        .section:nth-child(even) {
                            background-color: #f8f9fa;
                        }
                        .section-title-box {
                            background-color: var(--primary-color);
                            padding: 20px;
                            margin-bottom: 30px;
                            border-radius: 5px;
                        }
                        .section-title-box h2 {
                            color: var(--text-color-light);
                            margin: 0;
                            font-size: 2em;
                        }
                        .content-wrapper {
                            margin-top: 20px;
                            line-height: 1.8;
                            color: var(--text-color-dark);
                            font-size: 1.1em;
                            overflow-wrap: break-word;
                        }
                        .chart-container {
                            width: 100%;
                            max-width: 800px;
                            margin: 40px auto;
                            padding: 20px;
                            background: #fff;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <header class="cover">
                            <div class="cover-logo">${logo}</div>
                            <h1>${reportTitle}</h1>
                            <p>${subTitle}</p>
                        </header>
                        <main>
                            ${chapters.map(chapter => `
                                <section id="chapter-${chapter.id}" class="section">
                                    <div class="section-title-box">
                                        <h2>${chapter.title}</h2>
                                    </div>
                                    <div class="content-wrapper">
                                        <p>正在生成内容...</p>
                                    </div>
                                </section>
                            `).join('')}
                        </main>
                        <footer class="data-sources">
                            <h2>核心数据来源声明</h2>
                            <ul>${sourcesHTML}</ul>
                        </footer>
                    </div>
                    <script>
                        // The script to render charts will be added later
                    </script>
                </body>
                </html>
            `;
            reportWindow.document.write(reportSkeleton);
            reportWindow.document.close();
            
            await new Promise(resolve => {
                const checkReady = () => {
                    if (reportWindow.document.readyState === 'complete') {
                        resolve();
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            });

            // Step 4: Fetch and render each chapter sequentially
            for (const chapter of chapters) {
                const section = reportWindow.document.getElementById(`chapter-${chapter.id}`);
                const contentWrapper = section.querySelector('.content-wrapper');
                
                try {
                    const response = await fetch('/api/generate-chapter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ topic, chapter }),
                    });

                    if (!response.ok) throw new Error(`"${chapter.title}" 章节生成失败。`);

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let chapterContent = '';
                    
                    contentWrapper.innerHTML = ''; // Clear loader

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        chapterContent += chunk;
                        contentWrapper.innerHTML = chapterContent;
                    }
                    
                    if (chapter.hasChart) {
                        const chartContainer = reportWindow.document.createElement('div');
                        chartContainer.className = 'chart-container';
                        const chartCanvas = reportWindow.document.createElement('canvas');
                        chartCanvas.id = `chart-${chapter.id}`;
                        chartContainer.appendChild(chartCanvas);
                        contentWrapper.appendChild(chartContainer);

                        try {
                            const chartResponse = await fetch('/api/generate-chart-code', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ topic, chartType: chapter.chartType })
                            });
                            if (!chartResponse.ok) {
                                throw new Error(`图表服务器错误: ${chartResponse.status}`);
                            }
                            const chartConfig = await chartResponse.json();
                            new reportWindow.Chart(chartCanvas, chartConfig);
                        } catch (chartError) {
                            console.error('Chart generation error:', chartError);
                            chartContainer.innerHTML = `<div style="color: red; padding: 20px; border: 1px solid red; background: #ffeeee;">
                                <strong>图表加载失败</strong><br>
                                原因: ${chartError.message}<br>
                                我们正在紧急处理此问题，请稍后刷新或查看其他章节。
                            </div>`;
                        }
                    }
                } catch (error) {
                    contentWrapper.innerHTML = `<p style="color: red;">${chapter.title} - 内容加载失败: ${error.message}</p>`;
                }
            }

        } catch (error) {
            console.error('An error occurred during report generation:', error);
            const errorMessage = `
                <!DOCTYPE html>
                <html lang="zh">
                <head>
                    <title>报告生成失败</title>
                    <style>
                        body { font-family: sans-serif; background-color: #050a30; color: #e6f1ff; padding: 2rem; }
                        h1 { color: #ff124f; }
                    </style>
                </head>
                <body>
                    <h1>报告生成失败</h1>
                    <p>很抱歉，在准备报告框架时遇到了一个错误。</p>
                    <p><b>错误详情:</b> ${error.message}</p>
                    <p>我们已经记录了此问题，请稍后重试或联系支持人员。</p>
                </body>
                </html>
            `;
            if (reportWindow && !reportWindow.closed) {
                reportWindow.document.open();
                reportWindow.document.write(errorMessage);
                reportWindow.document.close();
            }
        }
    }

    // --- Attach Listeners Safely ---
    // The script runs on all pages, so we check if the element exists before adding a listener.
    if (elements.freeReportBtn) {
        elements.freeReportBtn.addEventListener('click', handleFreeReport);
    }

    if (elements.paidReportBtn) {
        console.log("DEBUG: Found paidReportBtn. Attaching event listener...");
        elements.paidReportBtn.addEventListener('click', openPaidFlow);
        console.log("DEBUG: Event listener for paidReportBtn attached.");
    } else {
        console.warn("DEBUG: paidReportBtn was not found on this page.");
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

    console.log("InsightGen AI Script v5 (Super Debug) loaded successfully.");
});