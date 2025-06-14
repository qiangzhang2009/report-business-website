function inferRegionAndGetData(topic) {
    const lowerCaseTopic = topic.toLowerCase();
    
    // Region keywords and corresponding data
    const regionData = {
        'CN': {
            keywords: ['中国', 'china', '上海', 'shenzhen', 'beijing'],
            logo: 'CN',
            sources: [
                "中华人民共和国国家统计局",
                "中国互联网络信息中心 (CNNIC)",
                "艾瑞咨询 (iResearch)",
                "QuestMobile",
                "工信部"
            ]
        },
        'JP': {
            keywords: ['日本', 'japan', '东京', 'tokyo'],
            logo: 'JP',
            sources: [
                "总务省统计局 (Statistics Bureau of Japan)",
                "矢野经济研究所 (Yano Research Institute)",
                "富士经济 (Fuji Keizai)",
                "帝国数据银行 (Teikoku Databank)",
                "日本银行 (Bank of Japan)"
            ]
        },
        'US': {
            keywords: ['美国', 'america', '加州', 'california', 'usa'],
            logo: 'US',
            sources: [
                "U.S. Census Bureau",
                "Bureau of Economic Analysis (BEA)",
                "Gartner",
                "Forrester Research",
                "Nielsen"
            ]
        },
        'EU': {
            keywords: ['欧盟', '欧洲', 'european union', 'germany', 'france', 'uk'],
            logo: 'EU',
            sources: [
                "Eurostat (European Statistical Office)",
                "Statista",
                "McKinsey & Company Europe",
                "Roland Berger",
                "IHS Markit"
            ]
        },
        'GLOBAL': {
            keywords: [], // Default
            logo: 'GLOBAL',
            sources: [
                "World Bank",
                "International Monetary Fund (IMF)",
                "Statista",
                "Gartner",
                "Nielsen"
            ]
        }
    };

    // Find the matching region
    for (const regionKey in regionData) {
        const { keywords } = regionData[regionKey];
        if (keywords.some(kw => lowerCaseTopic.includes(kw))) {
            return regionData[regionKey];
        }
    }
    
    // Default to GLOBAL if no keywords match
    return regionData['GLOBAL'];
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }
        
        const metadata = inferRegionAndGetData(topic);
        
        return res.status(200).json(metadata);

    } catch (error) {
        console.error('Metadata generation error:', error);
        return res.status(500).json({ error: 'Failed to generate report metadata' });
    }
} 