// This list defines the structure of our final report.
const chapters = [
    { id: 'introduction', title: '报告引言与核心摘要' },
    { id: 'market_overview', title: '宏观市场概览', hasChart: true, chartType: 'marketSize' },
    { id: 'market_size', title: '细分市场规模与预测', hasChart: true, chartType: 'marketForecast' },
    { id: 'industry_chain', title: '产业链深度分析' },
    { id: 'swot_analysis', title: 'SWOT综合分析' },
    { id: 'competition', title: '主要竞争对手画像', hasChart: true, chartType: 'marketShare' },
    { id: 'consumer_profile', title: '目标消费者画像', hasChart: true, chartType: 'consumerDemographics' },
    { id: 'channel_strategy', title: '市场渠道与分销策略' },
    { id: 'tech_trends', title: '技术与创新趋势', hasChart: true, chartType: 'techAdoptionCurve' },
    { id: 'policy_legal', title: '政策法规环境' },
    { id: 'investment_hotspots', title: '投资热点与机会' },
    { id: 'risk_assessment', title: '潜在风险评估' },
    { id: 'marketing_strategy', title: '营销与品牌策略' },
    { id: 'success_cases', title: '标杆案例研究' },
    { id: 'future_outlook', title: '未来5年趋势展望', hasChart: true, chartType: 'futureTrends' },
    { id: 'conclusion', title: '结论与战略建议' },
];

export default function handler(req, res) {
    if (req.method === 'GET') {
        res.status(200).json({ chapters });
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 