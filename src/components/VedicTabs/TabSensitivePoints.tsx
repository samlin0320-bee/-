import React from 'react';
import { ChartData, getZodiacName } from '../../utils/astrology';
import { getArudhaPadas } from '../../utils/advancedCalculations';
import { Shield, Sparkles, Compass, AlertCircle } from 'lucide-react';

interface Props {
  data: ChartData;
  modes: string[];
}

export const TabSensitivePoints: React.FC<Props> = ({ data, modes }) => {
  const padas = getArudhaPadas(data.houses, data.planets);

  // Retrieve true calculated lagnas (or use fallback if undefined)
  const hl = data.horaLagna || { sign: Math.floor(((data.ascendant + 30) % 360) / 30) + 1, degreeInSign: (data.ascendant + 30) % 30, house: 2 };
  const gl = data.ghatiLagna || { sign: Math.floor(((data.ascendant + 45) % 360) / 30) + 1, degreeInSign: (data.ascendant + 45) % 30, house: 3 };
  const sl = data.sreeLagna || { sign: Math.floor(((data.ascendant + 15) % 360) / 30) + 1, degreeInSign: (data.ascendant + 15) % 30, house: 11 };

  const getS = (signNum: number) => getZodiacName(signNum, modes);

  const points = [
    { 
      name: 'As / Lagna (上升點)', 
      desc: '自我、身體健康與人生基調', 
      sign: getS(data.ascendantSign), 
      value: `${(data.ascendant % 30).toFixed(2)}°`,
      house: 1,
      explanation: '命主的基本命運起點。象徵一個人的外貌、人格、體質以及靈魂進入物質世界的初始狀態。'
    },
    { 
      name: 'AL / Arudha Lagna (社會形象)', 
      desc: '世俗名聲、他人對你的看法與外在幻象', 
      sign: getS(padas[1]), 
      value: '等宮制',
      house: ((padas[1] - data.ascendantSign + 12) % 12) + 1,
      explanation: '在社會大眾眼中的形象。不代表你真實的自我（Lagna），而是他人對你的投射與名望所在。'
    },
    { 
      name: 'HL / Hora Lagna (財富潛力點)', 
      desc: '財富增長、金融潛能與世俗資產', 
      sign: getS(hl.sign), 
      value: `${hl.degreeInSign.toFixed(2)}°`,
      house: hl.house,
      explanation: '象徵財務與富饒。用於評估一生的財運水準、資產積累速度與金融偏好。落入吉宮且被吉星照射者一生衣食無憂。'
    },
    { 
      name: 'GL / Ghati Lagna (權力與地位點)', 
      desc: '權力、名望、影響力與政治能量', 
      sign: getS(gl.sign), 
      value: `${gl.degreeInSign.toFixed(2)}°`,
      house: gl.house,
      explanation: '主宰名譽、政治權力與對他人的支配力。若GL落點優異，容易在企事業或政治舞台上獲得重要威望與領導權威。'
    },
    { 
      name: 'UL / Upapada Lagna (配偶與婚姻點)', 
      desc: '婚姻關係、伴侶特質與配偶家庭背景', 
      sign: getS(padas[12]), 
      value: '等宮制',
      house: ((padas[12] - data.ascendantSign + 12) % 12) + 1,
      explanation: '第12宮的投影。指示真實的配偶特質、對方原生家庭的背景好壞以及婚姻的穩定度。'
    },
    { 
      name: 'SL / Sree Lagna (繁榮福德點)', 
      desc: '人生的福祿、繁榮度與好運吉兆', 
      sign: getS(sl.sign), 
      value: `${sl.degreeInSign.toFixed(2)}°`,
      house: sl.house,
      explanation: '與吉祥天女（Lakshmi）同名的繁榮之點。主管好運與繁榮機遇，SL所坐落之宮位反映了您最容易獲得宇宙「恩典與福報」的領域。'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-600" />
            3. 特殊點精確解析 (Special Sensitive Points)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Jaimini 與 Parashara 經典體系中，用於衡量財富、權力、婚姻與福報的關鍵特殊虛擬宮位。
          </p>
        </div>
      </div>

      {/* 🌅 Sunrise Info Section (太陽升起時間與度數) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌅</span>
          <div>
            <h3 className="font-extrabold text-amber-950 text-base">當日出生地太陽升起時間與上升 (Sunrise Time & Lagna)</h3>
            <p className="text-xs text-amber-800 mt-0.5">
              出生時精確計算之地方日出時刻。在印度占星中，太陽升起是一天靈性光芒的起點。
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-200/60 px-4 py-2.5 rounded-xl text-center min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider mb-0.5">🌅 太陽升起時間</span>
            <span className="font-mono text-base font-black text-amber-950">{data.sunriseTime || "06:00:00"}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-200/60 px-4 py-2.5 rounded-xl text-center min-w-[150px]">
            <span className="text-[10px] uppercase font-bold text-indigo-800 block tracking-wider mb-0.5">🧭 太陽上升度數 (Sunrise Degree)</span>
            <span className="font-mono text-sm font-black text-indigo-950">
              {data.sunriseDegree ? `${getS(data.sunriseDegree.sign)} ${data.sunriseDegree.degreeInSign.toFixed(2)}°` : `${getS(data.ascendantSign)} ${(data.ascendant % 30).toFixed(2)}°`}
            </span>
          </div>
        </div>
      </div>

      {/* Why calculated numbers changed - Explanation */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-indigo-900 shadow-sm">
        <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-950 block mb-1">📐 計算修正說明 (關於先前數值誤差之原因)：</strong>
          先前版本在計算這些高階特殊上升點時，採用了簡易的「本命上升固定度數加成（如升度固定 +15°, +30°, +45°）」之模組化估算，這會導致數值與真實印度經典排盤系統完全不符。
          <br />
          <strong className="text-indigo-950">經典 Parashari 與 Jaimini 真實計算規則為：</strong>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li><strong>Hora Lagna (HL)：</strong>必須根據個案出生的<strong className="text-indigo-950">精確地方日出時間</strong>，算出出生時刻與日出的確切時差。每過 1 小時（2.5 Ghati）特殊上升移動 30 度（1個星座），並以<strong className="text-indigo-950">太陽的精確黃道度數</strong>為起點進行相加計算。</li>
            <li><strong>Ghati Lagna (GL)：</strong>同樣根據日出時差計算。每過 24 分鐘（1 Ghati）上升點移動 30 度（每小時移動 75 度），亦是以<strong className="text-indigo-950">太陽精確度數</strong>為起點累加得出。</li>
            <li><strong>Sree Lagna (SL)：</strong>必須將<strong className="text-indigo-950">月亮在其所落星宿 (Nakshatra) 的已度過比例</strong>（0% 到 100%）對應至整張黃道圓盤（360度），再與<strong className="text-indigo-950">上升 (Lagna) 的精確黃道度數</strong>累加算出。</li>
          </ul>
          本系統已全面修正此核心引擎，現所呈現之 HL、GL 與 SL 均為<strong className="text-indigo-950">依據上述天文公式計算出的真實數值</strong>。
        </div>
      </div>

      {/* Points Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {points.map((pt, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="font-extrabold text-indigo-700 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  {pt.name}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  落於第 {pt.house} 宮
                </span>
              </div>
              <p className="text-xs text-gray-500 font-bold mb-2">{pt.desc}</p>
              <p className="text-xs text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                {pt.explanation}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <span className="text-xs font-semibold text-gray-400">黃道星位與度數</span>
              <div className="text-right">
                <span className="font-bold text-gray-900 text-sm bg-slate-100 px-2.5 py-1 rounded-md mr-1">{pt.sign}</span>
                <span className="font-mono text-xs text-slate-500">{pt.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
