import { NextResponse } from 'next/server';

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

export async function POST(req) {
    try {
        const { topic } = await req.json();
        if (!topic) {
            return new NextResponse(JSON.stringify({ error: 'Topic is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const metadata = inferRegionAndGetData(topic);
        
        return new NextResponse(JSON.stringify(metadata), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Metadata generation error:', error);
        return new NextResponse(JSON.stringify({ error: 'Failed to generate report metadata' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 