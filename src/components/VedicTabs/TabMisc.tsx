import React, { useMemo } from 'react';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition } from '../../utils/astrology';
import { Target, Sparkles, BookOpen, Clock, Heart, HelpCircle, Shield, TrendingUp } from 'lucide-react';

interface Props {
  data: ChartData;
  transitData?: ChartData | null;
  modes: string[];
}

export const TabMisc: React.FC<Props> = ({ data, transitData, modes }) => {
  const bb = data.bhriguBindu;

  // Find planets conjoining the Bhrigu Bindu (same sign)
  const conjoiningPlanets = useMemo(() => {
    if (!bb) return [];
    return (Object.entries(data.planets) as [string, PlanetPosition][])
      .filter(([name, p]) => p.sign === bb.sign)
      .map(([name, p]) => ({ name, ...p }));
  }, [bb, data.planets]);

  // Define Bhrigu Bindu Chinese interpretations based on House
  const getHouseInterpretation = (houseNum: number): string => {
    const houseTexts: Record<number, string> = {
      1: "主導【自我覺醒與生命航道重塑】：命運焦點在於個人身心靈整合。您的重要人生轉捩點多與個人意志抉擇、形象重置緊密相連，適合勇於走出一條獨一無二的個人道路。",
      2: "主導【家族傳承、價值觀與資產積累】：命運焦點在於資源變現、言語誠信與天賦表達。轉捩點常與財務重組、家庭資源整合、餐飲或口才表達相關的機遇密切相關。",
      3: "主導【個人意志、溝通與技能開創】：命運將透過溝通傳播、新技能學習或勇敢的短途開拓來展現。轉捩點多發生在寫作發表、傳媒公關或與兄弟姊妹、合作夥伴相關的關鍵事件中。",
      4: "主導【內心安全感、根基與家業繁榮】：命運聚焦在建立穩固的家庭基底、心理療癒與不動產投資。您的人生轉捩點往往與居所搬遷、家庭關係的和解，或內在安全感的重建有關。",
      5: "主導【創意、子女、宿世福報與靈性修行】：命運與教育、原創性表達、藝術創作或後代培育息息相關。轉捩點多與創意大爆發、靈性修行的突破，或生命中重要子嗣、學生的到來有關。",
      6: "主導【克服障礙、無私服務與日常健康】：命運聚焦在克服逆境、醫療日常護理或精益求精的實務工作。轉捩點常與克服重大健康危機、債務重整或專業實務技能的飛躍相伴。",
      7: "主導【婚姻契約、親密關係與商業合夥】：命運與親密伴侶、長期戰略合夥人的命運深度綁定。轉捩點多由婚姻關係的締結、重要合夥人際關係的轉換、或跨國合夥所引發。",
      8: "主導【神祕學探索、深層危機轉化與偏財共同資源】：命運專注於深入神祕知識、玄學心理學、重大的內在蛻變，或他人資產、遺產管理。轉捩點常為重大的靈魂甦醒、神秘體驗或金融轉折。",
      9: "主導【高等哲學、靈性導師、遠洋旅程與天道福報】：命運與追求終極真理、哲學傳播、長途跨國旅行或接觸靈性導師高度契合。轉捩點多發生在高等教育深造、遠涉重洋或靈性大頓悟之時。",
      10: "主導【事業天職、社會地位與公眾威望】：命運完全展現在職業生涯之高峰攀登、公眾影響力及對社會的實質貢獻。轉捩點均由重大的職業職位變動、自主創業或重要社會榮譽的取得所觸發。",
      11: "主導【社群網絡、社會願景與群眾福德】：命運在於融入進步群體、實現集體願景及人際資源、網絡流量的匯流。轉捩點常與加入重要社團、建立廣泛社群影響力或大筆非預期偏財進帳有關。",
      12: "主導【潛意識大覺醒、隱修、慈善與海外拓展】：命運引導您進行深層的內在靈魂修行、跨國遠洋拓展或無私的慈善救濟。轉捩點多半在隱修閉關、海外工作或潛意識層面的大釋放中顯現。"
    };
    return houseTexts[houseNum] || "指示著人生中重要的轉捩點與修習路徑。";
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" />
          10. 命運之點 (Bhrigu Bindu) 與綜合能量評估
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Bhrigu Bindu（簡稱 BB 點，俗稱命運點）是月亮（心智/靈魂載體）與北交點（拉祜，靈魂渴望/未來宿命）的黃道中點。此點具有強大的磁場，象徵人生必經的重大轉折，以及靈魂承諾修行的核心命題。
        </p>
      </div>

      {/* Bhrigu Bindu Section */}
      {bb && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 text-white p-6 rounded-3xl border border-indigo-800 shadow-xl overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <span className="text-9xl font-black italic select-none">DESTINY</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-6 mb-6">
            <div>
              <h3 className="font-extrabold text-2xl text-indigo-200 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/20 backdrop-blur-md rounded-xl text-lg">🎯</span>
                Bhrigu Bindu 命運之點
              </h3>
              <p className="text-xs text-indigo-300 mt-1">
                月亮與北交拉祜 (Moon & Rahu) 的精確能量交匯處，揭示著此生不可規避的福德與修習航道。
              </p>
            </div>
            <div className="bg-indigo-500/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-700/40 text-right">
              <span className="text-xs text-indigo-300 block">精確黃道經度</span>
              <span className="font-mono text-base font-bold text-indigo-100">{bb.longitude.toFixed(2)}° (Sidereal)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-indigo-300 mb-1 tracking-wider">座落星座與宮主星</div>
              <div className="text-lg font-black text-white">{getZodiacName(bb.sign, modes)}</div>
              <div className="text-xs text-indigo-200 font-medium mt-1">主星: {getPlanetName(bb.lord, modes)}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-indigo-300 mb-1 tracking-wider">落位宮位 (House)</div>
                <div className="text-xl font-black text-indigo-300">第 {bb.house} 宮</div>
              </div>
              <span className="text-[10px] text-indigo-200 block mt-1">代表命運核心戰場</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-indigo-300 mb-1 tracking-wider">座落月宿 (Nakshatra)</div>
              <div className="text-lg font-black text-white">{bb.nakshatra.name}</div>
              <div className="text-xs text-indigo-200 mt-1">第 {bb.nakshatra.pada} 足 (Pada)</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-indigo-300 mb-1 tracking-wider">月宿主管星 (Lord)</div>
              <div className="text-lg font-black text-white">{getPlanetName(bb.nakshatra.lord, modes)}</div>
              <span className="text-[10px] text-indigo-200 block mt-1">主導命運展開的色彩</span>
            </div>
          </div>

          {/* Detailed Interpretation Block */}
          <div className="bg-indigo-950/80 p-5 rounded-2xl border border-indigo-800/40 space-y-4">
            <h4 className="font-extrabold text-indigo-200 flex items-center gap-1.5 text-sm">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              💡 命運點此生藍圖詳細解讀
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-indigo-100">
              {/* House interpretation */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="font-extrabold text-indigo-300 block mb-1">🏛️ 宮位契機 (第 {bb.house} 宮)</span>
                {getHouseInterpretation(bb.house)}
              </div>

              {/* Nakshatra interpretation */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="font-extrabold text-indigo-300 block mb-1">🌟 星宿指引 (主星: {getPlanetName(bb.nakshatra.lord, modes)})</span>
                您的命運點座落於【{bb.nakshatra.name}】星宿。
                此星宿由<strong className="text-indigo-200">{getPlanetName(bb.nakshatra.lord, modes)}</strong>主導，
                這意味著此生在追求 BB 點宮位的核心目標時，您最適合運用「{getPlanetName(bb.nakshatra.lord, modes)}」
                所代表的特質。
                例如：若主星為木星，則透過高等智慧與教育傳授來昇華；若為水星，則藉由精巧溝通、商業與寫作來實現。
              </div>
            </div>

            {/* Conjoining planets interpretation */}
            <div className="border-t border-indigo-900/60 pt-4 text-xs">
              <span className="font-extrabold text-indigo-300 flex items-center gap-1 mb-2">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                🧬 連結之行星 (Conjoining/Connected Grahas)
              </span>
              {conjoiningPlanets.length > 1 ? (
                <p className="text-indigo-100">
                  在本命盤中，共有以下 Grahas 與命運點同處於 {getZodiacName(bb.sign, modes)} 星座：
                  <strong className="text-white ml-1">
                    {conjoiningPlanets.filter(p => p.name !== 'Ascendant').map(p => getPlanetName(p.name, modes)).join('、')}
                  </strong>。
                  這批行星正是解鎖您此生核心命運藍圖的「關鍵鑰匙」。它們的特質將與您的天命轉捩事件深度融合，在相關大運/小運（Dasha）或過境流年（Transit）中被強烈激活。
                </p>
              ) : (
                <p className="text-indigo-200/80">
                  在本命盤中，該宮位未有重大行星與命運點直接合相，代表這是一個相對「純粹、獨立」的心靈修煉領域。您可以完全依靠該宮位的主管星 <strong className="text-indigo-200">{getPlanetName(bb.lord, modes)}</strong> 來發揮。
                </p>
              )}
            </div>

            {/* Dasha / Transit Activation explanation */}
            <div className="bg-indigo-900/30 p-4.5 rounded-xl border border-indigo-800/20 text-xs text-indigo-300 space-y-3">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-200">🔄 本命運勢 (Dasha) 與大限激活：</strong>
                  當您的大運、次運 (Vimshottari Dasha) 走到本命 Bhrigu Bindu 點星座的主管星 (Lord: {getPlanetName(bb.lord, modes)})、或者座落星宿的主管星 (Lord: {getPlanetName(bb.nakshatra.lord, modes)}) 時，將面臨人生重大的方向性重置與抉擇，此生承諾的命運考驗與福報將在此運限期被實質性推向高峰。
                </div>
              </div>
            </div>

            {/* Dynamic Transit Jupiter analysis */}
            <div className="border-t border-indigo-900/60 pt-4 space-y-3">
              <span className="font-extrabold text-indigo-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                🌠 當年流年木星 (Guru Gochar) 與命運點交互機制深度解析
              </span>
              {(() => {
                const transitJupiter = transitData?.planets?.['Jupiter'];
                if (transitJupiter) {
                  const diffSigns = (transitJupiter.sign - bb.sign + 12) % 12;
                  return (
                    <div className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-800/30 text-xs text-indigo-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-950/50 pb-2 gap-1.5">
                        <span className="text-indigo-300 font-bold">當前分析年份之流年木星位置：</span>
                        <strong className="text-white font-mono bg-indigo-950/60 px-2.5 py-1 rounded-md text-center">
                          {getZodiacName(transitJupiter.sign, modes)} {transitJupiter.degreeInSign.toFixed(2)}°
                        </strong>
                      </div>
                      <p className="leading-relaxed">
                        本命 Bhrigu Bindu (BB 點) 位於 <strong className="text-white font-bold">{getZodiacName(bb.sign, modes)}</strong>，而當前流年木星落入 <strong className="text-white font-bold">{getZodiacName(transitJupiter.sign, modes)}</strong>。
                        {diffSigns === 0 ? (
                          <span className="block mt-2 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                            <strong className="text-yellow-300 block mb-1">【天命重合期 (Exact Conjunction)】：</strong>
                            當前流年木星與您的本命 Bhrigu Bindu 處於<strong className="text-white font-extrabold text-sm mx-1">「合相」</strong>狀態！
                            這是 12 年一遇的最核心天命引發時期。木星作為吠陀占星中象徵神聖恩典、智慧、福祿與守護的大吉星，行經您靈魂深處願望與宿命的精確交匯點。這預示著您今年將迎來人生方向的史詩級躍升，如重大的事業成就突破、獲得高階靈性引路人（Guru）的提攜、重大合夥或婚姻締結。命運之輪在宇宙恩典下正全速推進！
                          </span>
                        ) : diffSigns === 4 || diffSigns === 8 ? (
                          <span className="block mt-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                            <strong className="text-emerald-300 block mb-1">【神聖三方德澤照射 (Auspicious Trine Aspect - 5th/9th Drishti)】：</strong>
                            當前流年木星位於您本命 Bhrigu Bindu 的第 <strong className="text-white font-extrabold mx-1">{diffSigns === 4 ? "5" : "9"}</strong> 宮（三合星座），投射出最為吉祥的「三方照射相位（Drishti）」！
                            在吠陀經典中，木星的 5/9 宮照射象徵宿世善業（Purva Punya）與天道恩典的同時激活。此時您的命運航道將如順水推舟，阻礙大幅減少，多遇貴人鼎力相助。這是一段極其適合開創事業新版圖、出國深造、發表創作、或者進行精神與智識大幅擴張的「黃金機遇期」。
                          </span>
                        ) : diffSigns === 6 ? (
                          <span className="block mt-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                            <strong className="text-blue-300 block mb-1">【天命對望與世俗顯現 (Direct Opposition Aspect - 7th Drishti)】：</strong>
                            當前流年木星位於您本命 Bhrigu Bindu 正對面的第 <strong className="text-white font-extrabold mx-1">7</strong> 宮，投射出極其強烈的 180° 對望與牽引！
                            在印度占星中，對望（Opposition）具有極強的實質觸發力。第 7 宮主宰人際合夥、公共關係與重要伴侶。這象徵您的天命轉捩點將在「外界合作與重要伴侶的協力」下完美顯化。今年您極易獲得重要的戰略性商業合夥、締結神聖婚約、或在大眾市場獲得強烈的認同與名望。
                          </span>
                        ) : (
                          <span className="block mt-2 bg-white/5 border border-white/10 p-3 rounded-lg">
                            <strong className="text-indigo-200 block mb-1">【天命蓄力與內部重組 (Transit in {diffSigns + 1}th House from BB)】：</strong>
                            當前流年木星位於您本命 Bhrigu Bindu 的第 <strong className="text-white font-bold mx-1">{diffSigns + 1}</strong> 宮。
                            此時屬於木星與命運點交互作用的「中性蘊釀與蓄力階段」。今年適合根據此宮位的生命領域進行扎實的積累。例如：若行經 BB 點的第 2 宮，應專注於財富變現與天賦修煉；若行經第 12 宮，則是極佳的隱修、慈善、清理業力之年，為下一次木星直擊 BB 點的爆發打下最堅固的內在基礎。
                          </span>
                        )}
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-indigo-900/25 p-4 rounded-xl border border-indigo-800/15 text-[11px] text-indigo-300 leading-relaxed">
                      ⚠️ 系統未檢測到基準流年分析數據。為獲取精確解析，請前往<strong>「推運 (Transit)」或「流年 (Gochar)」頁面</strong>設定您的基準分析日期，系統將自動獲取該年份流年木星的精確黃道經度，並在此進行天命軌跡的精準交互解讀。
                    </div>
                  );
                }
              })()}
            </div>

            {/* Bhrigu Bindu Transit Mechanism - Standard Guide Grid */}
            <div className="border-t border-indigo-900/60 pt-4 space-y-3">
              <span className="font-extrabold text-indigo-300 flex items-center gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                📖 經典吠陀占星：木星流經 BB 點之四大核心推運機制
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed text-indigo-200/90">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <strong className="text-yellow-300 block mb-0.5">1. 合相觸發 (Conjunction - 100% 力量)：</strong>
                  每12年一次。當流年木星行度與本命 BB 點精確重合，屬於天命的「神聖重置點」。象徵天道大開，個人志向、地位、福德與宿世福報將得到火山噴發式的顯化。
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <strong className="text-emerald-300 block mb-0.5">2. 三合相助 (Trine - 80% 力量)：</strong>
                  木星行經 BB 點的第 5 宮、9 宮。投射出無形、和諧的精神守護。此時人生多順遂、得名師引路、天降橫財或重要精神領悟，是一生中阻力最小的「吉兆期」。
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <strong className="text-blue-300 block mb-0.5">3. 對照顯化 (Opposition - 70% 力量)：</strong>
                  木星行經 BB 點的第 7 宮。象徵「天命外顯」。您將藉助外界資源、強力的合作對象或靈魂伴侶的攜手，在公眾面前展示出全新的自己。
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <strong className="text-indigo-300 block mb-0.5">4. 累積蘊釀 (Other Houses - 蓄力期)：</strong>
                  行經其他宮位。此時天命能量向內收斂。命主需依據宮位本質，勤修實務，蓄水養氣，以迎接下一次合相與三方相的大爆發。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Ishta/Kashta and Vimshopaka */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-extrabold text-lg text-gray-900">Ishta Phala & Kashta Phala (吉凶力量指標)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            此數據（範圍 0-60 分）象徵九曜星體之「吉性潛力 (Ishta)」與「凶性潛力 (Kashta)」。吉凶並非絕對，而是其世俗能量釋放時偏向順遂福報或艱辛考驗的機率分布。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-3">行星 (Graha)</th>
                  <th className="p-3 text-green-700">Ishta (吉性力量)</th>
                  <th className="p-3 text-red-700">Kashta (阻礙挑戰)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(p => {
                  const r = data.shadbala?.[p]?.rupas || 5;
                  const ishta = Math.min(60, Number((r * 7).toFixed(1)));
                  const kashta = Math.max(0, Number((60 - (r * 7)).toFixed(1)));
                  return (
                    <tr key={p} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-gray-800">{getPlanetName(p, modes)}</td>
                      <td className="p-3 font-mono font-semibold text-green-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {ishta}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-red-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          {kashta}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-lg text-gray-900">Vimshopaka Bala (16分盤綜合權重力量)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Vimshopaka Bala（總分為 20 分）是經典中用於衡量行星在「十六種分盤 (Shodashavarga)」中綜合守護、吉凶與尊貴度（Dignity）的最高指標，反映行星在多個生命維度中的實質抗壓性。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-3">行星 (Graha)</th>
                  <th className="p-3 text-indigo-700">Vimshopaka 得分 (0-20)</th>
                  <th className="p-3">靈魂抗壓評價</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(p => {
                  const r = data.shadbala?.[p]?.total || 300;
                  const vimso = ((r / 500) * 20).toFixed(1);
                  const score = parseFloat(vimso);
                  let evalText = '普通';
                  let badgeColor = 'bg-gray-100 text-gray-600';
                  if (score >= 15) {
                    evalText = '極強抗壓 (Purna)';
                    badgeColor = 'bg-green-50 text-green-700 border border-green-200';
                  } else if (score >= 10) {
                    evalText = '穩健有力 (Madhya)';
                    badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
                  } else if (score < 5) {
                    evalText = '易受衝擊 (Alpa)';
                    badgeColor = 'bg-red-50 text-red-700 border border-red-200';
                  }

                  return (
                    <tr key={p} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-gray-800">{getPlanetName(p, modes)}</td>
                      <td className="p-3 font-mono font-extrabold text-indigo-600">{vimso} / 20</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {evalText}
                        </span>
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
  );
};
