import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Heart, Sparkles, AlertCircle, Info, RefreshCw, Star, 
  HelpCircle, CheckCircle, Flame, Compass, Sliders, ChevronDown, 
  ChevronUp, Play, BookOpen, Volume2, Save, FileText, Loader2
} from 'lucide-react';
import { calculateChart, ChartData, getPlanetName, getZodiacName, PlanetPosition } from '../utils/astrology';
import { ReportExportActions } from './ReportExportActions';

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

interface SynastryCompatibilityTabProps {
  natalData: ChartData | null;
  savedCharts: SavedChart[];
  isSidereal: boolean;
  ayanamsaType: string;
  chartModes: string[];
}

// 27 Nakshatras characteristics for Synastry
const NAKSHATRA_YONIS = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog', 'Cat', 'Ram', 'Cat', 
  'Rat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer', 
  'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse', 'Lion', 'Cow', 'Elephant'
];

const NAKSHATRA_GANAS = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, // Deva=0, Manushya=1, Rakshasa=2
  2, 1, 1, 0, 2, 0, 2, 0, 2,
  2, 1, 0, 0, 2, 2, 1, 1, 0
];

const NAKSHATRA_NADIS = [
  0, 1, 1, 2, 2, 0, 0, 1, 2, // Adi=0, Madhya=1, Antya=2
  2, 1, 0, 0, 1, 2, 2, 1, 0,
  0, 1, 2, 2, 1, 0, 0, 1, 2
];

const YONI_NAMES_ZH: Record<string, string> = {
  'Horse': '馬 (Horse)', 'Elephant': '象 (Elephant)', 'Sheep': '羊 (Sheep)', 'Serpent': '蛇 (Serpent)',
  'Dog': '狗 (Dog)', 'Cat': '貓 (Cat)', 'Ram': '綿羊 (Ram)', 'Rat': '鼠 (Rat)', 'Cow': '黃牛 (Cow)',
  'Buffalo': '水牛 (Buffalo)', 'Tiger': '虎 (Tiger)', 'Deer': '鹿 (Deer)', 'Monkey': '猴 (Monkey)',
  'Mongoose': '獴 (Mongoose)', 'Lion': '獅 (Lion)'
};

const GANA_NAMES_ZH = ['天神格 (Deva Gana)', '人類格 (Manushya Gana)', '阿修羅/魔王格 (Rakshasa Gana)'];
const NADI_NAMES_ZH = ['前脈 (Adi Nadi)', '中脈 (Madhya Nadi)', '後脈 (Antya Nadi)'];

// Yoni mutual conflict array
const YONI_ENEMY_MAP: Record<string, string> = {
  'Horse': 'Buffalo',
  'Buffalo': 'Horse',
  'Elephant': 'Lion',
  'Lion': 'Elephant',
  'Sheep': 'Monkey',
  'Monkey': 'Sheep',
  'Serpent': 'Mongoose',
  'Mongoose': 'Serpent',
  'Dog': 'Deer',
  'Deer': 'Dog',
  'Cat': 'Rat',
  'Rat': 'Cat',
  'Cow': 'Tiger',
  'Tiger': 'Cow'
};

