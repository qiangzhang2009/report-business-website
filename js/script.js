// Main entry point after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // --- 1. Element Cache ---
    const elements = {
        // From index.html
        topicInput: document.getElementById('topic-input'),
        triggerBtnIndex: document.getElementById('trigger-payment-modal-btn'),
        // From services.html
        triggerBtnServices: document.getElementById('trigger-payment-modal-from-services-btn'),
        
        // Shared Modals
        paymentModal: document.getElementById('payment-modal'),
        paymentModalCloseBtn: document.querySelector('#payment-modal .modal-close'),
        confirmPaymentBtn: document.getElementById('confirm-payment-btn'),
        missionControlModal: document.getElementById('mission-control-modal'),
        missionModalCloseBtn: document.querySelector('#mission-control-modal .modal-close'),
        missionInput: document.getElementById('mission-input'),
        executeMissionBtn: document.getElementById('execute-mission-btn'),
        
        // General elements
        spinner: document.getElementById('spinner')
    };

    // --- 2. Modal Logic ---
    function openModal(modal) {
        if (modal) modal.style.display = 'flex';
    }

    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }
    
    // --- 3. Unified Event Listeners ---
    const openPaymentHandler = () => {
        // On index.html, topic is required before showing modal
        if (elements.topicInput && !elements.topicInput.value.trim()) {
            alert('请输入您感兴趣的行业或产品！');
            elements.topicInput.focus();
            return;
        }
        openModal(elements.paymentModal);
    };

    if (elements.triggerBtnIndex) {
        elements.triggerBtnIndex.addEventListener('click', openPaymentHandler);
    }
    if (elements.triggerBtnServices) {
        elements.triggerBtnServices.addEventListener('click', openPaymentHandler);
    }

    if (elements.confirmPaymentBtn) {
        elements.confirmPaymentBtn.addEventListener('click', () => {
            closeModal(elements.paymentModal);
            openModal(elements.missionControlModal);
            // Pre-fill mission input ONLY if we are on index.html and the input exists
            if (elements.missionInput && elements.topicInput && elements.topicInput.value) {
                elements.missionInput.value = elements.topicInput.value;
            } else if (elements.missionInput) {
                // Clear it for the services page flow
                elements.missionInput.value = '';
            }
            if (elements.missionInput) elements.missionInput.focus();
        });
    }
    
    if (elements.executeMissionBtn) {
        elements.executeMissionBtn.addEventListener('click', () => {
            const topic = elements.missionInput.value.trim();
            if (!topic) {
                alert('报告任务目标不能为空！');
                elements.missionInput.focus();
                return;
            }
            closeModal(elements.missionControlModal);
            generateReport(topic); // Execute the main report generation
        });
    }

    // Shared modal close logic
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
});

// --- 4. Core Report Generation Logic ---
let reportWindow = null;
let reportTopic = '';

