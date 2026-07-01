import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Send, 
  Check, 
  Settings, 
  HelpCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  Copy,
  HardDrive,
  Calendar,
  Bell,
  Mail
} from 'lucide-react';
import { auth, db, collection, addDoc } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getGoogleAccessToken, uploadToGoogleDrive, setCachedGoogleToken } from '../utils/googleDrive';


export const formatToThreeCharName = (name: string): string => {
  if (!name) return '命主君';
  let cleaned = name.replace(/\s*\(.*?\)\s*/g, '').replace(/的星盤/g, '').trim();
  cleaned = cleaned.replace(/[^\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afa-zA-Z0-9]/g, '');
  if (cleaned.length > 3) {
    return cleaned.substring(0, 3);
  } else if (cleaned.length < 3) {
    if (cleaned.length === 2) {
      return cleaned + '君';
    }
    return cleaned.padEnd(3, '君');
  }
  return cleaned;
};

export interface TransitPeriodProp {
  planet: string;
  start: Date;
  end: Date;
  title: string;
  details: string;
  triggeredHouse?: string;
  attention?: string;
}

interface Props {
  reportTitle: string;
  reportText: string;
  userName?: string;
  className?: string;
  transitPeriods?: TransitPeriodProp[];
  chartData?: any;
}

export const ReportExportActions: React.FC<Props> = ({ 
  reportTitle, 
  reportText, 
  userName = '命主本人',
  className = '',
  transitPeriods,
  chartData
}) => {
  const finalUserName = formatToThreeCharName(userName);

  const [astrologySystem, setAstrologySystem] = useState<'sidereal' | 'tropical'>(() => {
    const title = reportTitle || '';
    const text = reportText || '';
    if (title.includes('西占') || title.includes('Tropical') || title.includes('西洋') || text.includes('Tropical') || text.includes('西占')) {
      return 'tropical';
    }
    return 'sidereal';
  });

  const [customFileName, setCustomFileName] = useState('');
  const [customRemarks, setCustomRemarks] = useState('');

  // ==========================================
  // GOOGLE CALENDAR & REMINDER INTEGRATION
  // ==========================================
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [showIphoneGuide, setShowIphoneGuide] = useState(false);
  const [calendarItems, setCalendarItems] = useState<TransitPeriodProp[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarProgress, setCalendarProgress] = useState({ current: 0, total: 0 });

  // Intelligent text parser to auto-extract date milestones/events if no static array is given
  const scanTextForDates = (text: string): TransitPeriodProp[] => {
    const found: TransitPeriodProp[] = [];
    const dateRangeRegex = /(\d{4}[/\-年]\d{1,2}[/\-月]\d{1,2}[日]?)\s*(?:~|-|至)\s*(\d{4}[/\-年]\d{1,2}[/\-月]\d{1,2}[日]?)/g;
    
    let match;
    while ((match = dateRangeRegex.exec(text)) !== null) {
      const rawStart = match[1];
      const rawEnd = match[2];
      
      const cleanStart = rawStart.replace(/年|月/g, '/').replace(/日/g, '').replace(/-/g, '/');
      const cleanEnd = rawEnd.replace(/年|月/g, '/').replace(/日/g, '').replace(/-/g, '/');
      
      const startDate = new Date(cleanStart);
      const endDate = new Date(cleanEnd);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const matchIndex = match.index;
        const startPos = Math.max(0, text.lastIndexOf('\n', matchIndex));
        const endPos = text.indexOf('\n', matchIndex + match[0].length);
        const surroundingText = text.substring(startPos, endPos !== -1 ? endPos : text.length).trim();
        
        // Formulate a beautiful display title from the context
        let cleanTitle = surroundingText
          .replace(/^[#*\-•\s\d.【】=>➔]+/g, '')
          .split('。')[0]
          .split('\n')[0]
          .trim()
          .substring(0, 36);
          
        if (!cleanTitle || cleanTitle.length < 4) {
          cleanTitle = 'AI 占星分析提醒區間';
        }
        
        found.push({
          planet: 'AI 智慧提醒事項',
          start: startDate,
          end: endDate,
          title: cleanTitle,
          details: surroundingText || '本時段為 AI 占星報告中提及的重要時間跨度。',
          triggeredHouse: 'AI 占星學理依據'
        });
      }
    }
    
    const uniqueItems: TransitPeriodProp[] = [];
    found.forEach(item => {
      const isDuplicate = uniqueItems.some(
        u => u.title === item.title && u.start.getTime() === item.start.getTime() && u.end.getTime() === item.end.getTime()
      );
      if (!isDuplicate) {
        uniqueItems.push(item);
      }
    });

    return uniqueItems;
  };

  // Synchronize dynamic items when props or report texts update
  useEffect(() => {
    let items: TransitPeriodProp[] = [];
    if (transitPeriods && transitPeriods.length > 0) {
      items = transitPeriods;
    } else {
      items = scanTextForDates(reportText);
    }
    setCalendarItems(items);
    
    // Check all by default
    const checked: Record<number, boolean> = {};
    items.forEach((_, idx) => {
      checked[idx] = true;
    });
    setCheckedItems(checked);
  }, [transitPeriods, reportText]);

  // Google Calendar API Sync Handler
  const handleSyncToGoogleCalendar = async () => {
    const selectedItems = calendarItems.filter((_, idx) => checkedItems[idx]);
    if (selectedItems.length === 0) {
      setCalendarError('💡 請至少勾選一個欲同步的行程！');
      return;
    }

    const confirmed = window.confirm(`您好，系統預計匯出 ${selectedItems.length} 個至您的 Google 行事曆，並依規定設定在「一週前」透過您登入之 Google Email 電子郵件帳號傳送信件與彈窗。確定要執行同步嗎？`);
    if (!confirmed) return;

    setCalendarLoading(true);
    setCalendarSuccess(null);
    setCalendarError(null);
    setCalendarProgress({ current: 0, total: selectedItems.length });

    try {
      const token = await getGoogleAccessToken();
      const userEmail = auth.currentUser?.email || '您的 Google 帳戶';

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        setCalendarProgress({ current: i + 1, total: selectedItems.length });

        const startDateStr = item.start.toISOString().split('T')[0];
        // Google Calendar all-day event end date is exclusive
        const rawEndDate = new Date(item.end);
        rawEndDate.setDate(rawEndDate.getDate() + 1);
        const endDateStr = rawEndDate.toISOString().split('T')[0];

        // Formulate an extremely clear layout containing explanation, warning, house, end duration
        const descLines = [
          `🔮 【古典印度占星要辰預警提醒】`,
          `👤 分析個案: ${finalUserName}`,
          `📍 觸發宮位: ${item.triggeredHouse || '一般/多重運限星群載量'}`,
          `📅 行程範圍: ${item.start.toLocaleDateString()} ~ ${item.end.toLocaleDateString()}`,
          `📃 理路詳析 / 學術依據:`,
          `   ${item.details}`,
          `🚨 截止與星像負荷: 本過運威脅載荷到 ${item.end.toLocaleDateString()} 截止`,
          `💡 注意防範說明: ${item.attention || '請保持規律生活、注意安全、預先做好提防防護準備！'}`,
          `⏰ 提醒週期: 已設定在事件開始前一週（一週前 / 7天前）自動發送 email 通知您！`,
          `\n---`,
          `🌌 系統算法: 古典梵天印度占星 (Lahiri Sidereal)`,
          `🙏 免責提示：印度星盤大數據命理算法涉及生涯理路與健康調治，報告內容僅供參考。`
        ];

        const payload = {
          summary: `【印占醫療預警】${item.title}`,
          description: descLines.join('\n'),
          start: {
            date: startDateStr
          },
          end: {
            date: endDateStr
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 10080 }, // 1 week before
              { method: 'popup', minutes: 10080 }
            ]
          }
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          if (response.status === 401) {
            setCachedGoogleToken(null);
          }
          throw new Error(errJson.error?.message || `建立行事曆事件遭遇錯誤 (伺服器代碼:${response.status})`);
        }
      }

      setCalendarSuccess(`🎉 同步成功！已順利將 ${selectedItems.length} 個重點預警行程，導向您 ${userEmail} 帳號的 Google 行事曆！\n您的 Gmail 郵箱將自動在各事件展開的「一週前」寄送完整 email 提醒信給您！`);
    } catch (err: any) {
      console.error('Google Calendar Sync error:', err);
      setCachedGoogleToken(null);
      let errMsg = err.message || '同步至 Google 行事曆遭遇未知錯誤，請重試。';
      if (
        err.code === 'auth/popup-blocked' || 
        err.code === 'auth/popup-not-supported' ||
        err.message?.toLowerCase().includes('popup') || 
        err.message?.toLowerCase().includes('iframe') ||
        err.message?.toLowerCase().includes('cross-origin') ||
        err.name === 'AppCheckError'
      ) {
        errMsg = '🛑 專屬授權彈出視窗被您的瀏覽器阻擋，或是您目前座落於 iframe 預覽沙盒安全性網域中。\n\n' +
                 '解決方法：\n' +
                 '1. 點選頁面預覽右上方的「在新分頁中開啟 / Open in a new tab」圖示。\n' +
                 '2. 在獨立頁籤中，沙盒保護限制將解除。重新點選「一鍵匯出選取行程至 Google 行事曆」便可順暢呼叫 Google 簽署驗證，完成同步！';
      }
      setCalendarError(errMsg);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Formatter to match AI prompt categories exactly with appropriate naming boundaries
  const getFormattedFileNameInfo = () => {
    const rawTitle = reportTitle || '';
    const nameStr = finalUserName || '命主本人';
    
    let matchedCategory = rawTitle;
    
    // Exact requested category mappings
    if (rawTitle.includes('事業熱情') || rawTitle.includes('事業發展預測') || rawTitle.includes('事業預測') || rawTitle.includes('事發發展預測')) {
      matchedCategory = '事業發展預測';
    } else if (rawTitle.includes('全面命運分析') || rawTitle.includes('全面命運')) {
      matchedCategory = '全面命運分析';
    } else if (rawTitle.includes('生命藍圖') || rawTitle.includes('人生藍圖') || rawTitle.includes('藍圖')) {
      matchedCategory = '生命藍圖解析';
    } else if (rawTitle.includes('關係') || rawTitle.includes('心理') || rawTitle.includes('深度關係')) {
      matchedCategory = '深度關係與心理分析';
    } else if (rawTitle.includes('分盤') || rawTitle.includes('業力') || rawTitle.includes('karma')) {
      matchedCategory = '精確分盤業力分析';
    } else if (rawTitle.includes('2026') || rawTitle.includes('流年專題')) {
      matchedCategory = '2026 年流年專題報告';
    } else if (rawTitle.includes('流年意外') || rawTitle.includes('關鍵事件預測') || rawTitle.includes('Transit Triggers') || rawTitle.includes('意外')) {
      matchedCategory = '流年意外及關鍵事件預測';
    } else if (rawTitle.includes('醫療') || rawTitle.includes('凶厄') || rawTitle.includes('預警')) {
      matchedCategory = '醫療與外在凶厄預警分析報告';
    }

    const d = new Date();
    const y = d.getFullYear(); // 2026
    const m = String(d.getMonth() + 1).padStart(2, '0'); // '06'
    const systemDatePrefix = `${y}${m}`; // "202606"

    const ZODIAC_SYMBOLS: Record<number, string> = {
      1: '♈', 2: '♉', 3: '♊', 4: '♋', 5: '♌', 6: '♍',
      7: '♎', 8: '♏', 9: '♐', 10: '♑', 11: '♒', 12: '♓'
    };

    const ascSignNum = chartData?.ascendantSign || 1;
    const ascSymbol = ZODIAC_SYMBOLS[ascSignNum] || '♈';

    // Wrapping case name with requested style and custom emojis
    const wrappedName = `🔮${nameStr}🔮`;
    let fileBase = '';

    if (astrologySystem === 'sidereal') {
      const moonSignNum = chartData?.planets?.['Moon']?.sign || 1;
      const moonSymbol = ZODIAC_SYMBOLS[moonSignNum] || '♋';
      // Format: 202606_🔮印占_Sideral_事業發展預測_Asc♍_🔮林育鋒🔮 _☽♋
      fileBase = `${systemDatePrefix}_🔮印占_Sideral_${matchedCategory}_Asc${ascSymbol}_${wrappedName} _☽${moonSymbol}`;
    } else {
      const sunSignNum = chartData?.planets?.['Sun']?.sign || 1;
      const sunSymbol = ZODIAC_SYMBOLS[sunSignNum] || '☉';
      // Format: 202606_🔮西占_Tropical_事業發展預測_Asc♎_🔮林育鋒🔮 _☉♓
      fileBase = `${systemDatePrefix}_🔮西占_Tropical_${matchedCategory}_Asc${ascSymbol}_${wrappedName} _☉${sunSymbol}`;
    }

    const cleanFileBase = fileBase.replace(/[\\/:*?"<>|]+/g, '_');
    
    return {
      category: matchedCategory,
      includeName: true,
      fileBase: cleanFileBase,
      pdfTitle: fileBase
    };
  };

  useEffect(() => {
    const info = getFormattedFileNameInfo();
    setCustomFileName(info.fileBase);
  }, [reportTitle, userName, astrologySystem, chartData]);

  // Firestore Save States
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveToCloud = async () => {
    const user = auth.currentUser;
    if (!user) {
      setSaveError('🔑 請先在此頁面左下角透過「Google 登入」系統，即可將此算命預警報告儲存至雲端歷史紀錄中！');
      return;
    }

    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const info = getFormattedFileNameInfo();
      await addDoc(collection(db, 'reports'), {
        userId: user.uid,
        userName: finalUserName,
        reportTitle: customFileName || info.pdfTitle,
        reportText: reportText,
        remarks: customRemarks,
        createdAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      console.error('Save to Firestore reports error:', err);
      setSaveError(err.message || '儲存至雲端資料庫遭遇問題，請重試。');
    } finally {
      setSaveLoading(false);
    }
  };

  // Telegram States
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem('jyotish_tg_bot_token') || '');
  const [telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem('jyotish_tg_chat_id') || '');
  const [tgLoading, setTgLoading] = useState(false);
  const [tgSuccess, setTgSuccess] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);

  // Google Docs States
  const [gdocsLoading, setGdocsLoading] = useState(false);
  const [gdocsSuccessUrl, setGdocsSuccessUrl] = useState<string | null>(null);
  const [gdocsError, setGdocsError] = useState<string | null>(null);

  // Google Drive States
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSuccessUrl, setDriveSuccessUrl] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Core copy state
  const [copied, setCopied] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  // Save Telegram settings to local storage
  const handleSaveTelegramConfig = () => {
    localStorage.setItem('jyotish_tg_bot_token', telegramToken.trim());
    localStorage.setItem('jyotish_tg_chat_id', telegramChatId.trim());
    alert('✅ Telegram Bot 設定已儲存到瀏覽器！');
  };

  // Plain Text file downloader
  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    let content = reportText;
    if (customRemarks.trim()) {
      content = `【備註資料】\n${customRemarks}\n\n==========================\n\n` + content;
    }
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    
    // Auto-name with the individual's/case name + report content according to requested rules
    const info = getFormattedFileNameInfo();
    element.download = `${customFileName || info.fileBase}.txt`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Plain Text copier
  const handleCopyText = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Markdown Formatted Plain Text copier
  const handleCopyMd = () => {
    const info = getFormattedFileNameInfo();
    const mdHeader = `# 【印度占星星盤解讀大數據分析特刊】\n\n` +
                     `* **報告名稱:** ${customFileName || info.pdfTitle}\n` +
                     `* **分析對象:** ${finalUserName}\n` +
                     `* **建立日期:** ${new Date().toLocaleString()}\n` +
                     `* **系統算法:** ${astrologySystem === 'sidereal' ? '古典梵天印度占星 (Lahiri Sidereal)' : '西洋占星 (Tropical)'}\n` +
                     (customRemarks.trim() ? `* **備註資料:** ${customRemarks}\n` : '') +
                     `\n---\n\n`;
    navigator.clipboard.writeText(mdHeader + reportText);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  // Print/PDF Handler (Extremely reliable for vector CJK/Chinese text layout)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("❌ 請允許開啟彈出視窗以產生 PDF 預覽！");
      return;
    }
    
    const info = getFormattedFileNameInfo();
    const pdfTitleToUse = customFileName || info.pdfTitle;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${pdfTitleToUse}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body {
              font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Inter", sans-serif;
              padding: 40px;
              color: #1e293b;
              line-height: 1.7;
              background-color: #ffffff;
              max-width: 800px;
              margin: 0 auto;
            }
            .header-container {
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            h1 {
              color: #312e81;
              font-size: 26px;
              font-weight: 700;
              margin: 0 0 10px 0;
              letter-spacing: -0.025em;
            }
            .meta-info {
              font-size: 13px;
              color: #64748b;
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
            }
            .meta-item {
              background: #f1f5f9;
              padding: 4px 10px;
              border-radius: 6px;
              font-weight: 500;
            }
            .remarks-box {
              margin-top: 15px;
              padding: 12px 16px;
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              border-radius: 6px;
              font-size: 13px;
              color: #78350f;
              line-height: 1.6;
            }
            .report-content {
              white-space: pre-wrap;
              font-size: 14px;
              color: #334155;
            }
            .nav-actions {
              margin-bottom: 20px;
              text-align: right;
            }
            .btn-print {
              background-color: #4f46e5;
              color: #ffffff;
              border: none;
              padding: 8px 16px;
              font-size: 13px;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.15s;
            }
            .btn-print:hover {
              background-color: #4338ca;
            }
            @media print {
              body { padding: 20px; }
              .nav-actions { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="nav-actions">
            <button class="btn-print" onclick="window.print()">🖨️ 立即列印或儲存為 PDF</button>
          </div>
          <div class="header-container">
            <h1>${pdfTitleToUse}</h1>
            <div class="meta-info">
              <span class="meta-item">👤 尊貴客主: ${finalUserName}</span>
              <span class="meta-item">📅 生成日期: ${new Date().toLocaleString()}</span>
              <span class="meta-item">🪐 系統算法: ${astrologySystem === 'sidereal' ? '古典梵天印度占星 (Lahiri Sidereal)' : '西洋占星 (Tropical)'}</span>
            </div>
            ${customRemarks.trim() ? `
            <div class="remarks-box">
              <strong>📝 備註資料：</strong><br/>
              ${customRemarks.replace(/\n/g, '<br/>')}
            </div>
            ` : ''}
          </div>
          <div class="report-content">${reportText}</div>
          <script>
            // Auto trigger print dialogue once loaded
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Telegram Sender Logic (with Chunking to ensure < 4096 bytes works flawlessly)
  const handleSendToTelegram = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      setTgError('請先在下方展開設定欄位，並填寫 Bot Token 及 Chat ID！');
      setShowTelegramConfig(true);
      return;
    }

    setTgLoading(true);
    setTgSuccess(false);
    setTgError(null);

    try {
      const token = telegramToken.trim();
      const chatId = telegramChatId.trim();

      // Chunk the text to stay within Telegram's max 4096 character limit
      const maxLength = 3900;
      const chunks: string[] = [];

      const info = getFormattedFileNameInfo();
      let header = `🔮 【${info.pdfTitle}】\n👤 尊貴命主: ${finalUserName}\n📅 傳送時間: ${new Date().toLocaleString()}\n`;
      header += `==========================\n\n`;

      if (reportText.length <= maxLength) {
        chunks.push(header + reportText);
      } else {
        let temp = reportText;
        while (temp.length > 0) {
          chunks.push(temp.substring(0, maxLength));
          temp = temp.substring(maxLength);
        }
      }

      // Send each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunkMessage = chunks.length > 1 
          ? `【報告分段投遞中 - 第 ${i + 1}/${chunks.length} 頁】\n\n${chunks[i]}`
          : chunks[i];

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: chunkMessage,
          })
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.description || `傳送失敗，請核對 API 欄位資訊 (錯誤代碼:${response.status})`);
        }
      }

      // Save settings to local storage upon successful send so they are persisted
      localStorage.setItem('jyotish_tg_bot_token', token);
      localStorage.setItem('jyotish_tg_chat_id', chatId);

      setTgSuccess(true);
    } catch (err: any) {
      setTgError(err.message || '傳送至 Telegram 異常');
    } finally {
      setTgLoading(false);
    }
  };

  // Google Docs Creation Link (Requests docs scope popups & builds live file)
  const handleSendToGoogleDocs = async () => {
    setGdocsLoading(true);
    setGdocsSuccessUrl(null);
    setGdocsError(null);

    try {
      const token = await getGoogleAccessToken();
      const info = getFormattedFileNameInfo();

      // 1. Create a blank Google Document
      const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `${info.fileBase} (${new Date().toLocaleDateString()})`
        })
      });

      if (!createResponse.ok) {
        const errJson = await createResponse.json().catch(() => ({}));
        if (createResponse.status === 401) {
          setCachedGoogleToken(null);
        }
        throw new Error(errJson.error?.message || `建立 Google 文件失敗 (伺服器代碼:${createResponse.status})`);
      }

      const docData = await createResponse.json();
      const documentId = docData.documentId;

      // 2. Insert report contents to document
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `# 【印度占星星盤解讀大數據 analysis 特刊】\n\n` +
                      `* **報告名稱:** ${info.pdfTitle}\n` +
                      `* **分析對象:** ${finalUserName}\n` +
                      `* **建立日期:** ${new Date().toLocaleString()}\n` +
                      `* **系統算法:** 古典梵天印度占星 (Lahiri Sidereal)\n\n` +
                      `---\n\n` +
                      `${reportText}\n`
              }
            }
          ]
        })
      });

      if (!updateResponse.ok) {
        const errJson = await updateResponse.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `寫入內容至 Google 文件失敗 (伺服器代碼:${updateResponse.status})`);
      }

      setGdocsSuccessUrl(`https://docs.google.com/document/d/${documentId}/edit`);
    } catch (err: any) {
      console.error('Google Docs Export error:', err);
      setCachedGoogleToken(null);
      
      let errMsg = err.message || '導出 Google Docs 遭遇未知錯誤，請重試。';
      if (
        err.code === 'auth/popup-blocked' || 
        err.code === 'auth/popup-not-supported' ||
        err.message?.toLowerCase().includes('popup') || 
        err.message?.toLowerCase().includes('iframe') ||
        err.message?.toLowerCase().includes('cross-origin') ||
        err.name === 'AppCheckError'
      ) {
        errMsg = '🛑 專屬授權彈出視窗被您的瀏覽器封鎖，或是您目前身處 iframe 預覽沙盒與跨網域環境中。\n\n' +
                 '為了解決此瀏覽器限制並順利進行 Google Docs 存檔：\n' +
                 '1. 請點選網頁預覽視窗右上方的「在新分頁中開啟 / Open in a new tab」圖示按鈕。\n' +
                 '2. 在獨立的新頁籤中，瀏覽器將釋放 Iframe 安全沙盒，即可順利彈出 Google 驗證畫面並成功導出您的星盤報告！';
      }
      setGdocsError(errMsg);
    } finally {
      setGdocsLoading(false);
    }
  };

  // Google Drive File Creation (Uploads Markdown file directly to user's Drive)
  const handleSendToGoogleDrive = async () => {
    setDriveLoading(true);
    setDriveSuccessUrl(null);
    setDriveError(null);

    try {
      const info = getFormattedFileNameInfo();
      const fileName = `${info.fileBase}_${new Date().toISOString().split('T')[0]}.md`;
      const fileId = await uploadToGoogleDrive(fileName, info.category, finalUserName, reportText);
      setDriveSuccessUrl(`https://drive.google.com/file/d/${fileId}/view`);
    } catch (err: any) {
      console.error('Google Drive Export error:', err);
      setCachedGoogleToken(null);
      
      let errMsg = err.message || '導出 Google Drive 遭遇未知錯誤，請重試。';
      if (
        err.code === 'auth/popup-blocked' || 
        err.code === 'auth/popup-not-supported' ||
        err.message?.toLowerCase().includes('popup') || 
        err.message?.toLowerCase().includes('iframe') ||
        err.message?.toLowerCase().includes('cross-origin') ||
        err.name === 'AppCheckError'
      ) {
        errMsg = '🛑 專屬授權彈出視窗被您的瀏覽器封鎖，或是您目前身處 iframe 預覽沙盒與跨網域環境中。\n\n' +
                 '為了解決此瀏覽器限制並順利進行 Google Drive 存檔：\n' +
                 '1. 請點選網頁預覽視窗右上方的「在新分頁中開啟 / Open in a new tab」圖示按鈕。\n' +
                 '2. 在獨立的新頁籤中，瀏覽器將釋放 Iframe 安全沙盒，即可順利彈出 Google 驗證畫面並成功導出您的星盤報告！';
      }
      setDriveError(errMsg);
    } finally {
      setDriveLoading(false);
    }
  };

  return (
    <div className={`space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 ${className}`}>
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <span>📤</span> 跨平台多功能報告匯出管理 (Multi-channel Export Center)
      </h3>
      
      {/* Dynamic Astrology System and Filename Auto-Preview Configurer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-left">
        <div className="text-slate-600 font-bold select-none">
          <span className="text-indigo-600 font-black">⚙️ 預定導出檔名：</span>
          <code className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-indigo-750 break-all font-mono ml-1 block sm:inline mt-1 sm:mt-0">
            {(customFileName || getFormattedFileNameInfo().fileBase)}.txt
          </code>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAstrologySystem('sidereal')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
              astrologySystem === 'sidereal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🌌 古典印占 (Sidereal)</span>
          </button>
          <button
            type="button"
            onClick={() => setAstrologySystem('tropical')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
              astrologySystem === 'tropical' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🔮 西洋占星 (Tropical)</span>
          </button>
        </div>
      </div>

      {/* Editable Filename & Remarks Fields */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              <span>✏️ 修改報告書檔案名：</span>
            </label>
            <input 
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="自訂報告與檔案名稱..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              <span>📝 新增備註資料：</span>
            </label>
            <input 
              type="text"
              value={customRemarks}
              onChange={(e) => setCustomRemarks(e.target.value)}
              placeholder="輸入備註或客戶相關背景資料..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-2.5">
        {/* Button 1: Copy Clipboard */}
        <button
          onClick={handleCopyText}
          className={`group flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs ${
            copied ? 'text-emerald-600 border-emerald-300 bg-emerald-50/50' : 'text-slate-700'
          }`}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600 animate-bounce" /> : <FileText className="w-4 h-4 text-indigo-500" />}
          {copied ? '已複製到剪貼簿' : '一鍵複製純文字'}
        </button>

        {/* Button 1.5: Copy Markdown格式 */}
        <button
          onClick={handleCopyMd}
          className={`group flex items-center justify-center gap-2 bg-white hover:bg-pink-50 border border-slate-200 hover:border-pink-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs ${
            copiedMd ? 'text-emerald-600 border-emerald-300 bg-emerald-50/50' : 'text-slate-700'
          }`}
        >
          {copiedMd ? <Check className="w-4 h-4 text-emerald-600 animate-bounce" /> : <Copy className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />}
          {copiedMd ? '已複製 MD 格式' : '一鍵複製 MD格式'}
        </button>

        {/* Button 2: Print/PDF */}
        <button
          onClick={handleExportPDF}
          className="group flex items-center justify-center gap-2 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
          <span>導出 PDF 檔 (完美版)</span>
        </button>

        {/* Button 3: Send to Telegram */}
        <button
          onClick={handleSendToTelegram}
          disabled={tgLoading}
          className="group flex items-center justify-center gap-2 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {tgLoading ? (
            <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 group-hover:translate-y-[-1px] transition-transform" />
          )}
          <span>傳送到 Telegram</span>
        </button>

        {/* Button 4: Create Google Doc */}
        <button
          onClick={handleSendToGoogleDocs}
          disabled={gdocsLoading}
          className="group flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {gdocsLoading ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          )}
          <span>傳送到 Google 文件</span>
        </button>

        {/* Button 4.5: Save to Google Drive */}
        <button
          onClick={handleSendToGoogleDrive}
          disabled={driveLoading}
          className="group flex items-center justify-center gap-2 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {driveLoading ? (
            <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
          ) : (
            <HardDrive className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          )}
          <span>傳送到 雲端硬碟 (MD)</span>
        </button>

        {/* Button 5: Save to Cloud Database */}
        <button
          onClick={handleSaveToCloud}
          disabled={saveLoading}
          className="group flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {saveLoading ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          ) : (
            <Database className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          )}
          <span>儲存至雲端資料庫</span>
        </button>

        {/* Button 6: Google Calendar Sync */}
        <button
          onClick={() => setShowCalendarPanel(!showCalendarPanel)}
          className={`group flex items-center justify-center gap-2 bg-white hover:bg-amber-50 border ${
            showCalendarPanel ? 'border-amber-300 bg-amber-50/50 text-amber-900' : 'border-slate-200 text-slate-700'
          } font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs`}
        >
          <Calendar className={`w-4 h-4 ${showCalendarPanel ? 'text-amber-600 animate-pulse' : 'text-amber-500'} group-hover:scale-110 transition-transform`} />
          <span>同步 Google 日曆</span>
        </button>
      </div>

      {/* Alternative Download Text directly */}
      <div className="flex justify-start">
        <button 
          onClick={handleDownloadTxt}
          className="text-[10px] text-slate-400 hover:text-indigo-600 font-extrabold flex items-center gap-1.5 cursor-pointer hover:underline"
        >
          <span>📥</span> 還是想要下載備份 .txt 文字檔案檔？ 點擊此處建立備份下載 &rarr;
        </button>
      </div>

      {/* Google Calendar Sync Panel */}
      {showCalendarPanel && (
        <div className="border border-amber-200 rounded-xl overflow-hidden bg-white shadow-md animate-in slide-in-from-top-3 duration-250">
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-150 flex justify-between items-center">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 select-none text-left">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>📅 Google 行事曆同步備忘中心 (Google Calendar Sync & Reminders)</span>
            </h4>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full shrink-0">
              一週前 Email + 彈窗預警
            </span>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed text-left">
              系統智能偵測出本報告中對應的過與期或關鍵時間里程段（共 <strong>{calendarItems.length}</strong> 個項目）。
              本提醒事件皆會預設設定在過度區間開始的 <strong>「一週前 (7 天前 / 10080 分鐘)」</strong> 寄送 Gmail 提醒事項信件和行事曆彈窗，避免您遺落任何重要注意事項！
            </p>

            {/* Custom iPhone Sync and Sandbox Safe-guard Troublshooting Guide Accordion */}
            <div className="border border-indigo-100 rounded-xl bg-indigo-50/20 overflow-hidden text-left">
              <button
                type="button"
                onClick={() => setShowIphoneGuide(!showIphoneGuide)}
                className="w-full px-4 py-2.5 bg-indigo-50/50 hover:bg-indigo-100/40 text-left font-bold text-xs text-indigo-950 flex items-center justify-between transition-colors select-none cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>📱</span>
                  <span>iPhone 與瀏覽器沙盒同步故障排除指南 (含 Gmail 收信設定)</span>
                </span>
                <span className="text-[10px] text-indigo-600 font-extrabold bg-white border border-indigo-100 px-2 py-0.5 rounded-full">
                  {showIphoneGuide ? '收合指引 ▴' : '展開指引 ▾'}
                </span>
              </button>
              
              {showIphoneGuide && (
                <div className="p-4 border-t border-indigo-100/50 text-[11px] text-slate-600 space-y-3 leading-relaxed animate-in slide-in-from-top-1 duration-100">
                  <div className="space-y-1">
                    <p className="font-bold text-indigo-900 flex items-center gap-1">
                      <span>🔒 1. 為什麼點擊同步沒有反應、或顯示錯誤？</span>
                    </p>
                    <p className="pl-4 text-slate-500">
                      當前您是在 <strong>AI Studio 預覽視窗 (iframe 沙盒)</strong> 內瀏覽網頁。出於瀏覽器跨網域安全機制，沙盒環境會百分百封鎖 Google 的 OAuth 登入驗證彈出視窗。
                    </p>
                    <p className="pl-4 font-semibold text-emerald-600 flex items-center gap-1">
                      <span>💡 解決方法：</span>
                      <span>請點擊預覽畫面右上角的「在新分頁中開啟 / Open in a new tab」按鈕，在獨立的頁籤開啟本系統，即可完美順利進行一鍵同步！</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-indigo-900 flex items-center gap-1">
                      <span>🍎 2. 如何使行事曆提醒同步顯示在 iPhone 手機上？</span>
                    </p>
                    <p className="pl-4 text-slate-500">
                      同步後，要讓 iPhone 行事曆能收到此預警彈窗，請完成以下設定：
                    </p>
                    <ul className="pl-8 list-decimal text-[11px] text-slate-500 space-y-1">
                      <li>
                        進入 iPhone <strong>【設定】</strong> &rarr; 點選 <strong>【郵件】</strong> 或 <strong>【行事曆】</strong> &rarr; <strong>【帳號】</strong> &rarr; <strong>【加入帳號】</strong>。
                      </li>
                      <li>
                        登入您剛剛匯出行程所使用的 <strong>Gmail / Google 帳戶</strong>，並確保勾選開啟 <strong>【行事曆】</strong> 同步按鈕。
                      </li>
                      <li>
                        前往 iPhone <strong>【設定】</strong> &rarr; <strong>【通知】</strong> &rarr; <strong>【行事曆】</strong> &rarr; 檢查「允許通知」及「共享的行事曆通知」是否都已勾選啟用。
                      </li>
                      <li>
                        打開 iPhone 內建的 <strong>【行事曆】App</strong>，點選畫面底部的 <strong>【行事曆】</strong> 選單，勾選起該 Gmail 帳號旁的複選框，行程才會順利出現在 iPhone 主畫面上！
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-indigo-900 flex items-center gap-1">
                      <span>📧 3. 關於預設「一週前 Gmail 預警信箱通知」</span>
                    </p>
                    <p className="pl-4 text-slate-500">
                      一鍵同步後，Google 會自動在各事件展開的 <strong>「10080 分鐘前（7 天前）」</strong>，往您的 Gmail 信箱傳送電子郵件提醒信。
                    </p>
                    <p className="pl-4 text-slate-550 font-semibold">
                      ※ 提示：該郵件皆是由 Google Server 系統 (<code>calendar-notification@google.com</code>) 自動派發。如果您未在 Gmail 收件匣中收到，請檢查您的「社交網路 / 垃圾郵件」信件匣中，並將其設定為「非垃圾郵件 / 信任的寄件者」即可。
                    </p>
                  </div>
                </div>
              )}
            </div>

            {calendarItems.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-lg text-center text-xs text-slate-400">
                💡 尚無在此報告文字中偵測到明顯的 YYYY/MM/DD ~ YYYY/MM/DD 時間跨度行程。
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1 select-none">
                  <span>勾選欲同步項目：</span>
                  <div className="flex gap-2.5">
                    <button 
                      type="button" 
                      onClick={() => {
                        const checked: Record<number, boolean> = {};
                        calendarItems.forEach((_, idx) => { checked[idx] = true; });
                        setCheckedItems(checked);
                      }} 
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      全選
                    </button>
                    <span>|</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setCheckedItems({});
                      }} 
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      全部清除
                    </button>
                  </div>
                </div>

                {calendarItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 border rounded-xl flex gap-3 transition-colors text-left ${
                      checkedItems[idx] 
                        ? 'border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/40' 
                        : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50/80 opacity-60'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={!!checkedItems[idx]}
                      onChange={(e) => setCheckedItems({ ...checkedItems, [idx]: e.target.checked })}
                      className="mt-0.5 w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded-md focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 leading-snug">
                          {item.title}
                        </span>
                        {item.triggeredHouse && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md shrink-0">
                            {item.triggeredHouse}
                          </span>
                        )}
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md shrink-0">
                          {item.planet}過運
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <span>📅 時間範圍：</span>
                        <span className="text-indigo-600 font-extrabold">
                          {item.start.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </span>
                        <span>~</span>
                        <span className="text-pink-600 font-extrabold">
                          {item.end.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 bg-white/60 p-2 border border-slate-100/80 rounded-lg leading-relaxed">
                        {item.details}
                      </p>

                      <div className="flex items-center gap-5 text-[9px] text-slate-400 font-medium">
                        <span className="flex items-center gap-0.5">
                          <Bell className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                          行事曆一週前彈窗預報
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Mail className="w-2.5 h-2.5 text-indigo-500" />
                          一週前 Gmail 電子信箱通知
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 leading-normal text-left">
                本同步功能建立於 Google 主要行事曆，事件設為全天，預先包含警告宮位與各類負荷。
              </span>
              
              <button
                type="button"
                onClick={handleSyncToGoogleCalendar}
                disabled={calendarLoading || calendarItems.length === 0}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {calendarLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>同步中 ({calendarProgress.current}/{calendarProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-white" />
                    <span>一鍵匯出選取行程至 Google 行事曆</span>
                  </>
                )}
              </button>
            </div>

            {/* Sync Feedback messages inside panel for perfect cohesion */}
            {calendarSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2 text-left animate-in fade-in duration-200">
                <span className="text-sm">🎉</span>
                <div className="space-y-1">
                  <p className="font-bold">Google Calendar 同步成功！</p>
                  <p className="text-slate-600 font-normal leading-relaxed text-[11px] whitespace-pre-wrap break-words break-all">
                    {calendarSuccess}
                  </p>
                </div>
              </div>
            )}
            {calendarError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start gap-2 text-left animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">同步失敗：</p>
                  <p className="text-slate-600 font-normal leading-relaxed text-[11px] whitespace-pre-wrap break-words break-all">
                    {calendarError}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Telegram Credentials configuration Drawer */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => setShowTelegramConfig(!showTelegramConfig)}
          className="w-full flex justify-between items-center px-4 py-2 bg-slate-100 hover:bg-slate-150 border-b border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            🤖 Telegram API 投遞欄位設定 (僅儲存於您本地瀏覽器)
          </span>
          {showTelegramConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTelegramConfig && (
          <div className="p-4 space-y-3.5 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] text-slate-500 font-extrabold mb-1">
                  1. Telegram Bot Token 🔑
                </label>
                <input 
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="例如：123456789:ABCdefGhI..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 font-extrabold mb-1">
                  2. Telegram Chat ID / 頻道 ID 👥
                </label>
                <input 
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="例如：987654321 或是 @my_channel_name"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handleSaveTelegramConfig}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                儲存 Token 與 Chat ID 到本地
              </button>
              
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <HelpCircle className="w-3 h-3 text-slate-400" />
                <span>不曉得如何取得？搜尋 <b>@BotFather</b> 建立專屬機器人、<b>@userinfobot</b> 獲取 Chat ID。</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Telegram Status Feedbacks */}
      {tgSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>✅</span>
          <span><b>成功投遞！</b>報告已成功經由您的 Bot 傳送至指定的 Telegram 視窗！</span>
        </div>
      )}
      {tgError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span><b>投遞失敗：</b>{tgError}</span>
        </div>
      )}

      {/* Google Docs Status Feedbacks */}
      {gdocsSuccessUrl && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs space-y-2">
          <p className="font-extrabold flex items-center gap-2 text-emerald-800">
            <span>🎉</span>
            <span>恭喜！Google 文件建立並儲存成功！</span>
          </p>
          <p className="text-slate-600 font-medium">
            我們已經為您在 Google 雲端帳戶建立了一份專屬的占星解讀報告。點擊下方連結可立即檢視、編輯或共用：
          </p>
          <a
            href={gdocsSuccessUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-4 rounded-xl transition-all shadow-sm shadow-emerald-200 hover:translate-y-[-1px]"
          >
            📂 開啟建立的 Google 文件
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
      {gdocsError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span><b>建立 Google 文件失敗：</b>{gdocsError}</span>
        </div>
      )}

      {/* Google Drive Status Feedbacks */}
      {driveSuccessUrl && (
        <div className="p-4 bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl text-xs space-y-2 animate-in fade-in duration-300">
          <p className="font-extrabold flex items-center gap-2 text-sky-800">
            <span>🎉</span>
            <span>恭喜！Google 雲端硬碟 Markdown 檔案建立並儲存成功！</span>
          </p>
          <p className="text-slate-600 font-medium">
            我們已經為您在 Google 雲端硬碟中儲存了一份 Markdown 規格的占星解讀報告。點擊下方連結可立即檢視或共用：
          </p>
          <a
            href={driveSuccessUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-sky-605 hover:bg-sky-700 text-white font-extrabold py-2 px-4 rounded-xl transition-all shadow-sm shadow-sky-200 hover:translate-y-[-1px]"
          >
            📂 開啟 Google 雲端硬碟檔案
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
      {driveError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-300">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span><b>導出至 Google 雲端硬碟失敗：</b>{driveError}</span>
        </div>
      )}

      {/* Firestore Cloud Save status feedbacks */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>☁️</span>
          <span><b>儲存成功！</b>本報告已被安全儲存於您的雲端歷史檔案庫中。可在「智能分析報告(Reports)」下方歷史區域隨時回顧閱讀。</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-yellow-50 border border-yellow-250 text-yellow-850 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-505" />
          <span><b>雲端儲存提醒：</b>{saveError}</span>
        </div>
      )}
    </div>
  );
};
