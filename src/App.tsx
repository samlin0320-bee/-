import React, { useState, useEffect } from 'react';
import { calculateChart, ChartData, getPlanetName, getZodiacName, calculateGochar, PlanetPosition, getFriendshipName, getDignityName, getPlanetProperties, getFunctionalDignity, getFunctionalDignityName, getFunctionalDignityColor } from './utils/astrology';
import VedicAnalysis from './components/VedicAnalysis';
import SouthIndianChart from './components/SouthIndianChart';
import { Download, Upload, Shield as ShieldIcon, Info } from 'lucide-react';
import NorthIndianChart from './components/NorthIndianChart';
import WesternChart from './components/WesternChart';
import MedicalReport from './components/MedicalReport';
import AspectGrid from './components/AspectGrid';
import AshtakavargaReport from './components/AshtakavargaReport';
import GocharaReport from './components/GocharaReport';
import { Calendar, Clock, MapPin, Settings, FileText, LayoutDashboard, Plus, Trash2, Search, Save, User, FolderOpen, LogIn, LogOut, Tag, X, Code, Globe, Sun as SunIcon } from 'lucide-react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, Timestamp, User as FirebaseUser } from './firebase';

interface Rule {
  id: string;
  planet: string;
  condition: 'in_house' | 'in_sign' | 'is_retrograde';
  value: number | boolean;
}

import TransitsEventLog from './components/TransitsEventLog';
import ChartDetailsPanel from './components/ChartDetailsPanel';
import TransitMasterReport from './components/TransitMasterReport';

import { TabGrahas } from './components/VedicTabs/TabGrahas';
import { TabUpagrahas } from './components/VedicTabs/TabUpagrahas';
import { TabSensitivePoints } from './components/VedicTabs/TabSensitivePoints';
import { TabArudhaPadas } from './components/VedicTabs/TabArudhaPadas';
import { TabRelations } from './components/VedicTabs/TabRelations';
import { TabShadbala } from './components/VedicTabs/TabShadbala';
import { TabMisc } from './components/VedicTabs/TabMisc';
import { TabReportPrompts } from './components/VedicTabs/TabReportPrompts';
import RulesReference from './components/RulesReference';
import ChartLegend from './components/ChartLegend';

interface SavedChart {
  id: string;
  name: string;
  date: string;
  time: string;
  lat: string;
  lng: string;
  isSidereal: boolean;
  ayanamsaType?: string;
  tags?: string[];
  userId: string;
  createdAt: any;
  birthData?: {
    location?: string;
  };
}

const VARGA_FOCUS: Record<string, string> = {
  'D1': '主盤 (Rasi)：整體命運、身體、外在發展。',
  'D2': '二分盤 (Hora)：財富、資產累積。',
  'D3': '三分盤 (Drekkana)：手足、勇氣、努力、天賦。',
  'D4': '四分盤 (Chaturthamsa)：不動產、住所、幸福感。',
  'D7': '七分盤 (Saptamsa)：子女、後代、創意。',
  'D9': '九分盤 (Navamsa)：婚姻、合作、靈魂力量、最終結果 (最重要)。請關注月亮與金星。',
  'D10': '十分盤 (Dasamsa)：事業、職業、成就、名望 (看 10 宮主星與土星)。',
  'D11': '十一分盤 (Rudramsa)：看鬥志力量、不屈意志、勝利。',
  'D12': '十二分盤 (Dwadasamsa)：父母、祖先、遺傳。',
  'D16': '十六分盤 (Shodasamsa)：交通工具、物質享受、心理壓力。',
  'D20': '二十分盤 (Vimsamsa)：靈性修行、宗教、奉獻。',
  'D24': '二十四分盤 (Chaturvimsamsa)：教育、知識、學習、智慧。',
  'D27': '二十七分盤 (Saptvimsamsa)：體質、力量。',
  'D30': '三十分盤 (Trimsamsa)：潛意識、疾病、心理創傷、性格缺陷。',
  'D40': '四十分盤 (Khavedamsa)：母系方面的祝福或詛咒。',
  'D45': '四十五分盤 (Akshavedamsa)：父系方面的祝福或詛咒。',
  'D60': '六十分盤 (Shashtyamsa)：極其細微的業力細節。'
};

const getAvasthaName = (avastha: string) => {
  switch (avastha) {
    case 'Infant': return '嬰兒 (Bala)';
    case 'Youth': return '青年 (Kumara)';
    case 'Adult': return '成年 (Yuva)';
    case 'Old': return '老年 (Vriddha)';
    case 'Dead': return '死亡 (Mrita)';
    default: return avastha;
  }
};

const formatDegree = (deg: number) => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.floor(((deg - d) * 60 - m) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
};

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
};