async function generateReport(topic) {
    reportTopic = topic;
    if (!reportTopic) {
        alert('报告主题不能为空！');
        return;
    }
    
    // Show spinner and disable button if they exist in the current context
    const generateBtn = document.getElementById('trigger-payment-modal-btn') || document.getElementById('trigger-payment-modal-from-services-btn');
    const spinner = document.getElementById('spinner'); // A general spinner
    if(generateBtn) generateBtn.disabled = true;
    if(spinner) spinner.style.display = 'inline-block';

    reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        alert('请允许弹窗！');
        if(generateBtn) generateBtn.disabled = false;
        if(spinner) spinner.style.display = 'none';
        return;
    }

    reportWindow.document.write('<html><head><title>正在生成报告...</title></head><body>请稍候，正在构建报告框架...</body></html>');

    try {
        const metadataResponse = await fetch('/api/get-report-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: reportTopic })
        });
        if (!metadataResponse.ok) throw new Error('无法加载报告元数据。');
        const metadata = await metadataResponse.json();

        const chaptersResponse = await fetch('/api/get-report-chapters');
        if (!chaptersResponse.ok) throw new Error('无法获取报告章节结构。');
        const { chapters } = await chaptersResponse.json();

        const year = new Date().getFullYear();
        const sourcesHTML = metadata.sources.map(source => `<li>${source}</li>`).join('');

        const reportSkeleton = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>${reportTopic} - 市场分析报告</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
                <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"><\/script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" integrity="sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoVBL5gI9kDXDCVwKTWZeNBZrGWtvw==" crossorigin="anonymous" referrerpolicy="no-referrer"><\/script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" integrity="sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==" crossorigin="anonymous" referrerpolicy="no-referrer"><\/script>
                <style>
                    :root { --primary-color: #050a30; --secondary-color: #091353; --accent-color: #00d4ff; --text-color: #e6f1ff; --text-secondary: #a3b1cc; --highlight: #ff124f; --card-bg: rgba(9, 19, 83, 0.7); }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 0; background-color: var(--primary-color); color: var(--text-color); background-image: linear-gradient(to bottom, var(--primary-color), var(--secondary-color)); background-attachment: fixed; }
                    .report-container { max-width: 800px; margin: auto; }
                    .cover, .chapter, .data-sources { padding: 4rem 2rem; margin: 2rem auto; background-color: var(--card-bg); border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.1); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1); backdrop-filter: blur(10px); }
                    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 400px; text-align: center; }
                    .cover-logo { font-size: 2.5rem; font-weight: bold; color: var(--accent-color); border: 3px solid var(--accent-color); border-radius: 50%; width: 80px; height: 80px; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; box-shadow: 0 0 20px rgba(0, 212, 255, 0.5); }
                    .cover h1 { font-size: 3em; margin: 0; color: var(--accent-color); text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);}
                    .cover p { font-size: 1.2em; margin-top: 10px; color: var(--text-secondary); }
                    .download-btn { margin-top: 2rem; padding: 1rem 2rem; background-color: var(--accent-color); color: var(--primary-color); border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; }
                    .download-btn:hover { background-color: var(--text-color); box-shadow: 0 0 15px var(--accent-color); }
                    .chapter h2, .data-sources h2 { font-size: 2.5rem; color: var(--accent-color); text-align: center; margin-bottom: 2rem; }
                    .content-wrapper { line-height: 1.8; color: var(--text-secondary); font-size: 1.1em; overflow-wrap: break-word; }
                    .content-wrapper p, .content-wrapper ul { margin-bottom: 1rem; }
                    .content-wrapper ul { padding-left: 20px; }
                    .chart-container { width: 100%; max-width: 600px; margin: 40px auto; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 8px; }
                    .data-sources ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
                    .data-sources li { background: var(--primary-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
                </style>
            </head>
            <body> <div id="report-content-to-print" class="report-container">
                <header class="cover">
                    <div class="cover-logo">${metadata.logo}</div>
                    <h1>${reportTopic}</h1> <p>市场综合分析与战略咨询报告 - ${year}版</p>
                    <button id="download-btn-pdf" class="download-btn">下载PDF报告</button>
                </header>
                <main>
                    ${chapters.map(c => `<section id="chapter-${c.id}" class="chapter"><h2>${c.title}</h2><div class="content-wrapper"><p>正在生成内容...</p></div></section>`).join('')}
                </main>
                <footer class="data-sources"><h2>核心数据来源声明</h2><ul>${sourcesHTML}</ul></footer>
            </div> </body> </html>`;

        reportWindow.document.open();
        reportWindow.document.write(reportSkeleton);
        reportWindow.document.close();

        reportWindow.Chart.register(reportWindow.ChartDataLabels);
        
        reportWindow.onload = () => {
            reportWindow.document.getElementById('download-btn-pdf').addEventListener('click', () => downloadPDF());
        };

        for (const chapter of chapters) {
            const contentWrapper = reportWindow.document.getElementById(`chapter-${chapter.id}`).querySelector('.content-wrapper');
            try {
                const response = await fetch('/api/generate-chapter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: reportTopic, chapter })
                });
                if (!response.ok) throw new Error('内容生成失败');
                const content = await response.text();
                contentWrapper.innerHTML = content;

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
                            body: JSON.stringify({ topic: reportTopic, chartType: chapter.chartType })
                        });
                        if (!chartResponse.ok) throw new Error(`图表服务器错误: ${chartResponse.status}`);
                        
                        const chartConfig = await sanitizeAndParseJson(chartResponse);
                        new reportWindow.Chart(chartCanvas, chartConfig);

                    } catch (chartError) {
                        chartContainer.innerHTML = `<div style="color: red; padding: 20px; border: 1px solid red; background: #ffeeee;"><strong>图表加载失败</strong><br>原因: ${chartError.message}</div>`;
                    }
                }
            } catch (error) {
                contentWrapper.innerHTML = `<p style="color:red;">此章节加载失败: ${error.message}</p>`;
            }
        }
    } catch (error) {
        if (reportWindow && !reportWindow.closed) {
            reportWindow.document.body.innerHTML = `<h1>报告生成失败</h1><p>错误详情: ${error.message}</p><p>请关闭此窗口重试。</p>`;
        }
    } finally {
        if(generateBtn) generateBtn.disabled = false;
        if(spinner) spinner.style.display = 'none';
    }
}

async function sanitizeAndParseJson(response) {
    let text = await response.text();
    text = text.replace(/^```json\s*|```\s*$/g, '');
    text = text.replace(/"formatter"\s*:\s*\([^)]*\)\s*=>\s*\{[^}]*\},?/g, '');
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("收到了无效的图表配置数据。");
    }
}

async function downloadPDF() {
    if (!reportWindow || reportWindow.closed) {
        alert("报告窗口已关闭，无法下载PDF。");
        return;
    }
    const { jsPDF } = reportWindow.jspdf;
    const html2canvas = reportWindow.html2canvas;

    const pdfDoc = new jsPDF('p', 'pt', 'a4');
    const sections = Array.from(reportWindow.document.querySelectorAll('.cover, .chapter, .data-sources'));
    const btn = reportWindow.document.getElementById('download-btn-pdf');

    btn.textContent = '正在生成PDF (0%)...';
    btn.disabled = true;

    try {
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = await html2canvas(section, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#050a30',
                onclone: (clonedDoc) => {
                    clonedDoc.querySelector('.report-container').style.margin = '0';
                }
            });

            const imgData = canvas.toDataURL('image/png', 0.9);
            const imgProps = pdfDoc.getImageProperties(imgData);
            const pdfWidth = pdfDoc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            if (i > 0) pdfDoc.addPage();
            pdfDoc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const progress = Math.round(((i + 1) / sections.length) * 100);
            btn.textContent = `正在生成PDF (${progress}%)...`;
        }
        pdfDoc.save(`${reportTopic} - 市场分析报告.pdf`);
    } catch (err) {
        console.error("PDF generation error:", err);
        alert("抱歉，生成PDF失败。请检查浏览器控制台获取更多信息。");
    } finally {
        btn.textContent = '下载PDF报告';
        btn.disabled = false;
    }
}