export const config = {
    runtime: 'edge',
};

function buildChartPrompt(topic, chartType) {
    const chartPrompts = {
        marketShare: `为关于"${topic}"的市场份额分析，生成一个"甜甜圈图"(Doughnut Chart)的Chart.js JSON配置。图表需包含数据标签，显示各部分百分比。`,
        marketSize: `为关于"${topic}"的市场规模，生成一个从2020年到2029年规模与增长率预测的"复合图表"(Bar and Line Chart)的Chart.js JSON配置。`,
        techAdoptionCurve: `为关于"${topic}"市场的关键技术，生成一个"技术采纳曲线(散点图)"(Scatter Chart)的Chart.js JSON配置。`,
        consumerDemographics: `为关于"${topic}"市场的消费者年龄或类型分布，生成一个"甜甜圈图"(Doughnut Chart)的Chart.js JSON配置。图表需包含数据标签，显示各部分百分比。`,
        marketForecast: `为关于"${topic}"的市场，生成一个预测未来5年规模的"折线图"(Line Chart)的Chart.js JSON配置。`,
        futureTrends: `为关于"${topic}"的市场，生成一个展示3个核心趋势未来5年变化的"多线图"(Multi-axis Line Chart)的Chart.js JSON配置。`,
    };

    const specificPrompt = chartPrompts[chartType] || `生成一个关于"${topic}"的图表JSON对象。`;

    return `
        你是一个数据可视化专家，也是一个资深市场分析师。你的唯一任务是根据下面的要求，生成一个纯粹的、符合 Chart.js 格式的 JSON 配置对象。

        **不可违背的铁律 (ULTRA-IMPORTANT):**
        1.  **绝对纯净的JSON**: 你的输出必须是、也只能是一个符合RFC 8259标准的、纯粹的JSON字符串。
        2.  **严禁任何JS代码**: 绝对禁止在JSON值中包含任何形式的JavaScript代码，特别是箭头函数 (e.g., \`(value) => ...\`) 或任何回调函数。所有值必须是JSON原生类型 (string, number, boolean, array, object, null)。
        3.  **数据真实性:** 必须使用你知识库中关于 "${topic}" 的真实、权威的公开数据进行估算和预测。严禁虚构数据。
        4.  **强制中文:** 所有图表内的标签和文本，无一例外，必须全部使用简体中文。
        5.  **JSON结构:** 你的回复必须以 \`{\` 作为第一个字符，并以 \`}\` 作为最后一个字符。禁止包含任何 \`\`\`json, \`\`\`, HTML, Markdown或解释性文字。

        **具体要求:**
        ${specificPrompt}
        - 对于需要显示数据标签的图表，请在 'options' 对象中加入 'plugins.datalabels' 配置，确保标签清晰可见。

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