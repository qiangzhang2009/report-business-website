export const config = {
    runtime: 'edge',
};

function buildChartPrompt(topic, chartType) {
    const chartPrompts = {
        marketShare: `生成一个 JSON 对象，用于配置关于"${topic}"市场份额的"甜甜圈图"(Doughnut Chart)。`,
        marketSize: `生成一个 JSON 对象，用于配置关于"${topic}"市场从2020年到2029年规模预测的"柱状图"(Bar Chart)。`,
        techAdoptionCurve: `生成一个 JSON 对象，用于配置关于"${topic}"市场关键技术的"技术采纳曲线(散点图)"(Scatter Chart)。`,
        consumerDemographics: `
            为关于 "${topic}" 市场的报告，生成一个JSON对象，用于配置"雷达图"(Radar Chart)。
            **核心要求:**
            1. 对比3-5个核心用户群体（例如："价格敏感型企业", "技术早期采用者", "大型跨国公司", "中小型企业"）。
            2. 评估维度必须包含 "购买力", "品牌忠诚度", "技术需求度", "服务敏感度", "市场规模" 这5个。
            3. **数据必须符合商业逻辑，例如"大型跨国公司"的购买力通常最高，而"价格敏感型企业"则最低。数据分布不能过于平坦或随机。**
        `
    };

    const specificPrompt = chartPrompts[chartType] || `生成一个关于"${topic}"的图表JSON对象。`;

    return `
        你是一个数据可视化专家和资深市场分析师。你的唯一任务是根据下面的要求，生成一个纯粹的、符合 Chart.js 格式的 JSON 配置对象。

        **天条级规则(必须严格遵守):**
        1.  **强制中文:** 所有图表内的标签和文本，无一例外，必须全部使用简体中文。
        2.  **纯粹JSON:** 你的回复必须是一个纯粹的JSON对象。绝对禁止包含任何 \`\`\`json, \`\`\`, HTML, Markdown或任何解释性文字。
        3.  **JSON开始/结束:** 你的回复必须以 \`{\` 作为第一个字符，并以 \`}\` 作为最后一个字符。
        4.  **数据真实性:** 你生成的所有数据都必须基于对真实世界宏观经济和市场趋势的理解，使其具有高度的说服力和合理性。严禁编造毫无根据的、随机的数字。

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