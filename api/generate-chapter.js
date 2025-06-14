// 请将此文件的全部内容，完整复制并替换掉 report-business-website/api/generate-chapter.js 的原有内容。

export const config = {
    runtime: 'edge',
};

function buildPrompt(topic, chapter) {
    const chapterPrompts = {
        introduction: `为关于 "${topic}" 市场的报告生成“报告引言与核心摘要”章节的分析文本。`,
        market_overview: `为关于 "${topic}" 市场的报告生成“宏观市场概览”章节的分析文本。`,
        market_size: `为关于 "${topic}" 市场的报告生成“细分市场规模与预测”章节的分析文本。`,
        industry_chain: `为关于 "${topic}" 市场的报告生成“产业链深度分析”章节的分析文本。`,
        swot_analysis: `为关于 "${topic}" 市场的报告生成“SWOT综合分析”章节的分析文本。`,
        competition: `为关于 "${topic}" 市场的报告生成“主要竞争对手画像”章节的分析文本。`,
        consumer_profile: `为关于 "${topic}" 市场的报告生成“目标消费者画像”章节的分析文本。`,
        channel_strategy: `为关于 "${topic}" 市场的报告生成“市场渠道与分销策略”章节的分析文本。`,
        tech_trends: `为关于 "${topic}" 市场的报告生成“技术与创新趋势”章节的分析文本。`,
        policy_legal: `为关于 "${topic}" 市场的报告生成“政策法规环境”章节的分析文本。`,
        investment_hotspots: `为关于 "${topic}" 市场的报告生成“投资热点与机会”章节的分析文本。`,
        risk_assessment: `为关于 "${topic}" 市场的报告生成“潜在风险评估”章节的分析文本。`,
        marketing_strategy: `为关于 "${topic}" 市场的报告生成“营销与品牌策略”章节的分析文本。`,
        success_cases: `为关于 "${topic}" 市场的报告生成“标杆案例研究”章节的分析文本。`,
        future_outlook: `为关于 "${topic}" 市场的报告生成“未来5年趋势展望”章节的分析文本。`,
        conclusion: `为关于 "${topic}" 市场的报告生成“结论与战略建议”章节的分析文本。`,
    };

    const specificPrompt = chapterPrompts[chapter.id] || `请为关于“${chapter.title}”的章节生成详细的HTML内容。`;

    return `
        你是一个世界顶级的市场分析师。你的任务是为一份关于 "${topic}" 市场的深度分析报告，生成其中一个章节的HTML内容。

        **天条级规则(必须严格遵守):**
        1.  **强制中文:** 所有输出的文本内容，无一例外，必须全部使用简体中文。
        2.  **纯粹内容:** 你的回复必须是纯粹的HTML内容片段。绝对禁止包含任何章节标题、\`<html>\`, \`<body>\`, \`\`\` 等标签或标记。
        3.  **标签开始/结束:** 你的回复必须以HTML标签 (例如 \`<p>\` 或 \`<ul>\`) 作为第一个字符，并以HTML闭合标签 (例如 \`</p>\` 或 \`</ul>\`) 作为最后一个字符。
        
        **章节具体要求:** 
        ${specificPrompt}
    `;
}

export default async function handler(req) {
    try {
        const { topic, chapter } = await req.json();
        const apiKey = process.env.DEEPSEEK_API_KEY;

        const prompt = buildPrompt(topic, chapter);

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1500,
                temperature: 0.7,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${errorText}`);
        }

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    buffer += decoder.decode(value, { stream: true });
                    
                    let boundary = buffer.indexOf('\n\n');
                    while (boundary !== -1) {
                        const message = buffer.substring(0, boundary);
                        buffer = buffer.substring(boundary + 2);

                        if (message.startsWith('data: ')) {
                            const jsonStr = message.substring(6).trim();
                            if (jsonStr === '[DONE]') {
                                controller.close();
                                return;
                            }
                            try {
                                const parsed = JSON.parse(jsonStr);
                                let content = parsed.choices[0].delta.content || '';
                                if (content) {
                                    // Final safeguard: Clean the content on the server side
                                    content = content.replace(/```html|```/g, '').trim();
                                    controller.enqueue(new TextEncoder().encode(content));
                                }
                            } catch (e) {
                                console.error('Error parsing stream JSON:', jsonStr, e);
                            }
                        }
                        boundary = buffer.indexOf('\n\n');
                    }
                }
                controller.close();
            },
        });
        
        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        console.error('[Generate Chapter Error]', error);
        return new Response('An error occurred while generating the report chapter.', { status: 500 });
    }
}