export default function App() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('1978-03-20');
  const [time, setTime] = useState('19:15');
  const [lat, setLat] = useState('24.80'); // Hsinchu
  const [lng, setLng] = useState('120.96'); // Hsinchu
  const [timezone, setTimezone] = useState('8');
  const [isDST, setIsDST] = useState(false);
  const [isSidereal, setIsSidereal] = useState(true);
  const [ayanamsaType, setAyanamsaType] = useState('Lahiri');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activeTab, setActiveTab] = useState<'charts' | 'vargas' | 'dashas' | 'data' | 'yogas' | 'transit' | 'sav' | 'analysis' | 'events' | 'rules' | 'reports'>('charts');
  const [selectedVarga, setSelectedVarga] = useState('D1');
  const [expandedDasha, setExpandedDasha] = useState<string | null>(null);
  const [expandedSubDasha, setExpandedSubDasha] = useState<string | null>(null);
  const [expandedPDasha, setExpandedPDasha] = useState<string | null>(null);
  const [dashaType, setDashaType] = useState<'vimshottari' | 'yogini' | 'chara'>('vimshottari');

  // Location Search State
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Saved Charts State
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [showSavedCharts, setShowSavedCharts] = useState(false);

  // Rule Builder State
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRulePlanet, setNewRulePlanet] = useState('Sun');
  const [newRuleCondition, setNewRuleCondition] = useState<'in_house' | 'in_sign' | 'is_retrograde'>('in_house');
  const [newRuleValue, setNewRuleValue] = useState('1');

  const [transitData, setTransitData] = useState<ChartData | null>(null);
  const [transitDate, setTransitDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartModes, setChartModes] = useState<string[]>(['zh']);
  const [referenceSignMode, setReferenceSignMode] = useState<'ascendant' | 'aries'>('ascendant');
  const [isProView, setIsProView] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [showPlanetPopup, setShowPlanetPopup] = useState<string | null>(null);

  const [vargaSlots, setVargaSlots] = useState<string[]>([
    'D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D11', 'D12', 
    'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'
  ]);
  const [slotOffsets, setSlotOffsets] = useState<[number, number]>([0, 0]);
  const [slotChartData, setSlotChartData] = useState<[ChartData | null, ChartData | null]>([null, null]);
  const [vargaMode, setVargaMode] = useState<'grid' | 'north' | 'south'>('grid');

  useEffect(() => {
    if (chartData) {
      const now = new Date();
      let dashasToUse = dashaType === 'vimshottari' ? chartData.dashas : dashaType === 'yogini' ? chartData.yoginiDashas : chartData.charaDashas;
      
      if (dashasToUse) {
        const currentMaha = dashasToUse.find(d => now >= d.start && now <= d.end);
        if (currentMaha) {
          setExpandedDasha(currentMaha.planet);
          if (currentMaha.subPeriods) {
            const currentAntar = currentMaha.subPeriods.find(sd => now >= sd.start && now <= sd.end);
            if (currentAntar) {
              setExpandedSubDasha(`${currentMaha.planet}-${currentAntar.planet}`);
              if (currentAntar.subPeriods) {
                const currentPratyantar = currentAntar.subPeriods.find(pd => now >= pd.start && now <= pd.end);
                if (currentPratyantar) {
                  setExpandedPDasha(`${currentMaha.planet}-${currentAntar.planet}-${currentPratyantar.planet}`);
                }
              }
            }
          }
        }
      }
    }
  }, [chartData, dashaType]);

  // Auth & Firestore State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [chartTags, setChartTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const q = query(collection(db, 'charts'), where('userId', '==', u.uid));
        const unsubSnap = onSnapshot(q, (snapshot) => {
          const charts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedChart));
          setSavedCharts(charts);
        });
        return () => unsubSnap();
      } else {
        setSavedCharts([]);
      }
    });

    handleCalculate();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!chartData) return;
    try {
      const baseDate = new Date(`${date}T${time}:00`);
      
      const d1 = new Date(baseDate.getTime() + slotOffsets[0] * 1000);
      const c1 = slotOffsets[0] === 0 ? chartData : calculateChart(d1, parseFloat(lat), parseFloat(lng), isSidereal, ayanamsaType);
      
      const d2 = new Date(baseDate.getTime() + slotOffsets[1] * 1000);
      const c2 = slotOffsets[1] === 0 ? chartData : calculateChart(d2, parseFloat(lat), parseFloat(lng), isSidereal, ayanamsaType);
      
      setSlotChartData([c1, c2]);
    } catch (e) {
      console.error(e);
    }
  }, [chartData, slotOffsets, date, time, lat, lng, isSidereal, ayanamsaType]);

  const updateOffset = (index: number, delta: number) => {
    setSlotOffsets(prev => {
      const newOffsets = [...prev] as [number, number];
      newOffsets[index] += delta;
      return newOffsets;
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const searchLocation = async () => {
    if (!locationQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result: any) => {
    setLat(parseFloat(result.lat).toFixed(2));
    setLng(parseFloat(result.lon).toFixed(2));
    setSearchResults([]);
    setLocationQuery(result.display_name.split(',')[0]);
  };

  const saveChart = async () => {
    if (!user) {
      alert('請先登入以儲存星盤');
      return;
    }
    if (!name.trim()) {
      alert('請輸入姓名以儲存星盤');
      return;
    }
    try {
      const chartToSave = {
        userId: user.uid,
        name,
        birthData: {
          name,
          date,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          location: locationQuery
        },
        date,
        time,
        lat,
        lng,
        isSidereal,
        ayanamsaType,
        tags: chartTags,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'charts'), chartToSave);
      alert('星盤已儲存至雲端！');
      setChartTags([]);
    } catch (err) {
      console.error('Save failed', err);
      alert('儲存失敗，請檢查網路連線');
    }
  };

  const loadChart = (chart: SavedChart) => {
    setName(chart.name);
    setDate(chart.date);
    setTime(chart.time);
    setLat(chart.lat);
    setLng(chart.lng);
    if (chart.birthData?.location) {
      setLocationQuery(chart.birthData.location);
    } else {
      setLocationQuery('');
    }
    setIsSidereal(chart.isSidereal);
    if (chart.ayanamsaType) setAyanamsaType(chart.ayanamsaType);
    setShowSavedCharts(false);
    setTimeout(() => {
      const dateTime = new Date(`${chart.date}T${chart.time}:00`);
      const data = calculateChart(dateTime, parseFloat(chart.lat), parseFloat(chart.lng), chart.isSidereal, chart.ayanamsaType || 'Lahiri');
      setChartData(data);
      const now = new Date();
      const tData = calculateChart(now, parseFloat(chart.lat), parseFloat(chart.lng), chart.isSidereal, chart.ayanamsaType || 'Lahiri');
      setTransitData(tData);
    }, 100);
  };

  const deleteChart = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('確定要刪除此星盤嗎？')) return;
    try {
      await deleteDoc(doc(db, 'charts', id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleCalculate = () => {
    try {
      // Correctly handle UTC conversion based on timezone and DST
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      
      const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      const tzOffset = parseFloat(timezone) + (isDST ? 1 : 0);
      utcDate.setMinutes(utcDate.getMinutes() - tzOffset * 60);

      const data = calculateChart(utcDate, parseFloat(lat), parseFloat(lng), isSidereal, ayanamsaType);
      setChartData(data);
      
      const tDate = new Date(transitDate);
      const tData = calculateChart(tDate, parseFloat(lat), parseFloat(lng), isSidereal, ayanamsaType);
      setTransitData(tData);
    } catch (error) {
      console.error('Error calculating chart:', error);
      alert('計算失敗，請檢查輸入數據');
    }
  };

  const checkGajaKesariYoga = (data: ChartData) => {
    const jupiter = data.planets['Jupiter'];
    const moon = data.planets['Moon'];
    if (!jupiter || !moon) return false;
    const diff = Math.abs(jupiter.sign - moon.sign);
    const housesFromMoon = (diff % 12) + 1;
    return [1, 4, 7, 10].includes(housesFromMoon);
  };

  const addRule = () => {
    const rule: Rule = {
      id: Math.random().toString(36).substr(2, 9),
      planet: newRulePlanet,
      condition: newRuleCondition,
      value: newRuleCondition === 'is_retrograde' ? true : parseInt(newRuleValue),
    };
    setRules([...rules, rule]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const evaluateRule = (rule: Rule, data: ChartData) => {
    const planet = data.planets[rule.planet];
    if (!planet) return false;
    if (rule.condition === 'in_sign') return planet.sign === rule.value;
    if (rule.condition === 'in_house') return planet.house === rule.value;
    if (rule.condition === 'is_retrograde') return planet.isRetrograde === rule.value;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-indigo-600 text-white shadow-md py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            專業占星分析系統 4.0
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold">{user.displayName}</div>
                  <div className="text-[10px] opacity-70">{user.email}</div>
                </div>
                {user.photoURL && <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/20" />}
                <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="登出">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">
                <LogIn className="w-4 h-4" /> Gmail 登入
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold">出生資料設定</h2>
            <button 
              onClick={() => setShowSavedCharts(!showSavedCharts)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
            >
              <FolderOpen className="w-4 h-4" /> {showSavedCharts ? '返回設定' : '已存星盤'}
            </button>
          </div>
          
          {showSavedCharts ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => setFilterTag(null)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${!filterTag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  全部
                </button>
                {Array.from(new Set(savedCharts.flatMap(c => c.tags || []))).map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border ${filterTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {savedCharts.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">尚未儲存任何星盤</div>
                ) : (
                  savedCharts
                    .filter(c => !filterTag || c.tags?.includes(filterTag))
                    .map(chart => (
                      <div 
                        key={chart.id} 
                        onClick={() => loadChart(chart)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-indigo-500 cursor-pointer transition-colors flex justify-between items-center group"
                      >
                        <div>
                          <div className="font-medium text-gray-800">{chart.name}</div>
                          <div className="text-xs text-gray-500">{chart.date} {chart.time}</div>
                          {chart.tags && chart.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {chart.tags.map(t => (
                                <span key={t} className="text-[8px] bg-gray-100 text-gray-500 px-1 rounded">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => deleteChart(chart.id, e)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" /> 姓名
                </label>
                <input
                  type="text"
                  placeholder="輸入姓名..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 出生日期
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> 出生時間
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> 出生地搜尋
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="輸入城市名稱 (如: Taipei)"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button 
                    onClick={searchLocation}
                    disabled={isSearching}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((res, i) => (
                      <div 
                        key={i}
                        onClick={() => selectLocation(res)}
                        className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700 border-b last:border-0"
                      >
                        {res.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    緯度
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    經度
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Timezone and DST */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" /> 時區 (GMT)
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {Array.from({ length: 25 }).map((_, i) => {
                      const tz = i - 12;
                      return (
                        <option key={tz} value={tz}>
                          GMT {tz >= 0 ? '+' : ''}{tz}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <SunIcon className="w-4 h-4 text-amber-500" /> 日光節約
                  </label>
                  <button
                    onClick={() => setIsDST(!isDST)}
                    className={`w-full px-3 py-2 border rounded-lg flex items-center justify-center gap-2 transition-all text-sm ${
                      isDST 
                      ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold' 
                      : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    {isDST ? '✅ 已開啟' : '❌ 已關閉'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> 系統設定
                  </label>
                  <select
                    value={isSidereal ? 'sidereal' : 'tropical'}
                    onChange={(e) => setIsSidereal(e.target.value === 'sidereal')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="sidereal">恆星制 (Sidereal / 吠陀)</option>
                    <option value="tropical">回歸制 (Tropical / 西洋)</option>
                  </select>
                </div>
                
                {isSidereal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> 歲差制 (Ayanamsa)
                    </label>
                    <select
                      value={ayanamsaType}
                      onChange={(e) => setAyanamsaType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="Lahiri">Lahiri (印度官方標準)</option>
                      <option value="FaganBradley">Fagan/Bradley (西方恆星制)</option>
                      <option value="Raman">Raman</option>
                      <option value="Krishnamurti">Krishnamurti (KP)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> 標籤分類
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="新增標籤..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        setChartTags([...chartTags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={() => {
                      if (newTag.trim()) {
                        setChartTags([...chartTags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
                    className="bg-gray-100 p-1.5 rounded-lg text-gray-600 hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {chartTags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setChartTags(chartTags.filter(t => t !== tag))} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCalculate}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  計算星盤
                </button>
                <button
                  onClick={saveChart}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center"
                  title="儲存星盤"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Search & Tags */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" /> 系統搜尋與標籤 (#Tag)
            </h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="搜尋功能或輸入 #標籤 (如 #D9)..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { tag: '#D1', target: 'charts' },
                { tag: '#D9', target: 'vargas' },
                { tag: '#Yoga', target: 'yogas' },
                { tag: '#Dasha', target: 'dashas' },
                { tag: '#Health', target: 'medical' },
                { tag: '#Transit', target: 'gochar' },
                { tag: '#Rules', target: 'rules' }
              ].map(item => (
                <button 
                  key={item.tag}
                  onClick={() => {
                    setActiveTab(item.target as any);
                    if (item.tag === '#D9') setSelectedVarga('D9');
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-700 rounded-lg text-[10px] font-bold transition-colors"
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>
          
          {activeTab === 'charts' && <ChartLegend />}
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            {[
              { id: 'charts', label: '本命三盤 (Charts)' },
              { id: 'data', label: '基本數據 (Data)' },
              { id: 'vargas', label: '16種分盤 (Vargas)' },
              { id: 'dashas', label: '大運系統 (Dashas)' },
              { id: 'nakshatra', label: '星宿分析 (Nakshatras)' },
              { id: 'gochar', label: '過運分析 (Gochar)' },
              { id: 'yogas', label: '格局分析 (Yogas)' },
              { id: 'transit', label: '流年報告 (Transit)' },
              { id: 'events', label: '推運事件簿 (Events)' },
              { id: 'medical', label: '醫療預警 (Medical)' },
              { id: 'sav', label: '動態力場 (SAV / Ashtakavarga)' },
              { id: 'analysis', label: '吠陀分析 (Vedic Analysis)' },
              { id: 'grahas', label: '行星 (Grahas)' },
              { id: 'upagrahas', label: '虛星 (Upagrahas)' },
              { id: 'sensitive', label: '特殊點 (Sensitive Points)' },
              { id: 'arudha', label: '映射 (Arudha Padas)' },
              { id: 'relations', label: '敵友 (Relations)' },
              { id: 'shadbala', label: '星力 (Shadbala)' },
              { id: 'misc', label: '其他 (Misc)' },
              { id: 'rules', label: '規則 (Rules & Logic)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[80px] py-1.5 px-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[600px]">
            {!chartData ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                請點擊左側「計算星盤」
              </div>
            ) : (
              <>
                {activeTab === 'charts' && (
                  <div className={`flex flex-col ${isProView ? 'lg:flex-row' : ''} gap-6`}>
                    {isProView && (
                      <div className="lg:w-72 flex-shrink-0 space-y-4">
                        <div className="bg-gray-900 rounded-2xl shadow-2xl border-4 border-indigo-900 overflow-hidden flex flex-col h-full min-h-[600px]">
                          <div className="p-4 bg-indigo-900/50 border-b border-indigo-800 flex items-center justify-between">
                            <span className="text-indigo-200 font-bold text-xs tracking-widest uppercase">行星數據清單</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {Object.values(chartData.planets).map((p: any) => (
                              <button
                                key={p.name}
                                onClick={() => setSelectedPlanet(p.name === selectedPlanet ? null : p.name)}
                                className={`w-full text-left p-3 rounded-xl transition-all border ${
                                  selectedPlanet === p.name 
                                    ? 'bg-indigo-600 border-indigo-400 shadow-lg scale-[1.02]' 
                                    : 'bg-black/40 border-indigo-900/30 hover:border-indigo-700 hover:bg-black/60'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`font-bold ${selectedPlanet === p.name ? 'text-white' : 'text-indigo-300'}`}>
                                    {getPlanetName(p.name, chartModes)}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    p.isRetrograde ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                                  }`}>
                                    {p.isRetrograde ? 'R' : 'D'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] font-mono">
                                  <div className="text-gray-500">度數:</div>
                                  <div className="text-gray-300 text-right">{p.degreeInSign.toFixed(2)}°</div>
                                  <div className="text-gray-500">星座:</div>
                                  <div className="text-gray-300 text-right">{getZodiacName(p.sign, chartModes)}</div>
                                  <div className="text-gray-500">宮位:</div>
                                  <div className="text-gray-300 text-right">{p.house} 宮</div>
                                </div>
                                {selectedPlanet === p.name && (
                                  <div className="mt-2 pt-2 border-t border-indigo-500/30 text-[9px] text-indigo-200 leading-tight">
                                    黃經: {p.longitude.toFixed(4)}°<br/>
                                    星宿: {p.nakshatra.name} ({p.nakshatra.pada}足)
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="p-3 bg-black/40 border-t border-indigo-900/50 text-[10px] text-indigo-400/60 font-mono text-center">
                            PRO SYSTEM ACTIVE
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap justify-center gap-4 text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm items-center">
                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#fee2e2] border border-red-200"></span> <span className="font-medium text-gray-700">火象</span></div>
                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#fef3c7] border border-yellow-200"></span> <span className="font-medium text-gray-700">土象</span></div>
                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#dcfce7] border border-green-200"></span> <span className="font-medium text-gray-700">風象</span></div>
                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#dbeafe] border border-blue-200"></span> <span className="font-medium text-gray-700">水象</span></div>
                        <div className="h-4 w-px bg-gray-200 mx-2"></div>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                          {(['zh', 'en', 'en-abbr', 'sanskrit', 'sanskrit-abbr', 'full-en', 'symbol'] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => {
                                if (isProView) {
                                  setChartModes(prev => 
                                    prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
                                  );
                                } else {
                                  setChartModes([m]);
                                }
                              }}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                chartModes.includes(m) ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              {m === 'zh' ? '中文' : m === 'en' ? '英文' : m === 'en-abbr' ? '英縮' : m === 'sanskrit' ? '印度' : m === 'sanskrit-abbr' ? '印縮' : m === 'full-en' ? '英/印' : '符號'}
                            </button>
                          ))}
                        </div>
                        {isProView && (
                          <>
                            <div className="h-4 w-px bg-gray-200 mx-2"></div>
                            <button 
                              onClick={() => setReferenceSignMode(prev => prev === 'ascendant' ? 'aries' : 'ascendant')}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                referenceSignMode === 'aries' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              固定牡羊第1宮
                            </button>
                          </>
                        )}
                        <div className="h-4 w-px bg-gray-200 mx-2"></div>
                        <button 
                          onClick={() => setIsProView(!isProView)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            isProView ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          專業版
                        </button>
                        <div className="h-4 w-px bg-gray-200 mx-2"></div>
                        <button 
                          onClick={() => setShowJsonModal(true)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="查看 JSON 數據"
                        >
                          <Code className="w-5 h-5" />
                        </button>
                      </div>
                      <div className={`grid grid-cols-1 ${isProView ? 'xl:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'} gap-8`}>
                        {isProView ? (
                          <>
                            <div className="space-y-4 xl:col-span-1">
                              <h3 className="text-center font-semibold text-gray-800">南印度盤 (D1)</h3>
                              <SouthIndianChart data={chartData} modes={chartModes} showDegrees={isProView} selectedPlanet={selectedPlanet} onPlanetClick={(p) => setShowPlanetPopup(p)} referenceSign={referenceSignMode === 'aries' ? 1 : undefined} />
                            </div>
                            <div className="space-y-4 xl:col-span-2 h-full">
                              <ChartDetailsPanel data={chartData} />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-4">
                              <h3 className="text-center font-semibold text-gray-800">南印度盤 (D1)</h3>
                              <SouthIndianChart data={chartData} modes={chartModes} showDegrees={isProView} selectedPlanet={selectedPlanet} onPlanetClick={(p) => setShowPlanetPopup(p)} referenceSign={referenceSignMode === 'aries' ? 1 : undefined} />
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-center font-semibold text-gray-800">北印度盤 (D1)</h3>
                              <NorthIndianChart data={chartData} modes={chartModes} showDegrees={isProView} selectedPlanet={selectedPlanet} onPlanetClick={(p) => setShowPlanetPopup(p)} referenceSign={referenceSignMode === 'aries' ? 1 : undefined} />
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-center font-semibold text-gray-800">西洋盤 (Western)</h3>
                              <WesternChart data={chartData} modes={chartModes} showDegrees={isProView} selectedPlanet={selectedPlanet} onPlanetClick={(p) => setShowPlanetPopup(p)} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'grahas' && chartData && <TabGrahas data={chartData} modes={chartModes} />}
                {activeTab === 'upagrahas' && chartData && <TabUpagrahas data={chartData} modes={chartModes} />}
                {activeTab === 'sensitive' && chartData && <TabSensitivePoints data={chartData} modes={chartModes} />}
                {activeTab === 'arudha' && chartData && <TabArudhaPadas data={chartData} modes={chartModes} />}
                {activeTab === 'relations' && chartData && <TabRelations data={chartData} modes={chartModes} />}
                {activeTab === 'shadbala' && chartData && <TabShadbala data={chartData} modes={chartModes} />}
                {activeTab === 'misc' && chartData && <TabMisc data={chartData} modes={chartModes} />}
                {activeTab === 'rules' && <RulesReference />}
                {activeTab === 'reports' && chartData && <TabReportPrompts data={chartData} />}

                {/* Varga Charts */}
                {activeTab === 'vargas' && chartData && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                      <h2 className="text-xl font-bold text-gray-900">分盤 (Varga Charts)</h2>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setVargaMode('grid')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vargaMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          網格視圖
                        </button>
                        <button
                          onClick={() => setVargaMode('north')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vargaMode === 'north' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          北印度盤
                        </button>
                        <button
                          onClick={() => setVargaMode('south')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vargaMode === 'south' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          南印度盤
                        </button>
                      </div>
                    </div>
                    {vargaSlots.map((vargaId, index) => {
                      const isRectificationSlot = index === 0 || index === 1;
                      const currentChartData = isRectificationSlot ? slotChartData[index] : chartData;
                      const offset = isRectificationSlot ? slotOffsets[index] : 0;
                      
                      if (!currentChartData) return null;

                      const vargaConfig = currentChartData.vargas.find(v => v.id === vargaId);
                      if (!vargaConfig) return null;

                      const vargaChartData = {
                        ...currentChartData,
                        ascendantSign: vargaConfig.ascendantSign,
                        planets: Object.fromEntries(
                          (Object.entries(currentChartData.planets) as [string, any][]).map(([name, p]) => [
                            name,
                            { ...p, sign: vargaConfig.planets[name].sign }
                          ])
                        )
                      } as ChartData;

                      const offsetDate = new Date(new Date(`${date}T${time}:00`).getTime() + offset * 1000);

                      return (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-700 font-bold rounded-full">
                                {index + 1}
                              </span>
                              <select 
                                value={vargaId}
                                onChange={(e) => {
                                  const newSlots = [...vargaSlots];
                                  newSlots[index] = e.target.value;
                                  setVargaSlots(newSlots);
                                }}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700 text-lg bg-gray-50"
                              >
                                {chartData.vargas.map(v => (
                                  <option key={v.id} value={v.id}>{v.id} {v.name.split(' ')[0]}</option>
                                ))}
                              </select>
                              <span className="text-sm font-medium text-gray-500">
                                {vargaConfig.name}
                              </span>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm ml-auto lg:ml-4 scale-95 origin-right">
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Info className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-[11px] font-bold text-amber-800 whitespace-nowrap">建議關注：</span>
                                </div>
                                <span className="text-[11px] font-bold text-amber-900 leading-tight">
                                  {VARGA_FOCUS[vargaId]}
                                  {vargaId === 'D9' && <span className="ml-1 text-red-600 animate-pulse">🌟</span>}
                                </span>
                              </div>
                            </div>
                            
                            {isRectificationSlot && (
                              <div className="flex flex-wrap items-center gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                                <div className="text-xs font-bold text-indigo-800 mr-2 flex flex-col">
                                  <span>校正時間</span>
                                  <span className="font-mono font-normal">{offsetDate.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => updateOffset(index, -86400)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">-日</button>
                                  <button onClick={() => updateOffset(index, 86400)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">+日</button>
                                </div>
                                <div className="flex items-center gap-1 ml-1">
                                  <button onClick={() => updateOffset(index, -3600)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">-時</button>
                                  <button onClick={() => updateOffset(index, 3600)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">+時</button>
                                </div>
                                <div className="flex items-center gap-1 ml-1">
                                  <button onClick={() => updateOffset(index, -60)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">-分</button>
                                  <button onClick={() => updateOffset(index, 60)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">+分</button>
                                </div>
                                <div className="flex items-center gap-1 ml-1">
                                  <button onClick={() => updateOffset(index, -1)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">-秒</button>
                                  <button onClick={() => updateOffset(index, 1)} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 font-medium">+秒</button>
                                </div>
                                <div className="ml-2 text-xs font-mono text-indigo-600 font-bold min-w-[50px] text-center bg-white px-2 py-1 rounded border border-indigo-100">
                                  {offset > 0 ? '+' : ''}{offset}s
                                </div>
                                <button onClick={() => updateOffset(index, -offset)} className="ml-1 px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs hover:bg-red-100 font-medium">重置</button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                            {/* Color Legend for Functional Dignities */}
                            <div className="col-span-full mb-4">
                              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] items-center justify-center">
                                <div className="font-bold text-gray-500 uppercase tracking-tighter mr-2">色標說明:</div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-600"></span> <span className="text-purple-800 font-bold">貴徵</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span> <span className="text-blue-800 font-bold">純清</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600"></span> <span className="text-green-700">吉星</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> <span className="text-amber-700">感染</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> <span className="text-red-500">破格</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#991b1b]"></span> <span className="text-red-900 font-bold">害格 (咖)</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500"></span> <span className="text-gray-500">中性 (灰)</span></div>
                                <div className="ml-4 pl-4 border-l border-gray-200 text-gray-400 font-medium whitespace-nowrap">(R) 逆行 | ASC 命宮 | (1-12) 宮位</div>
                              </div>
                            </div>
                            
                            {vargaMode === 'south' && (
                              <div className="space-y-4">
                                <h3 className="text-center font-bold text-gray-600 text-sm">南印度盤</h3>
                                <SouthIndianChart data={vargaChartData} modes={chartModes} showDegrees={isProView} selectedPlanet={selectedPlanet} onPlanetClick={(p) => setShowPlanetPopup(p)} />
                              </div>
                            )}
                            {vargaMode === 'north' && (
                              <div className="space-y-4">
                                <h3 className="text-center font-bold text-gray-600 text-sm">北印度盤</h3>
                                <NorthIndianChart data={vargaChartData} modes={chartModes} showDegrees={isProView} selectedPlanet={selectedPlanet} onPlanetClick={(p) => setShowPlanetPopup(p)} />
                              </div>
                            )}
                            {vargaMode === 'grid' && (
                              <div className="col-span-full space-y-4">
                                <h3 className="text-center font-bold text-gray-600 text-sm">網格視圖</h3>
                                <div className="grid grid-cols-4 gap-1 text-xs">
                                  {Array.from({ length: 12 }).map((_, i) => {
                                    const sign = i + 1;
                                    const planetsInSign = Object.entries(vargaChartData.planets)
                                      .filter(([_, p]) => p.sign === sign)
                                      .map(([name]) => getPlanetName(name, chartModes));
                                    
                                    return (
                                      <div key={sign} className={`border p-2 rounded ${sign === vargaChartData.ascendantSign ? 'bg-indigo-50 border-indigo-200' : 'border-gray-100'}`}>
                                        <div className="font-bold text-gray-500 mb-1">{getZodiacName(sign, chartModes)}</div>
                                        <div className="text-indigo-700 font-medium min-h-[20px]">
                                          {planetsInSign.join(', ')}
                                          {sign === vargaChartData.ascendantSign && <span className="text-red-500 ml-1">ASC</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'nakshatra' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">星宿分析 (Nakshatras)</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-3">行星/點 (Point)</th>
                            <th className="px-4 py-3">星宿 (Nakshatra)</th>
                            <th className="px-4 py-3">星宿主星 (Lord)</th>
                            <th className="px-4 py-3">步 (Pada)</th>
                            <th className="px-4 py-3">度數 (Degree)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-gray-50 bg-indigo-50/30">
                            <td className="px-4 py-3 font-bold text-indigo-900">上升 (Ascendant)</td>
                            <td className="px-4 py-3 font-medium">{chartData.houses[0].nakshatra.name}</td>
                            <td className="px-4 py-3">{getPlanetName(chartData.houses[0].nakshatra.lord, chartModes)}</td>
                            <td className="px-4 py-3">{chartData.houses[0].nakshatra.pada}</td>
                            <td className="px-4 py-3">{chartData.houses[0].nakshatra.degree.toFixed(2)}°</td>
                          </tr>
                          {(Object.entries(chartData.planets) as [string, PlanetPosition][]).map(([name, p]) => (
                            <tr key={name} className={`border-b hover:bg-gray-50 ${name === 'Moon' ? 'bg-blue-50/30' : ''}`}>
                              <td className={`px-4 py-3 font-medium ${name === 'Moon' ? 'text-blue-900 font-bold' : 'text-gray-900'}`}>{getPlanetName(name, chartModes)}</td>
                              <td className={`px-4 py-3 ${name === 'Moon' ? 'font-medium' : ''}`}>{p.nakshatra.name}</td>
                              <td className="px-4 py-3">{getPlanetName(p.nakshatra.lord, chartModes)}</td>
                              <td className="px-4 py-3">{p.nakshatra.pada}</td>
                              <td className="px-4 py-3">{p.nakshatra.degree.toFixed(2)}°</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2">應用方法</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-bold text-indigo-700 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-sm">1</span>
                            本命分析
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex gap-2">
                              <span className="font-bold min-w-[80px]">月亮星宿：</span>
                              <span>最重要的星宿，代表心智特質與內在情緒。</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold min-w-[80px]">上升星宿：</span>
                              <span>代表外在表現、身體特徵與給人的第一印象。</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold min-w-[80px]">行星星宿：</span>
                              <span>行星所在的星宿會影響該行星能量的表現方式。</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-bold text-indigo-700 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-sm">2</span>
                            擇時應用 (Muhurta)
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">選擇特定星宿的時間進行重要活動：</p>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex gap-2">
                              <span className="font-bold min-w-[60px]">結婚：</span>
                              <span>選擇有利於婚姻、穩定與和諧的星宿。</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold min-w-[60px]">開幕：</span>
                              <span>選擇有利於事業發展、財富累積的星宿。</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold min-w-[60px]">旅行：</span>
                              <span>選擇有利於出遊、平安順利的星宿。</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dashas' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                      <h2 className="text-xl font-bold text-gray-900">大運系統 (Dasha Systems)</h2>
                      <select
                        value={dashaType}
                        onChange={(e) => setDashaType(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="vimshottari">Vimshottari Dasha (120年大運)</option>
                        <option value="yogini">Yogini Dasha (36年大運)</option>
                        <option value="chara">Chara Dasha (星座大運)</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      {(dashaType === 'vimshottari' ? chartData.dashas : dashaType === 'yogini' ? chartData.yoginiDashas : chartData.charaDashas)?.map((d, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div 
                            onClick={() => setExpandedDasha(expandedDasha === d.planet ? null : d.planet)}
                            className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${expandedDasha === d.planet ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full font-bold">
                                {i + 1}
                              </span>
                              <div>
                                <div className="font-bold text-gray-900">{i + 1}. {dashaType === 'chara' ? d.planet : getPlanetName(d.planet, ['en'])}: {formatDate(d.start)} — {formatDate(d.end)}</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-indigo-500 font-bold">{expandedDasha === d.planet ? '[收合]' : '[展開]'}</span>
                          </div>
                          
                          {expandedDasha === d.planet && d.subPeriods && (
                            <div className="bg-gray-50 p-4 space-y-2 border-t border-gray-200">
                              {d.subPeriods.map((sd, j) => (
                                <div key={j} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                  <div 
                                    onClick={() => setExpandedSubDasha(expandedSubDasha === `${d.planet}-${sd.planet}` ? null : `${d.planet}-${sd.planet}`)}
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-indigo-50/30 transition-colors"
                                  >
                                    <div className="text-sm font-medium text-gray-800">
                                        {i + 1}.{j + 1} {dashaType === 'chara' ? sd.planet : getPlanetName(sd.planet, ['zh'])}：{formatDate(sd.start)}——{formatDate(sd.end)}
                                    </div>
                                    <span className="text-[10px] text-indigo-500 font-bold">{expandedSubDasha === `${d.planet}-${sd.planet}` ? '[收合]' : '[展開]'}</span>
                                  </div>
                                  
                                  {expandedSubDasha === `${d.planet}-${sd.planet}` && sd.subPeriods && (
                                    <div className="p-3 space-y-1 border-t border-gray-100 bg-gray-50/50">
                                      {sd.subPeriods.map((pd, k) => (
                                        <div key={k} className="border border-gray-200 rounded bg-white overflow-hidden">
                                          <div 
                                            onClick={() => setExpandedPDasha(expandedPDasha === `${d.planet}-${sd.planet}-${pd.planet}` ? null : `${d.planet}-${sd.planet}-${pd.planet}`)}
                                            className="p-2 flex items-center justify-between cursor-pointer hover:bg-indigo-50/20 transition-colors"
                                          >
                                            <div className="text-[10px] font-bold text-indigo-700">
                                                  {i + 1}.{j + 1}.{k + 1} {dashaType === 'chara' ? pd.planet : getPlanetName(pd.planet, ['zh'])}：{formatDate(pd.start)}——{formatDate(pd.end)}
                                            </div>
                                            {pd.subPeriods && <span className="text-[9px] text-indigo-500 font-bold">{expandedPDasha === `${d.planet}-${sd.planet}-${pd.planet}` ? '[收合]' : '[展開]'}</span>}
                                          </div>
                                          
                                          {expandedPDasha === `${d.planet}-${sd.planet}-${pd.planet}` && pd.subPeriods && (
                                            <div className="p-2 space-y-1 border-t border-gray-100 bg-white">
                                              {pd.subPeriods.map((spd, l) => (
                                                <div key={l} className="text-[9px] text-gray-600 pl-4 py-0.5">
                                                        {i + 1}.{j + 1}.{k + 1}.{l + 1} {dashaType === 'chara' ? spd.planet : getPlanetName(spd.planet, ['zh'])}：{formatDate(spd.start)}——{formatDate(spd.end)}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'data' && chartData && (
                  <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-600" /> 計算參數 (Calculation Parameters)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-500">輸入本地時間:</span>
                          <span className="font-mono">{date} {time} (GMT{timezone >= 0 ? '+' : ''}{timezone}{isDST ? ' DST' : ''})</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-500">計算使用 UTC:</span>
                          <span className="font-mono text-indigo-600 font-bold">{chartData.utcTime}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-500">歲差值 (Ayanamsa):</span>
                          <span className="font-mono text-amber-600 font-bold">{chartData.ayanamsa?.toFixed(4)}° ({ayanamsaType})</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-500">黃道制 (Zodiac):</span>
                          <span className="font-bold">{isSidereal ? '恆星制 (Sidereal)' : '回歸制 (Tropical)'}</span>
                        </div>
                      </div>
                    </div>

                    <AspectGrid natalData={chartData} modes={chartModes} />
                    
                    <section>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full"></div> 行星數據 (Planetary Data)
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                        <table className="w-full text-[11px] text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-wider">
                              <th className="p-2 border-r font-bold">#</th>
                              <th className="p-2 border-r font-bold">行星 (Planet)</th>
                              <th className="p-2 border-r font-bold">吉凶 (Dignity)</th>
                              <th className="p-2 border-r font-bold">黃經 (Longitude)</th>
                              <th className="p-2 border-r font-bold">星座 (Sign)</th>
                              <th className="p-2 border-r font-bold">度數 (Degree)</th>
                              <th className="p-2 border-r font-bold">宮位 (House)</th>
                              <th className="p-2 border-r font-bold">落陷 (Deb)</th>
                              <th className="p-2 border-r font-bold">廟旺 (Exa)</th>
                              <th className="p-2 border-r font-bold">強力 (Mool)</th>
                              <th className="p-2 border-r font-bold">本宮 (Own)</th>
                              <th className="p-2 border-r font-bold">燃燒 (Comb)</th>
                              <th className="p-2 border-r font-bold">同宮 (Conj)</th>
                              <th className="p-2 border-r font-bold">敵友 (Friendship)</th>
                              <th className="p-2 border-r font-bold">狀態 (Avastha)</th>
                              <th className="p-2 border-r font-bold">能量 (Strength)</th>
                              <th className="p-2 font-bold">速率 (Speed)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.values(chartData.planets).map((p, idx) => {
                              const planet = p as PlanetPosition;
                              const conjunctions = Object.values(chartData.planets)
                                .filter(other => {
                                  const o = other as PlanetPosition;
                                  return o.name !== planet.name && o.sign === planet.sign;
                                })
                                .map(other => getPlanetName((other as PlanetPosition).name, chartModes))
                                .join(', ');
                              
                              const dignity = getFunctionalDignity(chartData.ascendantSign, planet.name);
                              
                              return (
                                <tr key={planet.name} className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors">
                                  <td className="p-2 border-r text-gray-400">{idx + 1}</td>
                                  <td className="p-2 border-r font-bold text-indigo-700">
                                    {getPlanetName(planet.name, chartModes)}
                                    {planet.isRetrograde && <span className="text-red-500 ml-1 text-[9px]">(R)</span>}
                                  </td>
                                  <td className={`p-2 border-r font-bold ${getFunctionalDignityColor(dignity)}`}>
                                    {getFunctionalDignityName(dignity)}
                                  </td>
                                  <td className="p-2 border-r font-mono text-gray-600">{formatDegree(planet.longitude)}</td>
                                  <td className="p-2 border-r text-gray-800">{getZodiacName(planet.sign, chartModes)}</td>
                                  <td className="p-2 border-r font-mono text-gray-700">{formatDegree(planet.degreeInSign)}</td>
                                  <td className="p-2 border-r text-center font-bold text-gray-700">{planet.house}</td>
                                  <td className="p-2 border-r text-center">{planet.dignity === 'Debilitated' ? <span className="text-red-500 font-bold">是</span> : '-'}</td>
                                  <td className="p-2 border-r text-center">{planet.dignity === 'Exalted' ? <span className="text-green-500 font-bold">是</span> : '-'}</td>
                                  <td className="p-2 border-r text-center">{planet.dignity === 'Moolatrikona' ? <span className="text-amber-500 font-bold">是</span> : '-'}</td>
                                  <td className="p-2 border-r text-center">{planet.dignity === 'Own Sign' ? <span className="text-blue-500 font-bold">是</span> : '-'}</td>
                                  <td className="p-2 border-r text-center">{planet.isCombust ? <span className="text-orange-500 font-bold">是</span> : '-'}</td>
                                  <td className="p-2 border-r text-[9px] text-gray-500 max-w-[80px] truncate" title={conjunctions}>{conjunctions || '-'}</td>
                                  <td className="p-2 border-r text-center text-gray-600">{getFriendshipName(planet.friendship)}</td>
                                  <td className="p-2 border-r text-center text-gray-700">{getAvasthaName(planet.avastha)}</td>
                                  <td className="p-2 border-r text-center font-bold text-indigo-600">
                                    {chartData.shadbala?.[planet.name]?.rupas.toFixed(2) || '-'}
                                  </td>
                                  <td className="p-2 font-mono text-gray-500">{planet.speed.toFixed(3)}°/d</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-6 bg-emerald-600 rounded-full"></div> 十二宮數據 (Bhava Data)
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                        <table className="w-full text-xs text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase">
                              <th className="p-3 font-bold border-r">宮位</th>
                              <th className="p-3 font-bold border-r">星座</th>
                              <th className="p-3 font-bold border-r">黃經</th>
                              <th className="p-3 font-bold border-r">宮主星</th>
                              <th className="p-3 font-bold border-r">宮內行星</th>
                              <th className="p-3 font-bold">此宮評分</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chartData.houses.map((h, i) => (
                              <tr key={i} className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors">
                                <td className="p-3 border-r font-bold text-emerald-700">第 {h.number} 宮</td>
                                <td className="p-3 border-r font-medium text-gray-800">{getZodiacName(h.sign, chartModes)}</td>
                                <td className="p-3 border-r font-mono text-gray-600">{h.longitude.toFixed(2)}°</td>
                                <td className="p-3 border-r font-bold text-indigo-600">{getPlanetName(h.lord, chartModes)}</td>
                                <td className="p-3 border-r text-gray-700">
                                  {h.planetsInHouse.map(p => getPlanetName(p, chartModes)).join(', ') || '-'}
                                </td>
                                <td className="p-3 font-bold text-amber-600">{h.score}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-6 bg-amber-600 rounded-full"></div> 行星能量計算表 (Shadbala)
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                        <table className="w-full text-[10px] text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                              <th className="p-2 border-r font-bold">行星</th>
                              <th className="p-2 border-r">位置 (Sthana)</th>
                              <th className="p-2 border-r">方位 (Dig)</th>
                              <th className="p-2 border-r">時間 (Kala)</th>
                              <th className="p-2 border-r">運動 (Chesta)</th>
                              <th className="p-2 border-r">自然 (Naisargika)</th>
                              <th className="p-2 border-r">相位 (Drik)</th>
                              <th className="p-2 border-r font-bold bg-amber-50">總分 (Total)</th>
                              <th className="p-2 border-r font-bold bg-amber-100">Rupas</th>
                              <th className="p-2 font-bold">排名 (Rank)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(chartData.shadbala || {}).map(([name, data]: [string, any]) => (
                              <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-2 border-r font-bold text-indigo-700">{getPlanetName(name, chartModes)}</td>
                                <td className="p-2 border-r">{data.sthana.toFixed(2)}</td>
                                <td className="p-2 border-r">{data.dig.toFixed(2)}</td>
                                <td className="p-2 border-r">{data.kala.toFixed(2)}</td>
                                <td className="p-2 border-r">{data.chesta.toFixed(2)}</td>
                                <td className="p-2 border-r">{data.naisargika.toFixed(2)}</td>
                                <td className="p-2 border-r">{data.drik.toFixed(2)}</td>
                                <td className="p-2 border-r font-bold bg-amber-50/50">{data.total.toFixed(2)}</td>
                                <td className="p-2 font-bold bg-amber-100/50">{data.rupas.toFixed(2)}</td>
                                <td className="p-2 font-bold text-center">
                                  {Object.values(chartData.shadbala || {}).filter((d: any) => d.rupas > data.rupas).length + 1}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'gochar' && chartData && transitData && (
                  <div className="space-y-6">
                    <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                      <h2 className="text-2xl font-bold mb-2">過運分析 (Gochar Analysis)</h2>
                      <p className="opacity-90">基於帕拉夏拉 (Parashara) 原則，分析當前行星相對於本命月亮 (Chandra Lagna) 的影響。</p>
                    </div>

                    <AspectGrid natalData={chartData} transitData={transitData} modes={chartModes} />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(calculateGochar(chartData.planets['Moon'].sign, transitData.planets)).map(([name, info]) => (
                        <div key={name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-indigo-700">{getPlanetName(name, chartModes)}</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                第 {info.house} 宮 ({getZodiacName(info.sign, chartModes)})
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              info.result.includes('吉') ? 'bg-green-100 text-green-700' : 
                              info.result.includes('凶') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {info.result}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{info.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm text-amber-800">
                      <strong>註記：</strong> 過運分析應結合大運 (Dasha) 系統綜合判斷。若大運不佳，即便過運吉利，影響亦會打折。
                    </div>
                  </div>
                )}

                {activeTab === 'yogas' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">格局分析 (Yogas)</h2>
                    
                    <div className="grid gap-4">
                      <div className={`p-4 rounded-xl border ${checkGajaKesariYoga(chartData) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900">大象獅子瑜伽 (Gaja Kesari Yoga)</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${checkGajaKesariYoga(chartData) ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {checkGajaKesariYoga(chartData) ? '成立' : '未成立'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          <strong>條件：</strong> 木星位於月亮的四正宮（第1、4、7、10宮）。<br/>
                          <strong>涵義：</strong> 象徵智慧、名望、財富與領導力。擁有此格局者通常受人尊敬，具備克服困難的強大能力（如獅子般勇猛，如大象般穩重）。
                        </p>
                        {checkGajaKesariYoga(chartData) && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-green-100 text-sm text-green-700">
                            <strong>您的星盤：</strong> 木星在第 {chartData.planets['Jupiter'].sign} 宮，月亮在第 {chartData.planets['Moon'].sign} 宮，符合大象位條件！
                          </div>
                        )}
                      </div>
                      
                      {/* Custom Rules */}
                      <div className="p-4 rounded-xl border bg-white border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">自訂規則判斷</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-600">如果</span>
                            <select 
                              value={newRulePlanet}
                              onChange={(e) => setNewRulePlanet(e.target.value)}
                              className="border border-gray-300 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500"
                            >
                              <option value="Sun">太陽</option>
                              <option value="Moon">月亮</option>
                              <option value="Mars">火星</option>
                              <option value="Mercury">水星</option>
                              <option value="Jupiter">木星</option>
                              <option value="Venus">金星</option>
                              <option value="Saturn">土星</option>
                              <option value="Rahu">羅睺</option>
                              <option value="Ketu">計都</option>
                            </select>
                            <select 
                              value={newRuleCondition}
                              onChange={(e) => setNewRuleCondition(e.target.value as any)}
                              className="border border-gray-300 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500"
                            >
                              <option value="in_house">位於宮位</option>
                              <option value="in_sign">位於星座</option>
                              <option value="is_retrograde">處於逆行</option>
                            </select>
                            {newRuleCondition !== 'is_retrograde' && (
                              <select 
                                value={newRuleValue}
                                onChange={(e) => setNewRuleValue(e.target.value)}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500"
                              >
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <option key={i} value={i + 1}>第 {i + 1} {newRuleCondition === 'in_house' ? '宮' : '星座'}</option>
                                ))}
                              </select>
                            )}
                            <button 
                              onClick={addRule}
                              className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> 新增
                            </button>
                          </div>
                          
                          {rules.length === 0 ? (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-500 text-center">
                              目前尚未新增任何自訂規則
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {rules.map(rule => {
                                const isMet = evaluateRule(rule, chartData);
                                return (
                                  <div key={rule.id} className={`flex items-center justify-between p-3 rounded-lg border ${isMet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${isMet ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      <span className="text-sm font-medium text-gray-800">
                                        如果 {getPlanetName(rule.planet)} 
                                        {rule.condition === 'in_house' ? ` 位於第 ${rule.value} 宮` : ''}
                                        {rule.condition === 'in_sign' ? ` 位於第 ${rule.value} 星座` : ''}
                                        {rule.condition === 'is_retrograde' ? ` 處於逆行` : ''}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${isMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {isMet ? '成立' : '不成立'}
                                      </span>
                                      <button onClick={() => removeRule(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'transit' && chartData && transitData && (
                  <div className="space-y-8 max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">推運報告設定</h2>
                        <p className="text-sm text-gray-500">選擇分析基準日期</p>
                      </div>
                      <div className="flex items-center gap-4 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <input 
                          type="date" 
                          value={transitDate}
                          onChange={(e) => {
                            setTransitDate(e.target.value);
                            const tDate = new Date(e.target.value);
                            const tData = calculateChart(tDate, parseFloat(lat), parseFloat(lng), isSidereal, ayanamsaType);
                            setTransitData(tData);
                          }}
                          className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <TransitMasterReport 
                      natalData={chartData} 
                      transitData={transitData} 
                      transitDate={transitDate} 
                      modes={chartModes} 
                    />
                  </div>
                )}
                {activeTab === 'medical' && (
                  <MedicalReport natalData={chartData} transitData={transitData} modes={chartModes} />
                )}
                {activeTab === 'gochar' && chartData && transitData && (
                  <GocharaReport natalData={chartData} transitData={transitData} modes={chartModes} />
                )}
                {activeTab === 'sav' && chartData && (
                  <AshtakavargaReport data={chartData} transitData={transitData} modes={chartModes} />
                )}
                {activeTab === 'analysis' && chartData && (
                  <VedicAnalysis 
                    natalData={chartData} 
                    transitData={transitData || undefined} 
                    modes={chartModes}
                    isSidereal={isSidereal}
                    ayanamsaType={ayanamsaType}
                  />
                )}
                {activeTab === 'events' && chartData && (
                  <TransitsEventLog 
                    natalData={chartData} 
                    modes={chartModes} 
                    onReport={(dateStr) => {
                      setTransitDate(dateStr);
                      const tDate = new Date(dateStr);
                      const tData = calculateChart(tDate, parseFloat(lat), parseFloat(lng), isSidereal, ayanamsaType);
                      setTransitData(tData);
                      setActiveTab('transit');
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Planet Detail Popup */}
      {showPlanetPopup && chartData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPlanetPopup(null)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {getPlanetName(showPlanetPopup, ['symbol'])} {getPlanetName(showPlanetPopup, chartModes)}
              </h3>
              <button onClick={() => setShowPlanetPopup(null)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {(() => {
                const planet = chartData.planets[showPlanetPopup];
                const props = getPlanetProperties(showPlanetPopup);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">當前位置</div>
                        <div className="font-bold text-gray-900">{getZodiacName(planet.sign, chartModes)}</div>
                        <div className="text-sm text-gray-600">{planet.degreeInSign.toFixed(2)}° (第 {planet.house} 宮)</div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">星宿 (Nakshatra)</div>
                        <div className="font-bold text-gray-900">{planet.nakshatra.name}</div>
                        <div className="text-sm text-gray-600">第 {planet.nakshatra.pada} 足 (星宿主: {getPlanetName(planet.nakshatra.lord, chartModes)})</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-1">行星屬性</h4>
                      
                      <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div className="text-gray-500">守護星座 (Rulership)</div>
                        <div className="font-medium text-gray-900">
                          {props?.rules.map(r => getZodiacName(r, chartModes)).join(', ') || '無'}
                        </div>
                        
                        <div className="text-gray-500">廟旺星座 (Exaltation)</div>
                        <div className="font-medium text-green-600">
                          {props ? getZodiacName(props.exalted, chartModes) : '無'}
                        </div>
                        
                        <div className="text-gray-500">落陷星座 (Debilitation)</div>
                        <div className="font-medium text-red-600">
                          {props ? getZodiacName(props.debilitated, chartModes) : '無'}
                        </div>
                        
                        <div className="text-gray-500">當前狀態 (Dignity)</div>
                        <div className="font-medium text-indigo-600">
                          {getDignityName(planet.dignity)}
                        </div>
                        
                        <div className="text-gray-500">運行狀態</div>
                        <div className="font-medium">
                          {planet.isRetrograde ? <span className="text-red-600">逆行 (Retrograde)</span> : <span className="text-green-600">順行 (Direct)</span>}
                        </div>
                        
                        <div className="text-gray-500">燃燒狀態 (Combustion)</div>
                        <div className="font-medium">
                          {planet.isCombust ? <span className="text-orange-600">被太陽燃燒</span> : <span className="text-gray-600">無</span>}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* JSON Modal */}
      {showJsonModal && chartData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" /> 星盤數據 (JSON 格式)
              </h3>
              <button onClick={() => setShowJsonModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono leading-relaxed">
                {JSON.stringify(chartData, (key, value) => 
                  typeof value === 'bigint' ? value.toString() : value, 2
                )}
              </pre>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(chartData, null, 2));
                  alert('已複製到剪貼簿');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors"
              >
                複製 JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
