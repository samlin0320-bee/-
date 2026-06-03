import React, { useState } from 'react';
import { ChartData } from '../../utils/astrology';
import { REPORT_PROMPTS } from '../../constants/prompts';

interface Props {
  data: ChartData;
}

export const TabReportPrompts: React.FC<Props> = ({ data }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(REPORT_PROMPTS[0]);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartData: data,
          prompt: selectedPrompt.content
        })
      });
      const result = await response.json();
      setReport(result.report);
    } catch (error) {
      setReport("生成報告時發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">🤖 智能占星報告助理</h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        {REPORT_PROMPTS.map((p) => (
          <button
            key={p.title}
            onClick={() => setSelectedPrompt(p)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPrompt.title === p.title
                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-indigo-100'
            }`}
          >
            <h3 className="font-bold text-gray-900">{p.title}</h3>
          </button>
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
        <h4 className="font-bold mb-2">選定指令：</h4>
        <p>{selectedPrompt.content}</p>
      </div>

      <button
        onClick={generateReport}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? '正在啟動星盤解析…' : '產生報告內容'}
      </button>

      {report && (
        <div className="mt-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-indigo-900">分析報告：</h3>
          <div className="prose text-gray-800 whitespace-pre-line">{report}</div>
        </div>
      )}
    </div>
  );
};
