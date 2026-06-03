import React, { useState } from 'react';
import { ASTROLOGY_RULES, AstrologyRule } from '../constants/astrologyRules';
import { Search, Info, BookOpen, Layers, Compass, Zap, Activity, ShieldAlert, Heart, Briefcase, Globe } from 'lucide-react';

export const RulesReference: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(ASTROLOGY_RULES.map(r => r.category)))];

  const filteredRules = ASTROLOGY_RULES.filter(rule => {
    const matchesSearch = rule.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         rule.interpretation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.conditions.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || rule.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Yoga': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'Divisional Chart': return <Layers className="w-5 h-5 text-blue-500" />;
      case 'Transit': return <Activity className="w-5 h-5 text-green-500" />;
      case 'Ashtakavarga': return <Compass className="w-5 h-5 text-purple-500" />;
      case 'Medical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'Predictive': return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case 'Arudha': return <Layers className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl">
        <h2 className="text-3xl font-extrabold mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          吠陀占星規則與邏輯手冊
        </h2>
        <p className="text-indigo-100 opacity-90 max-w-2xl">
          本手冊詳列系統所套用的各項核心規則與瑜伽格局。您可以透過關鍵字搜尋特定規則的構成條件與占星釋義。
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sticky top-20 z-20 bg-gray-50/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="搜尋規則名稱、條件或釋義..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule, idx) => (
            <div key={idx} className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {getCategoryIcon(rule.category)}
              </div>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  {getCategoryIcon(rule.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-full">
                      {rule.system} System
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full">
                      #{rule.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {rule.ruleName}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 構成條件 (Conditions)
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed font-medium">
                    {rule.conditions.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3" /> 星座釋義 (Interpretation)
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed italic">
                    「{rule.interpretation}」
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-gray-400">規則 ID: {rule.ruleName.split(' ')[0]}</span>
                <button className="text-xs font-bold text-indigo-500 hover:underline">查看詳細範例 &rarr;</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">找不到符合規則</p>
              <p className="text-gray-500">嘗試更換關鍵字或重設分類過濾。</p>
            </div>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              顯示全部規則
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesReference;
