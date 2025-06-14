document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动到锚点
    const navLinks = document.querySelectorAll('.nav-menu a, .btn');

    for (const link of navLinks) {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // 只处理页面内的锚点链接
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }
});

document.addEventListener('scroll', () => {
    // ... (现有滚动逻辑)
});

// 新增：交互式报告生成逻辑
document.addEventListener('DOMContentLoaded', () => {
    // --- 全局元素获取 ---
    const topicInput = document.getElementById('topic-input');
    const outputContainer = document.getElementById('report-output-container');
    const reportOutput = document.getElementById('report-output');
    const loader = outputContainer ? outputContainer.querySelector('.loader') : null;
    const freeReportBtn = document.getElementById('trigger-payment-modal-btn'); // 首页的免费体验按钮

    // --- 付费流程相关元素 ---
    const paidReportBtn = document.getElementById('trigger-payment-modal-from-services-btn'); // 服务页的付费按钮
    const paymentModal = document.getElementById('payment-modal');
    const paymentModalCloseBtn = paymentModal ? paymentModal.querySelector('.modal-close') : null;
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');

    // --- 任务指令界面相关元素 ---
    const missionControlModal = document.getElementById('mission-control-modal');
    const missionModalCloseBtn = missionControlModal ? missionControlModal.querySelector('.modal-close') : null;
    const missionInput = document.getElementById('mission-input');
    const executeMissionBtn = document.getElementById('execute-mission-btn');
    const missionForm = missionControlModal ? missionControlModal.querySelector('.mission-form') : null;
    const missionLoader = document.getElementById('mission-loader');

    const urlParams = new URLSearchParams(window.location.search);
    const isPaidFlow = urlParams.get('paid') === 'true';

    // --- 通用函数 ---
    function openModal(modal) {
        if (!modal) return;
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('visible');
        setTimeout(() => modal.style.display = 'none', 300);
    }
    
    // --- 报告生成函数 ---
    
    // 1. 生成免费版的、不可下载的体验报告
    function generateFreeReport(topic) {
        if (!loader || !reportOutput || !outputContainer) return;
        outputContainer.style.display = 'block';
        loader.style.display = 'block';
        reportOutput.style.display = 'none';
        outputContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
             const reportHTML = `
                <div class="report-header">
                    <h3>${topic}市场免费体验报告</h3>
                    <span>由 InsightGen AI 生成 (体验版)</span>
                </div>
                <div class="report-grid-single-column">
                    <div class="report-card">
                        <h4><i class="fas fa-search-dollar"></i> 市场概览</h4>
                        <p>根据初步数据分析，<strong>${topic}</strong> 市场目前正经历一个显著的增长期。当前市场规模估计约为 <strong>${(Math.random() * 30 + 5).toFixed(1)}亿美元</strong>。消费者对创新和高品质产品的兴趣日益浓厚，线上销售渠道的渗透率持续提高，为新进入者提供了良好的市场机会。预计未来几年，在技术进步和消费升级的共同推动下，市场将继续保持上行态势。</p>
                    </div>
                    <div class="report-card">
                        <h4><i class="fas fa-users"></i> 消费者洞察</h4>
                        <p>该市场的核心消费群体可以被描绘为：追求生活品质、对新技术持开放态度、并在购买决策中高度依赖社交媒体和在线评价的"智慧型消费者"。他们的主要痛点在于信息不对称，难以在众多品牌中快速筛选出最符合自己需求和价值观的产品。因此，建立品牌信任和提供透明的产品信息至关重要。</p>
                    </div>
                    <div class="report-card">
                        <h4><i class="fas fa-chess-rook"></i> 竞争格局简析</h4>
                        <p>市场竞争日趋激烈。主要由三大力量主导：一是传统巨头"${topic}经典公司"，凭借品牌和渠道优势占据主导地位；二是创新型初创企业"${topic}新锐科技"，以其独特技术和灵活的市场策略获得关注；三是跨界玩家"全球优选集团"，利用其在其他领域的优势进行渗透。价格战并非主流，竞争焦点在于产品创新和用户体验。</p>
                    </div>
                     <div class="report-card">
                        <h4><i class="fas fa-lightbulb"></i> 机会与风险 (SWOT简析)</h4>
                        <p><strong>优势(S):</strong> 市场需求明确且持续增长。 <strong>劣势(W):</strong> 品牌建设需要较长时间和大量投入。 <strong>机会(O):</strong> 细分市场（如高端定制、环保材料）存在巨大潜力。 <strong>威胁(T):</strong> 宏观经济波动和日益严格的行业监管可能带来不确定性。</p>
                    </div>
                </div>
                <div class="report-footer">
                    <p>以上为免费体验版。付费1元可立即获取一份包含<strong>数据图表、渠道分析、可下载PDF</strong>的<strong>精美速览报告</strong>。</p>
                    <a href="services.html" class="btn-primary" style="margin-top:1rem; display:inline-block;">升级获取精美速览报告 <i class="fas fa-arrow-right"></i></a>
                </div>
            `;
            reportOutput.innerHTML = reportHTML;
            loader.style.display = 'none';
            reportOutput.style.display = 'block';
        }, 1500);
    }

    // 2.【最终重构 - V3: 真实数据驱动】生成关于"日本人参酒"的专业报告 (核心函数)
    function generateProfessionalReport(mission, reportWindow) {
        
        let product = "人参酒";
        let market = "日本";
        
        // 虽然目前是硬编码，但保留解析逻辑的框架
        const missionParts = mission.split("在").map(s => s.trim());
        if (missionParts.length === 2) {
            product = missionParts[0] || product;
            market = missionParts[1] || market;
        } else {
            product = mission || product;
        }

        const reportTitle = `${market}${product}市場総合調査レポート`;
        const reportSubtitle = `全面解析${market}市场关于${product}的机遇与挑战 | 2025年版`;
        const generationDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        const logoText = "人参";

        const reportContentHTML = `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${reportTitle}</title>
                 <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet">
                 <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
                <style>
                    body { background-color: #f8f9fa; font-family: 'Helvetica Neue', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Arial', 'Yu Gothic', 'Meiryo', sans-serif; }
                    .report-header { background-color: #2c3e50; color: white; padding: 3rem 1rem; margin-bottom: 2rem; border-radius: 0.3rem; text-align: center; }
                    .report-title { font-size: 2.5rem; font-weight: bold; }
                    .report-meta { font-size: 1rem; color: #bdc3c7; }
                    .section-title { border-bottom: 3px solid #3498db; padding-bottom: 0.5rem; margin-top: 3rem; margin-bottom: 1.5rem; font-size: 1.9rem; font-weight: 600; color: #2c3e50; }
                    .card { margin-bottom: 1.5rem; box-shadow: 0 4px 8px rgba(0,0,0,.1); border: 1px solid #ddd; }
                    .card-header { background-color: #ecf0f1; font-weight: bold; color: #2c3e50; font-size: 1.2rem; }
                    .list-group-item strong { color: #3498db; }
                    .chart-container { padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 8px rgba(0,0,0,.1); border: 1px solid #ddd; }
                    .text-success { color: #2ecc71 !important; }
                    .text-danger { color: #e74c3c !important; }
                    .text-primary { color: #3498db !important; }
                    .alert-info { background-color: #eaf5fb; border-color: #b8dff5; color: #31708f;}
                    .alert-heading { color: inherit; }
                </style>
            </head>
            <body>
                <div class="container mt-5">
                    <header class="report-header">
                        <h1 class="report-title">${reportTitle}</h1>
                        <p class="report-meta">発行日: ${generationDate} | レポートID: BIZ-JP-GSW-2025-V2</p>
                         <p class="report-meta mt-2">© 上海张小强企业咨询事务所 | 本报告由『智探GlobalAI』市场分析系统全自动编制</p>
                    </header>

                    <main>
                        <section id="market-overview">
                            <h2 class="section-title">1. 市場概要</h2>
                            <div class="card">
                                <div class="card-body">
                                    <p class="card-text">本レポートは、日本の人参酒（高麗人参酒を含む）市場に関する包括的な分析を提供します。人参酒は、健康志向の高まりと高齢化社会の進展を背景に、伝統的な「薬用酒」の枠を超え、新たな健康志向型アルコール飲料として注目を集めています。市場は、大手メーカーによる現代的な風味の製品から、輸入品、地方の小規模醸造所によるクラフト製品まで、多様なプレイヤーによって構成されています。</p>
                                    <p class="card-text">本市場の正確な市場規模データは限定的ですが、関連市場（機能性飲料、健康志向型アルコール）の成長トレンドから、安定した需要と今後の成長ポテンシャルが見込まれます。本レポートでは、市場の主要な促進要因、課題、機会を分析し、消費者動向、主要企業、法規制環境を明らかにすることで、市場への参入や事業拡大を検討する企業に実用的な洞察を提供します。</p>
                                </div>
                            </div>
                        </section>

                        <section id="market-dynamics">
                            <h2 class="section-title">2. 市場の推進力、課題、機会</h2>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="card h-100">
                                        <div class="card-header text-success"><i class="fas fa-arrow-up"></i> 推進力 (Drivers)</div>
                                        <ul class="list-group list-group-flush">
                                            <li class="list-group-item"><strong>高齢化と健康意識の向上:</strong> 日本の急速な高齢化社会において、健康維持・増進への関心は非常に高い。特に中高年層は、機能性を訴求する製品への支出意欲が旺盛です。</li>
                                            <li class="list-group-item"><strong>セルフメディケーションのトレンド:</strong> 日常的な健康管理を自身で行うという考え方が浸透し、食品や飲料を通じた健康維持が一般化しています。</li>
                                            <li class="list-group-item"><strong>伝統への回帰と自然派志向:</strong> 伝統的なハーブや自然由来の成分に対する信頼感が高まっており、人参酒の持つ「自然の力」というイメージが消費者に好意的に受け入れられています。</li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card h-100">
                                        <div class="card-header text-danger"><i class="fas fa-arrow-down"></i> 課題 (Challenges)</div>
                                        <ul class="list-group list-group-flush">
                                            <li class="list-group-item"><strong>"薬臭い"という先入観:</strong> 伝統的な薬用酒のイメージから、味に対するネガティブな先入観を持つ消費者が存在します。</li>
                                            <li class="list-group-item"><strong>若年層へのアプローチ:</strong> 主なターゲットが中高年層に偏りがちで、若年層の需要をいかに開拓するかが課題です。</li>
                                            <li class="list-group-item"><strong>競争の激化:</strong> 機能性を謳う他のアルコール飲料（例：糖質ゼロビール）や、ノンアルコールの健康ドリンクとの競争が激しい状況です。</li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card h-100">
                                        <div class="card-header text-primary"><i class="fas fa-lightbulb"></i> 機会 (Opportunities)</div>
                                        <ul class="list-group list-group-flush">
                                            <li class="list-group-item"><strong>製品の現代化:</strong> フルーティーな風味の追加や低アルコール化により、飲みやすさを追求した製品開発。</li>
                                            <li class="list-group-item"><strong>プレミアム・クラフト市場:</strong> 国産原料や製法にこだわった高付加価値なクラフト人参酒による、新たな市場セグメントの創造。</li>
                                            <li class="list-group-item"><strong>飲用シーンの多様化提案:</strong> 食前酒、リラックスタイム、カクテルベースなど、従来の「就寝前の一杯」以外の飲用シーンを提案することで、新たな顧客層を獲得。</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <section id="consumer-analysis">
                            <h2 class="section-title">3. 消費者分析</h2>
                            <div class="row align-items-center">
                                <div class="col-lg-7">
                                    <div class="card">
                                        <div class="card-header">主要ターゲット層：45歳以上の健康意識層</div>
                                        <div class="card-body">
                                            <p>日本の人参酒市場における最も重要な消費者層は、<strong>45歳以上の中高年〜高齢者層</strong>です。</p>
                                            <p>ニールセンIQの専門家による分析では、この年齢層は日本のアルコール消費において健康属性を持つ製品への支出が突出して高く、<strong>アルコール飲料への全支出の62%</strong>を占めています。この事実は、人参酒がターゲットとすべき中心顧客が、明確にこの層であることを示しています。</p>
                                            <ul>
                                                <li><strong>性別:</strong> 男女双方に需要があるが、特に健康管理に敏感な女性からの関心も高い。</li>
                                                <li><strong>ライフスタイル:</strong> 健康診断の結果を気にし始め、日々の食生活に気を配る層。リタイア後の生活の質（QOL）向上に関心がある層。</li>
                                                <li><strong>購入動機:</strong> "疲労回復"「滋養強壮」「冷え性改善」など、具体的な健康効果への期待が主な購入動機。</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-5">
                                    <div class="chart-container">
                                        <canvas id="consumerSpendingChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="market-players">
                            <h2 class="section-title">4. 主要プレイヤーと市場構造</h2>
                             <p>人参酒市場は、特定の寡占企業が存在するわけではなく、異なる特徴を持つ複数のプレイヤーによって構成されています。</p>
                            <div class="chart-container mt-4">
                                <canvas id="marketStructureChart"></canvas>
                            </div>
                             <div class="list-group mt-4">
                               <a href="#" class="list-group-item list-group-item-action flex-column align-items-start">
                                <div class="d-flex w-100 justify-content-between">
                                  <h5 class="mb-1 text-primary">市場リーダー: 養命酒製造(株)</h5>
                                </div>
                                <p class="mb-1">"薬用養命酒"で絶大な知名度を誇る同社は、市場のリーダー的存在です。専用製品"高麗人参酒"は、リンゴ果汁や黒糖蜜を加えて飲みやすくしており、伝統的なイメージを覆す現代的な製品開発で市場を牽引しています。</p>
                              </a>
                              <a href="#" class="list-group-item list-group-item-action flex-column align-items-start">
                                <div class="d-flex w-100 justify-content-between">
                                  <h5 class="mb-1 text-danger">輸入ブランド (韓国系)</h5>
                                </div>
                                <p class="mb-1">韓国から輸入される人参酒は、しばしば瓶の中に高麗人参の根がそのまま入っており、その見た目のインパクトと"本場"のイメージで一定の支持を得ています。ECサイトを中心に流通しています。</p>
                              </a>
                              <a href="#" class="list-group-item list-group-item-action flex-column align-items-start">
                                <div class="d-flex w-100 justify-content-between">
                                  <h5 class="mb-1 text-success">地方・クラフトブランド</h5>
                                </div>
                                <p class="mb-1">長野県など、国内の高麗人参産地では、小規模な酒造会社によるクラフト人参酒が生産されています。国産原料や独自の製法を強みとし、高価格帯のギフト市場やふるさと納税返礼品として人気があります。</p>
                              </a>
                               <a href="#" class="list-group-item list-group-item-action flex-column align-items-start">
                                <div class="d-flex w-100 justify-content-between">
                                  <h5 class="mb-1">間接的競合: (株)韓国人蔘公社ジャパン</h5>
                                </div>
                                <p class="mb-1">"正官庄"ブランドで知られる高麗人参製品の最大手。エキスやタブレットなど、非アルコール製品が主力であり、直接の競合ではないものの、"高麗人参による健康効果"を求める消費者の選択肢として強力な競合相手です。</p>
                              </a>
                            </div>
                        </section>

                        <section id="regulatory-environment">
                            <h2 class="section-title">5. 法規制環境</h2>
                             <div class="card">
                                <div class="card-header">酒税法上の分類</div>
                                <div class="card-body">
                                   <p>日本の<strong>酒税法</strong>において、"人参酒"や"薬用酒"という独立した法的な品目分類は存在しません。これらの製品は、製造方法に基づき、<strong>"混成酒類"</strong>の中の<strong>"リキュール"</strong>に分類されます。</p>
                                   <ul class="list-group">
                                       <li class="list-group-item"><strong>定義:</strong> 酒類と糖類、その他の物品（酒類を含む）を原料とし、エキス分が2度以上のもの。</li>
                                       <li class="list-group-item"><strong>免許:</strong> 製造・販売には"酒類製造免許（リキュール）"および"酒類販売業免許"が必要です。</li>
                                   </ul>
                                </div>
                            </div>
                             <div class="card mt-4">
                                <div class="card-header">表示に関する注意点</div>
                                 <div class="card-body">
                                    <p>"薬用酒"という名称は市場で広く使われていますが、医薬品と誤認されるような効果効能を断定的に表示することは<strong>医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律（薬機法）</strong>により厳しく制限されています。"滋養強壮"「疲労回復」といった表現は、国が承認した"医薬品"や"指定医薬部外品"である"薬用養命酒"のような製品に限定される場合が多く、一般的なリキュール（食品）として販売する際は注意が必要です。</p>
                                </div>
                            </div>
                             <div class="card mt-4">
                                <div class="card-header">家庭での製造（自家醸造）</div>
                                 <div class="card-body">
                                    <p>消費者が家庭で楽しむために混成酒（梅酒や人参酒など）を造ることは認められていますが、以下の厳格なルールがあります。</p>
                                     <ul class="list-group">
                                       <li class="list-group-item">使用する基酒のアルコール度数が<strong>20度以上</strong>であること。これは、20度未満の酒を使用すると、新たな発酵が起こり酒税の対象となる"醸造"とみなされる可能性があるためです。</li>
                                       <li class="list-group-item">ぶどう、やまぶどうを原料として使用しないこと。</li>
                                       <li class="list-group-item">販売目的で製造しないこと。</li>
                                   </ul>
                                </div>
                            </div>
                        </section>
                        
                        <section id="conclusion">
                            <h2 class="section-title">6. 結論と戦略的提言</h2>
                            <div class="alert alert-info" role="alert">
                                <h4 class="alert-heading">総括</h4>
                                <p>日本の人参酒市場は、健康志向という強力な追い風を受ける一方で、伝統的なイメージの払拭と若年層への浸透という課題を抱える、成熟しつつも変革期にある市場です。成功の鍵は、製品の"健康価値"を維持しつつ、いかに現代のライフスタイルに合った"飲用価値"を提供できるかにあります。</p>
                            </div>
                            <div class="card">
                                <div class="card-header">戦略的提言</div>
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item"><strong>ターゲットを絞った製品開発:</strong> 中高年層向けには伝統と信頼性を強調した高機能製品を、若年層向けには低アルコールで飲みやすいカクテルベースのような入門製品を開発し、ポートフォリオを多様化する。</li>
                                    <li class="list-group-item"><strong>デジタルマーケティングの強化:</strong> ECサイトでの販売を強化するとともに、SNSを活用して健康に関する情報発信や、多様な飲み方レシピの提案を行い、消費者とのエンゲージメントを高める。</li>
                                    <li class="list-group-item"><strong>透明性とストーリーテリング:</strong> 原料（高麗人参の種類や産地）や製造工程の情報を積極的に開示することで、製品への信頼と付加価値を高める。特にクラフトブランドにとっては重要な戦略となる。</li>
                                </ul>
                            </div>
                        </section>
                    </main>
                </div>

                <script>
                    document.addEventListener('DOMContentLoaded', function () {
                        // Chart.js - Consumer Spending Pie Chart
                        const consumerSpendingCtx = document.getElementById('consumerSpendingChart').getContext('2d');
                        new Chart(consumerSpendingCtx, {
                            type: 'pie',
                            data: {
                                labels: ['45歳以上層の健康属性酒類への支出', 'その他'],
                                datasets: [{
                                    label: 'アルコール支出割合',
                                    data: [62, 38],
                                    backgroundColor: ['rgba(52, 152, 219, 0.8)', 'rgba(189, 195, 199, 0.7)'],
                                    borderColor: ['#3498db', '#bdc3c7'],
                                    borderWidth: 2
                                }]
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' },
                                    title: { display: true, text: '45歳以上消費者のアルコール支出構成', font: { size: 16 } },
                                    tooltip: { callbacks: { label: (c) => c.label + ': ' + c.raw + '%' } }
                                }
                            }
                        });

                        // Chart.js - Market Structure Radar Chart
                        const marketStructureCtx = document.getElementById('marketStructureChart').getContext('2d');
                        new Chart(marketStructureCtx, {
                            type: 'radar',
                            data: {
                                labels: ['ブランド認知度', '価格', '風味の現代性', '伝統・信頼性', '入手容易性'],
                                datasets: [
                                    { label: '養命酒製造', data: [9, 6, 8, 9, 9],
                                      backgroundColor: 'rgba(52, 152, 219, 0.2)', borderColor: 'rgba(52, 152, 219, 1)', pointBackgroundColor: 'rgba(52, 152, 219, 1)' },
                                    { label: '輸入ブランド(韓国系)', data: [6, 7, 5, 8, 7],
                                      backgroundColor: 'rgba(231, 76, 60, 0.2)', borderColor: 'rgba(231, 76, 60, 1)', pointBackgroundColor: 'rgba(231, 76, 60, 1)' },
                                    { label: '地方・クラフトブランド', data: [4, 9, 6, 7, 4],
                                      backgroundColor: 'rgba(46, 204, 113, 0.2)', borderColor: 'rgba(46, 204, 113, 1)', pointBackgroundColor: 'rgba(46, 204, 113, 1)' }
                                ]
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    title: { display: true, text: '市場プレイヤー競合ポジショニング分析', font: { size: 16 } }
                                },
                                scales: { r: { beginAtZero: true, max: 10, ticks: { stepSize: 2 } } }
                            }
                        });
                    });
                <\/script>
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"></script>
            </body>
            </html>
        `;
        
        reportWindow.document.write(reportContentHTML);
        reportWindow.document.close();
    }

    // --- 事件监听器 ---

    // 1. 首页免费体验按钮
    if (freeReportBtn) {
        freeReportBtn.addEventListener('click', () => {
            if (!topicInput || topicInput.value.trim() === '') {
                alert('请输入一个行业或产品名称！');
                return;
            }
            generateFreeReport(topicInput.value.trim());
        });
    }

    // 2. 服务页付费按钮
    if (paidReportBtn) {
        paidReportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(paymentModal);
        });
    }

    // 3. 支付弹窗 "我已支付" 按钮
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', () => {
            closeModal(paymentModal);
            openModal(missionControlModal); // 打开任务指令界面
        });
    }

    // 4. 【已修改】任务指令界面 "生成报告" 按钮
    if (executeMissionBtn) {
        executeMissionBtn.addEventListener('click', () => {
            const mission = missionInput ? missionInput.value.trim() : '日本电动汽车市场'; // 默认使用我们的研究课题
            if (mission === '') {
                alert('请输入您的报告任务！');
                return;
            }
            
            const reportWindow = window.open('', '_blank');
            if (!reportWindow) {
                alert('您的浏览器阻止了弹出窗口。请允许本站点的弹出窗口后重试。');
                return;
            }
            reportWindow.document.write('<h1><i class="fas fa-cog fa-spin"></i> 正在为您生成专属报告，请稍候...</h1><p>AI正在分析实时数据并构建图表，请勿关闭此页面。</p>');

            if(missionForm) missionForm.style.display = 'none';
            if(missionLoader) missionLoader.style.display = 'block';

            setTimeout(() => {
                generateProfessionalReport(mission, reportWindow);
                
                closeModal(missionControlModal);
                if(missionForm) setTimeout(() => missionForm.style.display = 'flex', 300);
                if(missionLoader) missionLoader.style.display = 'none';
                if(missionInput) missionInput.value = '';

            }, 1500); // 缩短延迟用于演示
        });
    }

    // 5. 所有弹窗的关闭按钮
    [paymentModalCloseBtn, missionModalCloseBtn].forEach(btn => {
        if(btn) btn.addEventListener('click', () => {
            closeModal(paymentModal);
            closeModal(missionControlModal);
        });
    });
}); 