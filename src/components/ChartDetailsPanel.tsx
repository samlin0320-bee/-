import React, { useState } from 'react';
import { ChartData } from '../utils/astrology';
import { checkGeneralYogas, checkPanchaMahapurushaYogas, checkJaiminiYogas, checkDhanaYogas } from '../utils/rulesEngine';

interface ChartDetailsPanelProps {
  data: ChartData;
}

const ChartDetailsPanel: React.FC<ChartDetailsPanelProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('yogas');

  const tabs = [
    { id: 'yogas', label: '瑜伽 (Yogas)' },
    { id: 'ashtakavarga', label: '八分点 (Ashtakavarga)' },
    { id: 'd11', label: 'D11 灾厄盘 (Rudramsa)' },
  ];

  const renderYogas = () => {
    const generalYogas = checkGeneralYogas(data);
    const panchaYogas = checkPanchaMahapurushaYogas(data);
    const jaiminiYogas = checkJaiminiYogas(data);
    const dhanaYogas = checkDhanaYogas(data);

    const allYogas = [...generalYogas, ...panchaYogas, ...jaiminiYogas, ...dhanaYogas];

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">瑜伽 (Yoga)</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">含义 (Meaning)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allYogas.map((yoga, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{yoga.name}</td>
                <td className="px-4 py-2 text-gray-700">{yoga.description}</td>
              </tr>
            ))}
            {allYogas.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-4 text-center text-gray-500">未形成特定瑜伽</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAshtakavarga = () => {
    if (!data.sav || !data.bav) return <div className="p-4 text-gray-500">计算中...</div>;

    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    const signs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return (
      <div className="overflow-x-auto">
        <h4 className="font-bold text-gray-800 mb-2">综合八分位 (SAV) & 单星八分位 (BAV)</h4>
        <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 font-medium text-gray-500">星曜 \ 星座</th>
              {signs.map(s => <th key={s} className="px-2 py-2 font-medium text-gray-500">{s}</th>)}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planets.map(p => (
              <tr key={p} className="hover:bg-gray-50">
                <td className="px-2 py-2 font-medium text-gray-900">{p}</td>
                {signs.map(s => {
                  const score = data.bav![p][s - 1];
                  return (
                    <td key={s} className={`px-2 py-2 ${score >= 5 ? 'text-green-600 font-bold' : score <= 3 ? 'text-red-600' : 'text-gray-700'}`}>
                      {score}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td className="px-2 py-2 text-gray-900">SAV</td>
              {signs.map(s => {
                const score = data.sav![s - 1];
                return (
                  <td key={s} className={`px-2 py-2 ${score >= 30 ? 'text-green-600' : score < 25 ? 'text-red-600' : 'text-gray-900'}`}>
                    {score}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderD11 = () => {
    const d11Config = data.vargas.find(v => v.id === 'D11');
    if (!d11Config) return <div className="p-4 text-gray-500">D11 数据不可用</div>;

    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    
    return (
      <div className="overflow-x-auto">
        <div className="mb-4 text-sm text-gray-700">
          <p><strong>D11 灾厄盘 (Rudramsa)</strong> 主要用于分析生命中的突发事件、灾难、斗争、胜利以及第11宫相关的收益。</p>
          <p><strong>上升星座 (Ascendant):</strong> {d11Config.ascendantSign}</p>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">星曜 (Planet)</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">星座 (Sign)</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">宫位 (House)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planets.map(p => {
              const sign = d11Config.planets[p]?.sign;
              if (!sign) return null;
              const house = ((sign - d11Config.ascendantSign + 12) % 12) + 1;
              return (
                <tr key={p} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{p}</td>
                  <td className="px-4 py-2 text-gray-700">{sign}</td>
                  <td className="px-4 py-2 text-gray-700">{house}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'yogas' && renderYogas()}
        {activeTab === 'ashtakavarga' && renderAshtakavarga()}
        {activeTab === 'd11' && renderD11()}
      </div>
    </div>
  );
};

export default ChartDetailsPanel;
