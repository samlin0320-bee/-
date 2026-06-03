import React from 'react';
import { ChartData, getPlanetName, getZodiacName, getDignityName } from '../utils/astrology';
import { getTransitInterpretations, TransitInterpretation } from '../utils/rulesEngine';
import { CheckCircle, AlertCircle, Calendar, Star, TrendingUp, Shield, Activity, Info, Download } from 'lucide-react';

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

  const exportReport = () => {
    const content = `
星盤推運分析報告
分析日期: ${transitDate}
姓名: ${natalData.name || '未命名'}

[關鍵趨勢]
${interpretations.map(i => `- ${i.category}: ${i.rule} -> ${i.result}`).join('\n')}

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
