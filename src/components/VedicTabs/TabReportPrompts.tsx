import React, { useState, useRef, useEffect } from 'react';
import { ChartData, PlanetPosition, getPlanetName, getZodiacName } from '../../utils/astrology';
import { REPORT_PROMPTS } from '../../constants/prompts';
import { ReportExportActions } from '../ReportExportActions';
import { 
  Sparkles, 
  Save, 
  Trash2, 
  Plus, 
  BookOpen, 
  Copy, 
  Check, 
  User, 
  PlusCircle,
  FileText,
  AlertCircle,
  Play,
  RotateCcw,
  HardDrive,
  Loader2
} from 'lucide-react';
import { listGoogleDriveFiles, deleteGoogleDriveFile, downloadGoogleDriveFileContent } from '../../utils/googleDrive';
import { 
  auth, 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  googleProvider, 
  signInWithPopup 
} from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Props {
  data: ChartData;
  userName?: string;
  birthDate?: string;
  birthTime?: string;
}

interface CustomRole {
  label: string;
  prefix: string;
}

interface CustomPrompt {
  title: string;
  content: string;
}

export const TabReportPrompts: React.FC<Props> = ({ data, userName, birthDate, birthTime }) => {
  // Main state
  const [promptContent, setPromptContent] = useState(REPORT_PROMPTS[0].content);
  const [selectedPromptTitle, setSelectedPromptTitle] = useState(REPORT_PROMPTS[0].title);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('印度占星專家');
  const [showModal, setShowModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // ==========================================
  // AI VOICE/SPEECH SYNTHESIS ENGINE (TTS)
  // ==========================================
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.1); // default comfortable speed
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentencesToRead, setSentencesToRead] = useState<string[]>([]);

  const splitTextIntoSentences = (text: string) => {
    // Strip markdown formatting characters to maintain readable text
    const cleanText = text
      .replace(/[*#_`~=+\-|[\]]/g, '')
      .replace(/\s+/g, ' ');

    const rawChunks = cleanText.split(/([。！？；;\!\?\n])/);
    const chunks: string[] = [];
    
    let currentChunk = '';
    for (let i = 0; i < rawChunks.length; i++) {
      const part = rawChunks[i];
      if (part.match(/([。！？；;\!\?\n])/)) {
        currentChunk += part;
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = '';
      } else {
        currentChunk += part;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks.filter(c => c.length > 1);
  };

  const speakCurrentSentence = (index: number, list: string[], rate: number) => {
    if (!window.speechSynthesis) return;
    
    // Stop any existing speech synthesis before speaking
    window.speechSynthesis.cancel();
    
    if (index >= list.length) {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setCurrentSentenceIndex(0);
      return;
    }
    
    setCurrentSentenceIndex(index);
    const textToSpeak = list[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    
    // Choose local Chinese / English voices explicitly
    const voices = window.speechSynthesis.getVoices();
    const chVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CH') || v.lang.includes('TW'));
    if (chVoice) {
      utterance.voice = chVoice;
    }
    
    utterance.onend = () => {
      speakCurrentSentence(index + 1, list, rate);
    };
    
    utterance.onerror = (e) => {
      console.warn('Speech ended with state:', e);
      // Keep going unless it's explicitly stopped
      if (e.error !== 'interrupted') {
        speakCurrentSentence(index + 1, list, rate);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStartSpeaking = () => {
    if (!report) return;
    const list = splitTextIntoSentences(report);
    if (list.length === 0) return;
    
    setSentencesToRead(list);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
    speakCurrentSentence(0, list, speechRate);
  };

  const handlePauseSpeaking = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.pause();
    setIsPausedAudio(true);
  };

  const handleResumeSpeaking = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.resume();
    setIsPausedAudio(false);
  };

  const handleStopSpeaking = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setCurrentSentenceIndex(0);
  };

  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    if (isPlayingAudio && !isPausedAudio) {
      speakCurrentSentence(currentSentenceIndex, sentencesToRead, newRate);
    }
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Saved Reports Subscription state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  // Google Drive File State
  const [reportsSource, setReportsSource] = useState<'cloud' | 'drive'>('cloud');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const fetchDriveFiles = async () => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      const files = await listGoogleDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to list Google Drive files:', err);
      let errMsg = err.message || '查詢 Google Drive 失敗。';
      if (err.message?.toLowerCase().includes('popup') || err.message?.toLowerCase().includes('iframe')) {
        errMsg = '🛑 授權視窗被阻擋。請點選右上角「在新分頁中開啟」圖示，即可順利授權讀取 Google Drive 報告檔案！';
      }
      setDriveError(errMsg);
    } finally {
      setDriveLoading(false);
    }
  };

  const handleLoadDriveFile = async (fileId: string) => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      const content = await downloadGoogleDriveFileContent(fileId);
      setReport(content);
      // Automatically scroll to the generated report element
      const el = document.getElementById('ai-astrology-report-result');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Failed to load Google Drive file content:', err);
      setDriveError(err.message || '下載 Google Drive 報告內容失敗，請重試。');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDeleteDriveFile = async (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Safety Requirement: User confirmation before deletion
    const confirmed = window.confirm(`⚠️ 您確定要從您的 Google 雲端硬碟中永久刪除這份報告檔案嗎？\n\n檔案名稱: ${fileName}\n此動作將無法復原！`);
    if (!confirmed) return;

    setDriveLoading(true);
    setDriveError(null);
    try {
      await deleteGoogleDriveFile(fileId);
      // Refresh list
      const files = await listGoogleDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to delete Google Drive file:', err);
      setDriveError(err.message || '刪除 Google Drive 報告失敗，請重試。');
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    // Listen to Firebase auth changes to update user state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSavedReports([]);
      return;
    }

    // Subscribe to reports collection
    const q = query(collection(db, 'reports'), where('userId', '==', currentUser.uid));
    const unsubscribeReports = onSnapshot(q, (snapshot) => {
      const reportsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort newest first
      reportsList.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setSavedReports(reportsList);
    }, (error) => {
      console.error("Error reading saved reports:", error);
    });

    return () => unsubscribeReports();
  }, [currentUser]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
      alert("❌ 登入失敗：請點選網頁預覽視窗右上角的「在新分頁中開啟 / Open in a new tab」圖示，解除 Iframe 安全沙盒跨網域彈出限制，再重新點擊登入。");
    }
  };

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('❓ 您確定要刪除這份保存在雲端的歷史報告嗎？此動作將無法還原。')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("❌ 刪除報告失敗：" + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleLoadSavedReport = (reportText: string) => {
    setReport(reportText);
    // Scroll smoothly to active report view
    const viewItem = document.getElementById('active-report-view');
    if (viewItem) {
      viewItem.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  // Custom roles management
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    try {
      const saved = localStorage.getItem('jyotish_custom_roles2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRolePrefix, setNewRolePrefix] = useState('');

  // Custom prompts management  
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>(() => {
    try {
      const saved = localStorage.getItem('jyotish_custom_prompts2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSavePromptForm, setShowSavePromptForm] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Preset roles combined with custom roles
  const baseRoles = [
    { label: '印度占星專家', prefix: '' },
    { label: '職業顧問', prefix: '你現在以職業顧問的身分，針對此星盤提供專業建議：' },
    { label: '人生導師', prefix: '你現在以人生導師的身分，針對此星盤提供溫暖及具啟發性的指引：' },
  ];
  
  const allRoles = [...baseRoles, ...customRoles];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [promptContent]);

  // Sync custom roles to local storage
  const saveCustomRoles = (updated: CustomRole[]) => {
    setCustomRoles(updated);
    try {
      localStorage.setItem('jyotish_custom_roles2', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save custom roles", e);
    }
  };

  // Sync custom prompts to local storage
  const saveCustomPrompts = (updated: CustomPrompt[]) => {
    setCustomPrompts(updated);
    try {
      localStorage.setItem('jyotish_custom_prompts2', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save custom prompts", e);
    }
  };

  // Add custom role
  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleLabel.trim() || !newRolePrefix.trim()) return;
    
    // Check duplication
    if (allRoles.some(r => r.label === newRoleLabel.trim())) {
      alert("此角色稱號已存在，請使用不同的稱號！");
      return;
    }

    const newRoleObj = { label: newRoleLabel.trim(), prefix: newRolePrefix.trim() };
    const updated = [...customRoles, newRoleObj];
    saveCustomRoles(updated);
    setSelectedRole(newRoleLabel.trim());
    
    // Reset inputs
    setNewRoleLabel('');
    setNewRolePrefix('');
    setShowAddRoleForm(false);
  };

  // Delete custom role
  const handleDeleteCustomRole = (labelToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`確定要刪除「${labelToDelete}」角色身分嗎？`)) {
      const updated = customRoles.filter(r => r.label !== labelToDelete);
      saveCustomRoles(updated);
      setSelectedRole('印度占星專家');
    }
  };

  // Save current active prompt as a custom prompt
  const handleSaveCurrentPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptTitle.trim()) return;
    if (!promptContent.trim()) {
      alert("指令內容不能為空，請填寫指令後再儲存！");
      return;
    }

    // Check duplication
    if (customPrompts.some(p => p.title === newPromptTitle.trim())) {
      if (!confirm("已有同名的自訂範本，確定要覆蓋它嗎？")) {
        return;
      }
    }

    const newPromptObj = { title: newPromptTitle.trim(), content: promptContent };
    const filtered = customPrompts.filter(p => p.title !== newPromptTitle.trim());
    const updated = [...filtered, newPromptObj];
    
    saveCustomPrompts(updated);
    setNewPromptTitle('');
    setShowSavePromptForm(false);
  };

  // Delete custom prompt
  const handleDeleteCustomPrompt = (titleToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`確定要刪除「${titleToDelete}」自訂 Prompt 範本嗎？`)) {
      const updated = customPrompts.filter(p => p.title !== titleToDelete);
      saveCustomPrompts(updated);
    }
  };

  // Load a prompt content
  const loadPrompt = (content: string) => {
    setPromptContent(content);
  };

  const getFullAstrologyTableMarkdown = (chartData: ChartData, nameVal?: string, dobVal?: string, tobVal?: string) => {
    const finalUserName = nameVal || '命主本人';
    const ascName = getZodiacName(chartData.ascendantSign, ['zh']);
    const ascLord = chartData.houses?.[0]?.lord || '';
    const ascLordName = getPlanetName(ascLord, ['zh']);
    const ascDegreeInSign = (chartData.ascendant % 30).toFixed(2);
    
    let md = `\n\n`;
    md += `======================================================================\n`;
    md += `🌌 【印占星盤個案基本設定資訊與九曜星位表 (Subject & Graha Placements)】\n`;
    md += `======================================================================\n`;
    md += `👤 個案姓名: ${finalUserName}\n`;
    md += `📅 出生日期: ${dobVal || '未提供'}\n`;
    md += `🕒 出生時間: ${tobVal || '未提供'}\n`;
    md += `🪐 命宮星座: ${ascName} (第 1 宮) | 經度度數: ${ascDegreeInSign}°\n`;
    md += `💫 命主星 (Ascendant Lord): ${ascLordName}\n`;
    md += `🌌 占星歲差系統: Lahiri Ayanamsa (科學恆星制 / Sidereal Zodiac)\n`;
    md += `----------------------------------------------------------------------\n\n`;
    md += `📋 九曜星盤行星詳細星位表 (Detailed Graha Table):\n\n`;
    md += `| 行星 (Planet) | 飛入星座與宮位 (Sign & House) | 精確經度 (Longitude) | 狀態 (Status) | 星宿足與主星 (Nakshatra, Pada & Lord) | 吉凶廟旺狀態 (Dignity) |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    
    const sortedPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    sortedPlanets.forEach(pName => {
      const p = chartData.planets[pName];
      if (p) {
        const transSign = getZodiacName(p.sign, ['zh']);
        const transName = getPlanetName(pName, ['zh']);
        const retroStr = p.isRetrograde ? '逆行 ℟' : '順行';
        const combStr = p.isCombust ? '焦傷 ☄️' : '';
        const statusStr = [retroStr, combStr].filter(Boolean).join('、');
        
        const nakName = p.nakshatra?.name || '無';
        const nakPada = p.nakshatra?.pada ? `第 ${p.nakshatra.pada} 足` : '';
        const nakLord = p.nakshatra?.lord ? `(星宿主星: ${getPlanetName(p.nakshatra.lord, ['zh'])})` : '';
        const nakFull = `${nakName} ${nakPada} ${nakLord}`;
        
        let dignityText = '通常 (Neutral)';
        if (p.dignity === 'Exalted') dignityText = '曜升 (Exalted) ★';
        else if (p.dignity === 'Debilitated') dignityText = '曜陷 (Debilitated) ⚠';
        else if (p.dignity === 'Moolatrikona') dignityText = '三合本宮 (Moolatrikona)';
        else if (p.dignity === 'Own Sign') dignityText = '本宮 (Own Sign)';
        else if (p.dignity) dignityText = p.dignity;

        md += `| ${transName} (${pName}) | ${transSign} (第 ${p.house} 宮) | ${p.degreeInSign.toFixed(2)}° | ${statusStr} | ${nakFull} | ${dignityText} |\n`;
      }
    });

    // Append Vargas
    const targetVargas = [
      { id: 'D9', title: 'D-9 婚姻與潛能盤 (Navamsha)' },
      { id: 'D10', title: 'D-10 事業與成就盤 (Dashamsha)' },
      { id: 'D60', title: 'D-60 業力與前世盤 (Shashtiamsha)' }
    ];

    targetVargas.forEach(tv => {
      const varga = chartData.vargas?.find(v => v.id === tv.id);
      if (varga) {
        md += `\n📋 ${tv.title} 星位表:\n\n`;
        md += `| 行星 (Planet) | 飛入星座 (Sign) | 宮位 (House) |\n`;
        md += `| :--- | :--- | :--- |\n`;
        md += `| 命宮 (Ascendant) | ${getZodiacName(varga.ascendantSign, ['zh'])} | 第 1 宮 |\n`;
        
        sortedPlanets.forEach(pName => {
          const p = varga.planets[pName];
          if (p) {
            const house = (p.sign - varga.ascendantSign + 12) % 12 + 1;
            md += `| ${getPlanetName(pName, ['zh'])} (${pName}) | ${getZodiacName(p.sign, ['zh'])} | 第 ${house} 宮 |\n`;
          }
        });
      }
    });

    // Append SAV
    if (chartData.sav) {
      md += `\n📋 Ashtakavarga SAV (綜合星光分數):\n\n`;
      md += `| 宮位 (House) | 星座 (Sign) | SAV 分數 |\n`;
      md += `| :--- | :--- | :--- |\n`;
      
      for (let i = 1; i <= 12; i++) {
        const sign = ((chartData.ascendantSign + i - 2) % 12) + 1;
        const score = (chartData.sav as Record<number, number>)[sign] || 0;
        md += `| 第 ${i} 宮 | ${getZodiacName(sign, ['zh'])} | ${score} |\n`;
      }
    }

    // Append Current Dasha
    if (chartData.dashas && chartData.dashas.length > 0) {
      const now = new Date();
      
      const findCurrentDasha = (dashas: any[], level = 1): string => {
        for (const d of dashas) {
          const start = new Date(d.start);
          const end = new Date(d.end);
          if (start <= now && now <= end) {
            const pName = getPlanetName(d.planet, ['zh']);
            let res = `L${level}: ${pName} (${start.toISOString().split('T')[0]} ~ ${end.toISOString().split('T')[0]})`;
            if (d.subPeriods && d.subPeriods.length > 0) {
              const subRes = findCurrentDasha(d.subPeriods, level + 1);
              if (subRes) {
                res += `\n  ↳ ${subRes}`;
              }
            }
            return res;
          }
        }
        return '';
      };
      
      const currentDashaTree = findCurrentDasha(chartData.dashas);
      if (currentDashaTree) {
        md += `\n📋 當前 Vimshottari Dasha (大/小運):\n\n`;
        md += currentDashaTree + `\n`;
      }
    }
    
    md += `\n----------------------------------------------------------------------\n`;
    md += `* 本表由系統 Lahiri Sidereal 演算法精測生成，每份報告均附有完整的九星軌跡與廟旺度數。 *\n`;
    return md;
  };

  // Generate Report Call
  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      // Filter data to include all high-fidelity Vedic astrology indicators for maximum AI analytical context
      const essentialData = {
        ascendant: data.ascendant,
        ascendantSign: data.ascendantSign,
        planets: Object.fromEntries(
          (Object.entries(data.planets) as [string, PlanetPosition][]).map(([name, p]) => [
            name,
            {
              name: p.name,
              sign: p.sign,
              degreeInSign: p.degreeInSign,
              house: p.house,
              nakshatra: p.nakshatra,
              dignity: p.dignity,
              isRetrograde: p.isRetrograde || false,
              isCombust: p.isCombust || false
            }
          ])
        ),
        houses: data.houses.map(h => ({
          number: h.number,
          sign: h.sign,
          lord: h.lord,
          planetsInHouse: h.planetsInHouse,
          score: h.score || 0,
          degree: h.degree,
          longitude: h.longitude,
          nakshatra: h.nakshatra
        })),
        bhriguBindu: data.bhriguBindu,
        arudhaLagna: data.arudhaLagna,
        upapadaLagna: data.upapadaLagna,
        midheaven: data.midheaven,
        // Include Divisional Charts (Vargas D2-D60) - crucial for advanced Vedic prompts
        vargas: data.vargas?.map(v => ({
          name: v.name,
          id: v.id,
          ascendantSign: v.ascendantSign,
          planets: v.planets
        })) || [],
        // Include Vimshottari Dashas time triggers (Level 1, 2, and 3)
        dashas: data.dashas?.map(d => ({
          planet: d.planet,
          start: d.start instanceof Date ? d.start.toISOString() : d.start,
          end: d.end instanceof Date ? d.end.toISOString() : d.end,
          level: d.level,
          subPeriods: d.subPeriods?.map(sub => ({
            planet: sub.planet,
            start: sub.start instanceof Date ? sub.start.toISOString() : sub.start,
            end: sub.end instanceof Date ? sub.end.toISOString() : sub.end,
            level: sub.level,
            subPeriods: sub.subPeriods?.map(p3 => ({
              planet: p3.planet,
              start: p3.start instanceof Date ? p3.start.toISOString() : p3.start,
              end: p3.end instanceof Date ? p3.end.toISOString() : p3.end,
              level: p3.level
            }))
          }))
        })) || [],
        // Include alternative timing systems
        yoginiDashas: data.yoginiDashas?.map(d => ({
          planet: d.planet,
          start: d.start instanceof Date ? d.start.toISOString() : d.start,
          end: d.end instanceof Date ? d.end.toISOString() : d.end,
          level: d.level,
          subPeriods: d.subPeriods?.map(sub => ({
            planet: sub.planet,
            start: sub.start instanceof Date ? sub.start.toISOString() : sub.start,
            end: sub.end instanceof Date ? sub.end.toISOString() : sub.end,
            level: sub.level
          }))
        })) || [],
        charaDashas: data.charaDashas?.map(d => ({
          planet: d.planet,
          start: d.start instanceof Date ? d.start.toISOString() : d.start,
          end: d.end instanceof Date ? d.end.toISOString() : d.end,
          level: d.level,
          subPeriods: d.subPeriods?.map(sub => ({
            planet: sub.planet,
            start: sub.start instanceof Date ? sub.start.toISOString() : sub.start,
            end: sub.end instanceof Date ? sub.end.toISOString() : sub.end,
            level: sub.level
          }))
        })) || [],
        // Planetary Power
        shadbala: data.shadbala || null,
        // Ashtakavarga SAV (Sum of Ashtakavarga points) and BAV
        sav: data.sav || null,
        bav: data.bav || null
      };

      const activeRoleObj = allRoles.find(r => r.label === selectedRole);
      const rolePrefix = activeRoleObj?.prefix || '';
      
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartData: essentialData,
          prompt: `${rolePrefix}${promptContent}`
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
      
      const tableMarkdown = getFullAstrologyTableMarkdown(data, userName, birthDate, birthTime);
      setReport(`${result.report}${tableMarkdown}`);
    } catch (error: any) {
      setReport(`生成報告時發生錯誤，請稍後再試。\n錯誤訊息: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Copy prompt to clipboard
  const copyPromptText = () => {
    const activeRoleObj = allRoles.find(r => r.label === selectedRole);
    const rolePrefix = activeRoleObj?.prefix || '';
    const tableMarkdown = getFullAstrologyTableMarkdown(data, userName, birthDate, birthTime);
    const fullText = `${rolePrefix}${promptContent}\n\n${tableMarkdown}`;
    navigator.clipboard.writeText(fullText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Copy generated report to clipboard
  const copyReportText = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const renderSavedReportsSection = () => {
    if (!currentUser) {
      return (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2.5">
          <p className="text-xs text-slate-600 font-extrabold max-w-xl mx-auto flex items-center justify-center gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>本系統為尊貴命主提供安全的個人隱私雲端，請配合左下角「Google 登入」以便在生成報告後，一鍵儲存備份至雲端。</span>
          </p>
        </div>
      );
    }

    if (reportsSource === 'cloud') {
      if (savedReports.length === 0) {
        return (
          <div className="p-8 bg-slate-50 border border-slate-150 border-dashed rounded-xl text-center">
            <p className="text-xs text-slate-400 font-bold flex flex-col items-center gap-1.5">
              <span>𓭭</span>
              <span>您目前尚未在雲端的個人隱私檔中儲存任何 AI 星盤分析與醫療預警報告。</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              在上方的 AI 報告生成卡下方，點選<b>「儲存至雲端資料庫」</b>按鈕，即可將 analysis 與算命內容永久安全儲存！
            </p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-2">
          {savedReports.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleLoadSavedReport(item.reportText)}
              className="group relative p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-350 rounded-2xl transition-all cursor-pointer hover:shadow-lg flex flex-col justify-between space-y-3 animate-in fade-in"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold px-2 py-0.5 rounded-lg shrink-0">
                    👤 {item.userName || '命主本人'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                
                <h4 className="font-extrabold text-slate-800 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  🔮 {item.reportTitle || '智慧預警分析報告'}
                </h4>

                {item.remarks && (
                  <div className="text-[10px] bg-amber-55 border border-amber-100 rounded px-1.5 py-0.5 text-amber-800 line-clamp-1">
                    📝 備註: {item.remarks}
                  </div>
                )}
                
                <p className="text-[11px] text-slate-500 font-medium line-clamp-3 leading-relaxed whitespace-pre-wrap break-words break-all">
                  {item.reportText}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[10px] text-indigo-550 font-extrabold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  📖 點擊此卡片載入閱讀 &rarr;
                </span>
                
                <button
                  onClick={(e) => handleDeleteReport(item.id, e)}
                  className="p-1 px-2 border border-transparent hover:border-red-200 bg-slate-150 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                  title="刪除這份報告"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Google Drive View
    if (driveLoading) {
      return (
        <div className="p-8 text-center space-y-2.5">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-extrabold">正在存取並讀取您 Google Drive 中的 .md 報告檔案...</p>
        </div>
      );
    }

    if (driveError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold space-y-2">
          <p><b>🔍 讀取 Google 雲端硬碟遭遇限制：</b></p>
          <p className="text-slate-600 font-medium leading-relaxed">{driveError}</p>
          <button 
            onClick={fetchDriveFiles}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-red-300 hover:border-red-400 font-bold text-red-700 rounded-lg text-[11px] transition-colors cursor-pointer"
          >
            🔄 重新整理 / 再次授權
          </button>
        </div>
      );
    }

    if (driveFiles.length === 0) {
      return (
        <div className="p-8 bg-slate-50 border border-slate-150 border-dashed rounded-xl text-center">
          <p className="text-xs text-slate-400 font-bold flex flex-col items-center gap-1.5">
            <HardDrive className="w-8 h-8 text-slate-300 animate-pulse" />
            <span>您目前尚未在您的 Google 雲端硬碟中儲存任何 .md 格式星盤解讀檔。</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            在上邊已產生的報告控制庫中，點選<b>「傳送到 雲端硬碟 (MD)」</b>即可立即安全發佈至雲端硬碟！
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-2">
        {driveFiles.map((file) => (
          <div 
            key={file.id}
            onClick={() => handleLoadDriveFile(file.id)}
            className="group relative p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-350 rounded-2xl transition-all cursor-pointer hover:shadow-lg flex flex-col justify-between space-y-3 animate-in fade-in"
          >
            <div className="space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 font-extrabold px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-sky-500" />
                  Google Drive (.md)
                </span>
                <span className="text-[10px] text-slate-405 font-mono">
                  {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : ''}
                </span>
              </div>
              
              <h4 className="font-extrabold text-slate-800 text-xs line-clamp-2 group-hover:text-sky-600 transition-colors leading-relaxed">
                📄 {file.name}
              </h4>
              
              <p className="text-[10px] text-slate-400 font-mono">
                檔案代碼: {file.id.substring(0, 15)}...
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[10px] text-sky-605 font-extrabold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                📖 下載並載入報告 &rarr;
              </span>
              
              <button
                onClick={(e) => handleDeleteDriveFile(file.id, file.name, e)}
                className="p-1 px-2 border border-transparent hover:border-red-200 bg-slate-150 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                title="從雲端硬碟刪除此檔案"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="border-b pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-indigo-600">🤖</span> 智能占星報告客製助理
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            自由填寫 Prompts、預設諮詢角色的 AI 印度星盤深度解讀器 (Lahiri 恆星制)
          </p>
        </div>
      </div>

      {/* Main Grid: Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Rules, Personas & Saved Templates Picker */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* 1. Expert Persona Selector */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4.5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-indigo-500" />
                1. 專家諮詢定位 (Persona)
              </span>
              <button 
                onClick={() => setShowAddRoleForm(!showAddRoleForm)}
                className="text-xs text-indigo-600 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {showAddRoleForm ? '收起' : '自訂角色'}
              </button>
            </div>

            {showAddRoleForm && (
              <form onSubmit={handleAddCustomRole} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-bold text-indigo-900">✍️ 自訂諮詢角色與前置提示</p>
                <div>
                  <label className="block text-[11px] text-gray-500 font-extrabold mb-1">角色稱號</label>
                  <input 
                    type="text" 
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                    placeholder="例如：親密關係導師"
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-extrabold mb-1">引導詞 / 前置定位身份 (Prefix)</label>
                  <textarea 
                    value={newRolePrefix}
                    onChange={(e) => setNewRolePrefix(e.target.value)}
                    placeholder="例如：你現在是一位精通印度 D9 星盤和玄秘愛情功課的靈魂伴侶解讀專家，請根據我給的數據..."
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-medium min-h-[60px] focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    新增並選定
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAddRoleForm(false)}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-extrabold">啟用的專家角色：</label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {allRoles.map(role => (
                  <option key={role.label} value={role.label}>
                    {role.label} {baseRoles.some(br => br.label === role.label) ? ' (內置)' : ' (自訂)'}
                  </option>
                ))}
              </select>
            </div>

            {/* If user selected a custom role, show a simple preview and delete button */}
            {customRoles.some(r => r.label === selectedRole) && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl relative">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-extrabold">
                  自訂前置詞預覽
                </span>
                <p className="text-xs text-slate-600 font-medium italic mt-2 pr-6">
                  "{allRoles.find(r => r.label === selectedRole)?.prefix}"
                </p>
                <button 
                  onClick={(e) => handleDeleteCustomRole(selectedRole, e)}
                  title="刪除此自訂角色"
                  className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700 font-extrabold cursor-pointer h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Choose Templates & Create Custom Custom Prompt Lists */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4.5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-indigo-500" />
                2. Prompt 範本資料庫
              </span>
            </div>

            {/* A: System Library Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 rounded-xl text-xs font-bold text-indigo-950 transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                常用內置 Prompt 範本 ({REPORT_PROMPTS.length} 款)
              </span>
              <span className="text-xs text-indigo-600">展開庫 &rarr;</span>
            </button>

            {/* B: Save active prompt as custom template */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSavePromptForm(!showSavePromptForm)}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                儲存當前欄位為自訂範本
              </button>

              {showSavePromptForm && (
                <form onSubmit={handleSaveCurrentPrompt} className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-bold text-emerald-900">⭐ 新增自訂 Prompt 範本選項</p>
                  <div>
                    <label className="block text-[11px] text-gray-500 font-extrabold mb-1">自訂範本名稱</label>
                    <input 
                      type="text" 
                      value={newPromptTitle}
                      onChange={(e) => setNewPromptTitle(e.target.value)}
                      placeholder="例如：精確流年分析"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * 將儲存右側「指令內容」輸入框裡面填寫的全部內容。
                  </p>
                  <div className="flex gap-2">
                    <button 
                      type="submit"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      儲存範本
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowSavePromptForm(false)}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* C: Custom prompt list */}
            {customPrompts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs text-slate-500 font-extrabold block">⭐ 我的自訂 Prompts ({customPrompts.length})</label>
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {customPrompts.map((cp, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        loadPrompt(cp.content);
                        setSelectedPromptTitle(cp.title);
                      }}
                      className="group flex justify-between items-center p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer text-slate-800"
                    >
                      <span className="font-semibold truncate max-w-[150px]">{cp.title}</span>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                          點擊載入
                        </span>
                        <button
                          onClick={(e) => handleDeleteCustomPrompt(cp.title, e)}
                          title="刪除"
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Custom prompt workspace & AI engine feedback */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          
          {/* Active Work Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3">
              <div>
                <label className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  指令填寫編輯盤 (Workspace)
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  可以自由修改下方 Prompt 大綱，AI 將會結合您的星盤數據執行。
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyPromptText}
                  className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg transition-colors cursor-pointer"
                  title="複製完整 Prompt 內容"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPrompt ? '已複製' : '複製指令'}
                </button>
                <button
                  onClick={() => setPromptContent('')}
                  className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 font-bold rounded-lg transition-all cursor-pointer"
                  title="重置為空欄位"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  清空
                </button>
              </div>
            </div>

            {/* Active prefix banner */}
            {allRoles.find(r => r.label === selectedRole)?.prefix && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-900 font-semibold italic flex gap-1.5 items-start">
                <span className="text-amber-500 mt-0.5">&ldquo;</span>
                <div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded mr-1.5 font-bold">
                    系統已自動插入前置身分:
                  </span>
                  {allRoles.find(r => r.label === selectedRole)?.prefix}
                </div>
              </div>
            )}

            {/* Large flexible textarea */}
            <div className="space-y-1">
              <textarea 
                ref={textareaRef}
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-gray-300 focus:border-indigo-500 rounded-xl leading-relaxed text-sm font-medium min-h-[140px] max-h-[460px] resize-y focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="請於此處自行填寫想要的 Prompt 指令語。例如：請幫我預測合盤或是 D1 星宿結構..."
              />
              <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold">
                <span>* 星盤基本參數及九宿詳細度數會以 JSON 自動附於提示末尾發送給 AI。</span>
                <span>字數: {promptContent.length} 字</span>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={generateReport}
              disabled={loading || !promptContent.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-extrabold rounded-xl shadow-lg hover:shadow-indigo-100/60 transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-lg">⏳</span>
                  <span>星盤深度解讀中，九天星辰流轉中 (請安心稍等 3-10 秒)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>啟動 AI 智能星盤報告解析</span>
                </>
              )}
            </button>
          </div>

          {/* AI Result Card */}
          {report && (
            <div id="active-report-view" className="bg-slate-900 border border-slate-950 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    🔮 AI 精析占理報告
                  </h3>
                </div>
                <button
                  onClick={copyReportText}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReport ? '已成功複製' : '一鍵複製報告'}
                </button>
              </div>

              {/* 👤 新增個案醫學占星設定資訊卡 (On-screen Metadata Card) */}
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 shadow-inner">
                <h3 className="text-xs font-black text-indigo-400 flex items-center gap-2 mb-3.5 uppercase tracking-wider">
                  <span className="text-indigo-500 text-base">👤</span> 個案本命星盤與核心占星參數卡 (On-screen Metadata Card)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-sm">
                    <span className="text-sm shrink-0">👤</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-extrabold leading-none mb-1">個案姓名</p>
                      <p className="font-bold text-slate-100 truncate">{userName || '命主本人'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-sm">
                    <span className="text-sm shrink-0">📅</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-extrabold leading-none mb-1">出生年月日與時間</p>
                      <p className="font-bold text-slate-100">{birthDate || '未提供'} {birthTime || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-sm">
                    <span className="text-sm shrink-0">🪐</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-extrabold leading-none mb-1">命宮星座與經度</p>
                      <p className="font-bold text-slate-100">
                        {getZodiacName(data.ascendantSign, ['zh'])} (第 1 宮) | {(data.ascendant % 30).toFixed(2)}°
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-sm">
                    <span className="text-sm shrink-0">💫</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-extrabold leading-none mb-1">命主星 (Ascendant Lord)</p>
                      <p className="font-bold text-indigo-400 capitalize">
                        {getPlanetName(data.houses?.[0]?.lord || '', ['zh'])}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-sm sm:col-span-2 lg:col-span-1">
                    <span className="text-sm shrink-0">🌌</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-extrabold leading-none mb-1">占星系統設定</p>
                      <p className="font-bold text-emerald-400">Lahiri Sidereal (科學恆星制)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔊 AI 智慧回答語音朗讀播放器 (AI Audio Reader) */}
              <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full leading-none text-base shrink-0 ${isPlayingAudio && !isPausedAudio ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                    <span>🔊</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-200">AI 智慧語音朗讀器 (AI Smart Voice Narrator)</p>
                    {isPlayingAudio ? (
                      <p className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-1 mt-0.5 max-w-[280px] sm:max-w-[400px]">
                        <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                        正在播放第 {currentSentenceIndex + 1} / {sentencesToRead.length} 句：
                        <span className="text-slate-400 font-normal truncate">"{sentencesToRead[currentSentenceIndex]}"</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">點擊按鈕，由 AI 占星助理為您以優美的人聲細緻解讀此份星盤推演報告。</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isPlayingAudio ? (
                    <div className="flex items-center gap-1.5">
                      {isPausedAudio ? (
                        <button
                          type="button"
                          onClick={handleResumeSpeaking}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                        >
                          <span>▶</span> 繼續播放
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePauseSpeaking}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                        >
                          <span>⏸</span> 暫停
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={handleStopSpeaking}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                      >
                        <span>⏹</span> 停止
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartSpeaking}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                    >
                      <span>🔊</span> 一鍵語音合成朗讀
                    </button>
                  )}

                  {/* Speed Regulator select */}
                  <div className="flex items-center gap-1 bg-slate-800 px-2 py-1.5 rounded-lg border border-white/5 shrink-0 select-none">
                    <span className="text-[9px] text-slate-400 font-extrabold">語速:</span>
                    <select
                      value={speechRate}
                      onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                      className="bg-transparent text-slate-200 text-[10px] font-bold focus:outline-none cursor-pointer border-none outline-none pr-1"
                    >
                      <option value="0.8" className="bg-slate-900 text-slate-200">0.8x 慢音</option>
                      <option value="1.0" className="bg-slate-900 text-slate-200">1.0x 正常</option>
                      <option value="1.1" className="bg-slate-900 text-slate-200">1.1x 舒適</option>
                      <option value="1.2" className="bg-slate-900 text-slate-200">1.2x 稍快</option>
                      <option value="1.5" className="bg-slate-900 text-slate-200">1.5x 飛速</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Response markdown body */}
              <div className="text-slate-200 text-sm leading-relaxed overflow-x-auto select-text font-medium whitespace-pre-wrap break-words break-all bg-slate-950/70 p-5 rounded-xl border border-white/5 max-h-[3000px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {report}
              </div>

              {/* Advanced Multi-channel Export Action Panel */}
              <ReportExportActions 
                reportTitle={selectedPromptTitle} 
                reportText={report} 
                userName={userName}
                className="bg-slate-950 border-white/5 text-slate-200"
                chartData={data}
              />

              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 pb-1">
                <AlertCircle className="w-3 h-3 text-slate-500" />
                <span>免責提示：印度星盤大數據命推源於古典印占算法模擬，涉及生涯理路僅供參考。</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📂 Saved Reports and Google Drive Library Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>📂</span> 歷史已存 AI 智慧報告存檔與管理庫
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              隨時在別的裝置或瀏覽器同步、重新載入、預覽與匯出列印您儲存的占星解讀歷史
            </p>
          </div>
          
          {!currentUser && (
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-indigo-100 cursor-pointer animate-pulse"
            >
              🔑 Google 快速登入以啟用雲端備份
            </button>
          )}
        </div>

        {currentUser && (
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 border border-slate-200/60 rounded-xl max-w-sm">
            <button
              type="button"
              onClick={() => setReportsSource('cloud')}
              className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                reportsSource === 'cloud'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ☁️ 系統資料庫 ({savedReports.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setReportsSource('drive');
                fetchDriveFiles();
              }}
              className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                reportsSource === 'drive'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-sky-505" />
              雲端硬碟檔案 ({driveFiles.length})
            </button>
          </div>
        )}

        {renderSavedReportsSection()}
      </div>

      {/* Preset Library Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                常用內置 Prompt 智慧範本
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold h-8 w-8 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <p className="text-xs text-slate-500 font-bold">
              * 點擊以下大綱範本，將會在右側指令編輯盤載入對應範本內容：
            </p>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2.5">
              {REPORT_PROMPTS.map((p) => (
                <div
                  key={p.title}
                  onClick={() => {
                    loadPrompt(p.content);
                    setSelectedPromptTitle(p.title);
                    setShowModal(false);
                  }}
                  className="w-full text-left p-4 rounded-xl hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 font-semibold text-gray-800 cursor-pointer transition-all hover:shadow-md"
                >
                  <p className="font-extrabold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    {p.title}
                  </p>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {p.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-extrabold text-gray-700 text-xs transition-colors cursor-pointer"
              >
                關閉範本庫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
