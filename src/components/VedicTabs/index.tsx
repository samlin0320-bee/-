import React, { useState } from 'react';
import { ChartData } from '../../utils/astrology';

// Importing Tab Components
import { TabGrahas } from './TabGrahas';
import { TabUpagrahas } from './TabUpagrahas';
import { TabSensitivePoints } from './TabSensitivePoints';
import { TabArudhaPadas } from './TabArudhaPadas';
import { TabRelations } from './TabRelations';
// For others, we can reuse existing components passed down as props or imported if migrated
import AshtakavargaReport from '../AshtakavargaReport';
import TransitsEventLog from '../TransitsEventLog';

interface Props {
  chartData: ChartData;
  transitData: ChartData | null;
  chartModes: string[];
  // Reusable components from App.tsx passed as render functions
  renderShadbala: () => React.ReactNode;
  renderDashas: () => React.ReactNode;
  renderYogas: () => React.ReactNode;
  renderMisc: () => React.ReactNode;
}

const TABS = [
  { id: 'grahas', label: '1. 行星 (Grahas)' },
  { id: 'upagrahas', label: '2. 虛星 (Upagrahas)' },
  { id: 'sensitive-points', label: '3. 特殊點 (Points)' },
  { id: 'arudha-padas', label: '4. 映射 (Padas)' },
  { id: 'ashtakavarga', label: '5. 八分點 (SAV/BAV)' },
  { id: 'shadbala', label: '6. 星力 (Shadbala)' },
  { id: 'dashas', label: '7. 大運 (Dasha)' },
  { id: 'relations', label: '8. 敵友 (Relations)' },
  { id: 'yogas', label: '9. 瑜伽 (Yogas)' },
  { id: 'misc', label: '10. 其他 (Misc)' },
];

export const VedicDataTabs: React.FC<Props> = ({ 
  chartData, 
  transitData, 
  chartModes, 
  renderShadbala,
  renderDashas,
  renderYogas,
  renderMisc 
}) => {
  const [activeTab, setActiveTab] = useState('grahas');

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Scrollable Tabs Header */}
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-grow overflow-auto min-h-[600px]">
        {activeTab === 'grahas' && <TabGrahas data={chartData} modes={chartModes} />}
        {activeTab === 'upagrahas' && <TabUpagrahas data={chartData} modes={chartModes} />}
        {activeTab === 'sensitive-points' && <TabSensitivePoints data={chartData} modes={chartModes} />}
        {activeTab === 'arudha-padas' && <TabArudhaPadas data={chartData} modes={chartModes} />}
        {activeTab === 'ashtakavarga' && <AshtakavargaReport data={chartData} transitData={transitData} modes={chartModes} />}
        {activeTab === 'shadbala' && renderShadbala()}
        {activeTab === 'dashas' && renderDashas()}
        {activeTab === 'relations' && <TabRelations data={chartData} modes={chartModes} />}
        {activeTab === 'yogas' && renderYogas()}
        {activeTab === 'misc' && renderMisc()}
      </div>
    </div>
  );
};
