export const config = {
    runtime: 'edge',
};

function buildChartPrompt(topic, chartType) {
    const chartPrompts = {
        marketShare: `为关于"${topic}"市场的报告，生成一个用于配置"甜甜圈图"(Doughnut)的JSON对象，用以展示主要竞争对手的市场份额。`,
        marketSize: `为关于"${topic}"市场的报告，生成一个用于配置"柱状图"(Bar)的JSON对象，用以展示从2020到2029的市场规模预测（单位：亿美元）。Y轴必须从0开始。`,
        techAdoptionCurve: `为关于"${topic}"市场的报告，生成一个用于配置"散点图"(Scatter)的JSON对象，模仿技术采用生命周期曲线，展示关键技术在市场中的成熟度位置。`,
        consumerDemographics: `为关于"${topic}"市场的报告，生成一个用于配置"甜甜圈图"(Doughnut)的JSON对象，用以展示目标消费者的年龄分布。请使用行业标准年龄段（如 "18-24岁", "25-34岁", "35-44岁", "45-54岁", "55岁以上"），并确保数据总和为100%。`
    };

    const specificPrompt = chartPrompts[chartType] || `生成一个关于"${topic}"的图表JSON对象。`;

    return `
        你是一个来自顶级咨询公司（如麦肯锡、BCG）的数据可视化专家。你的唯一任务是根据下面的要求，生成一个纯粹的、符合 Chart.js 格式的 JSON 配置对象。

        **天条级规则(必须严格遵守):**
        1.  **强制中文:** 所有图表内的标签和文本，无一例外，必须全部使用简体中文。
        2.  **数据真实性:** 所有数据都应该是基于对 '${topic}' 市场的真实理解，使用可信的、近期的（2023年后）数据进行估算和编撰。
        3.  **纯粹JSON:** 你的回复必须是一个纯粹的JSON对象。绝对禁止包含任何 \`\`\`json, \`\`\`, HTML, Markdown或任何解释性文字。
        4.  **JSON开始/结束:** 你的回复必须以 \`{\` 作为第一个字符，并以 \`}\` 作为最后一个字符。

        **具体要求:**
        ${specificPrompt}

        请直接输出JSON对象。
    `;
}

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    try {
        const { topic, chartType } = await req.json();
        const apiKey = process.env.DEEPSEEK_API_KEY;

        const prompt = buildChartPrompt(topic, chartType);

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.5,
                stream: false, // No streaming needed for small code block
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Chart generation API error: ${errorText}`);
        }

        const result = await response.json();
        const chartCode = result.choices[0].message.content;

        return new Response(chartCode, {
            status: 200,
            headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        });

    } catch (error) {
        console.error('[Generate Chart Error]', error);
        return new Response(`/* Chart generation failed: ${error.message} */`, { status: 500 });
    }
} 