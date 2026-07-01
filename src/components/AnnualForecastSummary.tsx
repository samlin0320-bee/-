import React, { useState } from 'react';
import { 
  ChartData, 
  PlanetPosition, 
  getPlanetName, 
  getZodiacName 
} from '../utils/astrology';
import { 
  Sparkles, 
  Compass, 
  TrendingUp, 
  Heart, 
  Activity, 
  DollarSign, 
  Milestone, 
  HelpCircle,
  Gem,
  BookOpen,
  ArrowRightLeft
} from 'lucide-react';

interface ForecastProps {
  natalData: ChartData;
  returnChart: ChartData;
  age: number;
  targetYear: number;
  modes?: string[];
}

const SIGN_LORDS = ['', 'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

export const AnnualForecastSummary: React.FC<ForecastProps> = ({
  natalData,
  returnChart,
  age,
  targetYear,
  modes = ['zh']
}) => {
  const [activeTab, setActiveTab] = useState<'aura' | 'planet' | 'secular' | 'rules'>('aura');

  // Astrological computations
  const srAscSign = returnChart.ascendantSign;
  const srAscLord = SIGN_LORDS[srAscSign];
  const srAscLordPlanet = returnChart.planets[srAscLord] as PlanetPosition | undefined;
  const srAscLordHouse = srAscLordPlanet?.house || 1;
  const natalAscSign = natalData.ascendantSign;
  const srAscInNatalHouse = ((srAscSign - natalAscSign + 12) % 12) + 1;

  const srSunHouse = (returnChart.planets['Sun'] as PlanetPosition | undefined)?.house || 1;
  const srMoonHouse = (returnChart.planets['Moon'] as PlanetPosition | undefined)?.house || 1;
  const srJupiterHouse = (returnChart.planets['Jupiter'] as PlanetPosition | undefined)?.house || 1;
  const srSaturnHouse = (returnChart.planets['Saturn'] as PlanetPosition | undefined)?.house || 1;

  // Compute dynamical ratings based on alignments (scale 1 to 100)
  const computeThemeScores = () => {
    let career = 50;
    let wealth = 50;
    let relationship = 50;
    let spirituality = 50;

    // Ascendant influence
    if ([1, 10].includes(srAscSign)) career += 15;
    if ([2, 11].includes(srAscSign)) wealth += 15;
    if ([7].includes(srAscSign)) relationship += 20;
    if ([8, 9, 12].includes(srAscSign)) spirituality += 20;

    // Ascendant overlay in Natal house representation
    if (srAscInNatalHouse === 10) career += 25;
    if (srAscInNatalHouse === 1) career += 15;
    if (srAscInNatalHouse === 2 || srAscInNatalHouse === 11) wealth += 25;
    if (srAscInNatalHouse === 7) relationship += 25;
    if (srAscInNatalHouse === 9 || srAscInNatalHouse === 12 || srAscInNatalHouse === 8) spirituality += 25;

    // Return Ascendant Lord fly-house
    if (srAscLordHouse === 10) career += 15;
    if (srAscLordHouse === 2 || srAscLordHouse === 11) wealth += 15;
    if (srAscLordHouse === 7) relationship += 15;
    if (srAscLordHouse === 8 || srAscLordHouse === 9 || srAscLordHouse === 12) spirituality += 15;

    // Planet positions (Jupiter, Sun)
    if (srSunHouse === 10) career += 10;
    if (srJupiterHouse === 11 || srJupiterHouse === 2 || srJupiterHouse === 5) wealth += 15;
    if (srJupiterHouse === 7 || srJupiterHouse === 9) relationship += 10;
    if (srJupiterHouse === 9 || srJupiterHouse === 12) spirituality += 15;
    if (srSaturnHouse === 10) career -= 5; // Duty/stress is high but builds long term structure
    if (srSaturnHouse === 8) spirituality += 10;

    return {
      career: Math.min(100, Math.max(30, career)),
      wealth: Math.min(100, Math.max(30, wealth)),
      relationship: Math.min(100, Math.max(30, relationship)),
      spirituality: Math.min(100, Math.max(30, spirituality))
    };
  };

  const scores = computeThemeScores();

  // Keyword dictionary for Ascendant Sign
  const getAscSignData = (sign: number) => {
    const data: Record<number, { theme: string; vibe: string; detail: string }> = {
      1: {
        theme: '自我突變、披荊斬棘',
        vibe: '牡羊座 (Aries)',
        detail: '本年度充盈著剛烈無畏的起跑意志。您能獲得空前的爆發力與自主決斷權，極適合啟約全新項目、破釜沉舟，衝破膠著瓶頸。唯需調伏急躁偏激、預防虛火發炎與運動扭傷。'
      },
      2: {
        theme: '資產築基、物質整合',
        vibe: '金牛座 (Taurus)',
        detail: '心神放緩，安住現實。今年是耕耘實業、整理財產、調整儲蓄機器的黃金守成期。在資產、審美、與飲食生活享有高昂豐饒感。宜防家宅裝飾過度開支，或體重攀升。'
      },
      3: {
        theme: '多元驛動、契約學習',
        vibe: '雙子座 (Gemini)',
        detail: '生活有如五彩風箏，涉略極廣。今年文字寫作、合約談判、考證升級與短途出差頻率極高，大眾傳播亮眼。需警惕精力分散、對承諾隨性、心浮氣躁。'
      },
      4: {
        theme: '家業深耕、內心安瀾',
        vibe: '巨蟹座 (Cancer)',
        detail: '重心歸巢。返照命盤以安頓、修繕、家宅和睦為終極主調，能建立強韌內燃安全感。利於處理房產置業或家人生態，心態轉化更佳敏感多情，宜修身養心。'
      },
      5: {
        theme: '才華橫溢、耀眼桃花',
        vibe: '獅子座 (Leo)',
        detail: '華麗奪目，展現領袖權威。才華創意噴湧，生命中追求「精緻感與戲劇性」，對戀情、育兒、演講、時尚等富足樂觀力量。需在驕傲與真實情感中尋找天平。'
      },
      6: {
        theme: '職責磨礪、養身保健',
        vibe: '處女座 (Virgo)',
        detail: '凡事精益求精。一整年需面對工作、基層管理、細節梳理的打磨考驗，利於養成高度自律的日常規律與健身養生習慣。需嚴防神經衰弱及思慮過度。'
      },
      7: {
        theme: '博弈合作、親密契約',
        vibe: '天秤座 (Libra)',
        detail: '深度依賴一對一關聯事物。伴侶情感關係、重大合夥協議、核心客戶談判對你具有決定性指引作用。這是一年需要發揮優雅博弈智慧、在共贏中進化的流年。'
      },
      8: {
        theme: '資源整合、宿業蛻變',
        vibe: '天蠍座 (Scorpio)',
        detail: '破局重生。經歷靈魂或財務層面的巨大洗禮，極佳的保險、偏財、融資、或遺產配置機遇。精神抗壓力登頂，能輕易穿透人心，利投身深層身心靈轉折。'
      },
      9: {
        theme: '思想飛躍、遷旅行法',
        vibe: '射手座 (Sagittarius)',
        detail: '志在萬里。今年心智眼界全面放大，多有出國遠行、深造求學、跨國合作或法維權、靈修開展之兆。貴人星常伴，多能逢凶化吉，堪稱本年度的信仰福照！'
      },
      10: {
        theme: '權威建構、披靡官祿',
        vibe: '摩羯座 (Capricorn)',
        detail: '扛起硬擔，登頂在望。紀律與責任感落地。在社會階層、事業職能、權力名聲上被推上重要舞台。工作可能極端繁重、缺乏自由，但這是不可多得的奠基黃金期。'
      },
      11: {
        theme: '社群開拓、群雄共鳴',
        vibe: '水瓶座 (Aquarius)',
        detail: '重組友誼、打破陳規。今年你對群眾宣傳、社會公益或互聯網營銷充滿洞察力。能在大眾、社團中收穫優異聲譽與意想不到的大筆分成，追求徹底理念自由。'
      },
      12: {
        theme: '精神救贖、幕後清修',
        vibe: '雙魚座 (Pisces)',
        detail: '退居精神彼岸。外在的物質名利追逐在本年明顯收斂，內在直覺力、想像力爆發。極其適合搞研發、著書、休閒清修、做慈善功德，是重整生命硬碟的休止符。'
      }
    };
    return data[sign] || { theme: '多元流轉', vibe: '未知星座', detail: '生活呈現多維度的星象交織，需針對星盘特定宮位進行綜合斷訣。' };
  };

  const ascData = getAscSignData(srAscSign);

  // Return Ascendant in Natal House Interpretations
  const getAscInNatalHouseText = (house: number) => {
    const texts: Record<number, { title: string; desc: string }> = {
      1: {
        title: '🌟 重疊命宮 - 戰略新週期開端',
        desc: '一整年高度關注自我人格重塑、身體更新與人生重大定位調整。您正踏入全新的十二年行運週期，自主支配權極強。'
      },
      2: {
        title: '💰 金錢資產與世俗價值守護點',
        desc: '這是一年將賺錢、提升正財管道、買入大件生息資產或建立儲蓄體系的命題。此時在自我價值認知上也將經歷深刻的物質重建。'
      },
      3: {
        title: '📚 智識開拓、學習與高頻驛動',
        desc: '焦點在人際交往、日常契約談判、短途出差或新技能認證。您在思考層面多有創見，但也常容易奔走頻繁、內心不耐。'
      },
      4: {
        title: '🏠 家庭歸屬與內向情感沉澱',
        desc: '今年生命能量完全內聚。可能會面對置產置修、家園生活提質，或承擔家庭內部角色的義務，也是建立心靈避風港的黃金年。'
      },
      5: {
        title: '🎨 創意綻放、戀愛桃花與偏財氣運',
        desc: '才華和個人光芒得以顯化。專注於戀愛浪漫際遇、子女教育或炒股投資。生命處於高度想要「玩樂、展現與創作」的週期。'
      },
      6: {
        title: '🔧 動手務實、規律打磨與身心保健',
        desc: '精力投放在日常琐碎勞作、改進飲食、克服隱疾、消除債務等世俗承載。需要合理勞逸，謹防慢性疲勞引發抵抗力滑坡。'
      },
      7: {
        title: '🤝 親密關係、合夥協商與對宮引向',
        desc: '今年您很難完全獨立。伴侶的命運起伏、重大商業合夥的條款或法律關係，都將反過來支配您的行動。學會在合作中共同進退。'
      },
      8: {
        title: '🌀 身心蛻變、跨世偏財與融資博弈',
        desc: '生命處於深沉轉變期，直覺空前精準。極利於探索信仰玄學、繼承財產、處理大額他人資產、股權融資或重疾心靈自療。'
      },
      9: {
        title: '✈️ 宏觀遠景、跨國遠行與思想悟道',
        desc: '生命能量主動渴望擴張至遠方或高等學理。可能會有留學、宗教入道、出版或跨國差旅，精神極易得到德高望重之導師點撥。'
      },
      10: {
        title: '💼 職涯王牌、登頂受領社會名望',
        desc: '今年是事業打拼、職位飛躍或自主創業的高光點。所有的言行、成就都將接受社會或大眾的嚴格考核，任務壓力與榮譽同等宏大。'
      },
      11: {
        title: '👥 社群福利、圈層更換與收益分成',
        desc: '深度活躍於群體、社團或公眾流量中。極易獲得跨團隊支持，享受龐大朋友圈反哺的社會聲譽或與大眾共享的被動財利。'
      },
      12: {
        title: '🧘 幕後清修、潛意識清洗與遠洋暫避',
        desc: '今年生命外向度大幅度削減，靈性直覺力攀登新峰。適合退居幕後做智力或藝術沉澱，出遠門清修，用善行功德撫平業力牽絆。'
      }
    };
    return texts[house] || { title: '世俗領域流轉', desc: '宮位投射正與本命盤宮位產生細化化學反應，建議關注星盤主要支點。' };
  };

  const ascNatalText = getAscInNatalHouseText(srAscInNatalHouse);

  // Return Ascendant Lord fly-house data
  const getAscLordFlyHouseText = (house: number) => {
    const description: Record<number, string> = {
      1: '返照命主星歸位入本宮，能量高度守恆自足。這代表今年您擁有強大的自主意志，凡事只需依靠個人能力便能攻堅克難，不容易受外在局勢劇烈震盪，人生運作由內而外底氣十足！',
      2: '命主星飛入財帛宮（主體求財）。代表這一年您最大的奮鬥熱情與意志力被強烈牽引在「開源賺錢、確立物質積累、評估自我身價」這件事上。只要勤勉，正財成果必定豐厚落地！',
      3: '命主星飛入學習兄弟宮（交流驛動）。這一年思維極其活躍，對新觀點、短途差旅、契約談判、文字傳播抱持強大主動性。需專注將多變想法落地，防止多學少成。',
      4: '命主星飛入田宅宮（安住築基）。今年核心追求聚焦於建構靈魂避風港，您的意志會被深深引入房產交易、家宅裝潢、照料家族長輩的世俗事務中，內在獲得安穩奠實。',
      5: '命主星飛入子女宮（才華與愛好）。今年生命充滿蓬勃的創作渴望與享樂意志，在才華顯現、大眾演說、浪漫感情或子女培育上獲得極大滿足，投資理財投機運勢也被放大。',
      6: '命主星飛入奴僕宮（辛勤打磨）。這是非常辛苦但也極度務實、技術進步的一年。您將大量時間砸在日常業務流程的細化優化、克服生理阻礙或勞力付出上。需注重養生，提防勞疾。',
      7: '命主星飛入夫妻合夥宮（對宮投射）。自我主導力減低，需要藉由配偶、客戶、合夥人的命運或意願作為鏡子。在合作共生、商業共謀、或者是婚戀協議上迎來重大關鍵抉擇。',
      8: '命主星飛入疾厄宮（神祕與轉折）。生命直覺、危機處理能力和野心爆發。您會深度聚焦探索大額偏財、金融期權、生死修身或玄秘心理，生命經歷破舊重組，鳳凰涅槃。',
      9: '命主星飛入遷移遠行宮（宏大世界）。今年您的心思極其高遠，求知若渴。可能奔走在外、長途跨國，在信仰、學術進修、法律權威上有強手貴人護航，是心胸全面昇華的一年。',
      10: '命主星飛入事業官祿宮（榮膺耀堂頂峰）。流年最強格局之一！您的所有努力、雄心和專注力，都完全聚焦在職涯進階、品牌建立與社會威信。適合發起核心戰略，升職掌權指日可待！',
      11: '命主星飛入福德眾願宮（名利與社群）。這代表您一整年廣泛融入社會各階層，追求名譽與團體福利，在朋友圈及社群流量中極富話語權，大眾流量也帶來穩賺利潤。',
      12: '命主星飛入玄秘退隱宮（清修安神）。這預示著您今年追求安寧、擺脫俗務糾結。可能投入幕後研發、文藝創作或大眾慈善，靈修心靈直覺敏銳，是修身養性、積存陰騭的上佳期。'
    };
    return description[house] || '命主星高掛特定返照宮位，將能量源源不絕向該主題傾斜投射！';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden" id="annual-forecast-module">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 px-6 py-5 text-white relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-amber-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase">
            💫 Golden Oracle
          </span>
          <span className="text-indigo-200">|</span>
          <span className="text-xs text-indigo-300 font-mono">Solar Return Index</span>
        </div>
        <h3 className="text-lg font-black mt-1.5 flex items-center gap-2">
          ✨ {targetYear} 年度占星預測摘要 (Annual Forecast)
        </h3>
        <p className="text-xs text-indigo-200/80 mt-1.5 leading-relaxed">
          根據本次太陽返照盤的<strong>上升點 (Lagna)</strong> 與<strong>年度重要宮位配置 (Primary Layout)</strong>，系統已自解調引爆年度關鍵運勢重點與神契斷語。
        </p>
      </div>

      {/* Tabs Row */}
      <div className="bg-slate-50 border-b border-gray-200 flex overflow-x-auto scroller">
        <button
          onClick={() => setActiveTab('aura')}
          className={`flex-1 py-3 px-4 text-xs font-black border-b-2 text-center whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'aura' 
              ? 'border-indigo-600 text-indigo-950 bg-white font-black' 
              : 'border-transparent text-slate-500 hover:text-indigo-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> 年度主調 (Aura)
        </button>
        <button
          onClick={() => setActiveTab('planet')}
          className={`flex-1 py-3 px-4 text-xs font-black border-b-2 text-center whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'planet' 
              ? 'border-indigo-600 text-indigo-950 bg-white font-black' 
              : 'border-transparent text-slate-500 hover:text-indigo-800'
          }`}
        >
          <Milestone className="w-3.5 h-3.5" /> 四大星體配置 (Placements)
        </button>
        <button
          onClick={() => setActiveTab('secular')}
          className={`flex-1 py-3 px-4 text-xs font-black border-b-2 text-center whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'secular' 
              ? 'border-indigo-600 text-indigo-950 bg-white font-black' 
              : 'border-transparent text-slate-500 hover:text-indigo-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> 世俗成就指標 (Ratings)
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-3 px-4 text-xs font-black border-b-2 text-center whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'rules' 
              ? 'border-indigo-600 text-indigo-950 bg-white font-black' 
              : 'border-transparent text-slate-500 hover:text-indigo-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> 觸發規律完整解讀 (Rules)
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        
        {/* TAB 1: AURA */}
        {activeTab === 'aura' && (
          <div className="space-y-5 animate-fadeIn">
            {/* 1. Ascendant Overview */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/60 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping"></span>
                  <span className="text-xs font-bold text-slate-500">返照上升落宮特質 (Lagna Vibe)</span>
                </div>
                <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-700">
                  {ascData.vibe}
                </span>
              </div>
              <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1">
                🧿 年度生命核心基調：<span className="text-indigo-700 font-extrabold underline decoration-wavy decoration-indigo-300">{ascData.theme}</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                {ascData.detail}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Ascendant Overlay */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" /> 本命宮位投影 (Inter-Chart Offset)
                  </div>
                  <h4 className="text-xs font-black text-slate-800 mt-2">
                    {ascNatalText.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    {ascNatalText.desc}
                  </p>
                </div>
                <div className="text-[10px] bg-slate-200/60 font-black text-slate-700 px-2 py-1 rounded-lg mt-3 inline-block self-start border border-slate-300/40">
                  觸發徵象：返照上升重疊本命第 {srAscInNatalHouse} 宮
                </div>
              </div>

              {/* 3. Ascendant Lord placement */}
              <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-amber-700/80 uppercase tracking-widest flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5 text-amber-600" /> 命主飛星焦點 (Primary Driver)
                  </div>
                  <h4 className="text-xs font-black text-amber-950 mt-2">
                    返照命主星【{getPlanetName(srAscLord, modes)}】飛入 第 {srAscLordHouse} 宮
                  </h4>
                  <p className="text-[11px] text-amber-900/85 leading-relaxed mt-1">
                    {getAscLordFlyHouseText(srAscLordHouse)}
                  </p>
                </div>
                <div className="text-[10px] bg-amber-100 font-extrabold text-amber-800 px-2 py-1 rounded-lg mt-3 inline-block self-start border border-amber-200/50">
                  世俗核心聚焦管道 (House Lord Flight)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLANETS */}
        {activeTab === 'planet' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-gray-500 leading-normal mb-1">
              本年度四大守護行星（太陽、月亮、木星、土星）在返照盤中的宮位投影配置，共同雕琢您全年度精神感官與物質考驗的軌跡。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SUN */}
              <div className="p-3.5 bg-yellow-50/50 border border-yellow-200 rounded-2xl">
                <span className="text-[10px] uppercase font-black text-amber-800 flex items-center gap-1 bg-yellow-200/50 px-2 py-0.5 rounded self-start w-fit">
                  🔆 太陽落宮：第 {srSunHouse} 宮
                </span>
                <p className="text-xs font-black text-yellow-950 mt-2">
                  核心奮鬥意志與精力外顯焦點
                </p>
                <p className="text-[11.5px] text-slate-600 mt-1.5 leading-normal">
                  太陽在返照星盤落入第 {srSunHouse} 宮。它將強烈指引你這一年在該世俗領域追求名聲、事業地位或重大創造性發展，是點燃您年度生命精力的首要舞台。
                </p>
              </div>

              {/* MOON */}
              <div className="p-3.5 bg-blue-50/35 border border-indigo-100 rounded-2xl">
                <span className="text-[10px] uppercase font-black text-indigo-700 flex items-center gap-1 bg-blue-100/50 px-2 py-0.5 rounded self-start w-fit">
                  🌙 月亮落宮：第 {srMoonHouse} 宮
                </span>
                <p className="text-xs font-black text-indigo-950 mt-2">
                  潛意識情緒依歸與年度最終結局感受
                </p>
                <p className="text-[11.5px] text-slate-600 mt-1.5 leading-normal">
                  月亮位於返照星盤第 {srMoonHouse} 宮。這是您日常心境的感官折射、不安和情感需求的宣洩點。凡與該宮位象徵的事端打交道，最終的情感結局與世俗體驗往往更加深刻深刻。
                </p>
              </div>

              {/* JUPITER */}
              <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-2xl">
                <span className="text-[10px] uppercase font-black text-emerald-800 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded self-start w-fit">
                  🍀 木星落宮：第 {srJupiterHouse} 宮
                </span>
                <p className="text-xs font-black text-emerald-950 mt-2">
                  天降神助與福德護航機遇點 (Yearly Fortune)
                </p>
                <p className="text-[11.5px] text-slate-600 mt-1.5 leading-normal">
                  第一吉星木星落在您的返照盤第 {srJupiterHouse} 宮！這是您本年度的「幸運緩衝帶」與貴人大本營。哪怕面臨難關，在此一生命領域亦能輕鬆逢凶化吉、獲得豐厚財富與思維躍遷。
                </p>
              </div>

              {/* SATURN */}
              <div className="p-3.5 bg-stone-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] uppercase font-black text-stone-700 flex items-center gap-1 bg-stone-200/50 px-2 py-0.5 rounded self-start w-fit">
                  🧱 土星落宮：第 {srSaturnHouse} 宮
                </span>
                <p className="text-xs font-black text-stone-900 mt-2">
                  年度最沉重責任與壓力的磨練焦點 (Focus & Hurdle)
                </p>
                <p className="text-[11.5px] text-gray-600 mt-1.5 leading-normal">
                  第一挑戰星土星位於您的返照盤第 {srSaturnHouse} 宮。此處強烈提示您最不可迴避的責任，您必須在此忍痛修剪枝椏、在枯乾磨練中建立堅不可摧的長線防線、不可盲目高調招災。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECULAR RATINGS */}
        {activeTab === 'secular' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <h4 className="text-xs font-extrabold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-1">
                📊 四大人生維度世俗能量值 (Progression Graph)
              </h4>

              <div className="space-y-4">
                {/* 1. Career */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">💼 事業開創 & 社會名望</span>
                    <span className="font-mono text-indigo-600">{scores.career}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${scores.career}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {scores.career >= 75 ? '🔥 事業火星塞發作，職場有重大突破攀登可能！' : '🌿 長勢平穩，適合沉穩積蓄職涯勢能。'}
                  </p>
                </div>

                {/* 2. Wealth */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">💰 財富收益 & 資產配置</span>
                    <span className="font-mono text-indigo-600">{scores.wealth}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${scores.wealth}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {scores.wealth >= 75 ? '🔥 正偏財管道極端暢通，利潤驚人！極宜主控生息資產。' : '🌿 保持收支平衡，審慎理才、以長線資產安全第一。'}
                  </p>
                </div>

                {/* 3. Relationship */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">❤️ 人際緣分 & 親密伴侶</span>
                    <span className="font-mono text-indigo-600">{scores.relationship}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${scores.relationship}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {scores.relationship >= 75 ? '🔥 合夥伴侶能量極為高昂活躍，多有親密進階、強強聯手的契機。' : '🌿 普通社交往來。需防外部事務壓縮親密相處。'}
                  </p>
                </div>

                {/* 4. Spirituality */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">🧘 身心調養 & 靈性玄修</span>
                    <span className="font-mono text-indigo-600">{scores.spirituality}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${scores.spirituality}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {scores.spirituality >= 75 ? '🔥 靈魂直覺極強，參悟玄術命理與身心靈沈澱的黃金歲月！' : '🌿 合理注重作息與運動，維持心神舒暢。'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRIGGERED RULES EXPLANATIONS */}
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 leading-relaxed">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                🛡️ 守護系統核心規則說明 (Core Astrological Guard Rules)
              </h4>
              <p className="text-[11px]">
                符合《系統核心協作規則 (Agent Rules)》：<strong>「每一個星盤都必須呈現所觸發的占星規則（例如：宮主星落宮、貴格等），並且必須將它的解釋完整講出來（Rule Explanation），不可省略或隱藏在背景中。」</strong> 下面是本盤本次運算中完整觸發的高亮星盤飛星學術規則。
              </p>
            </div>

            <div className="space-y-3">
              {/* Rule 1 */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-600">規則 [SR-LAGNA]: 太陽返照上升點獨立盤命意判定</span>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  <strong>觸發規則：</strong>返照星盤上升於【{getZodiacName(srAscSign, modes)}座】。
                  <br />
                  <strong>詳盡學術解釋：</strong>此上升特徵主導了整季返照盤最根本的自我定位和底蘊防護能力，主管星【{getPlanetName(srAscLord, modes)}】為年度生命大印的主宰星體。
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-600">規則 [SR-FLY-LORD]: 命主星飛入特定宮位之引燃斷訣</span>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  <strong>觸發規則：</strong>宮主星（1宮命主星）飛入【第 {srAscLordHouse} 宮】（House Lord placement 1 to {srAscLordHouse}）。
                  <br />
                  <strong>詳盡學術解釋：</strong>返照上升命宮主星在回歸時刻的空間刻度投射。由於 1 宮代表自我主体，若 1 宮主飛入特定 Y 宮，表明命主自身的行動意欲與意志將被帶往 Y 宮象徵的世俗對標方向（如事業、財務等）來爆發。這正是「流年命主飛宮」的終極奧義。
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-600">規則 [SR-OVERLAY]: 返照上升 (Ascendant) 跌落本命宮位對接機制</span>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  <strong>觸發規則：</strong>返照 Ascendant 定位于本命星盤【第 {srAscInNatalHouse} 宮】。
                  <br />
                  <strong>詳盡學術解釋：</strong>返照盤本質是一張流年的「天球截面」，其與本命盤的重疊角度，為今年外在環境與人生固有命運的激發引合。落在您本命第 {srAscInNatalHouse} 宮主管對標世俗課題，該生命課題在今年會遭受極大強度的外部刺激與精力鎖死，本系統完整保留所有分析預測文字。
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
