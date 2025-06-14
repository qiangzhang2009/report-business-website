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
            if (!chaptersResponse.ok) {
                reportWindow.document.body.innerHTML = '<h1>报告生成失败</h1><p>错误详情：无法获取报告章节结构。</p>';
                return;
            }
            const { chapters } = await chaptersResponse.json();

            // Dynamically build the report skeleton
            const year = new Date().getFullYear();
            const sourcesHTML = sources.map(source => `<li>${source}</li>`).join('');

            const reportSkeleton = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <title>${topic} - 市场分析报告</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                    <style>
                        :root {
                            --primary-color: #050a30;
                            --secondary-color: #091353;
                            --accent-color: #00d4ff;
                            --text-color: #e6f1ff;
                            --text-secondary: #a3b1cc;
                            --highlight: #ff124f;
                            --card-bg: rgba(9, 19, 83, 0.7);
                        }
                        body {
                            background-color: var(--primary-color);
                            color: var(--text-color);
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                            line-height: 1.8;
                            background-image: linear-gradient(to bottom, var(--primary-color), var(--secondary-color));
                            background-attachment: fixed;
                        }
                        .report-container { max-width: 1200px; margin: auto; }
                        .cover {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            text-align: center;
                            padding: 2rem;
                            background: rgba(5, 10, 48, 0.7);
                            backdrop-filter: blur(10px);
                        }
                        .cover .logo {
                            font-size: 2.5rem; font-weight: bold; color: var(--primary-color);
                            background-color: var(--accent-color);
                            border-radius: 50%; width: 80px; height: 80px;
                            display: flex; justify-content: center; align-items: center;
                            margin-bottom: 2rem; box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
                        }
                        .cover h1 { font-size: 3.5em; margin: 0; color: var(--accent-color); text-shadow: 0 0 10px rgba(0, 212, 255, 0.5); }
                        .cover p { font-size: 1.2rem; color: var(--text-secondary); margin: 1rem 0 2rem; }
                        .pdf-download-btn {
                            background-color: var(--accent-color); color: var(--primary-color);
                            border: none; border-radius: 5px; padding: 12px 25px;
                            font-size: 1.1rem; font-weight: bold; cursor: pointer;
                            transition: transform 0.2s, box-shadow 0.2s;
                        }
                        .pdf-download-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 212, 255, 0.2); }
                        
                        .chapter-card {
                            background-color: var(--card-bg);
                            backdrop-filter: blur(10px);
                            border: 1px solid rgba(0, 212, 255, 0.1);
                            border-radius: 12px; padding: 2.5rem; margin: 2.5rem 0;
                            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
                        }
                        .chapter-title {
                            font-size: 2.2rem; text-align: left; color: var(--accent-color);
                            margin-bottom: 1.5rem; border-bottom: 1px solid rgba(0, 212, 255, 0.2);
                            padding-bottom: 1rem;
                        }
                        .content-wrapper { color: var(--text-secondary); font-size: 1.1em; }
                        .chart-container { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1.5rem; margin-top: 1.5rem; }

                        .data-sources { padding: 3rem 2rem; background-color: #0a142c; text-align: center; }
                        .data-sources h2 { color: var(--accent-color); }
                        .data-sources ul { list-style: none; padding: 0; column-count: 2; column-gap: 2rem; text-align: left; display: inline-block; }
                        .data-sources li { background: var(--primary-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <header class="cover">
                            <div class="logo">${logo}</div>
                            <h1>${topic}</h1>
                            <p>市场综合分析与战略咨询报告 ${year}</p>
                            <button class="pdf-download-btn" onclick="downloadPDF()">下载PDF报告</button>
                        </header>
                        <main>
                            ${chapters.map(chapter => `
                                <section id="chapter-${chapter.id}" class="chapter-card">
                                    <h2 class="chapter-title">${chapter.title}</h2>
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
                        function downloadPDF() {
                            const { jsPDF } = window.jspdf;
                            const reportElement = document.querySelector('.report-container');
                            const downloadButton = document.querySelector('.pdf-download-btn');
                            
                            // Hide button during capture
                            downloadButton.style.display = 'none';

                            html2canvas(reportElement, {
                                scale: 2, // Improve quality
                                useCORS: true,
                                backgroundColor: '#050a30'
                            }).then(canvas => {
                                // Show button again
                                downloadButton.style.display = 'block';

                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF('p', 'mm', 'a4');
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const pdfHeight = pdf.internal.pageSize.getHeight();
                                const canvasWidth = canvas.width;
                                const canvasHeight = canvas.height;
                                const ratio = canvasWidth / canvasHeight;
                                const imgHeight = pdfWidth / ratio;
                                let heightLeft = canvasHeight;
                                let position = 0;

                                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                                heightLeft -= canvasHeight;

                                while (heightLeft > 0) {
                                    position = heightLeft - canvasHeight;
                                    pdf.addPage();
                                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                                    heightLeft -= canvasHeight;
                                }
                                pdf.save(\`\${topic} - 分析报告.pdf\`);
                            }).catch(err => {
                                console.error('PDF generation error:', err);
                                downloadButton.style.display = 'block';
                                alert('抱歉，生成PDF失败，请稍后重试。');
                            });
                        }
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
                                const errorText = await chartResponse.text();
                                throw new Error(`图表服务器错误 ${chartResponse.status}: ${errorText}`);
                            }
                            
                            const chartConfigString = await chartResponse.text();
                            let chartConfig;
                            try {
                               chartConfig = JSON.parse(chartConfigString);
                            } catch(e) {
                                throw new Error(`AI返回了无效的图表JSON格式: ${e.message}`);
                            }
                            
                            // Further enhance chart options for better visuals
                            const commonOptions = {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        labels: { color: 'rgba(230, 241, 255, 0.8)' }
                                    }
                                },
                                scales: {
                                    x: {
                                        ticks: { color: 'rgba(230, 241, 255, 0.6)' },
                                        grid: { color: 'rgba(230, 241, 255, 0.1)' }
                                    },
                                    y: {
                                        ticks: { color: 'rgba(230, 241, 255, 0.6)' },
                                        grid: { color: 'rgba(230, 241, 255, 0.1)' }
                                    }
                                }
                            };

                            new reportWindow.Chart(chartCanvas, { ...chartConfig, options: { ...commonOptions, ...chartConfig.options }});

                        } catch (chartError) {
                            console.error('Chart generation error:', chartError);
                            chartContainer.innerHTML = `<div style="color: #ff124f; padding: 20px; border: 1px solid #ff124f; background: rgba(255, 18, 79, 0.1);">
                                <strong>图表加载失败</strong><br>
                                <p style="font-family: monospace; white-space: pre-wrap; word-break: break-all;">原因: ${chartError.message}</p>
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