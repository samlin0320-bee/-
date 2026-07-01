import React, { useState, useEffect } from 'react';
import { ChartData, getPlanetName, getZodiacName, calculateChart, getDignityName } from '../utils/astrology';
import { getTransitInterpretations, TransitInterpretation } from '../utils/rulesEngine';
import { ArrowRight, Info, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface Props {
  natalData: ChartData;
  modes?: string[];
  onReport?: (date: string) => void;
}

interface EventLog {
  date: Date;
  planet: string;
  type: 'sign_change' | 'retrograde' | 'direct';
  details: string;
  insight?: string;
}

const getTransitInsight = (planet: string, house: number, dignity: string, affectedNatalPlanets: string[]): string => {
  let insight = '';
  const houseMeanings: Record<string, Record<number, string>> = {
    'Jupiter': {
      1: '帶來個人成長與新機遇。', 2: '財運提升，家庭和諧。', 3: '溝通頻繁，旅行運佳。', 4: '內心安定，家庭幸福。',
      5: '創造力強，投資運佳。', 6: '工作環境改善，解決債務。', 7: '婚姻與合作運佳。', 8: '意外收穫或深層轉變。',
      9: '精神提升，長途旅行運。', 10: '事業平步青雲。', 11: '社交圈擴大，願望實現。', 12: '靈性成長，海外機緣。'
    },
    'Saturn': {
      1: '責任重，自我重塑期。', 2: '理財需謹慎。', 3: '多勞多得，耐心溝通。', 4: '家庭壓力，尋求穩定。',
      5: '投機需保守。', 6: '工作辛苦，注意健康。', 7: '關係考驗，需耐力。', 8: '財務或心理的深層轉變。',
      9: '信仰反思，旅行延遲。', 10: '事業壓力大但奠定基礎。', 11: '社交精簡，目標務實。', 12: '因果清理，需安靜反省。'
    }
  };

  if (houseMeanings[planet]?.[house]) insight += houseMeanings[planet][house];
  if (['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity)) insight += ' 星曜狀態極佳，正面效應強烈。';
  else if (dignity === 'Debilitated') insight += ' 星曜受損，需防範相關負面特質。';
  if (affectedNatalPlanets.length > 0) insight += ` 本命連接：${affectedNatalPlanets.join(', ')}。`;
  return insight;
};

export interface EventFactor {
  cause: string;
  impact: number;
  description: string;
}

export const analyzeEventCausality = (
  natalData: ChartData,
  eventDateStr: string,
  eventType: string
) => {
  const tDate = new Date(eventDateStr);
  const tData = calculateChart(tDate, 0, 0, true, 'Lahiri');
  const factors: EventFactor[] = [];
  
  const getTransitHouse = (planetName: string) => {
    const tp = tData.planets[planetName];
    if (!tp) return 1;
    return ((tp.sign - natalData.ascendantSign + 12) % 12) + 1;
  };

  let category = '';
  if (eventType === 'career') {
    category = '💼 事業升遷 / 職業成就發展';
    const jupHouse = getTransitHouse('Jupiter');
    if (jupHouse === 10) {
      factors.push({
        cause: '🌟 流年木星正高掛於本命「第十宮 (事業名望宮)」',
        impact: 92,
        description: '木星代表擴張、好運與社會榮耀。流年木星進駐事業宮，直接注入貴人相助之氣，能大幅排除阻礙，使長官賞識、事業地位晉升。'
      });
    } else if (jupHouse === 11) {
      factors.push({
        cause: '💰 流年木星進入本命「第十一宮 (福德願望宮)」',
        impact: 88,
        description: '十一宮掌管社會資源與最終願望的實現。流年吉星照拂，代表與團隊社群合作順暢，因他人提攜而獲得意想不到的事業好運與機緣。'
      });
    } else if (jupHouse === 1) {
      factors.push({
        cause: '🌟 流年木星飛臨「第一宮 (命宮)」重啟生命輪廓',
        impact: 84,
        description: '木星入命，為人生注入全新的信心與自我實現動能，往往伴隨著主動開啟新事業版圖或承接更重要角色的機緣。'
      });
    }

    const satHouse = getTransitHouse('Saturn');
    if (satHouse === 10) {
      factors.push({
        cause: '🪐 流年土星碾壓本命「第十宮 (事業考驗與基石宮)」',
        impact: 95,
        description: '土星在此雖然會帶來極大工作量與高壓，但卻是「奠定長期事業聲譽」最關鍵的考核期。此時的晉升往往伴隨著沈甸甸的責任。'
      });
    } else if (satHouse === 11) {
      factors.push({
        cause: '🪐 流年土星嚴審本命「第十一宮 (群眾資源宮)」',
        impact: 65,
        description: '重塑了您在業界的影響力與朋友圈，雖然人際圈面臨精簡，但留下來的都是穩固而務實的長期合作關係。'
      });
    }

    const rahuHouse = getTransitHouse('Rahu');
    if (rahuHouse === 10) {
      factors.push({
        cause: '🌀 流年羅睺進入「第十宮 (非傳統突破之宮)」',
        impact: 90,
        description: '羅睺主掌執念、顛覆與不守常規的突破。流年羅睺進入事業宮，會引發極強烈改變現狀的野心，帶來戲劇化或爆發性的破格拔擢。'
      });
    }

    const sunHouse = getTransitHouse('Sun');
    if (sunHouse === 10 || sunHouse === 11 || sunHouse === 1) {
      factors.push({
        cause: '☀️ 流年太陽進入本命強勢宮位 (第1/10/11宮) 帶來聚光燈',
        impact: 70,
        description: '太陽運行至關鍵宮位，使個人才華與表現力在公眾場合或職場中被高度看見，是自信展現與獲得主導權的黃金期。'
      });
    }
    
    const marsHouse = getTransitHouse('Mars');
    if (marsHouse === 10) {
      factors.push({
        cause: '🔥 流年火星入本命「第十宮 (衝勁與競爭宮)」',
        impact: 75,
        description: '火星在此處能提供排山倒海的執行力與開疆闢土的勇氣，但需注意在權力鬥爭中過於強勢所引發的口舌糾紛。'
      });
    }
  } else if (eventType === 'wealth') {
    category = '💰 意外進財 / 重大投資獲利';
    const jupHouse = getTransitHouse('Jupiter');
    if (jupHouse === 2) {
      factors.push({
        cause: '🌟 流年木星恩寵本命「第二宮 (財帛蓄水池宮)」',
        impact: 96,
        description: '木星流年駐留財帛宮是古典吠陀占星中極吉利的水星進財格局，象徵個人正財收入增加、資產評估大幅度上漲。'
      });
    } else if (jupHouse === 11) {
      factors.push({
        cause: '💰 流年木星進入本命「第十一宮 (福德意外收益宮)」',
        impact: 92,
        description: '十一宮為強烈的「進財、大財、大收益」之宮。木星流經此處，代表能透過社群網路、大宗投資或商業模式獲得高額回報。'
      });
    } else if (jupHouse === 5) {
      factors.push({
        cause: '🎭 流年木星進入本命「第五宮 (投機好運與智慧宮)」',
        impact: 86,
        description: '五宮與偏財、股票、投資、彩券等運氣息息相關。木星照耀此宮，將極大提升個人的直覺判斷力，有極強的投機偏財運。'
      });
    }

    const venHouse = getTransitHouse('Venus');
    if (venHouse === 2 || venHouse === 11 || venHouse === 5) {
      factors.push({
        cause: '🌸 流年金星飛臨本命財富宮位 (第2/5/11宮)',
        impact: 75,
        description: '金星乃大吉星且掌管財富與舒適。流年金星在這些宮位帶來了和諧順利、物質奢華與輕鬆得財的好運道。'
      });
    }

    const mercHouse = getTransitHouse('Mercury');
    if (mercHouse === 2 || mercHouse === 11) {
      factors.push({
        cause: '⚡ 流年水星交會本命財富中樞',
        impact: 68,
        description: '水星代表商業頭腦、簽署合同與智慧理財。水星流經此處，極有利於談成合約、股票短期操作或依靠敏捷思考賺取佣金。'
      });
    }

    const rahuHouse = getTransitHouse('Rahu');
    if (rahuHouse === 11) {
      factors.push({
        cause: '🌀 流年羅睺進入「第十一宮 (暴發暴利宮)」',
        impact: 89,
        description: '羅睺象徵巨大的欲望與非正常突破。在第十一宮，它通常會帶來突如其來、甚至不合常理的爆發性高額進帳。'
      });
    }
  } else if (eventType === 'relationship') {
    category = '💑 結婚成家 / 浪漫桃花降臨';
    const jupHouse = getTransitHouse('Jupiter');
    if (jupHouse === 7) {
      factors.push({
        cause: '🌟 流年木星進入本命「第七宮 (夫妻合夥宮)」',
        impact: 98,
        description: '此乃吠陀占星學中「神聖婚盟」的最經典指標！木星正位進入夫妻宮，會極大催化穩定的婚盟意願、遇到靈魂伴侶，或與愛人攜手成家。'
      });
    } else if (jupHouse === 5) {
      factors.push({
        cause: '🌸 流年木星照耀「第五宮 (浪漫戀愛宮)」',
        impact: 92,
        description: '五宮掌管心動、浪漫與純愛。木星駐紮此宮，往往代表被熱烈追求、陷入甜蜜戀情，或此時容易擁有子嗣、奉子成婚。'
      });
    } else if (jupHouse === 1) {
      factors.push({
        cause: '🌟 流年木星飛臨「第一宮 (命宮)」七宮互照',
        impact: 85,
        description: '木星在命宮會以 180 度直接投影到第七宮。這同樣極大地照拂了伴侶關係，讓雙方心靈相通，減少誤會。'
      });
    }

    const venHouse = getTransitHouse('Venus');
    if (venHouse === 7) {
      factors.push({
        cause: '🌸 流年金星正進入本命「第七宮 (親密關係宮)」',
        impact: 88,
        description: '金星本身就是代表愛與美的「天然夫妻主星 (Karaka)」。流年金星回歸夫妻宮，使彼此相處充滿甜蜜與浪漫引力。'
      });
    } else if (venHouse === 1) {
      factors.push({
        cause: '🌸 流年金星飛臨「第一宮 (命宮)」散發個人魅力',
        impact: 78,
        description: '金星照拂自我外貌與吸引力，使您氣場溫柔和諧，非常容易吸引身邊異性關注，是桃花盛開的最佳時節。'
      });
    }

    const rahuHouse = getTransitHouse('Rahu');
    if (rahuHouse === 7) {
      factors.push({
        cause: '🌀 流年羅睺進入「第七宮 (狂熱迷戀宮)」',
        impact: 80,
        description: '羅睺在夫妻宮往往引發極其強烈的、宿命般的著迷與吸引力。有機會開啟跨國、跨文化或充滿激情的不尋常戀情。'
      });
    }
  } else if (eventType === 'health') {
    category = '🏥 身體微恙 / 突發手術 / 健康危機';
    const satHouse = getTransitHouse('Saturn');
    if (satHouse === 8) {
      factors.push({
        cause: '🪐 流年土星碾壓本命「第八宮 (疾厄死亡宮 / 慢性磨難)」',
        impact: 96,
        description: '第八宮乃深度磨難與隱疾之宮。土星在此運位盤踞，往往會引發潛藏慢性病的爆發、精神緊繃甚至因過度勞累引發筋骨、牙齒或脾臟問題。'
      });
    } else if (satHouse === 6) {
      factors.push({
        cause: '🪐 流年土星進入本命「第六宮 (疾病與日常勞碌宮)」',
        impact: 82,
        description: '土星代表限制、退化與壓力。在第六宮會顯著拉低免疫系統抗性，此時應提防工作過度導致的積勞成疾。'
      });
    } else if (satHouse === 12) {
      factors.push({
        cause: '🪐 流年土星進入「第十二宮 (醫院與隔離修養宮)」',
        impact: 87,
        description: '此運位容易出現睡眠障礙、神經衰弱，或需要安排住院檢查與修養，屬於因果反思與身體重整期。'
      });
    }

    const ketuHouse = getTransitHouse('Ketu');
    if (ketuHouse === 8) {
      factors.push({
        cause: '🌀 流年計都進入本命「第八宮 (突發性疾厄與隱秘宮)」',
        impact: 94,
        description: '計都代表突發事件、切割與神秘力量。流年計都在第八宮是極需注意手術、突發出血或診斷不明的「神秘性急性健康波動」。'
      });
    } else if (ketuHouse === 1) {
      factors.push({
        cause: '🌀 流年計都直接入駐「第一宮 (命宮 / 體質)」',
        impact: 84,
        description: '計都入命，會削弱肉體自我保護的元氣，使人容易神情倦怠、免疫力低下、或因注意力不集中引發小意外。'
      });
    }

    const marsHouse = getTransitHouse('Mars');
    if (marsHouse === 8) {
      factors.push({
        cause: '🔥 流年火星橫掃「第八宮 (突發手術與創傷之宮)」',
        impact: 90,
        description: '火星主宰刀傷、血液、發炎與手術。流年火星在此宮位極易伴隨突發性的創傷、急性出血或不得不進行的手術切除治療。'
      });
    } else if (marsHouse === 6) {
      factors.push({
        cause: '🔥 流年火星火燒「第六宮 (急性發炎與意外感染宮)」',
        impact: 78,
        description: '易有發燒、發炎、外傷、肌肉拉傷或免疫系統失調引起的急性症狀，此時切忌作作息失調與劇烈運動。'
      });
    }
  } else {
    category = '⚡ 突發意外衝突 / 行動受阻 / 口舌爭執';
    const marsHouse = getTransitHouse('Mars');
    if (marsHouse === 3) {
      factors.push({
        cause: '🔥 流年火星火燒「第三宮 (口舌爭執與競爭宮)」',
        impact: 88,
        description: '火星在第三宮會使人溝通語氣極具攻擊性，極易因一時衝動頂撞上司、與親友同事發生激烈爭論，甚至遭遇交通違規罰單。'
      });
    }
    const ketuHouse = getTransitHouse('Ketu');
    if (ketuHouse === 3) {
      factors.push({
        cause: '🌀 流年計都進入「第三宮 (通訊障礙與誤會之宮)」',
        impact: 78,
        description: '極易遭遇通訊設備故障、信件丟失，或言語表達被嚴重誤解而造成的無謂口舌。'
      });
    }
    const rahuHouse = getTransitHouse('Rahu');
    if (rahuHouse === 3) {
      factors.push({
        cause: '🌀 流年羅睺進入「第三宮 (狂熱表達與冒險宮)」',
        impact: 82,
        description: '激發了極強的表達欲與冒險念頭，但也容易說出過於誇張的話，引發公眾是非。'
      });
    }
  }

  if (factors.length === 0) {
    factors.push({
      cause: '🌙 月相盈虧與日常天體引力轉化',
      impact: 50,
      description: '事件在此時發生主要是受更短週期的星曜如水星逆行或金星相位影響，多引導起微幅情緒起落。'
    });
  }

  const sorted = [...factors].sort((a, b) => b.impact - a.impact);
  const topCauses = sorted.slice(0, 3);
  while (topCauses.length < 3 && sorted.length > topCauses.length) {
    topCauses.push(sorted[topCauses.length]);
  }

  const top1 = topCauses[0]?.cause || '常規天體引力';
  const verdict = `根據印占古法 Lahiri 星盤運轉解析：在此事件發生日 (${eventDateStr})，您星盤中最關鍵的核心感應為「${top1}」。此能量與您本命星盤產生了極強烈的相位共振與引力交會，構成了此事件最主要的催化主力矩。結合流年星曜的尊貴度分析，建議積極應對流年星曜的特定考驗，以平衡內在磁場。`;

  return {
    category,
    topCauses,
    fullVerdict: verdict
  };
};

const TransitsEventLog: React.FC<Props> = ({ natalData, modes = ['zh'], onReport }) => {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);
  const [transitData, setTransitData] = useState<ChartData | null>(null);
  const [interpretations, setInterpretations] = useState<TransitInterpretation[]>([]);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>(['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Chiron']);

  // 智能事件分析器狀態
  const [eventTypeName, setEventTypeName] = useState('career');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [eventAnalysisResult, setEventAnalysisResult] = useState<any>(null);

  const handleAnalyzeEvent = () => {
    const res = analyzeEventCausality(natalData, eventDate, eventTypeName);
    setEventAnalysisResult(res);
  };

  useEffect(() => {
    const tData = calculateChart(new Date(analysisDate), 0, 0, true, 'Lahiri');
    setTransitData(tData);
    setInterpretations(getTransitInterpretations(natalData, tData, modes));
  }, [analysisDate, natalData]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const newEvents: EventLog[] = [];
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      let prevPos: Record<string, { sign: number, isRetrograde: boolean }> = {};
      const initialChart = calculateChart(new Date(startDate.getTime() - 86400000), 0, 0, true, 'Lahiri');
      
      selectedPlanets.forEach(p => {
        if (initialChart.planets[p]) {
          prevPos[p] = { sign: initialChart.planets[p].sign, isRetrograde: initialChart.planets[p].isRetrograde };
        }
      });

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 2)) {
        const current = calculateChart(d, 0, 0, true, 'Lahiri');
        selectedPlanets.forEach(p => {
          const cp = current.planets[p];
          if (!cp || !prevPos[p]) return;
          if (cp.sign !== prevPos[p].sign) {
            const house = ((cp.sign - natalData.ascendantSign + 12) % 12) + 1;
            const affected: string[] = [];
            Object.entries(natalData.planets).forEach(([nk, np]: [string, any]) => {
              if (np.sign === cp.sign) affected.push(`${getPlanetName(nk, modes)}(合相)`);
            });
            newEvents.push({
              date: new Date(d), planet: p, type: 'sign_change',
              details: `入 ${getZodiacName(cp.sign, modes)} (${house}宮)`,
              insight: getTransitInsight(p, house, getDignityName(cp.dignity), affected)
            });
          }
          if (cp.isRetrograde !== prevPos[p].isRetrograde) {
            newEvents.push({
              date: new Date(d), planet: p, type: cp.isRetrograde ? 'retrograde' : 'direct',
              details: `${cp.isRetrograde ? '逆行' : '順行'}於 ${getZodiacName(cp.sign, modes)}`
            });
          }
          prevPos[p] = { sign: cp.sign, isRetrograde: cp.isRetrograde };
        });
      }
      setEvents(newEvents);
      setLoading(false);
    }, 100);
  }, [year, natalData, selectedPlanets, modes]);

  return (
    <div className="space-y-8 pb-20 text-left">
      {/* 📊 智能發生事件深度分析器 */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-500/30 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-4">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">智能發生事件深度分析器</h2>
            <p className="text-xs text-indigo-200/70 mt-0.5">輸入已發生的重大生活事件與日期，智能探勘並分類本命與流年的前三大主引發因果關係</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-indigo-200">選擇事件大類</label>
            <select
              value={eventTypeName}
              onChange={(e) => setEventTypeName(e.target.value)}
              className="w-full bg-slate-800/80 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="career">💼 事業升遷 / 職業成就突破</option>
              <option value="wealth">💰 意外進財 / 重大投資獲利</option>
              <option value="relationship">💑 結婚成家 / 浪漫桃花降臨</option>
              <option value="health">🏥 身體微恙 / 突發手術 / 健康危機</option>
              <option value="other">⚡ 突發意外衝突 / 行動受阻 / 口舌爭執</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-indigo-200">事件具體經歷備註 (選填)</label>
            <input
              type="text"
              placeholder="例如：今天被主管升遷、買彩券中獎..."
              value={customEventTitle}
              onChange={(e) => setCustomEventTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-indigo-200">事件發生日期</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-slate-800/80 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleAnalyzeEvent}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl border border-indigo-400/30 transition-all shadow-md hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            🔍 開始智能事件原因探勘與主因分析
          </button>
        </div>

        {eventAnalysisResult && (
          <div className="bg-slate-900/60 rounded-xl border border-indigo-500/20 p-5 mt-4 space-y-5 text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-black">✨ 智能分析結果：</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-md border border-indigo-500/30">
                  {eventAnalysisResult.category}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                分析日期：{eventDate} {customEventTitle && `| 「${customEventTitle}」`}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider">🎯 影響本命流年之前三大主引發因素：</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {eventAnalysisResult.topCauses.map((cause: any, index: number) => {
                  const medalColors = [
                    'border-amber-500/30 bg-amber-500/10 text-amber-200',
                    'border-slate-300/30 bg-slate-300/10 text-slate-200',
                    'border-orange-400/30 bg-orange-400/10 text-orange-200'
                  ];
                  const badges = ['🥇 第一主因', '🥈 第二主因', '🥉 第三主因'];
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all hover:bg-slate-800/40 flex flex-col justify-between ${medalColors[index] || 'border-indigo-500/20 bg-indigo-500/5'}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/40">
                            {badges[index]}
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-400">
                            影響權重: {cause.impact}%
                          </span>
                        </div>
                        <div className="font-bold text-xs">{cause.cause}</div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                          {cause.description}
                        </p>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                          className="bg-indigo-400 h-1.5 rounded-full"
                          style={{ width: `${cause.impact}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/10 space-y-1.5">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                📖 占星因果判定綜合論斷：
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {eventAnalysisResult.fullVerdict}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Date Analysis Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">推運深度解析 (Harmony Analysis)</h2>
            <p className="text-sm text-gray-500">深入分析特定日期的行星能量與「人和」條件</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <input 
                type="date" 
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer text-indigo-900"
              />
            </div>
            {onReport && (
              <button 
                onClick={() => onReport(analysisDate)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2"
              >
                生成完整報告
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Harmony Rules List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> 符合「人和」與關鍵條件
            </h3>
            <div className="space-y-3">
              {interpretations.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border transition-all ${item.isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.isPositive ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">P{item.priority}</span>
                  </div>
                  <div className="font-bold text-gray-900 mb-1">{item.rule}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.result}</p>
                </div>
              ))}
              {interpretations.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm">
                  此日期無觸發特定的關鍵和諧規則
                </div>
              )}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex gap-2 items-center text-blue-800 font-bold text-xs mb-2">
                <Info className="w-4 h-4" /> 規則說明
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed italic">
                「人和」條件基於 BPHS 經典規則，重點考量流年吉星 (木星、金星) 對命宮、月亮及其主星的相位感應。
                結合現代占星對外行星 (天、海、冥) 與個人太陽的相位考量。
              </p>
            </div>
          </div>

          {/* Planet Degrees Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <ArrowRight className="w-4 h-4" /> 行星推運數據 (含度數)
            </h3>
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-2 text-gray-500">行星</th>
                    <th className="p-2 text-gray-500">星座</th>
                    <th className="p-2 text-gray-500">精確度數</th>
                    <th className="p-2 text-gray-500">宮位</th>
                    <th className="p-2 text-gray-500 text-center">本命感應</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transitData && Object.entries(transitData.planets).map(([k, p]: [string, any]) => {
                    const natalP = natalData.planets[k];
                    const house = ((p.sign - natalData.ascendantSign + 12) % 12) + 1;
                    const isConjunction = natalData.planets[k]?.sign === p.sign;
                    
                    return (
                      <tr key={k} className="hover:bg-white transition-colors">
                        <td className="p-2 font-bold text-gray-700">{getPlanetName(k, ['zh'])}</td>
                        <td className="p-2 text-gray-600">{getZodiacName(p.sign, ['zh'])}</td>
                        <td className="p-2 font-mono text-gray-500">{p.degreeInSign.toFixed(2)}°</td>
                        <td className="p-2 text-gray-600 text-center">{house}</td>
                        <td className="p-2 text-center">
                          {isConjunction && <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" title="進入本命同一星座" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Event Log Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
          <h2 className="text-xl font-bold text-gray-900">年度推運大事記 (Transit Timeline)</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">年份:</label>
              <input 
                type="number" 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm w-20 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {['Sun', 'Moon', 'Mars', 'Mercury', 'Venus', 'Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta', 'Fortune', 'Spirit', 'Vertex'].map(p => (
                <button
                  key={p} onClick={() => setSelectedPlanets(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${selectedPlanets.includes(p) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {getPlanetName(p, ['zh'])}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
              <tr>
                <th className="p-4 font-bold">日期</th>
                <th className="p-4 font-bold">行星</th>
                <th className="p-4 font-bold">事件</th>
                <th className="p-4 font-bold">深度解析</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">正在追蹤星跡...</td></tr>
              ) : events.map((event, i) => (
                <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="p-4 text-gray-500 font-mono text-xs">{event.date.toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-indigo-700">{getPlanetName(event.planet, ['zh'])}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      event.type === 'sign_change' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {event.type === 'sign_change' ? '換座' : '行度變化'}
                    </span>
                    <div className="text-xs text-gray-900 mt-1 font-medium">{event.details}</div>
                  </td>
                  <td className="p-4 text-xs text-gray-600 max-w-sm italic">
                    {event.insight || '星象變遷中，屬常規能量切換。'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransitsEventLog;
