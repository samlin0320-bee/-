import React from 'react';
import { ChartData, getPlanetName, getZodiacName, NAKSHATRAS, findNextSaturnTransitToNakshatra, calculateSadeSatiPeriods } from '../utils/astrology';
import { ASCENDANT_PROPERTIES, checkDhanaYogas, checkSadeSati, getKakshyaLord, checkPanchaMahapurushaYogas, checkJaiminiYogas } from '../utils/rulesEngine';
import { HOUSE_LORD_RULES } from '../constants/houseLords';
import { Shield, TrendingUp, AlertTriangle, Zap, Star, Crown, BookOpen, Compass, Calendar } from 'lucide-react';

interface Props {
  natalData: ChartData;
  transitData?: ChartData;
  modes?: string[];
  isSidereal?: boolean;
  ayanamsaType?: string;
  birthDate?: Date;
}

const VedicAnalysis: React.FC<Props> = ({ natalData, transitData, modes = ['zh'], isSidereal = true, ayanamsaType = 'Lahiri', birthDate }) => {
  const ascSign = natalData.ascendantSign;
  const props = ASCENDANT_PROPERTIES[ascSign];
  const dhanaYogas = checkDhanaYogas(natalData);
  const panchaYogas = checkPanchaMahapurushaYogas(natalData);
  const jaiminiYogas = checkJaiminiYogas(natalData);
  
  const [selectedHouseLordTab, setSelectedHouseLordTab] = React.useState<number>(1);
  const [expandAllHouseLords, setExpandAllHouseLords] = React.useState<boolean>(false);

  // Calculate All House Lords placements
  const allHouseLords = React.useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const houseNum = i + 1;
      const lordName = natalData.houses[i]?.lord;
      const placementHouse = (lordName && natalData.planets[lordName]) ? natalData.planets[lordName].house : null;
      const rules = (lordName && placementHouse) ? HOUSE_LORD_RULES[houseNum]?.[placementHouse] : null;
      const signName = getZodiacName(natalData.houses[i]?.sign, modes);
      return {
        houseNum,
        lordName,
        placementHouse,
        rules,
        signName
      };
    });
  }, [natalData, modes]);

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

  const sadeSatiPeriods = React.useMemo(() => {
    if (birthDate && natalMoonSign) {
      return calculateSadeSatiPeriods(birthDate, natalMoonSign, isSidereal, ayanamsaType);
    }
    return [];
  }, [birthDate, natalMoonSign, isSidereal, ayanamsaType]);

  const sav = natalData.sav as Record<number, number>;
  const saturnSign = natalData.planets['Saturn']?.sign || 1;
  const housesToSaturn = (saturnSign - ascSign + 12) % 12 + 1;
  
  let ascToSaturnSavSum = 0;
  if (sav) {
    for (let h = 1; h <= housesToSaturn; h++) {
      ascToSaturnSavSum += sav[h] || 0;
    }
  } else {
    ascToSaturnSavSum = housesToSaturn * 28;
  }
  
  const totalSAV = Object.values(sav || {}).reduce((a, b) => (a as number) + (b as number), 0) as number;
  const longevityYears = Math.floor((ascToSaturnSavSum * 7) / 27); 
  const longevityRem = Math.floor((ascToSaturnSavSum * 7) % 27); 
  const nakshatraName = NAKSHATRAS[longevityRem] || NAKSHATRAS[26];

  // Calculate danger year start search window
  const localBirthDate = (natalData as any).utcTime ? new Date((natalData as any).utcTime) : (birthDate || new Date());
  const searchStartDate = new Date(localBirthDate);
  searchStartDate.setFullYear(searchStartDate.getFullYear() + Math.max(0, longevityYears - 2));

  // Calculate Saturn transit
  const nextSaturnTransit = React.useMemo(() => {
    return findNextSaturnTransitToNakshatra(longevityRem, searchStartDate, isSidereal, ayanamsaType);
  }, [longevityRem, searchStartDate, isSidereal, ayanamsaType]);

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
              從命宮起算至本命土星宮位之SAV加總，乘以7後除以 27。商數為危險歲數，餘數為星宿索引。
            </div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-indigo-300 uppercase font-bold mb-1">對應歲數 (Danger Age)</div>
            <div className="text-3xl font-black text-rose-400">{longevityYears} 歲</div>
            <div className="text-[10px] text-gray-400 mt-1">此加總點數為: {ascToSaturnSavSum}</div>
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
            「此 Ashtakavarga 公式用於預測生命中的重大考驗點。商數 {longevityYears} 代表大約發生的歲數；當此時流年土星行經餘數對應之星宿 {nakshatraName} 時，代表命主在此歲數階段要特別注意大難死劫，將引發最強烈的業力回饋與壽數險關。」
          </p>
        </div>
        {nextSaturnTransit && (
          <div className="mt-6 p-4 bg-red-900/40 border border-red-500/50 rounded-xl">
            <div className="flex items-center gap-2 text-red-400 font-black mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>流年土星過運危險期預警 (Saturn Danger Transit)</span>
            </div>
            <p className="text-sm text-red-200">
              實際日期都已為您精算：當流年土星行經 <strong>{nakshatraName}</strong> 星宿時，會對命盤產生極凶的影響。
            </p>
            <div className="mt-2 text-xs text-red-100 font-mono bg-red-950/60 p-2.5 rounded border border-red-800/50 inline-block font-bold">
              極危險確實發生時間：{nextSaturnTransit.start.toLocaleDateString()} ~ {nextSaturnTransit.end.toLocaleDateString()}
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-4 italic">
          * 此計算基於 Ashtakavarga 總分支古典算法。餘數對應之星宿為流年土星行經時需注意之凶險死劫期。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* House Lords Placement */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-bold text-gray-800">12 宮主星落宮飛星全解析 (House Lord Placements)</h3>
            </div>
            <button
              onClick={() => setExpandAllHouseLords(!expandAllHouseLords)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                expandAllHouseLords
                  ? "bg-teal-600 text-white border-teal-600 shadow-md"
                  : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
              }`}
            >
              {expandAllHouseLords ? "🔍 點選切換「單宮精細解讀」" : "📋 一鍵展示「全十二宮飛星」"}
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            <strong>強制呈現與解釋 (Mandatory Rule Display)：</strong>
            吠陀占星中，各宮主星（House Lord）落入不同宮位代表該宮位的原始能量與人生範疇發生重大轉化。
            系統已為您精準算出所有 12 宮主的落宮飛星與觸發之占星格局規則，無任何省略或隱藏，全面解析如下：
          </p>

          {!expandAllHouseLords ? (
            <div className="space-y-4">
              {/* Tabs selector */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
                {allHouseLords.map((hl) => {
                  const isActive = selectedHouseLordTab === hl.houseNum;
                  return (
                    <button
                      key={hl.houseNum}
                      onClick={() => setSelectedHouseLordTab(hl.houseNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isActive
                          ? "bg-teal-600 text-white shadow-sm scale-105"
                          : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      <span>第 {hl.houseNum} 宮主</span>
                      {hl.lordName && (
                        <span className={`text-[10px] ${isActive ? "text-teal-200" : "text-gray-400"}`}>
                          ({getPlanetName(hl.lordName, modes)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Single tab content view */}
              {(() => {
                const hl = allHouseLords.find((h) => h.houseNum === selectedHouseLordTab);
                if (!hl) return null;

                const HOUSE_EXPLANATIONS: Record<number, string> = {
                  1: "命主星（1宮主）主掌身體健康、長相氣質、命運根基、活力與自我意識。",
                  2: "財帛宮主（2宮主）主掌財富累積、說話口才、家庭和睦與飲食習慣。",
                  3: "兄弟宮主（3宮主）主掌手足關係、勇氣與奮鬥意志、短途旅行、藝術手藝與傳播媒體。",
                  4: "田宅宮主（4宮主）主掌母親緣分、家庭和諧、住宅土地、車輛座駕與內心平靜。",
                  5: "子女宮主（5宮主）主掌子女福分、創意藝術、前世福報、高超智力與投資投機。",
                  6: "奴僕宮主（6宮主）主掌日常工作、競爭對手、小人阻礙、身體疾病與債務糾紛。",
                  7: "夫妻宮主（7宮主）主掌配偶關係、婚姻和諧、合夥生意、公共社交與國際貿易。",
                  8: "疾厄宮主（8宮主）主掌壽元大限、突發變化、偏財橫財、神秘科學與涅槃蛻變。",
                  9: "遷移宮主（9宮主）主掌天降福報、正法護航、父親緣分、長途旅行與高等學術教育。",
                  10: "官祿宮主（10宮主）主掌事業發展、社會名望、行政特權、政府關係與職業成就。",
                  11: "福德宮主（11宮主）主掌利潤偏利、願望達成、社交網絡人脈與多元收入管道。",
                  12: "玄秘宮主（12宮主）主掌精神解脫、海外因緣、幕後研究、慈善佈施與花銷消耗。"
                };

                return (
                  <div className="p-5 bg-teal-50/70 border border-teal-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="bg-teal-600 text-white text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        規則觸發 (Rule Matched)
                      </span>
                      <div className="font-extrabold text-teal-900 text-base sm:text-lg">
                        第 {hl.houseNum} 宮主星 ({getPlanetName(hl.lordName || "", modes)}) 飛入 第 {hl.placementHouse} 宮
                      </div>
                    </div>

                    <div className="mb-4 text-xs text-teal-800 bg-teal-100/50 p-3 rounded-lg border-l-4 border-teal-500 leading-relaxed">
                      <strong>宮位象徵與解析 (Rule Explanation)：</strong> {HOUSE_EXPLANATIONS[hl.houseNum]}
                      <br />
                      當其主星飛入【第 {hl.placementHouse} 宮】時，代表此人生範疇的強大能量會全力投向該宮的事務，產生如下命運徵兆：
                    </div>

                    {hl.rules ? (
                      <ul className="text-sm text-teal-950 font-medium space-y-2 list-disc pl-5 leading-relaxed bg-white/60 p-4 rounded-lg border border-teal-100/40">
                        {hl.rules.map((rule, idx) => (
                          <li key={idx} className="hover:text-teal-700 transition-colors">{rule}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg italic border border-dashed">
                        此星盤配置尚未定義此特定飛星規則（宮主星飛入對應宮位）。
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-1 scrollbar-thin">
              {allHouseLords.map((hl) => {
                const HOUSE_EXPLANATIONS: Record<number, string> = {
                  1: "命主星（1宮主）主掌身體健康、長相氣質、命運根基、活力與自我意識。",
                  2: "財帛宮主（2宮主）主掌財富累積、說話口才、家庭和睦與飲食習慣。",
                  3: "兄弟宮主（3宮主）主掌手足關係、勇氣與奮鬥意志、短途旅行、藝術手藝與傳播媒體。",
                  4: "田宅宮主（4宮主）主掌母親緣分、家庭和諧、住宅土地、車輛座駕與內心平靜。",
                  5: "子女宮主（5宮主）主掌子女福分、創意藝術、前世福報、高超智力與投資投機。",
                  6: "奴僕宮主（6宮主）主掌日常工作、競爭對手、小人阻礙、身體疾病與債務糾紛。",
                  7: "夫妻宮主（7宮主）主掌配偶關係、婚姻和諧、合夥生意、公共社交與國際貿易。",
                  8: "疾厄宮主（8宮主）主掌壽元大限、突發變化、偏財橫財、神秘科學與涅槃蛻變。",
                  9: "遷移宮主（9宮主）主掌天降福報、正法護航、父親緣分、長途旅行與高等學術教育。",
                  10: "官祿宮主（10宮主）主掌事業發展、社會名望、行政特權、政府關係與職業成就。",
                  11: "福德宮主（11宮主）主掌利潤偏利、願望達成、社交網絡人脈與多元收入管道。",
                  12: "玄秘宮主（12宮主）主掌精神解脫、海外因緣、幕後研究、慈善佈施與花銷消耗。"
                };

                return (
                  <div key={hl.houseNum} className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl hover:shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="font-extrabold text-teal-900 text-sm">
                          第 {hl.houseNum} 宮主 ({getPlanetName(hl.lordName || "", modes)}) 飛入 第 {hl.placementHouse} 宮
                        </div>
                        <span className="bg-teal-600/90 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0">
                          第 {hl.houseNum} 宮
                        </span>
                      </div>
                      <div className="text-[10px] text-teal-800 bg-teal-100/30 p-2 rounded mb-2.5 leading-tight">
                        <strong>宮位象徵：</strong> {HOUSE_EXPLANATIONS[hl.houseNum]}
                      </div>
                      {hl.rules ? (
                        <ul className="text-xs text-teal-950 font-medium space-y-1 list-disc pl-4 leading-relaxed">
                          {hl.rules.map((rule, idx) => (
                            <li key={idx}>{rule}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-[10px] text-gray-400 italic">無特定飛星規則解讀</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <div className="text-amber-900 font-bold">⚠️ 正處於 Sade Sati 期間</div>
              <div className="text-sm text-amber-700 mt-1">當前階段：{sadeSati.phase}</div>
              <p className="text-xs text-amber-600 mt-2">
                土星行經本命月亮前後宮位，通常伴隨著壓力、責任與轉變。
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
              <div className="text-green-900 font-bold">✅ 目前非 Sade Sati 期間</div>
              <p className="text-xs text-green-700 mt-1">流年土星未對本命月亮形成直接壓迫。</p>
            </div>
          )}
          
          {sadeSatiPeriods.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-2">📜 終生 Sade Sati 考驗期列表</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                {sadeSatiPeriods.map((period, idx) => {
                  const isCurrent = period.startDate <= new Date() && new Date() <= period.endDate;
                  const phaseLabel = period.phase === 1 ? '一 (12宮)' : period.phase === 2 ? '二 (1宮)' : '三 (2宮)';
                  return (
                    <div key={idx} className={`p-2.5 rounded-lg border text-xs ${isCurrent ? 'bg-amber-100 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${isCurrent ? 'text-amber-900' : 'text-gray-700'}`}>階段 {phaseLabel}</span>
                        <span className="text-gray-500 font-mono">
                          {period.startDate.toISOString().split('T')[0]} ~ {period.endDate.toISOString().split('T')[0]}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        土星進入 {getZodiacName(period.sign, modes)}
                        {isCurrent && <span className="ml-2 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">CURRENT</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
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