// Natural relations of planetary lords
const PLANET_FEELINGS: Record<string, { friends: string[]; enemies: string[]; neutral: string[] }> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutral: ['Mercury'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutral: ['Mars', 'Jupiter', 'Saturn'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutral: ['Saturn'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutral: ['Mars', 'Jupiter'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] }
};

export const SynastryCompatibilityTab: React.FC<SynastryCompatibilityTabProps> = ({
  natalData,
  savedCharts,
  isSidereal,
  ayanamsaType,
  chartModes
}) => {
  // Mode selection for Partner 1 & Partner 2
  const [partner1Mode, setPartner1Mode] = useState<'active' | 'custom'>('active');
  const [partner2Mode, setPartner2Mode] = useState<'saved' | 'custom'>('saved');

  // Partner 1 Inputs
  const [p1Name, setP1Name] = useState('命主甲');
  const [p1Date, setP1Date] = useState('1990-05-15');
  const [p1Time, setP1Time] = useState('12:00');
  const [p1Lat, setP1Lat] = useState('25.03'); // Taipei
  const [p1Lng, setP1Lng] = useState('121.56');
  const [p1Timezone, setP1Timezone] = useState('8');
  const [p1IsDST, setP1IsDST] = useState(false);

  // Partner 2 Inputs
  const [p2Name, setP2Name] = useState('命主乙');
  const [p2Date, setP2Date] = useState('1992-08-20');
  const [p2Time, setP2Time] = useState('15:30');
  const [p2Lat, setP2Lat] = useState('24.14'); // Taichung
  const [p2Lng, setP2Lng] = useState('120.67');
  const [p2Timezone, setP2Timezone] = useState('8');
  const [p2IsDST, setP2IsDST] = useState(false);
  const [p2SelectedSavedId, setP2SelectedSavedId] = useState('');

  // Analysis result state
  const [p1Chart, setP1Chart] = useState<ChartData | null>(null);
  const [p2Chart, setP2Chart] = useState<ChartData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kootaResults, setKootaResults] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  // AI Synastry report state
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiViewer, setShowAiViewer] = useState(false);

  // Detail panel collapsers
  const [expandedKootaIndex, setExpandedKootaIndex] = useState<number | null>(null);

  // Auto-load main active chart to Partner 1
  useEffect(() => {
    if (natalData && partner1Mode === 'active') {
      setP1Chart(natalData);
    }
  }, [natalData, partner1Mode]);

  // Load selected saved chart properties to Partner 2 states
  const handleSelectSavedChart = (id: string) => {
    setP2SelectedSavedId(id);
    const selected = savedCharts.find(c => c.id === id);
    if (selected) {
      setP2Name(selected.name);
      setP2Date(selected.date);
      setP2Time(selected.time);
      setP2Lat(selected.lat);
      setP2Lng(selected.lng);
      setP2Timezone(selected.ayanamsaType === 'Lahiri' ? '8' : '8'); // fallback/adjust if needed
    }
  };

  // Main Calculation Handler for Compatibility & Synastry
  const handleCalculateCompatibility = () => {
    setIsAnalyzing(true);
    setSyncWarning(null);
    setAiReport(null);
    setShowAiViewer(false);

    setTimeout(() => {
      try {
        let chart1: ChartData | null = null;
        let chart2: ChartData | null = null;

        // 1. Resolve Chart 1
        if (partner1Mode === 'active' && p1Chart) {
          chart1 = p1Chart;
        } else {
          const [y, m, d] = p1Date.split('-').map(Number);
          const [h, min] = p1Time.split(':').map(Number);
          const utc1 = new Date(Date.UTC(y, m - 1, d, h, min));
          const offset1 = parseFloat(p1Timezone) + (p1IsDST ? 1 : 0);
          utc1.setMinutes(utc1.getMinutes() - offset1 * 60);
          chart1 = calculateChart(utc1, parseFloat(p1Lat), parseFloat(p1Lng), isSidereal, ayanamsaType);
          setP1Chart(chart1);
        }

        // 2. Resolve Chart 2
        const [year2, month2, day2] = p2Date.split('-').map(Number);
        const [h2, min2] = p2Time.split(':').map(Number);
        const utc2 = new Date(Date.UTC(year2, month2 - 1, day2, h2, min2));
        const offset2 = parseFloat(p2Timezone) + (p2IsDST ? 1 : 0);
        utc2.setMinutes(utc2.getMinutes() - offset2 * 60);
        chart2 = calculateChart(utc2, parseFloat(p2Lat), parseFloat(p2Lng), isSidereal, ayanamsaType);
        setP2Chart(chart2);

        if (!chart1 || !chart2) {
          throw new Error("無法成功計算其中一個星盤的數據。");
        }

        // 3. Extract Moon properties
        const moon1 = chart1.planets['Moon'];
        const moon2 = chart2.planets['Moon'];

        if (!moon1 || !moon2) {
          throw new Error("未發現 Moon (月亮) 座標數據，請確認星盤初始化完全。");
        }

        const sign1 = moon1.sign; // 1-12
        const sign2 = moon2.sign; // 1-12

        // Finding Nakshatras 
        // In astrology.ts, nakshatras names are mapped. We need to find index of Ashwini, etc.
        const listAllNaks = [
          'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
          'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
          'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
        ];
        
        const nakIndex1 = listAllNaks.indexOf(moon1.nakshatra.name);
        const nakIndex2 = listAllNaks.indexOf(moon2.nakshatra.name);

        if (nakIndex1 === -1 || nakIndex2 === -1) {
          throw new Error("無法定位月亮星宿索引，請驗證天宮定位。");
        }

        // 4. Run Ashta Koota Milan matches
        const kootas: any[] = [];
        let runningScore = 0;

        // A. Varna (Caste / Elements match) - Max 1 Pt
        // Water (Cancer-4, Scorpio-8, Pisces-12) -> Brahmin (4)
        // Fire (Aries-1, Leo-5, Sagittarius-9) -> Kshatriya (3)
        // Earth (Taurus-2, Virgo-6, Capricorn-10) -> Vaishya (2)
        // Air (Gemini-3, Libra-7, Aquarius-11) -> Shudra (1)
        const getVarnaValue = (sign: number) => {
          if ([4, 8, 12].includes(sign)) return { val: 4, name: '婆羅門 (精神/智慧脈系)' };
          if ([1, 5, 9].includes(sign)) return { val: 3, name: '剎帝利 (志向/行動脈系)' };
          if ([2, 6, 10].includes(sign)) return { val: 2, name: '吠舍 (世俗/務實脈系)' };
          return { val: 1, name: '首陀羅 (技術/勞動脈系)' };
        };

        const varna1 = getVarnaValue(sign1);
        const varna2 = getVarnaValue(sign2);
        
        let varnaScore = 0;
        let varnaExplanation = "";
        if (varna1.val >= varna2.val) {
          varnaScore = 1;
          varnaExplanation = `由於第一人 (Varna: ${varna1.name}) 的精神階等大於或等於第二人 (Varna: ${varna2.name})，符合傳統吠陀 Varna 核心判定法則。雙方在心智取向、精神理想上具有融洽的共識與尊重，能量相輔相成，獲得滿分。`;
        } else {
          varnaScore = 0;
          varnaExplanation = `第一人屬 ${varna1.name}，第二人屬 ${varna2.name}。由於第一人的能量階等低於第二人，在傳統合盤中被認為主導關係與靈性責任上容易產生定位混淆，互動時需更主動作出溝通與包容。`;
        }
        runningScore += varnaScore;
        kootas.push({ name_zh: '階等合盤 (Varna Koota)', value: varnaScore, maxValue: 1, explanation: varnaExplanation, status: varnaScore === 1 ? 'pass' : 'fail' });

        // B. Vashya (Mutual Attraction) - Max 2 Pts
        const getVashyaGroup = (sign: number) => {
          if ([1, 2].includes(sign)) return { key: 'Quadruped', name: '四足獸 (Quadruped)' };
          if ([3, 6, 7, 11].includes(sign)) return { key: 'Human', name: '人類 (Human)' };
          if ([4, 12].includes(sign)) return { key: 'Water', name: '水居者 (Water)' };
          if (sign === 5) return { key: 'Wild', name: '猛獸 (Wild)' };
          if (sign === 8) return { key: 'Insect', name: '昆蟲 (Insect)' };
          if (sign === 9) return { key: 'Human', name: '人類 (Human)' };
          if (sign === 10) return { key: 'Water', name: '水居者 (Water)' };
          return { key: 'Human', name: '人類 (Human)' };
        };

        const vashya1 = getVashyaGroup(sign1);
        const vashya2 = getVashyaGroup(sign2);
        let vashyaScore = 1;
        let vashyaExplanation = "";

        if (vashya1.key === vashya2.key) {
          vashyaScore = 2;
          vashyaExplanation = `雙方月亮皆屬於同類星曜引力圈「${vashya1.name}」。雙方的潛意識頻率、彼此體貼關心與吸引的深度非常牢固。兩人即使不說話也能相互體諒理解，一見如故，取得滿分！`;
        } else if (vashya1.key === 'Wild' || vashya2.key === 'Wild') {
          vashyaScore = vashya1.key === vashya2.key ? 2 : 0;
          vashyaExplanation = `其中一人帶有「猛獸 (${vashya1.key === 'Wild' ? '第一人' : '第二人'})」引力場，另一人屬「${vashya1.key !== 'Wild' ? vashya1.name : vashya2.name}」。猛獸性格在人際與情感中易顯露強大佔有慾或敏感，兩人在情感防線、隱私保護上需要特別妥協與自我調節。`;
        } else if (vashya1.key === 'Human' && vashya2.key === 'Water') {
          vashyaScore = 1.5;
          vashyaExplanation = `第一人為 "${vashya1.name}"，第二人為 "${vashya2.name}"。人在水居，屬於自然滋潤的和諧格局，雙方能形成高雅的藝術、思維、家庭互補，取得較高的適應。`;
        } else {
          vashyaScore = 1.0;
          vashyaExplanation = `第一人屬於「${vashya1.name}」，第二人屬於「${vashya2.name}」。這在星耀吸引度上偏向一般而中性的吸引，有不錯的日常生活相處氛圍，但可能較缺乏激烈的宿命磁場張力。`;
        }
        runningScore += vashyaScore;
        kootas.push({ name_zh: '性情磁吸 (Vashya Koota)', value: vashyaScore, maxValue: 2, explanation: vashyaExplanation, status: vashyaScore >= 1.5 ? 'pass' : 'partial' });

        // C. Tara (Star/Destiny Path compatibility) - Max 3 Pts
        const d1 = (nakIndex2 - nakIndex1 + 27) % 27;
        const r1 = (d1 + 1) % 9 === 0 ? 9 : (d1 + 1) % 9;
        const d2 = (nakIndex1 - nakIndex2 + 27) % 27;
        const r2 = (d2 + 1) % 9 === 0 ? 9 : (d2 + 1) % 9;

        const badTaras = [3, 5, 7]; // Vipat, Pratyak, Naidhana (Danger, Obstacle, Death)
        const isBad1 = badTaras.includes(r1);
        const isBad2 = badTaras.includes(r2);

        let taraScore = 0;
        let taraExplanation = "";
        const taraMeaning = (r: number) => {
          switch(r) {
            case 1: return 'Janma (生命/同步)';
            case 2: return 'Sampat (豐盛/富足)';
            case 3: return 'Vipat (災厄/變數)';
            case 4: return 'Kshema (安康/守護)';
            case 5: return 'Pratyak (阻礙/分歧)';
            case 6: return 'Sadhana (修持/進步)';
            case 7: return 'Naidhana (終結/考驗)';
            case 8: return 'Mitra (和諧盟友)';
            case 9: return 'Adhi-Mitra (靈魂摯友)';
            default: return '';
          }
        };

        if (!isBad1 && !isBad2) {
          taraScore = 3;
          taraExplanation = `命運星宿交叉指示皆為合平大吉之相！第一人至第二人為【${taraMeaning(r1)}】，第二人至第一人為【${taraMeaning(r2)}】。這極其罕見而良性，顯示兩人人生方向、命運節奏、大運輪轉軌道具高度協同效應，不容易因外在事業變故或考驗而生怨。`;
        } else if (isBad1 && isBad2) {
          taraScore = 0;
          taraExplanation = `警戒：雙方命曜軌道路線皆產生碰撞。第一人面臨【${taraMeaning(r1)}】，第二人面臨【${taraMeaning(r2)}】。此在命理上屬於星宿雙向干擾，日常生活中易遭遇價值觀碰撞，或在大運交泰、歲運不佳時，情緒及家庭壓力顯著增加。應多自我覺察，給予對方空間。`;
        } else {
          taraScore = 1.5;
          const badParty = isBad1 ? '第二人對第一人' : '第一人對第二人';
          const badValue = isBad1 ? r1 : r2;
          taraExplanation = `呈現半吉和諧。單向軌道相安，但局部面臨考驗：其中【${badParty}】為不利的【${taraMeaning(badValue)}】磁場。表明雙方在其中一方處於特定人生關口時，另一方可能感到不安，或容易無意中加重對方的心理負荷。若能維持互信將有助於解鎖。`;
        }
        runningScore += taraScore;
        kootas.push({ name_zh: '宿命命曜 (Tara Koota)', value: taraScore, maxValue: 3, explanation: taraExplanation, status: taraScore === 3 ? 'pass' : (taraScore === 1.5 ? 'partial' : 'fail') });

        // D. Yoni (Physical / Temperament Affection Yoni) - Max 4 Pts
        const animal1 = NAKSHATRA_YONIS[nakIndex1];
        const animal2 = NAKSHATRA_YONIS[nakIndex2];
        let yoniScore = 2;
        let yoniExplanation = "";

        if (animal1 === animal2) {
          yoniScore = 4;
          yoniExplanation = `極致契合！雙方同屬【${YONI_NAMES_ZH[animal1] || animal1}】能量。在生理化學、肢體接觸、深層神經與肉體親密度上有高超和諧，情感中能產生非常深的自然依賴，獲得滿分！`;
        } else if (YONI_ENEMY_MAP[animal1] === animal2) {
          yoniScore = 0;
          yoniExplanation = `⚠️ 觸發 Yoni 宿敵煞：第一人為【${YONI_NAMES_ZH[animal1] || animal1}】，第二人為【${YONI_NAMES_ZH[animal2] || animal2}】，雙方動物象徵構成了「天生宿敵之爭」（如貓鼠鬥、蛇獴爭、虎牛克等）。這易點燃關係中不可名狀的莫名的敏感與猜忌，一旦發生磨擦容易往極端的控制或反彈方向演變，需克制脾氣。`;
        } else {
          // Check friendly vs neutral
          const isFriendly = ['Horse', 'Elephant', 'Deer', 'Cow', 'Buffalo'].includes(animal1) && ['Horse', 'Elephant', 'Deer', 'Cow', 'Buffalo'].includes(animal2);
          if (isFriendly) {
            yoniScore = 3;
            yoniExplanation = `雙方動物性情為【${YONI_NAMES_ZH[animal1]}】對【${YONI_NAMES_ZH[animal2]}】。自然和諧友好，生理契合與相處習慣非常怡心自在，互補而溫暖。`;
          } else {
            yoniScore = 2;
            yoniExplanation = `第一人 Yoni 為【${YONI_NAMES_ZH[animal1]}】，第二人為【${YONI_NAMES_ZH[animal2]}】。這在肉體親密與體質共鳴上為中和狀態，日常生活需要更多的浪漫心意鋪墊、優雅儀式感來點燃能量。`;
          }
        }
        runningScore += yoniScore;
        kootas.push({ name_zh: '生理情感 (Yoni Koota)', value: yoniScore, maxValue: 4, explanation: yoniExplanation, status: yoniScore >= 3 ? 'pass' : (yoniScore === 2 ? 'partial' : 'fail') });

        // E. Maitri (Moon Sign Lord Friendship) - Max 5 Pts
        const getSignLord = (sign: number) => {
          if ([1, 8].includes(sign)) return 'Mars';
          if ([2, 7].includes(sign)) return 'Venus';
          if ([3, 6].includes(sign)) return 'Mercury';
          if (sign === 4) return 'Moon';
          if (sign === 5) return 'Sun';
          if ([9, 12].includes(sign)) return 'Jupiter';
          return 'Saturn';
        };

        const lord1 = getSignLord(sign1);
        const lord2 = getSignLord(sign2);

        // Get mutual relationship points
        const isFriendOf = (pA: string, pB: string) => PLANET_FEELINGS[pA]?.friends.includes(pB);
        const isEnemyOf = (pA: string, pB: string) => PLANET_FEELINGS[pA]?.enemies.includes(pB);

        const rel1to2 = isFriendOf(lord1, lord2) ? 'friend' : (isEnemyOf(lord1, lord2) ? 'enemy' : 'neutral');
        const rel2to1 = isFriendOf(lord2, lord1) ? 'friend' : (isEnemyOf(lord2, lord1) ? 'enemy' : 'neutral');

        let maitriScore = 3;
        let maitriExplanation = "";

        if (lord1 === lord2) {
          maitriScore = 5;
          maitriExplanation = `極緻和諧！雙方月曜宮主星皆為同星【${getPlanetName(lord1, ['zh'])}】守護。兩人脾氣秉性非常對頻，思維習慣如出一轍。日常生活中的想法、品味、愛好高度和諧，沒有重大的思維分歧。`;
        } else if (rel1to2 === 'friend' && rel2to1 === 'friend') {
          maitriScore = 5; // mutually friends 
          maitriExplanation = `雙向熱戀和諧！第一人主星 ${getPlanetName(lord1, ['zh'])} 與第二人主星 ${getPlanetName(lord2, ['zh'])} 彼此皆為「大吉好友」。兩人在思想觀念上非常有話聊，互相欣賞对方的觀點，相處愉快。`;
        } else if ((rel1to2 === 'friend' && rel2to1 === 'neutral') || (rel1to2 === 'neutral' && rel2to1 === 'friend')) {
          maitriScore = 4;
          maitriExplanation = `高和諧。主星 ${getPlanetName(lord1, ['zh'])} 與 ${getPlanetName(lord2, ['zh'])} 形成一個愛慕、一個理解的格局。關係中具有極佳的耐心和滋養，在討論人生決策時多能夠和氣妥協。`;
        } else if (rel1to2 === 'neutral' && rel2to1 === 'neutral') {
          maitriScore = 3;
          maitriExplanation = `正常中性。主星相互中性。互動偏向理智包容，沒有刻意的矛盾性，雙方需要共同開發興趣爱好來拉近心理情感距離。`;
        } else if (rel1to2 === 'enemy' && rel2to1 === 'enemy') {
          maitriScore = 0;
          maitriExplanation = `⚠️ 主星交惡衝突：第一人主星 ${getPlanetName(lord1, ['zh'])} 與第二人主星 ${getPlanetName(lord2, ['zh'])} 屬於天然相左與水火不容。容易出現「你講東他往西」的思維衝突，雙方難以在思想根本上完全妥協，切忌不要互相說服，以各自發展、保持彼此個體空間為宜。`;
        } else {
          maitriScore = 1;
          maitriExplanation = `思想拉鋸狀態。一方對另一方懷有偏見、排斥或感到難以看透（一向朋友、一向敵人、或一向中性）。這造成情感中容易累積小誤會且不易化解。`;
        }
        runningScore += maitriScore;
        kootas.push({ name_zh: '主星契合 (Maitri Koota)', value: maitriScore, maxValue: 5, explanation: maitriExplanation, status: maitriScore >= 4 ? 'pass' : (maitriScore >= 3 ? 'partial' : 'fail') });

        // F. Gana (Temperament/Vibe compatibility) - Max 6 Pts
        const gana1 = NAKSHATRA_GANAS[nakIndex1];
        const gana2 = NAKSHATRA_GANAS[nakIndex2];
        const GANA_GRID = [
          // Row = Partner 1 Gana (Deva-0, Manushya-1, Rakshasa-2)
          // Col = Partner 2 Gana (Deva-0, Manushya-1, Rakshasa-2)
          [6, 5, 1], // Deva (0): with Deva 6, Manushya 5, Rakshasa 1
          [5, 6, 0], // Manushya (1): with Deva 5, Manushya 6, Rakshasa 0
          [0, 0, 6]  // Rakshasa (2): with Deva 0, Manushya 0, Rakshasa 6
        ];

        const ganaScore = GANA_GRID[gana1][gana2];
        let ganaExplanation = "";
        if (gana1 === gana2) {
          ganaExplanation = `完美的魂魄本色共鳴！兩人同為【${GANA_NAMES_ZH[gana1]}】。性格基調契合，生活頻率一拍即合：若是天神組則一同保持修為和慈愛；若是人類組則一同追求世俗與成就；若是阿修羅組則一同豪爽執著、追求權力與激情。`;
        } else if (ganaScore === 5) {
          ganaExplanation = `良好和諧。一為【${GANA_NAMES_ZH[gana1]}】，一為【${GANA_NAMES_ZH[gana2]}】。這能形成成熟安穩的家庭互動，天神引導人類、人類依靠天神，家庭氛圍明朗順暢。`;
        } else if (gana1 === 1 && gana2 === 2) {
          ganaExplanation = `⚠️ Gana 氣場嚴重對立：第一人為【${GANA_NAMES_ZH[gana1]}】，第二人為【${GANA_NAMES_ZH[gana2]}】。氣質南轅北轍，人类重情義與傳統，阿修羅直爽霸道、好勝不屈。相處中極易因態度或說話語氣硬實而引發長期的冷戰或心理拉鋸。`;
        } else {
          ganaExplanation = `氣場微弱互動。第一人為【${GANA_NAMES_ZH[gana1]}】，第二人為【${GANA_NAMES_ZH[gana2]}】。兩人的生活和處事態度有著明顯的「代溝」或視角差距。其中一方性格柔和，另一方執念強，需要特別學會包容這份性格的差異。`;
        }
        runningScore += ganaScore;
        kootas.push({ name_zh: '魂魄本色 (Gana Koota)', value: ganaScore, maxValue: 6, explanation: ganaExplanation, status: ganaScore >= 5 ? 'pass' : (ganaScore >= 1 ? 'partial' : 'fail') });

        // G. Bhakoot (Rashi/Sign compatibility) - Max 7 Pts
        const dist = (sign2 - sign1 + 12) % 12 + 1; // Partner 2 place relative to Partner 1
        const distBack = (sign1 - sign2 + 12) % 12 + 1; // Partner 1 place relative to Partner 2

        let bhakootScore = 0;
        let bhakootExplanation = "";
        const isFavorableBhakoot = [1, 3, 4, 10, 11].includes(dist);

        if (isFavorableBhakoot) {
          bhakootScore = 7;
          let rName = "";
          if (dist === 1) rName = "1-1 (同曜共生)";
          else if (dist === 3 || dist === 11) rName = "3-11 (互利財富/人際拓展)";
          else rName = "4-10 (四角中堅支撐/家庭事業和諧)";
          
          bhakootExplanation = `大吉！月亮宮位距離比率形成和諧之「${rName}」構造，徹底免除 Bhakoot Dosha 的能量干擾。兩人能共同守護家庭財富、孕育和諧後代，並在心理情感上產生雙向的強大安慰與定力，合盤取得 7 分滿分！`;
        } else {
          bhakootScore = 0;
          let doshaName = "";
          if (dist === 2 || dist === 12) {
            doshaName = "2-12 孤寡財耗煞 (Dwirdwadashe)";
            bhakootExplanation = `⚠️ 觸發【${doshaName}】（其中一人月曜在另一人二宮，另一人在十二宮）。情感上容易出現其中一方在物欲與日常消費上開支繁重，或是容易感到情感耗損、心理距離遙遠，需要共同制定合理的財務計劃與注重心靈溝通。`;
          } else if (dist === 5 || dist === 9) {
            doshaName = "5-9 宿世情仇煞 (Navapancham)";
            bhakootExplanation = `⚠️ 觸發【${doshaName}】（形成5宮和9宮的宿世大拉力）。雖然雙方在文化精神上有強烈的迷戀，但也極易激發情感上的傲慢與互不服輸。在涉及家庭責任、子女教育理念上常面臨理念代溝，雙方要放低自尊。`;
          } else {
            doshaName = "6-8 陰陽隔閡破碎煞 (Shadashtak)";
            bhakootExplanation = `⚠️ 觸發【${doshaName}】（極凶：一人月曜在另一人六宮，另一人在八宮）。在吠陀秘傳合盤中，這被認為是最需要克制的格局。代表雙方在生活中極易出現「無端爭執、理念斷層」或小病考驗。日常生活瑣事可能在短時間內爆發為冷暴力，需以大悲憫及智慧自我約束。`;
          }
          setSyncWarning(prev => prev ? `${prev} + ${doshaName}` : doshaName);
        }
        runningScore += bhakootScore;
        kootas.push({ name_zh: '感情宮宿 (Bhakoot Koota)', value: bhakootScore, maxValue: 7, explanation: bhakootExplanation, status: bhakootScore === 7 ? 'pass' : 'fail' });

        // H. Nadi (Ayurvedic/Spiritual Humors) - Max 8 Pts
        const nadi1 = NAKSHATRA_NADIS[nakIndex1];
        const nadi2 = NAKSHATRA_NADIS[nakIndex2];
        let nadiScore = 0;
        let nadiExplanation = "";

        if (nadi1 !== nadi2) {
          nadiScore = 8;
          nadiExplanation = `極緻健康和諧！第一人為【${NADI_NAMES_ZH[nadi1]}】，第二人為【${NADI_NAMES_ZH[nadi2]}】。完全避開 Nadi Dosha，雙方生理構成及氣血運行處於相生互補狀態！此等匹配有利於家族繁衍、後代健康、精神安寧。此項在合盤中佔比最重，兩人獲 8 分滿分！`;
        } else {
          nadiScore = 0;
          const nName = NADI_NAMES_ZH[nadi1];
          nadiExplanation = `⚠️ 觸發核心【Nadi Same-Dosh (同脈能量衝突大煞)】。雙方皆屬於相同的「${nName}」。在吠陀秘傳中，同脈代表氣血體質共振過強（如皆偏火氣大、或皆偏寒濕），容易像兩堵同頻的音牆碰撞。這易在關係深處引發莫名的神經緊繃、情緒敏感、或不易受孕、後代心神不寧等狀況。中和方法是多親近大自然、練習冥想瑜伽。`;
          setSyncWarning(prev => prev ? `同脈 Nadi Dosha + ${prev}` : `同脈 Nadi Dosha (${nName})`);
        }
        runningScore += nadiScore;
        kootas.push({ name_zh: '脈象融合 (Nadi Koota)', value: nadiScore, maxValue: 8, explanation: nadiExplanation, status: nadiScore === 8 ? 'pass' : 'fail' });

        setKootaResults(kootas);
        setTotalScore(runningScore);

      } catch (err: any) {
        console.error("Synastry calculation failed", err);
        alert(`計算出錯：${err.message || err}`);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  };

  // Perform Initial Calculation on load if they have data
  useEffect(() => {
    if (natalData && !p1Chart) {
      setP1Chart(natalData);
    }
  }, [natalData]);

  // Generate Personalized AI Synastry compatibility report using the standard server-side router
  const handleGenerateAISynastryReport = async () => {
    if (!p1Chart || !p2Chart) return;
    setAiLoading(true);
    setAiReport(null);
    setShowAiViewer(true);

    try {
      // 1. Pack essential data of both charts to keep payload small but highly detailed
      const packEssential = (data: ChartData) => ({
        ascendantSign: data.ascendantSign,
        planets: Object.entries(data.planets).reduce((acc: any, [name, p]: any) => {
          acc[name] = { sign: p.sign, house: p.house, degree: p.degreeInSign, name: p.name, nakshatra: p.nakshatra.name };
          return acc;
        }, {}),
        ayanamsa: data.ayanamsa
      });

      const payloadData = {
        partner1: {
          name: p1Name,
          essential: packEssential(p1Chart)
        },
        partner2: {
          name: p2Name,
          essential: packEssential(p2Chart)
        },
        compatibility: {
          score_out_of_36: totalScore,
          warning: syncWarning || '正常無多重煞',
          kootas: kootaResults.map(k => ({ name: k.name_zh, val: k.value, max: k.maxValue }))
        }
      };

      const prompt = `
你是一位精通印度吠陀占星學 (Vedic Astrology - Jyotish) 與跨文化合盤分析 (Synastry & Relationship Compatibility) 的首席大師。
請根據我為你提供的「雙人星盤深度數據」，為「${p1Name}」與「${p2Name}」撰寫一篇精細、大氣、客觀且具備溫暖療癒意義的【雙人宿世緣分與契合度終極白皮書】。

這份報告必須包含以下關鍵章節：
1. 【宿世波段與緣分緣起】：分析兩人的 Moon (月亮) 與 Ascendant (上升) 星宮特質，指出雙方靈魂在宇宙中相遇的原始引力。
2. 【八分點合盤 (Ashta Koota) 深度拆解】：兩人合盤計分為： ${totalScore} / 36 分（18分及格，24分以上極佳）。請客觀解讀此分數，並深度点评觸發的凶煞（如 ${syncWarning || '無重大凶煞'}）以及給與命理上的化解方法與心智指南（Upayas）。
3. 【星盤核心重疊影響 (Planet Overlaps)】：分析 A 的太陽/月亮/金星落入 B 的什麼宮位，以及 B 的太陽/月亮/金星落入 A 的宮位。這對彼此人生軌跡和心理情感領域有何喚醒效應。
4. 【大師智慧忠告 (Upaya & Soul Path Guide)】：給出具體的關係相處調研忠告，指引兩人如何在性格分歧、大運交變時維持靈魂的和諧、克制猜疑和情緒波動。

請以繁體中文撰寫，字數不少於 1200 字。
要求：排版優雅，段落清晰，充滿啟發性。不要使用任何預設行事曆連結。
`;

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartData: payloadData,
          prompt: prompt
        })
      });

      let result: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`伺服器回應了非預期的格式 (HTTP ${response.status})。可能是系統忙碌或重啟中，請稍後重試。\n\n[伺服器回應]: ${text.substring(0, 300)}`);
      }
      
      if (!response.ok) {
        throw new Error(result?.error || `API 錯誤 (HTTP ${response.status})`);
      }
      
      if (result.report) {
        setAiReport(result.report);
      } else {
        setAiReport("生成報告時發生錯誤，請稍後重試。");
      }
    } catch (error: any) {
      console.error("AI report failed", error);
      setAiReport(`無法連通 AI 合成引擎或發生錯誤：${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // 12 Houses descriptions for Synastry Overlaps
  const getOverlayReading = (planet: string, houseNum: number) => {
    const pZh = getPlanetName(planet, ['zh']);
    switch(planet) {
      case 'Sun':
        if (houseNum === 1) return `帶來強大的存在感與照耀。對方能感受到你無比的自信與主導引力，能有效提振其人生信心，但相處中需注意不要過於自我中心。`;
        if (houseNum === 5) return `強烈激發對方的創造力與玩樂火花！這是一個極佳的戀愛、藝術共鳴位，對方覺得與你在一起非常多彩多姿，充滿能量。`;
        if (houseNum === 7) return `命中注定的合作與相遇。你的行為容易完全被對方看重為一生的靈魂伴侶或核心投射目標，能深度參與對方的世界。`;
        if (houseNum === 9) return `精神與靈性的高度導師位。你常以智慧、哲學或生活眼界引導對方的精神境界，一同旅行、學道或探尋生命真理。`;
        if (houseNum === 10) return `活化對方的事業格局。你能引導並重構對方的社會聲望、志向、榮譽感，適合作為事業上的重要盟友。`;
        return `將光芒傾注於此宮位領域。帶動該宮位的能量活化，促使對方重視此界面的日常生活體驗。`;
      case 'Moon':
        if (houseNum === 1) return `兩人能瞬間感應彼此喜怒哀樂。你的直覺、情緒波動會直接在對方的心理層面引起漣漪，雙方就像一體。`;
        if (houseNum === 4) return `深深的「歸屬感」與「家的歸宿」。對方在你身邊能卸下所有防備，找到家庭般的庇護，利於情感牢固與家庭建設。`;
        if (houseNum === 7) return `深層的心理依賴和愛慕。你滿足了對方潛意識中對伴侶的情感定義，雙向的體貼非常細膩，容易形影不離。`;
        if (houseNum === 12) return `靈魂的海洋。雙方的感受常互通於夢境、秘密、或潛意識中。可能會有莫名而宿世的深情連結。`;
        return `在感情、安全感與內在心神上提供深刻滋養，使對方在該宮位事務中感到無比安心舒服。`;
      case 'Venus':
        if (houseNum === 1) return `天然的美感與外貌吸引力！對方眼中你是完美的、迷人的，你的優雅和體貼能徹底舒緩對方的緊繃感，非常甜美。`;
        if (houseNum === 5) return `浪漫激情與情趣的顛峰！雙方能盡情享受美妙的約會、休閒與深刻的愛意互動，充滿藝術和浪漫的色彩。`;
        if (houseNum === 7) return `吠陀合盤最美伴侶位。你將和諧、柔情、藝術和浪漫全盤傾注於對方的伴侶宮，在物質和情感層面皆是非常良善的福報。`;
        if (houseNum === 11) return `共享社群和利潤豐盛。你們在社交圈或財富積累上能融洽合作，互為貴人，共同開啟生活的開闊機緣。`;
        return `帶來迷人的舒適、和諧與美感。顯著美化並滋養對方的該宮位功能，緩解多種潛在壓力。`;
      case 'Mars':
        if (houseNum === 1) return `強大的熱情和物理張力。你激發了對方的鬥志與雄心，容易共同衝刺，但亦極易因瑣事發生摩擦、直接的脾氣對撞。`;
        if (houseNum === 7) return `強烈情感張力，但也容易激化紛爭。你激發了對方追求浪漫或執著的決心，但需妥協以防長期的權利與脾氣摩擦。`;
        if (houseNum === 8) return `⚠️ 觸發 Mars Synastry 8宮拉力。在隱私或性吸引上有極端強大的佔有慾與深層張力，但日常相處極易陷入控制、嫉妒、猜忌，需注重安全感與冷靜。`;
        return `注入極強的驅動力、激情和競爭力。能催促對方在該宮位事務中展現魄力，但需控制急躁作風。`;
      case 'Jupiter':
        if (houseNum === 1) return `對方此生最珍貴的靈性與智慧貴人！金木合和，你的存在就像給予對方的恆久庇佑，為其帶來莫大機緣與生活樂觀。`;
        if (houseNum === 7) return `福報之吉。在伴侶、婚姻與長久合作上提供充實財富與相互滋潤。讓對方感到幸運與被上天垂憐，感情關係長治久安。`;
        if (houseNum === 9) return `思想、道德、信念的最完美交泰。一同求真，帶領彼此探索宇宙萬律，感情能轉化為高階的靈性支持，功德無量。`;
        return `為此宮位注滿無上福澤、擴張與神聖包容。你總能在這領域無私地支持、鼓勵並指引對方。`;
      case 'Saturn':
        if (houseNum === 4) return `帶來了厚重的責任與義務感。這在家庭、資產方面能建立起極其穩定的契約，但也可能帶來心理上的壓抑感或負擔。`;
        if (houseNum === 7) return `長久不渝但偏向嚴肅的婚姻盟約。這提供了無與倫比的忠誠度和現實考驗。雖然缺乏一時的輕快，但卻是白頭偕老的中流砥柱。`;
        if (houseNum === 10) return `為對方的事業帶來強烈的現實架構、紀律要求與長久規律。督促對方戒驕戒躁，共同攀登世俗台階。`;
        return `為對方的此宮位引入紀律、結構和考驗，往往帶來了某種長期、無法逃避的心理債務或責任。`;
      default:
        return `在此宮位帶來了獨特的占星作用力。`;
    }
  };

  // Helper values for selected sign info
  const getElementEmoji = (name: string) => {
    if (name.includes('婆羅門') || name.includes('Brahmin') || name.includes('Water')) return '💧 水象';
    if (name.includes('剎帝利') || name.includes('Kshatriya') || name.includes('Fire')) return '🔥 火象';
    if (name.includes('吠舍') || name.includes('Vaishya') || name.includes('Earth')) return '🌱 土象';
    return '💨 風象';
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-350">
      
      {/* Dynamic Introduction Card with elegant gradients */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-indigo-500/10 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-pink-500/5 select-none font-bold text-[120px] pointer-events-none pr-6">
          Jyotish
        </div>
        <h2 className="text-xl font-black text-indigo-950 flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-500" />
          <span>👥 雙人合盤宿世契合度分析中心 (Ashta Koota Milan & Synastry)</span>
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
          吠陀占星學中，兩人的結合並非隨機，而是宿世星曜引力圈的再次軌道聚合。
          本系統採用最崇高精確的<strong>「八分點合盤 (Ashta Koota Milan)」共 36 分體系</strong>，從宿命命曜 (Tara)、脈象核心 (Nadi)、感情宮宿 (Bhakoot)、性情磁吸 (Vashya) 等八大能量次元，深度分析雙方潛意識。
          本命盤各行星亦可重疊印記至伴侶的宮位，解密兩人的長久相處奧秘。
        </p>
      </div>

      {/* Inputs Configuration Box in balanced bento columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Partner 1 Selector Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-150 pb-3">
            <h3 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5 uppercase tracking-widest">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
              第一人資訊 (Partner 1 / 命主甲)
            </h3>
            
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPartner1Mode('active')}
                disabled={!natalData}
                className={`py-1 px-2.5 text-[10px] font-bold rounded-lg transition-all border ${
                  partner1Mode === 'active' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 disabled:opacity-50'
                }`}
              >
                帶入當前本命盤
              </button>
              <button
                type="button"
                onClick={() => setPartner1Mode('custom')}
                className={`py-1 px-2.5 text-[10px] font-bold rounded-lg transition-all border ${
                  partner1Mode === 'custom' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                手動填寫資料
              </button>
            </div>
          </div>

          {partner1Mode === 'active' ? (
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 text-left space-y-2">
              <p className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <span>✅ 已成功綁定當前主星盤數據</span>
              </p>
              {natalData ? (
                <div className="text-[11px] text-slate-600 space-y-1 font-semibold pl-4">
                  <p>命主：{natalData.utcTime ? '本命星盤持有人' : '主盤命曜'}</p>
                  <p>上升點：{natalData.ascendant.toFixed(2)}° ({getZodiacName(natalData.ascendantSign, ['zh'])}座)</p>
                  <p>月亮星宿：{natalData.planets['Moon']?.nakshatra.name} | 第 {natalData.planets['Moon']?.nakshatra.pada} 足 (Pada)</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">請先點擊左側「計算星盤」讀取原始數據。</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">姓名/稱呼</label>
                  <input
                    type="text"
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">出生日期 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={p1Date}
                    onChange={(e) => setP1Date(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">時間 (HH:MM)</label>
                  <input
                    type="time"
                    value={p1Time}
                    onChange={(e) => setP1Time(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">時區 (GMT+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={p1Timezone}
                    onChange={(e) => setP1Timezone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">緯度 (Latitude)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={p1Lat}
                    onChange={(e) => setP1Lat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">經度 (Longitude)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={p1Lng}
                    onChange={(e) => setP1Lng(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1.5 select-none">
                <input
                  type="checkbox"
                  id="p1IsDST"
                  checked={p1IsDST}
                  onChange={(e) => setP1IsDST(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="p1IsDST" className="text-[11px] font-bold text-slate-600 cursor-pointer">
                  此出生時間正在適用日光節約 (DST +1)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Partner 2 Selector Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-150 pb-3">
            <h3 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5 uppercase tracking-widest">
              <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 shrink-0" />
              第二人資訊 (Partner 2 / 命主乙)
            </h3>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPartner2Mode('saved')}
                disabled={savedCharts.length === 0}
                className={`py-1 px-2.5 text-[10px] font-bold rounded-lg transition-all border ${
                  partner2Mode === 'saved' 
                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 disabled:opacity-50'
                }`}
              >
                從已存星盤載入
              </button>
              <button
                type="button"
                onClick={() => setPartner2Mode('custom')}
                className={`py-1 px-2.5 text-[10px] font-bold rounded-lg transition-all border ${
                  partner2Mode === 'custom' 
                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                手動填寫資料
              </button>
            </div>
          </div>

          {partner2Mode === 'saved' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                  請選擇已儲存的合盤對象：
                </label>
                <select
                  value={p2SelectedSavedId}
                  onChange={(e) => handleSelectSavedChart(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50 font-bold text-slate-800"
                >
                  <option value="">-- 點擊展開清單 --</option>
                  {savedCharts.map(c => (
                    <option key={c.id} value={c.id}>
                      👤 {c.name} ({c.date})
                    </option>
                  ))}
                </select>
              </div>

              {p2SelectedSavedId && (
                <div className="text-[11px] text-slate-500 space-y-1 bg-pink-50/20 p-3 border border-pink-100/50 rounded-xl font-semibold">
                  <p className="text-pink-900 font-extrabold">備註：已成功鎖定「{p2Name}」星曜經緯參數</p>
                  <p>出生地緯度：{p2Lat}° | 經度：{p2Lng}°</p>
                  <p>時間：{p2Date} {p2Time}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">姓名/稱呼</label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">出生日期 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={p2Date}
                    onChange={(e) => setP2Date(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">時間 (HH:MM)</label>
                  <input
                    type="time"
                    value={p2Time}
                    onChange={(e) => setP2Time(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">時區 (GMT+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={p2Timezone}
                    onChange={(e) => setP2Timezone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">緯度 (Latitude)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={p2Lat}
                    onChange={(e) => setP2Lat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">經度 (Longitude)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={p2Lng}
                    onChange={(e) => setP2Lng(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1.5 select-none">
                <input
                  type="checkbox"
                  id="p2IsDST"
                  checked={p2IsDST}
                  onChange={(e) => setP2IsDST(e.target.checked)}
                  className="w-3.5 h-3.5 text-pink-600 border-slate-300 rounded focus:ring-pink-500 cursor-pointer"
                />
                <label htmlFor="p2IsDST" className="text-[11px] font-bold text-slate-600 cursor-pointer">
                  此出生時間正在適用日光節約 (DST +1)
                </label>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Calculate Control Bar */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleCalculateCompatibility}
          disabled={isAnalyzing || (partner1Mode === 'active' && !natalData)}
          className="w-full sm:w-80 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-sm cursor-pointer flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>正在運算雙曜星引力軌道...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>一鍵計算雙人占星契合分析</span>
            </>
          )}
        </button>
      </div>

      {/* Main Results Board */}
      {kootaResults.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-350">
          
          {/* Section 1: Gauge scorecard */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border-2 border-indigo-500/20 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-pink-500/10 to-indigo-500/15 rounded-full blur-3xl pointer-events-none select-none" />
            
            {/* Visual Circular/Progress Gauge Block */}
            <div className="flex flex-col items-center justify-center shrink-0 w-48 h-48 rounded-full border-8 border-slate-800 bg-slate-950/40 relative shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ashta Koota</span>
              <span className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent my-1">
                {totalScore}
              </span>
              <span className="text-xs text-indigo-200 font-bold border-t border-white/5 pt-1.5 px-3">
                / 滿分 36 
              </span>

              {/* Progress ring border effect decoration */}
              <div 
                className="absolute inset-0 rounded-full border-8 border-transparent pointer-events-none transition-all duration-1000"
                style={{
                  clipPath: `polygon(50% 50%, -50% -50%, ${totalScore >= 18 ? '150% -50%' : '50% -50%'}, 150% 150%, -50% 150%, -50% -50%)`,
                  borderColor: totalScore >= 24 ? '#10b981' : (totalScore >= 18 ? '#f59e0b' : '#ef4444')
                }}
              />
            </div>

            {/* Analysis Summary details block */}
            <div className="flex-1 space-y-3.5 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-slate-100">
                  {p1Name} 👥 {p2Name} 契合判詞：
                </span>
                
                {totalScore >= 24 ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    💖 緣定三生星耀高照 (極致契合)
                  </span>
                ) : (totalScore >= 18 ? (
                  <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    🤝 和諧互補良緣相得 (合格融洽)
                  </span>
                ) : (
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
                    ⚠️ 孤曜隔林多需修行 (充滿挑戰)
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                雙方合盤宿曜八分點總得分為 <strong>{totalScore} 分 (契合度 {Math.round(totalScore / 36 * 100)}%)</strong>。
                {totalScore >= 18 
                  ? '本數值大於 18 分之安全基準門檻，表明雙方天然靈魂引力及性格傾向融洽。即使遇到現實磨難，兩人的潛意識中依然能互為主心骨。' 
                  : '本數值低於傳統推薦之及格門檻。多因脈象衝突 (Nadi Dosha) 或月柱刑克 (Bhakoot Dosha) 造成，容易在情感親密、現實日常決策中發生莫名猜忌或疲累，極度需要保持理性，以多交流與化解凶星能量為妙。'}
              </p>

              {/* Warnings / Doshas notification */}
              {syncWarning ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2.5 items-start text-red-200">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                  <div className="text-[11px] font-semibold space-y-0.5">
                    <p className="font-bold">⚠️ 触發合盤警戒凶煞 (Astrological Doshas Detected):</p>
                    <p className="leading-relaxed text-red-300/90 font-medium">
                      星盤探測出：【{syncWarning}】。上述凶煞一般會對家庭溝通及健康情緒帶來特定頻率干擾。請務必詳細閱讀下方各細項的化解建議。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-center text-emerald-300 text-[11px] font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>星盤偵測：雙方避開了所有重大惡性合盤凶煞 (脈星衝突煞、月柱刑克煞、宿敵煞)！這在占星匹配中是非常完美的祝福。</span>
                </div>
              )}

              {/* Secondary actions: AI consulting button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateAISynastryReport}
                  className="bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/30 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 select-none shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>生成 AI 宿世合盤深度報告 🔮</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI report popup container */}
          {showAiViewer && (
            <div className="bg-slate-950 border border-indigo-500/20 text-slate-100 rounded-2xl p-5 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs font-black text-indigo-400 tracking-wider flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>AI 智慧合盤解讀終極白皮書 (AI Joint Astrology Report)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const synth = window.speechSynthesis;
                    if (synth) synth.cancel();
                    setShowAiViewer(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ 關閉報告
                </button>
              </div>

              {aiLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-xs text-indigo-300 font-extrabold animate-pulse">
                    正在呼叫 Gemini 模型，多維度分析 A 與 B 全盤重疊印記...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  
                  {/* Speech reader built-in (TTS) */}
                  <div className="bg-slate-900 border border-white/5 p-3 rounded-xl flex flex-wrap gap-3 items-center justify-between">
                    <p className="text-[11px] text-slate-400 font-medium">
                      💡 點擊語音播放，由 AI 占星管家為您現場合成精準的中英語人聲報告
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!aiReport || !window.speechSynthesis) return;
                        window.speechSynthesis.cancel();
                        const cleanText = aiReport.replace(/[*#_`~=+\-|[\]]/g, '').replace(/\s+/g, ' ');
                        const utterance = new SpeechSynthesisUtterance(cleanText);
                        utterance.rate = 1.1;
                        const voices = window.speechSynthesis.getVoices();
                        const voice = voices.find(v => v.lang.includes('zh') || v.lang.includes('TW'));
                        if (voice) utterance.voice = voice;
                        window.speechSynthesis.speak(utterance);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
                    >
                      🔊 一鍵語音合成朗讀
                    </button>
                  </div>

                  <div className="text-xs text-slate-200 leading-relaxed font-semibold whitespace-pre-wrap break-words break-all bg-slate-900 p-5 rounded-xl border border-white/5 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {aiReport}
                  </div>

                  {/* Advanced Multi-channel Export Action Panel */}
                  <ReportExportActions 
                    reportTitle={`【雙人合盤】${p1Name} & ${p2Name} AI 深度報告`}
                    reportText={aiReport}
                    userName={p1Name}
                    className="bg-slate-950 border-white/5 text-slate-200"
                    chartData={natalData || undefined}
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 2: Detailed Ashta Kootas Matching - Standard compliance */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>八大維度合盤細則深度解碼 (Ashta Koota Milan Breakdown)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kootaResults.map((k, idx) => (
                <div 
                  key={idx}
                  className={`border rounded-2xl bg-white shadow-xs transition-all overflow-hidden ${
                    expandedKootaIndex === idx 
                      ? 'border-indigo-300 ring-1 ring-indigo-300/30' 
                      : 'border-slate-150 hover:border-slate-200'
                  }`}
                >
                  {/* Card header */}
                  <button
                    type="button"
                    onClick={() => setExpandedKootaIndex(expandedKootaIndex === idx ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left focus:outline-none select-none cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{k.name_zh}</span>
                        {k.status === 'pass' ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200">優良</span>
                        ) : (k.status === 'partial' ? (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200">中等</span>
                        ) : (
                          <span className="bg-red-50 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-200">衝突</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        得分：{k.value} / 滿分 {k.maxValue} 分 ({Math.round(k.value / k.maxValue * 100)}%)
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Bar indicator */}
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            k.status === 'pass' ? 'bg-emerald-500' : (k.status === 'partial' ? 'bg-amber-500' : 'bg-red-500')
                          }`}
                          style={{ width: `${(k.value / k.maxValue) * 100}%` }}
                        />
                      </div>
                      {expandedKootaIndex === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {expandedKootaIndex === idx && (
                    <div className="px-4 pb-4 border-t border-slate-50 pt-3 bg-slate-50/50 space-y-2 text-left animate-in fade-in duration-200">
                      <div className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 border border-slate-100 rounded-xl shadow-xs">
                        <p className="font-extrabold text-indigo-950 mb-1">占星軌道解密：</p>
                        <p className="whitespace-pre-line text-slate-600 text-[11px] font-medium leading-relaxed">
                          {k.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Dual Multi-house Overlaps - Vedic Synastry Placements */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-pink-500" />
              <span>雙曜星盤宮位互落重疊印記 (Vedic Planet Overlaps)</span>
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal mb-2">
              當對方走入你的生命，他們的行星坐標便深刻投影在你的星盤中。
              以下解鎖 <strong>第一人行星落入第二人Whole Sign宮位</strong> 以及 <strong>第二人行星落入第一人宮位</strong> 的雙向影響：
            </p>

            {p1Chart && p2Chart && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* P1 to P2 Overlaps */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5 space-y-3.5 text-left">
                  <h4 className="font-black text-xs text-indigo-950 flex items-center gap-1.5 border-b border-slate-100 pb-2 bg-slate-50 -mx-5 -mt-5 p-4 rounded-t-2xl">
                    <span>➡️</span>
                    {p1Name} 影響 {p2Name} (P1 Planets in P2 Houses)
                  </h4>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {['Sun', 'Moon', 'Venus', 'Mars', 'Jupiter', 'Saturn'].map(pName => {
                      const p1Pl = p1Chart.planets[pName];
                      if (!p1Pl) return null;
                      
                      // Calculate house in P2 chart: (P1 planet sign - P2 ascendant sign + 12) % 12 + 1
                      const houseInP2 = (p1Pl.sign - p2Chart.ascendantSign + 12) % 12 + 1;
                      const reading = getOverlayReading(pName, houseInP2);

                      return (
                        <div key={pName} className="p-3 border border-slate-100 rounded-xl bg-slate-50/20 text-left space-y-1 hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-300 shrink-0" />
                              {p1Name} 的【{getPlanetName(pName, ['zh'])}】
                            </span>
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                              落入 {p2Name} 第 {houseInP2} 宮 (Whole Sign)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed pl-4 font-medium">
                            {reading}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* P2 to P1 Overlaps */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5 space-y-3.5 text-left">
                  <h4 className="font-black text-xs text-pink-950 flex items-center gap-1.5 border-b border-slate-100 pb-2 bg-slate-50 -mx-5 -mt-5 p-4 rounded-t-2xl">
                    <span>⬅️</span>
                    {p2Name} 影響 {p1Name} (P2 Planets in P1 Houses)
                  </h4>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {['Sun', 'Moon', 'Venus', 'Mars', 'Jupiter', 'Saturn'].map(pName => {
                      const p2Pl = p2Chart.planets[pName];
                      if (!p2Pl) return null;

                      // Calculate house in P1 chart
                      const houseInP1 = (p2Pl.sign - p1Chart.ascendantSign + 12) % 12 + 1;
                      const reading = getOverlayReading(pName, houseInP1);

                      return (
                        <div key={pName} className="p-3 border border-slate-100 rounded-xl bg-slate-50/20 text-left space-y-1 hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-xs font-black text-pink-950 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-pink-400 fill-pink-200 shrink-0" />
                              {p2Name} 的【{getPlanetName(pName, ['zh'])}】
                            </span>
                            <span className="text-[10px] font-black bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-100">
                              落入 {p1Name} 第 {houseInP1} 宮 (Whole Sign)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed pl-4 font-medium">
                            {reading}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
