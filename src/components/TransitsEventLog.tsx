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

const TransitsEventLog: React.FC<Props> = ({ natalData, modes = ['zh'], onReport }) => {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);
  const [transitData, setTransitData] = useState<ChartData | null>(null);
  const [interpretations, setInterpretations] = useState<TransitInterpretation[]>([]);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>(['Jupiter', 'Saturn', 'Rahu', 'Ketu']);

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
    <div className="space-y-8 pb-20">
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
              {['Sun', 'Moon', 'Mars', 'Mercury', 'Venus', 'Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto'].map(p => (
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
