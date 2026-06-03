import React from 'react';
import { ChartData, getPlanetName, getZodiacName, NAKSHATRAS, findNextSaturnTransitToNakshatra } from '../utils/astrology';
import { ASCENDANT_PROPERTIES, checkDhanaYogas, checkSadeSati, getKakshyaLord, checkPanchaMahapurushaYogas, checkJaiminiYogas } from '../utils/rulesEngine';
import { HOUSE_LORD_RULES } from '../constants/houseLords';
import { Shield, TrendingUp, AlertTriangle, Zap, Star, Crown, BookOpen, Compass } from 'lucide-react';

interface Props {
  natalData: ChartData;
  transitData?: ChartData;
  modes?: string[];
  isSidereal?: boolean;
  ayanamsaType?: string;
}

const VedicAnalysis: React.FC<Props> = ({ natalData, transitData, modes = ['zh'], isSidereal = true, ayanamsaType = 'Lahiri' }) => {
  const ascSign = natalData.ascendantSign;
  const props = ASCENDANT_PROPERTIES[ascSign];
  const dhanaYogas = checkDhanaYogas(natalData);
  const panchaYogas = checkPanchaMahapurushaYogas(natalData);
  const jaiminiYogas = checkJaiminiYogas(natalData);
  
  // Calculate 3rd House Lord placement
  const lord3Name = natalData.houses[2]?.lord;
  const lord3Placement = lord3Name && natalData.planets[lord3Name] ? natalData.planets[lord3Name].house : null;
  const lord3Rules = lord3Placement ? HOUSE_LORD_RULES[3]?.[lord3Placement] : null;

  // Helper to format degrees for display
  const formatDegreeLabel = (deg: number) => {
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    return `${d}°${m.toString().padStart(2, '0')}'`;
  };

  const karakaInterpretations: Record<string, string> = {
    'AK': '靈魂指標 (Atma Karaka)：代表靈魂、本質、此生的主要課題。',
    'AMK': '事業指標 (Amatya Karaka)：代表事業、職業、行政與專業能力。',
    'BK': '手足指標 (Bhratri Karaka)：代表手足、導師、溝通與勇氣。',
    'MK': '母親指標 (Matri Karaka)：代表母親、家庭、財產與幸福感。',
    'PK': '子女指標 (Putra Karaka)：代表子女、創意、考試、智慧與前世福報。',
    'GK': '競爭指標 (Gnati Karaka)：代表競爭者、疾病、障礙與親屬。',
    'DK': '配偶指標 (Dara Karaka)：代表配偶、合夥人、世俗欲望。'
  };

  const natalMoonSign = natalData.planets['Moon']?.sign;

  const transitSaturnSign = transitData?.planets['Saturn']?.sign;
  const sadeSati = natalMoonSign && transitSaturnSign ? checkSadeSati(natalMoonSign, transitSaturnSign) : null;

  const sav = natalData.sav as Record<number, number>;
  const totalSAV = Object.values(sav || {}).reduce((a, b) => (a as number) + (b as number), 0) as number;
  const longevityYears = Math.floor(totalSAV / 4); // Simplified rule from user prompt
  const longevityRem = totalSAV % 27; // Simplified rule for Nakshatra
  const nakshatraName = NAKSHATRAS[longevityRem - 1] || NAKSHATRAS[26];

  // Calculate danger year
  const birthYear = natalData.utcTime ? new Date(natalData.utcTime).getFullYear() : new Date().getFullYear();
  const dangerYear = birthYear + longevityYears;

  // Calculate Saturn transit
  const nextSaturnTransit = React.useMemo(() => {
    return findNextSaturnTransitToNakshatra(longevityRem - 1, new Date(), isSidereal, ayanamsaType);
  }, [longevityRem, isSidereal, ayanamsaType]);

  return (
    <div className="space-y-6">
      {/* Longevity Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold">壽元預測 (Ashtakavarga Longevity)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-indigo-300 uppercase font-bold mb-1">計算規則 (Rule)</div>
            <div className="text-[10px] text-indigo-200/70 leading-tight">
              將 SAV 總點數除以 27，所得之「餘數」即為關鍵星宿。
            </div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-indigo-300 uppercase font-bold mb-1">總分 (Total SAV)</div>
            <div className="text-3xl font-black">{totalSAV}</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-indigo-300 uppercase font-bold mb-1">餘數 (Nakshatra Ref)</div>
            <div className="text-3xl font-black text-orange-400">{longevityRem}</div>
            <div className="text-[10px] text-gray-400 mt-1">對應：{nakshatraName}</div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2">規則解釋 (Rule Explanation):</h4>
          <p className="text-xs text-gray-300 leading-relaxed italic">
            「此公式用於預測生命中的重大考驗點。當流年土星行經此餘數對應之星宿時，將引發最強烈的業力回饋。SAV 總點數越高，代表整體福報越強。」
          </p>
        </div>
        {nextSaturnTransit && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>流年土星過運預警 (Saturn Transit Warning)</span>
            </div>
            <p className="text-sm text-red-200">
              當流年土星行經 <strong>{nakshatraName}</strong> 星宿時，可能會引發不好的事件。
            </p>
            <div className="mt-2 text-xs text-red-300 font-mono bg-black/20 p-2 rounded inline-block">
              預計時間：{nextSaturnTransit.start.toLocaleDateString()} ~ {nextSaturnTransit.end.toLocaleDateString()}
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-4 italic">
          * 此計算基於 Ashtakavarga 總分之簡化算法。餘數對應之星宿為流年土星行經時需注意之凶險期。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* House Lords Placement */}
        {lord3Rules && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-bold">宮主星落宮解析 (House Lord Placements)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-teal-50 rounded-xl border-l-4 border-teal-500 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-teal-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">規則觸發</span>
                  <div className="font-bold text-teal-900 text-md">
                    第 {natalData.houses[2]?.number} 宮主 星 ({getPlanetName(lord3Name, modes)}) 飛入 第 {lord3Placement} 宮
                  </div>
                </div>
                <div className="mb-2 text-xs text-teal-700 bg-teal-100/30 p-2 rounded italic">
                  <strong>規則解釋：</strong> 3 宮主掌管勇氣、鄰居與手足。飛入特定宮位代表這些能量轉化為該宮位的事務。
                </div>
                <ul className="text-sm text-teal-800 font-medium bg-teal-100/50 p-3 rounded mt-2 space-y-1 list-disc pl-5">
                  {lord3Rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Ascendant Properties */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold">命宮性質 (上升 {getZodiacName(ascSign, modes)})</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">吉星 (Benefics):</span>
              <span className="font-bold text-green-600">{props.benefics.map(p => getPlanetName(p, modes)).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">凶星 (Malefics):</span>
              <span className="font-bold text-red-600">{props.malefics.map(p => getPlanetName(p, modes)).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">貴徵星 (Yoga Karaka):</span>
              <span className="font-bold text-indigo-600">{props.yogaKaraka.length > 0 ? props.yogaKaraka.map(p => getPlanetName(p, modes)).join(', ') : '無'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">損壽星 (Marakas):</span>
              <span className="font-bold text-orange-600">{props.marakas.map(p => getPlanetName(p, modes)).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Dhana Yogas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold">財格分析 (Dhana Yogas)</h3>
          </div>
          <div className="space-y-4">
            <div className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded border border-dashed mb-2">
              <strong>規則解釋：</strong> 財格由財富宮（2, 11）與強勢宮（1, 5, 9）的連結構成。命中此格代表一生財源穩定或有大財。
            </div>
            {dhanaYogas.length > 0 ? (
              dhanaYogas.map((yoga, i) => (
                <div key={i} className="p-4 bg-emerald-50 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">條件符合</span>
                    <div className="font-bold text-emerald-900 text-md">{yoga.name}</div>
                  </div>
                  <div className="text-sm text-emerald-800 font-medium bg-emerald-100/50 p-2 rounded mt-2">{yoga.description}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm italic">未發現顯著財格組合</div>
            )}
          </div>
        </div>
      </div>

      {/* Pancha Mahapurusha Yogas */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <Star className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold">五星得地格 (Pancha Mahapurusha Yogas)</h3>
        </div>
        <div className="space-y-4">
          <div className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded border border-dashed mb-2">
            <strong>規則解釋：</strong> 當五大行星（火、水、木、金、土）位於自己本垣或廟旺星座，且處於四正宮 (1, 4, 7, 10) 時觸發。
          </div>
          {panchaYogas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {panchaYogas.map((yoga, i) => (
                <div key={i} className="p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">條件符合</span>
                    <div className="font-bold text-purple-900 text-md">{yoga.name}</div>
                  </div>
                  <div className="text-sm text-purple-800 font-medium bg-purple-100/50 p-2 rounded mt-2">{yoga.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">未發現五星得地格</div>
          )}
        </div>
      </div>

      {/* Jaimini Astrology */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <Crown className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold">賈米尼占星 (Jaimini Astrology)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 7 Karakas */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> 七種真相星 (7 Karakas)
            </h4>
            <div className="space-y-1.5">
              {Object.values(natalData.planets)
                .filter((p: any) => p.jaiminiKaraka)
                .sort((a: any, b: any) => {
                  const order = ['AK', 'AMK', 'BK', 'MK', 'PK', 'GK', 'DK'];
                  return order.indexOf(a.jaiminiKaraka) - order.indexOf(b.jaiminiKaraka);
                })
                .map((p: any, idx, arr) => {
                  const isHighest = idx === 0;
                  const isLowest = idx === arr.length - 1;
                  return (
                    <div key={p.name} className="group relative">
                      <div className={`flex justify-between items-center p-2.5 rounded-lg border transition-all ${
                        isHighest ? 'bg-amber-100 border-amber-300 shadow-sm' : 
                        isLowest ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-8 font-black text-[10px] sm:text-xs ${isHighest ? 'text-amber-800' : 'text-gray-500'}`}>{p.jaiminiKaraka}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className={`font-bold text-sm ${isHighest ? 'text-amber-900' : 'text-gray-800'}`}>
                            {getPlanetName(p.name, modes)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-gray-500">{formatDegreeLabel(p.degreeInSign)}</span>
                          {isHighest && <span className="text-[10px] font-black text-amber-600">← 最高</span>}
                          {isLowest && <span className="text-[10px] font-black text-indigo-400">← 最低</span>}
                        </div>
                      </div>
                      <div className="hidden group-hover:block absolute left-0 -top-12 z-10 w-full bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl leading-tight">
                        {karakaInterpretations[p.jaiminiKaraka]}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Special Lagnas */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" /> 特殊命宮 (Special Lagnas)
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-900 text-sm">Arudha Lagna (AL / 1P)</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">{natalData.arudhaLagna ? getZodiacName(natalData.arudhaLagna, modes) : '-'}</span>
                </div>
                <p className="text-[10px] text-amber-700 italic">「規則解釋：代表你在世俗社會中被他人感知到的外部形象（Maya）。」</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-emerald-900 text-sm">Upapada Lagna (UL / 12P)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">{natalData.upapadaLagna ? getZodiacName(natalData.upapadaLagna, modes) : '-'}</span>
                </div>
                <p className="text-[10px] text-emerald-700 italic">「規則解釋：代表你的婚姻狀態與長期合作關係的本質。」</p>
              </div>
              {natalData.bhriguBindu && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-indigo-900 text-sm">Bhrigu Bindu (命運點)</span>
                      <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">命運</span>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-bold text-right">
                      {getZodiacName(natalData.bhriguBindu.sign, modes)} {formatDegreeLabel(natalData.bhriguBindu.degreeInSign)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1">
                    <span className="text-[10px] font-bold text-indigo-700">第 {natalData.bhriguBindu.house} 宮</span>
                    <span className="text-[10px] text-gray-500">主星: {getPlanetName(natalData.bhriguBindu.lord, modes)}</span>
                    <span className="text-[10px] text-gray-500">星宿: {natalData.bhriguBindu.nakshatra.name} (主: {getPlanetName(natalData.bhriguBindu.nakshatra.lord, modes)})</span>
                  </div>
                  <p className="text-[10px] text-indigo-700 italic">「規則解釋：月亮與羅喉的中點，象徵人生修習的路徑與命運轉折點。」</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Jaimini Yogas */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 font-black uppercase">
             賈米尼貴格 (Jaimini Raj Yogas)
          </h4>
          <div className="space-y-3">
            {jaiminiYogas.length > 0 ? (
              jaiminiYogas.map((yoga, i) => (
                <div key={i} className="p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">條件符合</span>
                    <div className="font-bold text-amber-900 text-md">{yoga.name}</div>
                  </div>
                  <div className="text-xs text-amber-700 bg-amber-100/50 p-3 rounded leading-relaxed border-l-4 border-amber-500">
                    <strong>規則釋義：</strong> {yoga.description}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm italic">未發現賈米尼貴格組合</div>
            )}
          </div>
        </div>
      </div>

      {/* Transit Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sade Sati */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold">流土掩月 (Sade Sati)</h3>
          </div>
          {sadeSati?.isSadeSati ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-amber-900 font-bold">⚠️ 正處於 Sade Sati 期間</div>
              <div className="text-sm text-amber-700 mt-1">當前階段：{sadeSati.phase}</div>
              <p className="text-xs text-amber-600 mt-2">
                土星行經本命月亮前後宮位，通常伴隨著壓力、責任與轉變。
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="text-green-900 font-bold">✅ 目前非 Sade Sati 期間</div>
              <p className="text-xs text-green-700 mt-1">流年土星未對本命月亮形成直接壓迫。</p>
            </div>
          )}
        </div>

        {/* Kakshya Transit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold">流年星曜界 (Kakshya)</h3>
          </div>
          <div className="space-y-2">
            {transitData && Object.entries(transitData.planets).filter(([name]) => ['Jupiter', 'Saturn', 'Mars'].includes(name)).map(([name, p]) => {
              const planet = p as any;
              const lord = getKakshyaLord(planet.longitude);
              return (
                <div key={name} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-sm font-medium">{getPlanetName(name, modes)}</span>
                  <div className="text-xs text-gray-500">
                    位於 <span className="font-bold text-blue-600">{getPlanetName(lord, modes)}</span> 界 (Kakshya)
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-gray-400 mt-2 italic">
              * 根據 Ashtavarga 點數，若流年行星進入有給分的 Kakshya，則該時段較為順遂。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VedicAnalysis;
