import React from 'react';
import { ChartData, getPlanetName, getZodiacName, getDignityName, findNextSaturnTransitToNakshatra, NAKSHATRAS } from '../utils/astrology';
import { getTransitInterpretations, TransitInterpretation } from '../utils/rulesEngine';
import { CheckCircle, AlertCircle, Calendar, Star, TrendingUp, Shield, Activity, Info, Download, BookOpen } from 'lucide-react';
import SouthIndianChart from './SouthIndianChart';

interface Props {
  natalData: ChartData;
  transitData: ChartData;
  transitDate: string;
  modes?: string[];
}

const TransitMasterReport: React.FC<Props> = ({ natalData, transitData, transitDate, modes = ['zh'] }) => {
  const interpretations = getTransitInterpretations(natalData, transitData);
  const positiveRules = interpretations.filter(i => i.isPositive);
  const negativeRules = interpretations.filter(i => !i.isPositive);

  // Calculate current dasha for that date (or roughly)
  const tDateObj = new Date(transitDate);
  const currentMaha = natalData.dashas.find(d => tDateObj >= d.start && tDateObj <= d.end);
  const currentAntar = currentMaha?.subPeriods?.find(sd => tDateObj >= sd.start && tDateObj <= sd.end);

  const dangerTransits = React.useMemo(() => {
    const ascSign = natalData.ascendantSign;
    const saturnSign = natalData.planets['Saturn']?.sign || 1;
    const sav = (natalData.sav as Record<number, number>) || {};

    const housesToSaturn = (saturnSign - ascSign + 12) % 12 + 1;
    const housesFromSaturn = (ascSign - saturnSign + 12) % 12 + 1;

    let savSumA = 0;
    for (let h = 1; h <= housesToSaturn; h++) {
      savSumA += sav[h] || 28;
    }

    let savSumB = 0;
    for (let i = 0; i < housesFromSaturn; i++) {
      let houseIdx = housesToSaturn + i;
      if (houseIdx > 12) houseIdx -= 12;
      savSumB += sav[houseIdx] || 28;
    }

    const dangerNakIdxA = Math.floor((savSumA * 7) % 27);
    const dangerNakIdxB = Math.floor((savSumB * 7) % 27);
    
    // We want unique indices
    const nakshatrasSet = Array.from(new Set([dangerNakIdxA, dangerNakIdxB]));

    const searchStartDate = new Date(tDateObj);
    const next5YearsEnd = new Date(tDateObj);
    next5YearsEnd.setFullYear(next5YearsEnd.getFullYear() + 5);

    const transits: { nakshatraName: string; idx: number; start: Date; end: Date; formula: string }[] = [];

    nakshatrasSet.forEach(idx => {
      let currSearchDate = new Date(searchStartDate);
      let limit = 0;
      while (currSearchDate < next5YearsEnd && limit < 10) {
        const transit = findNextSaturnTransitToNakshatra(idx, currSearchDate, true, 'lahiri');
        if (!transit) break;
        if (transit.start <= next5YearsEnd && transit.end >= searchStartDate) {
          transits.push({
            nakshatraName: NAKSHATRAS[idx],
            idx,
            start: transit.start,
            end: transit.end,
            formula: idx === dangerNakIdxA ? 'A (Asc→土星)' : 'B (土星→Asc)'
          });
        }
        currSearchDate = new Date(transit.end.getTime() + 2 * 24 * 60 * 60 * 1000); // go forward 2 days after end
        limit++;
      }
    });

    transits.sort((a, b) => a.start.getTime() - b.start.getTime());
    return transits;
  }, [natalData, tDateObj]);

  const exportReport = () => {
    const srAscSign = transitData.ascendantSign || 1;
    const srSunSign = transitData.planets['Sun']?.sign || 1;
    const srSunHouse = (srSunSign - srAscSign + 12) % 12 + 1;
    let busyPeriod = '';
    if ([1, 4, 7, 10].includes(srSunHouse)) {
      busyPeriod = '年初活動最多';
    } else if ([2, 5, 8, 11].includes(srSunHouse)) {
      busyPeriod = '年中運勢最旺 / 最為繁忙';
    } else {
      busyPeriod = '大部分時間準備，年末行動';
    }

    const content = `
星盤推運分析報告
分析日期: ${transitDate}
姓名: ${natalData.name || '未命名'}

[關鍵趨勢]
${interpretations.map(i => `- ${i.category}: ${i.rule} -> ${i.result}`).join('\n')}

[太陽反照趨勢]
流年太陽落入返照盤第 ${srSunHouse} 宮，預測年度最繁忙時期為：${busyPeriod}

[凶險星宿過運監測 (未來5年)]
${dangerTransits.length === 0 ? '未來 5 年內無土星行經凶險星宿的紀錄。' : dangerTransits.map(t => `- [大凶] 流年土星行經 ${t.nakshatraName} (餘數 ${t.idx}, ${t.formula}) : ${t.start.toLocaleDateString('zh-TW')} ~ ${t.end.toLocaleDateString('zh-TW')}`).join('\n')}

[大運背景]
Mahadasha: ${currentMaha ? getPlanetName(currentMaha.planet, modes) : '未知'}
Antardasha: ${currentAntar ? getPlanetName(currentAntar.planet, modes) : '未知'}

[行星位置]
${Object.entries(transitData.planets).map(([k, p]: [string, any]) => `${getPlanetName(k, modes)}: ${getZodiacName(p.sign, modes)} ${p.degreeInSign.toFixed(2)}°`).join('\n')}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transit_Report_${transitDate}.txt`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <TrendingUp className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-200 font-bold tracking-widest text-sm mb-2">
                <Calendar className="w-4 h-4" /> 推運日期報告
              </div>
              <h1 className="text-4xl font-black mb-2">{transitDate}</h1>
              <p className="text-indigo-100 opacity-80 max-w-xl leading-relaxed">
                綜合吠陀星命學、流年過運（Gochara）與「人和」格局的深度大數據解析。
              </p>
            </div>
            <button 
              onClick={exportReport}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 transition-all font-bold text-sm shadow-xl"
            >
              <Download className="w-4 h-4" /> 匯出文字報告
            </button>
          </div>
        </div>
      </div>

      {/* Transit Chart Over Natal Sun */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl overflow-hidden mt-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-indigo-600" /> 行運星盤對本命太陽 行運對分盤 (Surya Lagna)
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          將「本命太陽」所在的星座設為第1宮（Ascendant），觀察流年（行運）行星相對於本命太陽所造成的影響。此「行運對分盤」能精準透析名望、事業與生命力的流年起伏。
        </p>
        <div className="max-w-md mx-auto">
          <SouthIndianChart 
            data={transitData} 
            modes={modes} 
            showDegrees={true} 
            referenceSign={natalData.planets['Sun']?.sign} 
          />
        </div>
      </div>

      {/* Solar Return Chart */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl overflow-hidden mt-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" /> 太陽反照圖 (Solar Return Chart)
        </h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          「太陽反照盤」是以流年星盤為基礎的年度推運法，能判斷一整年的活動節奏與最繁忙時期：<br/>
          <strong>a. 太陽在四角宮 (1, 4, 7, 10宮)</strong>：年初將是一年中活動最多的時期。<br/>
          <strong>b. 太陽在續宮 (2, 5, 8, 11宮)</strong>：年中將是你最繁忙的時期。<br/>
          <strong>c. 太陽在果宮 (3, 6, 9, 12宮)</strong>：一年中大部分時間都在準備與協調，直到年末才會開始行動。
        </p>
        
        {(() => {
          const srAscSign = transitData.ascendantSign || 1;
          const srSunSign = transitData.planets['Sun']?.sign || 1;
          const srSunHouse = (srSunSign - srAscSign + 12) % 12 + 1;
          
          let busyPeriod = '';
          let busyColor = '';
          let busyDesc = '';

          if ([1, 4, 7, 10].includes(srSunHouse)) {
            busyPeriod = '年初活動最多';
            busyColor = 'text-blue-700 bg-blue-50 border-blue-200';
            busyDesc = '太陽位於返照盤的「四角宮」(Kendra)。暗示著今年初將是你活動最多、節奏最快的時期，行動力與影響力在年初達到高峰。';
          } else if ([2, 5, 8, 11].includes(srSunHouse)) {
            busyPeriod = '年中運勢最旺 / 最為繁忙';
            busyColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
            busyDesc = '太陽位於返照盤的「續宮」(Panaphara)。代表今年運勢的高潮往往在年中爆發，這段期間將是你最繁忙、收益與發展最顯著的時期。';
          } else {
            busyPeriod = '大部分時間準備，年末行動';
            busyColor = 'text-purple-700 bg-purple-50 border-purple-200';
            busyDesc = '太陽位於返照盤的「果宮」(Apoklima)。這說明一年中的大部分時間（年初至年中）你都會在做準備、醞釀和協調工作，直到年末才會開始進一步的實際行動。';
          }

          return (
            <div className="flex flex-col lg:flex-row gap-6 items-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="flex-1 space-y-4 w-full">
                <div className="inline-flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">流年太陽 落入 流年命盤</span>
                  <div className="text-2xl font-black text-gray-900 border-b-2 border-gray-200 pb-2">第 {srSunHouse} 宮</div>
                </div>
                
                <div className={`mt-2 font-black px-4 py-3 rounded-xl border ${busyColor} inline-block shadow-sm`}>
                  {busyPeriod}
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed max-w-sm mt-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  {busyDesc}
                </p>
              </div>
              
              <div className="w-full max-w-[280px] lg:max-w-[320px]">
                <SouthIndianChart 
                  data={transitData} 
                  modes={modes} 
                  showDegrees={true} 
                  selectedPlanet="Sun"
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Solar Return Chart Guide */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl overflow-hidden mt-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> 太陽反照法解盤步驟 (Solar Return Guide)
        </h3>
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <p>
            太陽反照法是以太陽每年回歸到個人出生時精確位置的當下時間來起盤，相當於以這個特殊時間點作為一個新週期的「出生圖」，藉此推斷個人從這次生日到下次生日這一年內的整體運勢趨勢。
          </p>
          <p>
            在解讀太陽返照盤時，必須同時考量「返照盤本身的獨立狀態」以及「返照盤與本命盤的互動對照」。以下為詳細的解盤步驟與重點：
          </p>
          
          <div className="space-y-4">
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">第一步：解讀返照盤本身的獨立狀態</h4>
              <p className="mb-2">將返照盤視為一張卜卦盤或獨立命盤，觀察這一年哪種能量被凸顯：</p>
              <ul className="list-decimal list-inside space-y-2 ml-1">
                <li><strong>觀察星盤四角（ASC、MC、DES、IC）：</strong> 星盤四角具有放大的效應，若有星體落在返照盤的四角附近，代表該星體的影響力這一年會被強烈凸顯。例如，金星落四角暗示今年人緣與桃花現象被強調；火星在ASC附近則強化了自身的風險、衝突與意外的可能。</li>
                <li><strong>檢視行星的分佈情況：</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-600">
                    <li>多數行星在上半部：意味著這一年對外活動增加、交流頻繁。</li>
                    <li>多數行星在地平線下：預示這一年你將對自身或家人投入更多關注。</li>
                    <li>大量行星在左半盤：強化個人的發展、決定與發揮。</li>
                    <li>群星在右半盤：個人的決定將更多受到他人的影響。</li>
                  </ul>
                </li>
                <li><strong>尋找星群結構（Stellium）：</strong> 若某一宮或某一星座內有三顆以上的星體落入，代表能量的聚集，該星座或宮位代表的領域在這一年將倍受關注。</li>
                <li><strong>分析返照盤命宮與命主星：</strong> 返照盤的上升星座（ASC）代表你這一年表現出的特質與主要人生目的。
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-600">
                    <li>星座性質：上升為基本星座代表當年較積極主動；固定星座較易守成不動；變動星座則多變不定。</li>
                    <li>命主星落宮：返照盤的命主星飛入哪一宮，是該年的重要線索（例如命主星高掛MC，則這一年重心在於地位與事業）。</li>
                  </ul>
                </li>
                <li><strong>解析返照太陽與月亮的特殊指標：</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-600">
                    <li>太陽的落宮：顯示該年力量花費最多的地方與被凸顯的狀態。此外，它能推算一年中最繁忙的時期：若太陽在四角（1、4、7、10宮），年初活動最多；在2、5、8、11宮，年中最繁忙；在3、6、9、12宮，則大部份時間在做準備，年末才開始進一步行動。</li>
                    <li>月亮的最後相位：月亮最後形成的入相暗示當年度事件的結果。若返照盤月亮空亡，這一年較容易一事無成。</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">第二步：返照盤與本命盤的對照分析</h4>
              <p className="mb-2">返照的星體代表「外界賦予你的能量」，必須對照本命盤（你自身潛在的能量）來解釋：</p>
              <ul className="list-decimal list-inside space-y-2 ml-1">
                <li><strong>返照盤上升（ASC）落入本命盤的哪一宮：</strong> 這是極其重要的指標。返照上升所落入的本命宮位，其相關領域將佔用你這一年大部分的精力，成為年度焦點。例如，返照上升開在本命12宮，代表這年主要發展容易在身心靈領域或靈性成就上。</li>
                <li><strong>反轉現象（逆轉）：</strong> 留意返照盤的上升是否開在本命盤的對宮（尤其在DES下降點附近）。這種反轉意味著這年度人生會有較大調整，生活因素發生徹底改變，可能是主控權的喪失、突然虛弱或錯誤計畫的制定。</li>
                <li><strong>本命行星落入返照盤四角：</strong> 注意本命盤的星體是否落入了返照盤的四角，這代表本命該星體的潛在力量在這一年得以強烈發揮。</li>
              </ul>
            </div>

            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
              <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">第三步：尋找「結構呼應」引發重大事件</h4>
              <p className="mb-2">這是判斷重大事件是否發生的關鍵心法。檢視本命盤的徵象結構是否在返照盤中「重現」。當返照盤凸顯出某個事件徵象，且這個徵象的結構與本命盤的結構一致時，就會強烈引發該本命事件。</p>
              <div className="mt-3 bg-white p-4 rounded-xl border border-amber-200 shadow-sm text-amber-800">
                <strong className="block mb-1">💡 案例說明：</strong>
                若本命盤有太陽、月亮、金星構成的結婚徵象（例如日月互容、日金合相）。而該年的返照盤中剛好也有日金合相、日月六合，且返照命主星太陽高掛MC合相金星，這個結構被強烈凸顯與呼應，那麼這一年就非常容易引發結婚的事件。
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dasha & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Harmony Rules */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Star className="w-5 h-5 fill-white" /> 「人和」吉兆格局
              </h3>
              <span className="text-xs bg-emerald-700 px-2 py-1 rounded-full">{positiveRules.length} 條符合</span>
            </div>
            <div className="p-6 space-y-4">
              {positiveRules.map((rule, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 uppercase mb-1">{rule.category}</div>
                    <div className="font-bold text-gray-900 mb-1">{rule.rule}</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{rule.result}</p>
                  </div>
                </div>
              ))}
              {positiveRules.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic">此日期無明顯的人和吉兆出現。</div>
              )}
            </div>
          </section>

          {/* Danger Nakshatra Transit Monitoring */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden mt-6">
            <div className="bg-red-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 fill-red-500 text-white" /> 凶險星宿過運監測 (未來5年)
              </h3>
              <span className="text-xs bg-red-950 px-2 py-1 rounded-full">{dangerTransits.length} 個危險區間</span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                依據 Ashtakavarga SAV 公式精算（分別從命宮至土星，以及土星至命宮），找出命盤的危險殘星。當流年土星行經這些特選星宿時，極易觸發突發災難或大關卡。以下列出未來 5 年內實際發生的具體日期範圍：
              </p>
              
              {dangerTransits.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-gray-100">
                  未來 5 年內無土星行經凶險星宿的紀錄。安全期！
                </div>
              ) : (
                <div className="space-y-4">
                  {dangerTransits.map((transit, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-red-50 border border-red-200 relative overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-red-100 border border-red-300 flex flex-col items-center justify-center flex-shrink-0 z-10">
                        <span className="text-[10px] font-bold text-red-800">餘數</span>
                        <span className="text-sm font-black text-red-600 leading-none">{transit.idx}</span>
                      </div>
                      <div className="z-10 w-full">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-sm font-bold text-red-800">
                            流年土星 行經 【{transit.nakshatraName}】 ({transit.formula})
                          </div>
                          <span className="text-[10px] px-2 py-1 bg-red-200 text-red-900 rounded font-bold uppercase tracking-wider">
                            大凶
                          </span>
                        </div>
                        <div className="font-mono text-xs bg-white text-red-900 p-2 rounded border border-red-100 inline-block mt-2 font-bold shadow-sm">
                          {transit.start.toLocaleDateString('zh-TW')} ~ {transit.end.toLocaleDateString('zh-TW')}
                        </div>
                        <p className="text-[11px] text-red-700 mt-2 leading-relaxed opacity-80">
                          這是一段潛在的『危險流年』區間，需特別防範突發急症、意外或重大考驗。
                        </p>
                      </div>
                      {/* background decoration */}
                      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                        <Shield className="w-24 h-24 text-red-900" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Warning Rules */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-rose-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> 關鍵預警與考驗
              </h3>
              <span className="text-xs bg-rose-700 px-2 py-1 rounded-full">{negativeRules.length} 條符合</span>
            </div>
            <div className="p-6 space-y-4">
              {negativeRules.map((rule, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-600 uppercase mb-1">{rule.category}</div>
                    <div className="font-bold text-gray-900 mb-1">{rule.rule}</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{rule.result}</p>
                  </div>
                </div>
              ))}
              {negativeRules.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic">此日期無重大凶兆預警。</div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Current Dasha Card */}
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> 大運背景解析
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                <div className="text-xs text-indigo-300 font-bold uppercase mb-1">主運 Mahadasha</div>
                <div className="text-2xl font-black">{currentMaha ? getPlanetName(currentMaha.planet, modes) : '---'}</div>
                <div className="text-[10px] text-indigo-400 mt-1">
                  主導宏觀趨勢：{currentMaha?.start.toLocaleDateString()}起
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                <div className="text-xs text-indigo-300 font-bold uppercase mb-1">中運 Antardasha</div>
                <div className="text-2xl font-black">{currentAntar ? getPlanetName(currentAntar.planet, modes) : '---'}</div>
                <div className="text-[10px] text-indigo-400 mt-1">
                  影響當下細節：至{currentAntar?.end.toLocaleDateString()}止
                </div>
              </div>
            </div>
            <p className="text-xs text-indigo-200 mt-4 leading-relaxed opacity-70">
              * 大運決定了您的人生劇本，流年則是當下的演員。兩者共振時影響最為劇烈。
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-4">關鍵行星推運點</h3>
            <div className="space-y-3">
              {['Jupiter', 'Saturn', 'Rahu', 'Sun'].map(pName => {
                const p = transitData.planets[pName];
                if (!p) return null;
                const house = ((p.sign - natalData.ascendantSign + 12) % 12) + 1;
                return (
                  <div key={pName} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-700">{getPlanetName(pName, modes)}</span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-600">{getZodiacName(p.sign, modes)} {house}宮</div>
                      <div className="text-[10px] text-gray-400">{getDignityName(p.dignity)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
              <Info className="w-5 h-5" /> 行動指南
            </div>
            <p className="text-sm text-amber-700 leading-relaxed italic">
              「人和」條件是成功的關鍵，當木星感應命宮時，請積極參與社交活動。若土星入 12 宮，建議轉向內省。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitMasterReport;
