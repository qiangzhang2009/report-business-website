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

            // Step 3: Dynamically build the report skeleton with new styling and PDF functionality
            const year = new Date().getFullYear();
            const sourcesHTML = sources.map(source => `<li>${source}</li>`).join('');

            const reportSkeleton = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <title>${topic} - 市场分析报告</title>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
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
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: var(--primary-color);
                            color: var(--text-color);
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
                            border-bottom: 1px solid rgba(0, 212, 255, 0.2);
                        }
                        .cover-logo {
                            font-size: 2.5rem;
                            font-weight: bold;
                            color: var(--accent-color);
                            border: 3px solid var(--accent-color);
                            border-radius: 50%;
                            width: 80px;
                            height: 80px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            margin-bottom: 2rem;
                            box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
                        }
                        .cover h1 { font-size: 3.5em; margin: 0; color: var(--accent-color); text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);}
                        .cover p { font-size: 1.5em; margin-top: 10px; color: var(--text-secondary); }
                        .download-btn {
                            margin-top: 2rem;
                            padding: 1rem 2rem;
                            background-color: var(--accent-color);
                            color: var(--primary-color);
                            border: none;
                            border-radius: 5px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            text-transform: uppercase;
                        }
                        .download-btn:hover { background-color: var(--text-color); box-shadow: 0 0 15px var(--accent-color); }
                        
                        .chapter, .data-sources {
                            padding: 4rem 2rem;
                            margin: 2rem auto;
                            background-color: var(--card-bg);
                            border-radius: 12px;
                            border: 1px solid rgba(0, 212, 255, 0.1);
                            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
                            backdrop-filter: blur(10px);
                        }
                        
                        .chapter h2, .data-sources h2 {
                            font-size: 2.5rem;
                            color: var(--accent-color);
                            text-align: center;
                            margin-bottom: 2rem;
                        }

                        .content-wrapper { line-height: 1.8; color: var(--text-secondary); font-size: 1.1em; overflow-wrap: break-word; }
                        .content-wrapper p, .content-wrapper ul { margin-bottom: 1rem; }
                        .content-wrapper ul { padding-left: 20px; }

                        .chart-container { width: 100%; max-width: 800px; margin: 40px auto; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 8px; }
                        .data-sources ul { list-style: none; padding: 0; column-count: 2; column-gap: 2rem; }
                        .data-sources li { background: var(--primary-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
                    </style>
                </head>
                <body>
                    <div id="report-content-to-print" class="report-container">
                        <header class="cover">
                            <div class="cover-logo">${logo}</div>
                            <h1>${topic}</h1>
                            <p>市场综合分析与战略咨询报告 - ${year}版</p>
                            <button class="download-btn" onclick="downloadPDF()">下载PDF报告</button>
                        </header>
                        <main>
                            ${chapters.map(chapter => `
                                <section id="chapter-${chapter.id}" class="chapter">
                                    <h2>${chapter.title}</h2>
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
                            const reportContent = document.getElementById('report-content-to-print');
                            const downloadButton = reportContent.querySelector('.download-btn');
                            
                            // Hide the button before taking the screenshot
                            downloadButton.style.display = 'none';

                            html2canvas(reportContent, { 
                                scale: 2, // Higher scale for better quality
                                useCORS: true,
                                backgroundColor: '#050a30'
                            }).then(canvas => {
                                // Show the button again after screenshot
                                downloadButton.style.display = 'block';

                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF({
                                    orientation: 'p',
                                    unit: 'px',
                                    format: [canvas.width, canvas.height]
                                });
                                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                                pdf.save("${topic} - 分析报告.pdf");
                            }).catch(err => {
                                // Ensure button is always visible even if there is an error
                                downloadButton.style.display = 'block';
                                console.error("PDF generation error:", err);
                                alert("抱歉，生成PDF失败。请稍后重试。");
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