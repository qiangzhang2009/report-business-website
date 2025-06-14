// file: report-business-website/api/generate-report.js
// This is the production-ready serverless function that acts as a secure proxy to the DeepSeek API.

export default async function handler(req, res) {
    // 1. We only accept POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 2. Get the 'topic' from the request body sent by the frontend
    const { topic } = req.body;
    // 3. Securely get the API key from environment variables on the server
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!topic) {
        return res.status(400).json({ error: 'A topic is required to generate a report.' });
    }

    if (!apiKey) {
        console.error('CRITICAL: DEEPSEEK_API_KEY is not configured on the Vercel server.');
        const noKeyErrorHtml = `
            <div id="report-content" style="background-color: #fff3f3; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px;">
                <h3 style="color: #721c24;">后端配置错误 (Backend Configuration Error)</h3>
                <p><strong>错误详情:</strong> 服务器未能读取到 <code>DEEPSEEK_API_KEY</code> 环境变量。</p>
                <p><strong>解决方案:</strong> 请登录您的Vercel项目设置，在 "Environment Variables" 中添加名为 <code>DEEPSEEK_API_KEY</code> 的变量，并设置其值为您正确的API密钥。完成后请重新部署。</p>
            </div>`;
        // We return 500 but send a JSON with a 'report' key so the frontend can display it
        return res.status(500).json({ report: noKeyErrorHtml });
    }

    // 4. This is the master prompt to instruct the AI
    const prompt = `
        The entire report MUST be generated in Simplified Chinese.
        You are a world-class market analyst. Your task is to generate a concise, data-driven "Experience Version" market insight report on a specific topic.
        The report MUST be in HTML format. You must return ONLY the HTML content for the report section itself, without any preamble, explanation, or markdown fences.
        The root element must be a single div: <div id="report-content">...</div>.

        Topic: "${topic}"

        Required HTML Structure:
        <div id="report-content">
            <style>
                #report-content { font-family: 'Roboto', 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; color: #333; }
                #report-content h3 { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #1a2c5b; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; margin-top: 15px; }
                #report-content h4 { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #3a4c7b; margin-top: 20px; }
                #report-content p { font-size: 16px; line-height: 1.7; color: #444; }
                #report-content .highlight { color: #0056b3; font-weight: bold; }
                #report-content ul { list-style-type: none; padding-left: 0; }
                #report-content li { background-color: #f7f9fc; border-left: 3px solid #0056b3; margin-bottom: 10px; padding: 10px 15px; }
            </style>
            <h3>${topic} - 市场快照 (体验版)</h3>
            <p>这是一份由AI生成的关于<strong>${topic}</strong>市场的初步洞察报告。完整版包含超过20个数据图表和深度分析。</p>
            
            <h4>核心洞察</h4>
            <p>[Generate 1-2 sentences summarizing the most critical market insights and trends for "${topic}" in Simplified Chinese]</p>

            <h4>市场规模与增长</h4>
            <p>[Generate a brief estimate and description of the market size and growth rate (CAGR) for "${topic}" in Simplified Chinese]</p>

            <h4>关键驱动力</h4>
            <ul>
                <li>[Generate the 1st driving factor in Simplified Chinese]</li>
                <li>[Generate the 2nd driving factor in Simplified Chinese]</li>
                <li>[Generate the 3rd driving factor in Simplified Chinese]</li>
            </ul>

            <h4>可预见的挑战</h4>
            <ul>
                <li>[Generate the 1st challenge in Simplified Chinese]</li>
                <li>[Generate the 2nd challenge in Simplified Chinese]</li>
            </ul>

            <p class="highlight">这只是冰山一角。立即订购完整报告，以获得对竞争格局、消费者画像、技术趋势和监管环境的全面分析。</p>
        </div>
    `;

    // 5. Call the DeepSeek API
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a top-tier market analyst who specializes in generating market reports in HTML format.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.75,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('DeepSeek API Error:', errorData);
            throw new Error(`The AI service returned an error (Status: ${response.status}).`);
        }

        const data = await response.json();
        // A safety check in case the AI returns an empty or malformed response
        if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('The AI service returned an unexpected empty response.');
        }
        const reportHtml = data.choices[0].message.content;

        // 6. Send the generated HTML back to the frontend
        res.status(200).json({ report: reportHtml });

    } catch (error) {
        console.error('Internal Server Error:', error);
        const internalErrorHtml = `
            <div id="report-content" style="background-color: #fff3f3; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px;">
                <h3 style="color: #721c24;">后端执行错误 (Backend Execution Error)</h3>
                <p><strong>错误详情:</strong> 在与AI服务通信时发生意外错误。</p>
                <p><strong>诊断信息:</strong> ${error.message}</p>
                <p>这可能是暂时的网络问题，或AI服务暂时不可用。请稍后重试。</p>
            </div>`;
        return res.status(500).json({ report: internalErrorHtml });
    }
}