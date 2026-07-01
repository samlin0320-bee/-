import React, { useState } from 'react';
import { ChartData, getPlanetName, getZodiacName, findNextSaturnTransitToNakshatra, findTransitPeriods, TransitPeriod } from '../utils/astrology';
import { ReportExportActions } from './ReportExportActions';

interface Props {
  natalData: ChartData;
  transitData: ChartData | null;
  modes: string[];
  userName?: string;
  birthDate?: string;
  birthTime?: string;
}

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const ZODIAC_BODY_PARTS: Record<number, string> = {
  1: '頭部、大腦、眼睛、臉部',
  2: '頸部、喉嚨、聲帶、甲狀腺',
  3: '肩膀、手臂、手、肺部、神經系統',
  4: '胸部、乳房、胃、消化系統',
  5: '心臟、脊椎、上背部',
  6: '腸道、腹部、脾臟',
  7: '腎臟、下背部、腎上腺、皮膚',
  8: '生殖器官、膀胱、直腸',
  9: '臀部、大腿、肝臟、坐骨神經',
  10: '膝蓋、關節、骨骼、牙齒、皮膚',
  11: '小腿、腳踝、循環系統',
  12: '腳部、腳趾、淋巴系統'
};

const PLANET_BODY_PARTS: Record<string, string> = {
  'Sun': '心臟、脊椎、生命力、右眼(男)/左眼(女)',
  'Moon': '胃、乳房、體液、左眼(男)/右眼(女)',
  'Mars': '肌肉、血液、頭部、男性生殖系統',
  'Mercury': '大腦、神經系統、肺部、聲帶、手',
  'Jupiter': '肝臟、大腿、臀部、代謝系統',
  'Venus': '腎臟、喉嚨、皮膚、女性生殖系統',
  'Saturn': '骨骼、牙齒、膝蓋、皮膚、關節',
  'Rahu': '免疫系統、未確診疾病、毒素',
  'Ketu': '神經系統、脊髓、傳染病'
};

const formatDate = (date?: Date) => {
  if (!date) return '未知';
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const formatBirthDate = (bDateStr?: string) => {
  if (!bDateStr) return '未提供';
  const d = new Date(bDateStr);
  if (isNaN(d.getTime())) return bDateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

const MedicalReport: React.FC<Props> = ({ natalData, transitData, modes, userName, birthDate, birthTime }) => {
  if (!transitData) return <div className="text-center p-8 text-gray-500">載入流年數據中...</div>;

  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const warnings = [];
  const malefics = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const getLord = (houseNum: number) => natalData.houses[houseNum - 1].lord;

  // 1. 死亡/死劫判定
  const lord2 = getLord(2);
  const lord7 = getLord(7);
  const now = new Date();
  const currentMaha = natalData.dashas.find(d => now >= d.start && now <= d.end);
  const currentAntar = currentMaha?.subPeriods?.find(sd => now >= sd.start && now <= sd.end);

  // 找出所有符合 Maraka (2/7宮主) 的大運與次運
  const allMarakaPeriods: { type: string, planet: string, start: Date, end: Date, isCurrent: boolean }[] = [];
  natalData.dashas.forEach(maha => {
    const isMahaMaraka = maha.planet === lord2 || maha.planet === lord7;
    const isMahaCurrent = now >= maha.start && now <= maha.end;
    if (isMahaMaraka) {
      allMarakaPeriods.push({ type: '大運', planet: maha.planet, start: maha.start, end: maha.end, isCurrent: isMahaCurrent });
    }
    maha.subPeriods?.forEach(antar => {
      const isAntarMaraka = antar.planet === lord2 || antar.planet === lord7;
      const isAntarCurrent = now >= antar.start && now <= antar.end;
      if (isAntarMaraka) {
        allMarakaPeriods.push({ type: '次運', planet: `${maha.planet}-${antar.planet}`, start: antar.start, end: antar.end, isCurrent: isAntarCurrent });
      }
    });
  });
  allMarakaPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

  const natalMoonSign = natalData.planets['Moon'].sign;
  const transitSaturnSign = transitData.planets['Saturn'].sign;
  const sadeSatiSigns = [
    natalMoonSign === 1 ? 12 : natalMoonSign - 1,
    natalMoonSign,
    natalMoonSign === 12 ? 1 : natalMoonSign + 1
  ];
  const isSadeSati = sadeSatiSigns.includes(transitSaturnSign);

  // Ashtakavarga danger year (Real SAV logic)
  const ascSign = natalData.ascendantSign;
  const ascDegreeInSign = (natalData.ascendant % 30).toFixed(2);
  const saturnSign = natalData.planets['Saturn'].sign;
  const housesToSaturn = (saturnSign - ascSign + 12) % 12 + 1;
  let savSum = 0;
  if (natalData.sav) {
    const savRecord = natalData.sav as Record<number, number>;
    for (let h = 1; h <= housesToSaturn; h++) {
      savSum += savRecord[h] || 0;
    }
  } else {
    savSum = housesToSaturn * 28;
  }
  const dangerAge = Math.floor((savSum * 7) / 27);
  const dangerNakshatraIdx = Math.floor((savSum * 7) % 27);
  const dangerNakshatra = NAKSHATRAS[dangerNakshatraIdx];

  const birthDateForSAV = natalData.utcTime ? new Date(natalData.utcTime) : new Date();
  const searchStartDate = new Date(birthDateForSAV);
  searchStartDate.setFullYear(searchStartDate.getFullYear() + Math.max(0, dangerAge - 2));
  const savSaturnTransit = findNextSaturnTransitToNakshatra(dangerNakshatraIdx, searchStartDate, true, 'lahiri');

  const ascLord = getLord(1);
  const sunSign = natalData.planets['Sun'].sign;
  const ascLordSign = natalData.planets[ascLord]?.sign;
  const house6Sign = natalData.houses[5].sign;
  const house8Sign = natalData.houses[7].sign;

  // --- Define House Signs up front ---
  const natalHouse1Sign = natalData.houses[0].sign; // 1H
  const natalHouse4Sign = natalData.houses[3].sign; // 4H
  const natalHouse8Sign = natalData.houses[7].sign; // 8H
  const natalHouse12Sign = natalData.houses[11].sign; // 12H

  // --- Lifespan and Dynamic Transit Dates Calculation ---
  const parsedBirthDate = birthDate ? new Date(birthDate) : (natalData.utcTime ? new Date(natalData.utcTime) : new Date(1999, 1, 27));
  const getHouseFromSign = (signNum: number) => {
    return ((signNum - ascSign + 12) % 12) + 1;
  };
  
  const renderTransitList = (transits: TransitPeriod[]) => {
    if (transits.length === 0) return <span className="text-gray-500">此生未過運此些宮位</span>;
    return (
      <ul className="list-disc pl-5 space-y-1 text-xs max-h-40 overflow-y-auto bg-white p-2 rounded border border-red-100">
        {transits.map((t, idx) => {
          const isCurrent = now >= t.start && now <= t.end;
          const houseNum = getHouseFromSign(t.sign);
          return (
            <li key={idx} className={isCurrent ? 'text-red-700 font-extrabold bg-red-50 p-1.5 rounded border border-red-200' : 'text-gray-700'}>
              {isCurrent && '🔴 (目前正處於此運期間！)'}
              流年 {getPlanetName(t.planet, modes)} 進入第 {houseNum} 宮 (【{getZodiacName(t.sign, modes)}】) 
              ➔ {formatDate(t.start)} ~ {formatDate(t.end)}
            </li>
          );
        })}
      </ul>
    );
  };

  const formatTransitTextList = (transits: TransitPeriod[]) => {
    if (transits.length === 0) return '      (無此過運期)';
    return transits.map(t => {
      const isCurrent = now >= t.start && now <= t.end;
      const houseNum = getHouseFromSign(t.sign);
      const isCurrentStr = isCurrent ? ` 🔴 [👉 警報：目前正處於此運期間！]` : ``;
      return `      - 流年${getPlanetName(t.planet, modes)} 進入第 ${houseNum} 宮 (【${getZodiacName(t.sign, modes)}】) (起: ${formatDate(t.start)} ~ 迄: ${formatDate(t.end)})${isCurrentStr}`;
    }).join('\n');
  };

  // Perform Calculations
  const uniqueAfflictedSigns = Array.from(new Set([sunSign, ascLordSign, house6Sign, house8Sign]));
  
  // Item 2: Saturn and Rahu transits to afflicted signs
  const saturnAfflictedTransits = findTransitPeriods('Saturn', uniqueAfflictedSigns, parsedBirthDate, 85, true, 'lahiri');
  const rahuAfflictedTransits = findTransitPeriods('Rahu', uniqueAfflictedSigns, parsedBirthDate, 85, true, 'lahiri');
  // Specifically 8th house
  const saturn8HTransits = findTransitPeriods('Saturn', [natalHouse8Sign], parsedBirthDate, 85, true, 'lahiri');
  const rahu8HTransits = findTransitPeriods('Rahu', [natalHouse8Sign], parsedBirthDate, 85, true, 'lahiri');

  // Item 3: Mars & Uranus transits to H4 & H8
  const marsH4Transits = findTransitPeriods('Mars', [natalHouse4Sign], parsedBirthDate, 85, true, 'lahiri');
  const uranusH4Transits = findTransitPeriods('Uranus', [natalHouse4Sign], parsedBirthDate, 85, true, 'lahiri');
  const mars8HTransits = findTransitPeriods('Mars', [natalHouse8Sign], parsedBirthDate, 85, true, 'lahiri');
  const uranus8HTransits = findTransitPeriods('Uranus', [natalHouse8Sign], parsedBirthDate, 85, true, 'lahiri');

  // Item 4: Mars & Pluto transits to H1 & H8
  const marsH1H8Transits = findTransitPeriods('Mars', [natalHouse1Sign, natalHouse8Sign], parsedBirthDate, 85, true, 'lahiri');
  const plutoH1H8Transits = findTransitPeriods('Pluto', [natalHouse1Sign, natalHouse8Sign], parsedBirthDate, 85, true, 'lahiri');

  // Item 5: Neptune transits to H12 & H8
  const neptuneH12Transits = findTransitPeriods('Neptune', [natalHouse12Sign], parsedBirthDate, 85, true, 'lahiri');
  const neptune8HTransits = findTransitPeriods('Neptune', [natalHouse8Sign], parsedBirthDate, 85, true, 'lahiri');

  warnings.push({
    person: "命主本人或配偶(7宮)",
    event: "突發死劫 / 重大健康危機",
    object: "全身系統 / 生命力",
    location: "醫院 / 意外現場",
    timing: (
      <div className="space-y-3 mt-2">
        <div>
          <strong className="text-red-800">【所有 Maraka (2/7宮主) 危險大運/次運時間軸】</strong>
          <p className="text-xs text-gray-600 mb-1">本命盤第2宮主星為 {getPlanetName(lord2, modes)}，第7宮主星為 {getPlanetName(lord7, modes)}。</p>
          <ul className="list-disc pl-5 space-y-1 text-xs max-h-40 overflow-y-auto bg-white p-2 rounded border border-red-100">
            {allMarakaPeriods.map((p, idx) => (
              <li key={idx} className={p.isCurrent ? 'text-red-600 font-bold bg-red-50 p-1 rounded' : 'text-gray-700'}>
                {p.isCurrent && '👉 (目前) '}
                {p.type}: {p.planet.split('-').map(pl => getPlanetName(pl, modes)).join('-')} 
                ({formatDate(p.start)} ~ {formatDate(p.end)})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong className="text-red-800">【Sade-Sati (土星回歸) 觸發條件】</strong>
          <p className="text-xs text-gray-700">
            當流年土星進入 <span className="font-bold">{sadeSatiSigns.map(s => getZodiacName(s, modes)).join('、')}</span> 時觸發。
            {isSadeSati ? (
              <span className="text-red-600 font-bold block mt-1">
                👉 警告：目前流年土星正位於 {getZodiacName(transitSaturnSign, modes)}，正處於 Sade-Sati 期間！
              </span>
            ) : (
              <span className="text-green-600 block mt-1">
                目前流年土星位於 {getZodiacName(transitSaturnSign, modes)}，未處於 Sade-Sati 期間。
              </span>
            )}
          </p>
        </div>
        <div>
          <strong className="text-red-800">【Ashtakavarga (SAV) 估算死劫】</strong>
          <p className="text-xs text-gray-700">
            估算危險歲數約為 <span className="font-bold text-red-600">{dangerAge} 歲</span>。
            此代表命主大約在 {dangerAge} 歲時要特別注意！<br/>
            流年土星經過 <span className="font-bold">{dangerNakshatra}</span> 星宿的時期會引發極凶影響。
            {savSaturnTransit && (
              <span className="block mt-1 p-1 bg-red-100 text-red-800 rounded font-bold border border-red-300">
                🔴 警報：實際發生危險流年日期為 {formatDate(savSaturnTransit.start)} 至 {formatDate(savSaturnTransit.end)}。
              </span>
            )}
          </p>
        </div>
      </div>
    )
  });

  // 2. 癌症/無名重病判定
  const d30 = natalData.vargas.find(v => v.name === 'D30');
  let d30Afflicted = false;
  let maleficsInD30Asc: [string, any][] = [];
  if (d30) {
    const d30AscSign = d30.ascendantSign;
    maleficsInD30Asc = (Object.entries(d30.planets) as [string, { sign: number; degreeInSign: number }][]).filter(([name, p]) => malefics.includes(name) && p.sign === d30AscSign);
    if (maleficsInD30Asc.length >= 1) d30Afflicted = true;
  }

  const transitRahuSign = transitData.planets['Rahu'].sign;
  const transitSaturnSign2 = transitData.planets['Saturn'].sign;

  const afflictedSigns = [sunSign, ascLordSign, house6Sign, house8Sign];
  const isRahuSaturnAfflicting = afflictedSigns.includes(transitRahuSign) || afflictedSigns.includes(transitSaturnSign2);

  warnings.push({
    person: "命主本人",
    event: "癌症確診 / 無名重病",
    object: "細胞病變 / 免疫系統 / 隱疾",
    location: "醫院 / 療養院",
    timing: (
      <div className="space-y-3 mt-2">
        <div>
          <strong className="text-red-800">【流年羅睺/土星刑剋要地與第8宮起迄時間】</strong>
          <p className="text-xs text-gray-700 mb-1.5">
            當流年羅睺或土星進入以下受剋要地時觸發：<span className="font-bold">{afflictedSigns.map(s => getZodiacName(s, modes)).join('、')}</span> 
            (本命太陽、命主星、第6宮、第8宮所在星座)。
          </p>
          {isRahuSaturnAfflicting ? (
            <div className="text-red-600 font-bold text-xs mb-3 bg-red-50 p-2 rounded">
              👉 警告：目前流年羅睺位於 {getZodiacName(transitRahuSign, modes)}，流年土星位於 {getZodiacName(transitSaturnSign2, modes)}，正形成刑剋！
              <br/>
              <span className="text-gray-600 font-normal text-[11px]">
                (羅睺代表免疫系統異常與未確診疾病；土星代表慢性病消耗與折磨)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mb-2">目前流年羅睺與土星未形成刑剋。</div>
          )}
          
          <div className="space-y-2 mt-2">
            <div>
              <span className="text-xs font-semibold text-amber-900 block">🪐 土星過運本命受剋要地起迄時間表 (含第8宮)：</span>
              {renderTransitList(saturnAfflictedTransits)}
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-900 block">🐉 羅睺過運本命受剋要地起迄時間表 (含第8宮)：</span>
              {renderTransitList(rahuAfflictedTransits)}
            </div>
            <div className="bg-red-50/50 p-2 rounded border border-red-100">
              <span className="text-xs font-bold text-red-850 flex items-center gap-1">💀 關鍵生命預警：流年土星與羅睺經過【第8宮】(【{getZodiacName(natalHouse8Sign, modes)}】) 時間點：</span>
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-700 font-semibold text-red-900">● 流年土星經過第8宮時間：</p>
                {renderTransitList(saturn8HTransits)}
                <p className="text-xs text-gray-700 font-semibold text-red-900 mt-2">● 流年羅睺經過第8宮時間：</p>
                {renderTransitList(rahu8HTransits)}
              </div>
            </div>
          </div>
        </div>
        <div>
          <strong className="text-red-800">【D-30 (Trishamsha) 潛在體質】</strong>
          {d30Afflicted ? (
            <p className="text-xs text-red-600 font-bold">
              👉 警告：本命 D-30 分盤命宮受凶星 ({maleficsInD30Asc.map(p => getPlanetName(p[0], modes)).join(', ')}) 刑剋，先天帶有重病或隱疾體質。
            </p>
          ) : (
            <p className="text-xs text-green-600">本命 D-30 分盤命宮無凶星刑剋，先天體質較佳。</p>
          )}
        </div>
      </div>
    )
  });

  // 3. 車禍/交通意外判定
  const d16 = natalData.vargas.find(v => v.name === 'D16');
  let d16Afflicted = false;
  let maleficsInD16H4: [string, any][] = [];
  if (d16) {
    const d16House4Sign = ((d16.ascendantSign + 3) % 12) || 12;
    maleficsInD16H4 = (Object.entries(d16.planets) as [string, { sign: number; degreeInSign: number }][]).filter(([name, p]) => ['Saturn', 'Mars', 'Uranus', 'Pluto'].includes(name) && p.sign === d16House4Sign);
    if (maleficsInD16H4.length > 0) d16Afflicted = true;
  }
  const transitMarsSign = transitData.planets['Mars'].sign;
  const transitUranusSign = transitData.planets['Uranus']?.sign;
  const isTransitMarsInH4 = transitMarsSign === natalHouse4Sign;
  const isTransitUranusInH4 = transitUranusSign === natalHouse4Sign;

  warnings.push({
    person: "命主本人或母親(4宮)",
    event: "重大車禍 / 交通意外",
    object: "車輛 / 骨骼 / 頭部",
    location: "高速公路 / 街道 / 交通樞紐",
    timing: (
      <div className="space-y-3 mt-2">
        <div>
          <strong className="text-red-800">【流年火星/天王星入4宮與第8宮起迄時間】</strong>
          <p className="text-xs text-gray-700 mb-1.5">
            當流年火星或天王星進入本命第4宮 (<span className="font-bold">{getZodiacName(natalHouse4Sign, modes)}</span>) 時觸發。
          </p>
          {(isTransitMarsInH4 || isTransitUranusInH4) ? (
            <div className="text-red-600 font-bold text-xs mb-3 bg-red-50 p-2 rounded">
              👉 警告：目前流年
              {isTransitMarsInH4 && `火星位於 ${getZodiacName(transitMarsSign, modes)} `}
              {isTransitUranusInH4 && `天王星位於 ${getZodiacName(transitUranusSign, modes)} `}
              正行經本命第4宮，極易引發突發交通意外！
              <br/>
              <span className="text-gray-600 font-normal text-[11px]">
                (火星代表：急性發炎、金屬創傷、衝動超速；天王星代表：突發碰撞失控、巨震意外)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mb-2">目前流年火星與天王星未進入本命第4宮。</div>
          )}

          <div className="space-y-2 mt-2">
            <div>
              <span className="text-xs font-semibold text-amber-900 block">🚗 火星過運第4宮時間表 (此生完整記錄)：</span>
              {renderTransitList(marsH4Transits)}
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-900 block">⚡ 天王星過運第4宮時間表 (此生完整記錄)：</span>
              {renderTransitList(uranusH4Transits)}
            </div>
            <div className="bg-red-50/50 p-2 rounded border border-red-100">
              <span className="text-xs font-bold text-red-850 flex items-center gap-1">💀 關鍵車關預警：行經【第8宮-疾厄宮】(【{getZodiacName(natalHouse8Sign, modes)}】) 時間點：</span>
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-700 font-semibold text-red-900">● 流年火星經過第8宮時間 (此生完整記錄)：</p>
                {renderTransitList(mars8HTransits)}
                <p className="text-xs text-gray-700 font-semibold text-red-900 mt-2">● 流年天王星經過第8宮時間：</p>
                {renderTransitList(uranus8HTransits)}
              </div>
            </div>
          </div>
        </div>
        <div>
          <strong className="text-red-800">【D-16 (Shodashamsha) 潛在體質】</strong>
          {d16Afflicted ? (
            <p className="text-xs text-red-600 font-bold">
              👉 警告：本命 D-16 分盤第4宮受凶星 ({maleficsInD16H4.map(p => getPlanetName(p[0], modes)).join(', ')}) 刑剋，先天帶有車禍意外體質。
            </p>
          ) : (
            <p className="text-xs text-green-600">本命 D-16 分盤第4宮無凶星刑剋，交通運勢較平穩。</p>
          )}
        </div>
      </div>
    )
  });

  // 4. 開刀/血光/外傷判定
  const transitPlutoSign = transitData.planets['Pluto']?.sign;
  const isMarsIn1or8 = transitMarsSign === natalHouse1Sign || transitMarsSign === natalHouse8Sign;
  const isPlutoIn1or8 = transitPlutoSign === natalHouse1Sign || transitPlutoSign === natalHouse8Sign;

  warnings.push({
    person: "命主本人",
    event: "開刀手術 / 血光之災 / 外傷",
    object: "頭部(1宮) / 血液 / 隱密部位(8宮)",
    location: "醫院手術室 / 意外現場",
    timing: (
      <div className="space-y-3 mt-2">
        <div>
          <strong className="text-red-800">【流年火星/冥王星入1/8宮起迄時間】</strong>
          <p className="text-xs text-gray-700 mb-1.5">
            當流年火星或冥王星進入本命第1宮 (<span className="font-bold">{getZodiacName(natalHouse1Sign, modes)}</span>) 或第8宮 (<span className="font-bold">{getZodiacName(natalHouse8Sign, modes)}</span>) 時觸發。
          </p>
          {(isMarsIn1or8 || isPlutoIn1or8) ? (
            <div className="text-red-600 font-bold text-xs mb-3 bg-red-50 p-2 rounded">
              👉 警告：目前流年
              {isMarsIn1or8 && `火星位於 ${getZodiacName(transitMarsSign, modes)} `}
              {isPlutoIn1or8 && `冥王星位於 ${getZodiacName(transitPlutoSign, modes)} `}
              正行經本命第1或8宮，為意外血光、開刀高危期！
              <br/>
              <span className="text-gray-600 font-normal text-[11px]">
                (火星代表：刀傷、開刀手術、急性出血高熱；冥王星代表：病灶徹底切除、劇烈摧毀與生命重組)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mb-2">目前流年火星與冥王星未進入本命第1或8宮。</div>
          )}

          <div className="space-y-2 mt-2">
            <div>
              <span className="text-xs font-semibold text-amber-900 block">🩸 火星過運第1宮及第8宮時間表 (此生完整記錄，含關鍵第8宮時期)：</span>
              {renderTransitList(marsH1H8Transits)}
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-900 block">💀 冥王星過運第1宮及第8宮時間表 (此生完整記錄，含關鍵第8宮時期)：</span>
              {renderTransitList(plutoH1H8Transits)}
            </div>
          </div>
        </div>
      </div>
    )
  });

  // 5. 住院/慢性折磨/精神疾病判定
  const house12Planets = natalData.houses[11].planetsInHouse;
  const hasMaleficsInH12 = house12Planets.some(p => malefics.includes(p) || ['Neptune', 'Uranus'].includes(p));
  
  const lord1 = getLord(1);
  const lord8 = getLord(8);
  const lord1In8 = natalData.planets[lord1]?.sign === natalHouse8Sign;
  const lord8In1 = natalData.planets[lord8]?.sign === natalHouse1Sign;
  const isExchange1_8 = lord1In8 && lord8In1;

  const transitNeptuneSign = transitData.planets['Neptune']?.sign;
  const isNeptuneIn12 = transitNeptuneSign === natalHouse12Sign;

  warnings.push({
    person: "命主本人",
    event: "住院折磨 / 慢性病 / 精神疾病",
    object: "神經系統 / 睡眠中樞 / 潛意識",
    location: "醫院病房 / 居家臥室 / 隔離場所",
    timing: (
      <div className="space-y-3 mt-2">
        <div>
          <strong className="text-red-800">【流年海王星入12宮與第8宮起迄時間】</strong>
          <p className="text-xs text-gray-700 mb-1.5">
            當流年海王星進入本命第12宮 (<span className="font-bold">{getZodiacName(natalHouse12Sign, modes)}</span>) 時觸發。
          </p>
          {isNeptuneIn12 ? (
            <div className="text-red-600 font-bold text-xs mb-3 bg-red-50 p-2 rounded">
              👉 警告：目前流年海王星位於 {getZodiacName(transitNeptuneSign, modes)}，正行經本命第12宮！
              <br/>
              <span className="text-gray-600 font-normal text-[11px]">
                (海王星代表：精神耗弱、成癮引誘、難以確診之罕見疾病或長期住院隔離)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mb-2">目前流年海王星未進入本命第12宮。</div>
          )}

          <div className="space-y-2 mt-2">
            <div>
              <span className="text-xs font-semibold text-amber-900 block">🌊 海王星過運第12宮時間表 (此生完整記錄)：</span>
              {renderTransitList(neptuneH12Transits)}
            </div>
            <div className="bg-red-50/50 p-2 rounded border border-red-100">
              <span className="text-xs font-bold text-red-850 flex items-center gap-1">💀 關鍵慢性病預警：行經【第8宮-疾厄宮】(【{getZodiacName(natalHouse8Sign, modes)}】) 時間點：</span>
              <div className="mt-1">
                {renderTransitList(neptune8HTransits)}
              </div>
            </div>
          </div>
        </div>
        <div>
          <strong className="text-red-800">【本命第12宮/8宮潛在體質】</strong>
          {hasMaleficsInH12 ? (
            <p className="text-xs text-red-600 font-bold">
              👉 警告：本命第12宮受凶星 ({house12Planets.filter(p => malefics.includes(p) || ['Neptune', 'Uranus'].includes(p)).map(p => getPlanetName(p, modes)).join(', ')}) 影響，易有睡眠障礙 or 潛意識組織之功能焦慮。
            </p>
          ) : (
            <p className="text-xs text-green-600">本命第12宮無凶星影響。</p>
          )}
          {isExchange1_8 && (
            <p className="text-xs text-red-600 font-bold mt-1">
              👉 警告：本命命主星與第8宮主星互換，為慢性疾病、長期折磨之高危險格局。
            </p>
          )}
        </div>
      </div>
    )
  });

  const compiledCalendarEvents: any[] = [];

  // 1. SAV Saturn transit
  if (savSaturnTransit && savSaturnTransit.start && savSaturnTransit.end) {
    compiledCalendarEvents.push({
      planet: 'Saturn',
      start: savSaturnTransit.start,
      end: savSaturnTransit.end,
      title: '土星經過 SAV 凶星宿危難期 (星盤死劫預警)',
      details: `估算危險歲數約為 ${dangerAge} 歲，流年土星行經特定星宿（${dangerNakshatra}）引發極凶影響。`,
      triggeredHouse: '第 8 宮 (疾厄宮)',
      attention: '防範突發重大災厄、壽元危機。應在一週前通知防範。'
    });
  }

  // 2. Maraka periods
  allMarakaPeriods.forEach((p) => {
    if (p.start && p.end) {
      compiledCalendarEvents.push({
        planet: p.planet,
        start: p.start,
        end: p.end,
        title: `第 ${p.type} 運期：Maraka (2/7宮主星) 觸發階段 (健康壽元預警)`,
        details: `本命第2宮主星為 ${getPlanetName(lord2, modes)}，第7宮主星為 ${getPlanetName(lord7, modes)}。在此大限或次限運期，主世俗生命力與壽元功能面臨關卡考驗。`,
        triggeredHouse: p.type.includes('Dasha') ? '第 2/7 宮' : '大限/次限運度',
        attention: '防範慢性宿疾突發爆發。應在一週前通知防範。'
      });
    }
  });

  // 3. Saturn 8H transits
  saturn8HTransits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Saturn',
        start: t.start,
        end: t.end,
        title: '流年土星行經第 8 宮 (重病防範預警)',
        details: `流年土星經過第 8 宮（${getZodiacName(natalHouse8Sign, modes)}），常引起器官慢性衰退、折磨性病症，需要持續調養與防微杜漸。`,
        triggeredHouse: '第 8 宮 (疾厄宮)',
        attention: '注意防範慢性病變消磨。應在一週前通知防範。'
      });
    }
  });

  // 4. Rahu 8H transits
  rahu8HTransits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Rahu',
        start: t.start,
        end: t.end,
        title: '流年羅睺行經第 8 宮 (隱疾防範預警)',
        details: `流年羅睺經過第 8 宮（${getZodiacName(natalHouse8Sign, modes)}），常引起免疫系統異常、中毒感染、難以確診之罕見疾病。`,
        triggeredHouse: '第 8 宮 (疾厄宮)',
        attention: '預防免疫系統異常與未確診隱疾。應在一週前通知防範。'
      });
    }
  });

  // 5. Mars 4H transits
  marsH4Transits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Mars',
        start: t.start,
        end: t.end,
        title: '流年火星行經第 4 宮 (交通血光警示)',
        details: `流年火星進入第 4 宮（${getZodiacName(natalHouse4Sign, modes)}），極易因衝動駕駛、器具操作不慎或擦撞引發突發血光之災。`,
        triggeredHouse: '第 4 宮 (田宅宮-主交通載具)',
        attention: '防範超速發熱、開車碰撞。應在一週前通知防範。'
      });
    }
  });

  // 6. Uranus 4H transits
  uranusH4Transits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Uranus',
        start: t.start,
        end: t.end,
        title: '流年天王星行經第 4 宮 (突發碰撞警示)',
        details: `流年天王星進入第 4 宮（${getZodiacName(natalHouse4Sign, modes)}），常誘發出行工具碰撞失控、機械故障或突發猛烈意外。`,
        triggeredHouse: '第 4 宮 (田宅宮-主交通載具)',
        attention: '防範機械及出行載具突發失靈。應在一週前通知防範。'
      });
    }
  });

  // 7. Mars 8H transits
  mars8HTransits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Mars',
        start: t.start,
        end: t.end,
        title: '流年火星行經第 8 宮 (意外凶災警示)',
        details: `流年火星進入第 8 宮（${getZodiacName(natalHouse8Sign, modes)}），常引發突發碰撞受傷、金屬利刃創傷、或血光開刀手術。`,
        triggeredHouse: '第 8 宮 (疾厄宮)',
        attention: '防範外傷開刀或流血事件。應在一週前通知防範。'
      });
    }
  });

  // 8. Uranus 8H transits
  uranus8HTransits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Uranus',
        start: t.start,
        end: t.end,
        title: '流年天王星行經第 8 宮 (驚恐碰撞警示)',
        details: `流年天王星進入第 8 宮（${getZodiacName(natalHouse8Sign, modes)}），此為不可抗力、或意外驚恐之碰撞事件，帶來突發外傷挑戰。`,
        triggeredHouse: '第 8 宮 (疾厄宮)',
        attention: '防範各類大型驚恐碰撞外傷。應在一週前通知防範。'
      });
    }
  });

  // 9. Mars H1/H8 transits (excluding ones already added)
  marsH1H8Transits.forEach((t) => {
    if (t.start && t.end) {
      const isDuplicate = compiledCalendarEvents.some(
        e => e.planet === 'Mars' && e.start.getTime() === t.start.getTime() && e.title.includes('第 8 宮')
      );
      if (!isDuplicate) {
        compiledCalendarEvents.push({
          planet: 'Mars',
          start: t.start,
          end: t.end,
          title: '流年火星經過命宮或疾厄宮 (手術血光預警)',
          details: `流年火星行經命宮第 1 宮 (${getZodiacName(natalHouse1Sign, modes)}) 或第 8 宮 (${getZodiacName(natalHouse8Sign, modes)})，為主動性外科開刀、或急性流血發熱的高潮階段。`,
          triggeredHouse: '第 1 / 8 宮 (生命命元宮)',
          attention: '防範刀剪利器撞擊流血受傷。應在一週前通知防範。'
        });
      }
    }
  });

  // 10. Pluto H1/H8 transits
  plutoH1H8Transits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Pluto',
        start: t.start,
        end: t.end,
        title: '流年冥王星經過命宮或疾厄宮 (生命重整修補預警)',
        details: `流年冥王星行經命宮第 1 宮 (${getZodiacName(natalHouse1Sign, modes)}) 或第 8 宮 (${getZodiacName(natalHouse8Sign, modes)})，代表生理結構重修大手術、不破不立之病理治疗。`,
        triggeredHouse: '第 1 / 8 宮 (生命命元宮)',
        attention: '防範病灶大開刀切除。應在一週前通知防範。'
      });
    }
  });

  // 11. Neptune 12H transits
  neptuneH12Transits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Neptune',
        start: t.start,
        end: t.end,
        title: '流年海王星行經第 12 宮 (住院精神焦慮預警)',
        details: `流年海王星行經第 12 宮（${getZodiacName(natalHouse12Sign, modes)}），易引發嚴重睡眠不寧失眠障礙、藥物中毒感染或隔離性住院照護。`,
        triggeredHouse: '第 12 宮 (玄秘住院宮)',
        attention: '防範睡眠障礙與罕見感染，應調整作息。應在一週前通知防範。'
      });
    }
  });

  // 12. Neptune 8H transits
  neptune8HTransits.forEach((t) => {
    if (t.start && t.end) {
      compiledCalendarEvents.push({
        planet: 'Neptune',
        start: t.start,
        end: t.end,
        title: '流年海王星行經第 8 宮 (無名疾病預警)',
        details: `流年海王星行經第 8 宮（${getZodiacName(natalHouse8Sign, modes)}），需防範臨床疑難雜症、莫名虛衰慢性病、或過敏中毒失準等疾病。`,
        triggeredHouse: '第 8 宮 (疾厄宮)',
        attention: '注意防範用藥失誤與水源過敏中毒。應在一週前通知防範。'
      });
    }
  });

  // 導出 CSV 文字報告內容生成器
  const generateCSVReport = () => {
    let csvContent = '\uFEFF';
    const headers = ['在事件前14天 提醒', '在事前7天 提醒', '事件', '期間', '命主', '具體事件', '身體部位發生場合', '觸發時機'];
    csvContent += headers.join(',') + '\n';
    
    compiledCalendarEvents.forEach(event => {
      const startDate = new Date(event.start);
      const date14DaysBefore = new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000);
      const date7DaysBefore = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const formatDate = (date: Date) => `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      
      const d14 = isNaN(date14DaysBefore.getTime()) ? '' : formatDate(date14DaysBefore);
      const d7 = isNaN(date7DaysBefore.getTime()) ? '' : formatDate(date7DaysBefore);
      
      const startStr = isNaN(startDate.getTime()) ? (event.start || '') : formatDate(startDate);
      const endDate = new Date(event.end);
      const endStr = isNaN(endDate.getTime()) ? (event.end || '') : formatDate(endDate);
      const period = `${startStr} ~ ${endStr}`;
      
      const ascendant = userName || '命主本人';
      
      let bodyPart = event.triggeredHouse || '';
      if (bodyPart.includes('第 1 宮')) bodyPart += ' (頭部/大腦/全身)';
      else if (bodyPart.includes('第 4 宮')) bodyPart += ' (胸部/心肺/乳房)';
      else if (bodyPart.includes('第 6 宮')) bodyPart += ' (腸胃/消化系統/盲腸)';
      else if (bodyPart.includes('第 8 宮')) bodyPart += ' (生殖器/排泄系統/直腸)';
      else if (bodyPart.includes('第 12 宮')) bodyPart += ' (足部/睡眠神經/精神系統)';

      let reminder14 = d14 ? `${d14} 流年${getPlanetName(event.planet, modes)}進${event.triggeredHouse}` : '';
      let reminder7 = d7 ? d7 : '';

      const row = [
        `"${reminder14}"`,
        `"${reminder7}"`,
        `"${event.title}"`,
        `"${period}"`,
        `"${ascendant}"`,
        `"${event.details}"`,
        `"${bodyPart}"`,
        `"${event.attention}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  };

  const downloadCSV = () => {
    const csvContent = generateCSVReport();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '印占醫厄預警.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 導出文字報告內容生成器
  const generateTextReport = () => {
    let reportText = `======================================================================\n`;
    reportText += `       🔮 醫療與外在凶厄預警分析報告 (Medical Astrology Report) 🔮\n`;
    reportText += `======================================================================\n`;
    const nowLocal = new Date();
    const generationTime = `${nowLocal.getFullYear()}/${String(nowLocal.getMonth() + 1).padStart(2, '0')}/${String(nowLocal.getDate()).padStart(2, '0')} ${String(nowLocal.getHours()).padStart(2, '0')}:${String(nowLocal.getMinutes()).padStart(2, '0')}:${String(nowLocal.getSeconds()).padStart(2, '0')}`;
    reportText += `📌 生成時間: ${generationTime}\n`;
    reportText += `👤 個案姓名: ${userName || '命主本人'}\n`;
    reportText += `📅 出生日期: ${formatBirthDate(birthDate)}\n`;
    reportText += `🕒 出生時間: ${birthTime || '未提供'}\n`;
    reportText += `🌌 占星系統: Lahiri Ayanamsa (恆星黃道 / Sidereal Zodiac)\n`;
    reportText += `----------------------------------------------------------------------\n\n`;
    
    // 命盤基本資訊
    const ascName = getZodiacName(natalData.ascendantSign, modes);
    const sunName = getZodiacName(natalData.planets['Sun']?.sign, modes);
    const moonName = getZodiacName(natalData.planets['Moon']?.sign, modes);
    const ascLordName = getPlanetName(ascLord, modes);
    const ascDegreeInSign = (natalData.ascendant % 30).toFixed(2);
    
    reportText += `【🪐 星盤基本參數 (Graha & Lagna Parameters)】\n`;
    reportText += `● 命宮 (Ascendant / Lagna): ${ascName} (第 1 宮) | 經度度數: ${ascDegreeInSign}°\n`;
    reportText += `● 命主星 (Ascendant Lord): ${ascLordName}\n`;
    reportText += `● 本命太陽 (Sun Sign): ${sunName} | 位於第 ${natalData.planets['Sun']?.house} 宮 | 度數: ${natalData.planets['Sun']?.degreeInSign.toFixed(2)}°\n`;
    reportText += `● 本命月亮 (Moon Sign): ${moonName} | 位於第 ${natalData.planets['Moon']?.house} 宮 | 度數: ${natalData.planets['Moon']?.degreeInSign.toFixed(2)}°\n`;
    reportText += `----------------------------------------------------------------------\n\n`;

    reportText += `【🪐 九曜星盤行星詳細星位 (Graha Placements Details)】\n`;
    const sortedPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    sortedPlanets.forEach(pName => {
      const p = natalData.planets[pName];
      if (p) {
        const transSign = getZodiacName(p.sign, modes);
        const transName = getPlanetName(pName, modes);
        const isRetro = p.isRetrograde ? ' (逆行 ℟)' : '';
        const isComb = p.isCombust ? ' (焦傷 ☄️)' : '';
        const nakName = p.nakshatra?.name || '無';
        const nakPada = p.nakshatra?.pada ? `第 ${p.nakshatra.pada} 象限(足)` : '';
        const nakLord = p.nakshatra?.lord ? `(主星: ${getPlanetName(p.nakshatra.lord, modes)})` : '';
        let dignityText = '通常 (Neutral)';
        if (p.dignity === 'Exalted') dignityText = '🌟 曜升 (Exalted)';
        else if (p.dignity === 'Debilitated') dignityText = '⚡ 曜陷 (Debilitated)';
        else if (p.dignity === 'Moolatrikona') dignityText = '💎 三合本宮 (Moolatrikona)';
        else if (p.dignity === 'Own Sign') dignityText = '🏠 廟旺本宮 (Own Sign)';
        else if (p.dignity) dignityText = p.dignity;

        reportText += `  ● ${transName.padEnd(6, ' ')} (${pName.padEnd(8, ' ')}): 位於 ${transSign.padEnd(6, ' ')} (第 ${p.house} 宮) | 度數: ${p.degreeInSign.toFixed(2)}°${isRetro}${isComb} | 星宿: ${nakName} ${nakPada} ${nakLord} | 吉凶狀態: ${dignityText}\n`;
      }
    });
    reportText += `----------------------------------------------------------------------\n\n`;

    // 項目 1：突發死劫 / 重大健康危機
    reportText += `【💀 項目一：突發死劫 / 重大健康危機】\n`;
    reportText += `● 👤 影響對象: 命主本人或配偶 (7宮) 範圍\n`;
    reportText += `● 🚨 具體事件: 突發凶險 / 壽元關劫 / 重大健康危機\n`;
    reportText += `● 🩻 身體部位: 全身機能系統衰減 / 元氣生命力損耗\n`;
    reportText += `● 📍 發生場所: 醫院急診 / 重大意外現場\n`;
    reportText += `● ⏰ 觸發時機:\n`;
    reportText += `  (1) 🗓️ Maraka (第2/7宮限期主星) 凶險大運與次運重合期:\n`;
    reportText += `      (本命盤第2宮主星為【${getPlanetName(lord2, modes)}】，第7宮主星為【${getPlanetName(lord7, modes)}】)\n`;
    allMarakaPeriods.forEach(p => {
      const isCurrentStr = p.isCurrent ? ` 🔴 [👉 警報：目前正處於此運期間！]` : ``;
      reportText += `      - [${p.type}] ${p.planet.split('-').map(pl => getPlanetName(pl, modes)).join('-')} (${formatDate(p.start)} ~ ${formatDate(p.end)})${isCurrentStr}\n`;
    });
    reportText += `  (2) 🪐 Sade-Sati (土星回歸本命月亮前後共7.5年) 觸發條件:\n`;
    reportText += `      當流年土星經過本命月亮所在及前後共三個星座時觸發：${sadeSatiSigns.map(s => getZodiacName(s, modes)).join('、')}。\n`;
    reportText += `      - 🎯 目前狀態: 流年土星目前位於【${getZodiacName(transitSaturnSign, modes)}】。` + (isSadeSati ? `🔴 警報：正處於凶險 Sade-Sati 期間！\n` : `🟢 目前未處於 Sade-Sati 考驗期。\n`);
    reportText += `  (3) 🧮 Ashtakavarga (SAV) 壽數點數估算死劫:\n`;
    reportText += `      - 依據本命點數，估算好發危險歲數約為【${dangerAge} 歲】，這代表命主在 ${dangerAge} 歲時要特別注意是否有大難或死劫。\n`;
    reportText += `      - 殘星點數餘數為 ${dangerNakshatraIdx}，代表從第一個星宿 (Ashwini) 起算的第 ${dangerNakshatraIdx} 個星宿【${dangerNakshatra}】。\n`;
    if (savSaturnTransit) {
      reportText += `      - 🔴 [嚴重警報] 實際日期都出列：當流年土星行經這個星宿時，會對命盤產生極凶的影響。確切日期大約落在【${formatDate(savSaturnTransit.start)}】至【${formatDate(savSaturnTransit.end)}】期間。\n\n`;
    } else {
      reportText += `      - 🔴 [嚴重警報] 需特別留意流年土星經過【${dangerNakshatra}】星宿的年份，預防極凶影響。\n\n`;
    }

    // 項目 2：癌症確診 / 無名重病
    reportText += `【🦠 項目二：癌症確診 / 無名重病】\n`;
    reportText += `● 👤 影響對象: 命主本人\n`;
    reportText += `● 🚨 具體事件: 惡性細胞病變 / 免疫系統缺陷 / 難治之症 / 罕見病與無名重病\n`;
    reportText += `● 🩻 身體部位: 淋巴免疫異常 / 深層器官毒素積累 / 慢性退化\n`;
    reportText += `● 📍 發生場所: 大型醫學中心 / 腫瘤科病房 / 療養院\n`;
    reportText += `● ⏰ 觸發時機:\n`;
    reportText += `  (1) 🪐 流年羅睺 (Rahu) / 土星 (Saturn) 刑剋本命要地與第8宮:\n`;
    reportText += `      當流年羅睺或土星進入本命要地時觸發：${afflictedSigns.map(s => getZodiacName(s, modes)).join('、')} (本命太陽、命主星、第6宮、第8宮所在星座)。\n`;
    reportText += `      - 🎯 目前狀態: 流年羅睺正位於【${getZodiacName(transitRahuSign, modes)}】，流年土星正位於【${getZodiacName(transitSaturnSign2, modes)}】。` + (isRahuSaturnAfflicting ? `🔴 警報：與本命重要宮位形成強度刑剋！(羅睺代表免疫紊亂、未確診毒素；土星代表慢性病變消耗、骨肉之苦)\n` : `🟢 目前未與本命重要宮位形成刑剋。\n`);
    reportText += `      - 🪐 土星過運本命受剋要地之起迄日期表：\n${formatTransitTextList(saturnAfflictedTransits)}\n`;
    reportText += `      - 🐉 羅睺過運本命受剋要地之起迄日期表：\n${formatTransitTextList(rahuAfflictedTransits)}\n`;
    reportText += `      - 💀 關鍵預警：流年土星與羅睺行經【第8宮-疾厄宮】(【${getZodiacName(natalHouse8Sign, modes)}】) 之確切時間點：\n`;
    reportText += `        * 流年土星經過第8宮時間：\n${formatTransitTextList(saturn8HTransits)}\n`;
    reportText += `        * 流年羅睺經過第8宮時間：\n${formatTransitTextList(rahu8HTransits)}\n`;
    reportText += `  (2) 🛡️ D-30 (Trishamsha 凶星重病等分盤) 潛在體質強度:\n`;
    reportText += d30Afflicted 
      ? `      - 🔴 警報：本命 D-30 分盤命宮受凶星 (${maleficsInD30Asc.map(p => getPlanetName(p[0], modes)).join(', ')}) 侵擾，先天帶有頑固隱疾及重病易感體質。\n\n`
      : `      - 🟢 良好：本命 D-30 分盤命宮安穩無凶星受剋，先天抗病體質較佳。\n\n`;

    // 項目 3：重大車禍 / 交通意外
    reportText += `【🚗 項目三：重大車禍 / 交通意外】\n`;
    reportText += `● 👤 影響對象: 命主本人或母親 (第4宮範疇)\n`;
    reportText += `● 🚨 具體事件: 強烈撞擊 / 車輛意外毀損 / 骨折血光\n`;
    reportText += `● 🩻 身體部位: 交通載具 / 骨骼結構損害 / 胸腹頭部外傷\n`;
    reportText += `● 📍 發生場所: 高速公路 / 市區繁忙街道 / 交通路口\n`;
    reportText += `● ⏰ 觸發時機:\n`;
    reportText += `  (1) 🪐 流年火星 (Mars) / 天王星 (Uranus) 入本命第4宮與第8宮:\n`;
    reportText += `      當流年火星或天王星進入本命第4宮【${getZodiacName(natalHouse4Sign, modes)}】時觸發。\n`;
    const isMarsOrUranusInH4 = isTransitMarsInH4 || isTransitUranusInH4;
    reportText += `      - 🎯 目前狀態: 流年火星在【${getZodiacName(transitMarsSign, modes)}】，流年天王星在【${transitUranusSign ? getZodiacName(transitUranusSign, modes) : '未知'}】。` + (isMarsOrUranusInH4 ? `🔴 警報：正行經本命第4宮，交通意外風險飆升！(火星代表衝動超速、金屬利器撞擊；天王星代表突發失控、追撞)\n` : `🟢 目前無流年凶星行經第4宮，交通運勢平穩。\n`);
    reportText += `      - 🚗 火星過運第4宮時間表 (此生完整記錄)：\n${formatTransitTextList(marsH4Transits)}\n`;
    reportText += `      - ⚡ 天王星過運第4宮時間表 (此生完整記錄)：\n${formatTransitTextList(uranusH4Transits)}\n`;
    reportText += `      - 💀 關鍵車關預警：流年火星與天王星行經【第8宮】(【${getZodiacName(natalHouse8Sign, modes)}】) 之確切時間點：\n`;
    reportText += `        * 流年火星經過第8宮時間 (此生完整記錄)：\n${formatTransitTextList(mars8HTransits)}\n`;
    reportText += `        * 流年天王星經過第8宮時間 (此生完整記錄)：\n${formatTransitTextList(uranus8HTransits)}\n`;
    reportText += `  (2) 🛡️ D-16 (Shodashamsha 安全車輛等分盤) 潛在體質強度:\n`;
    reportText += d16Afflicted
      ? `      - 🔴 警報：本命 D-16 分盤第4宮受凶星 (${maleficsInD16H4.map(p => getPlanetName(p[0], modes)).join(', ')}) 刑剋，先天帶有車禍意外體質。\n\n`
      : `      - 🟢 良好：本命 D-16 分盤第4宮無凶星干擾，先天交通磁場較為順遂安穩。\n\n`;

    // 項目 4：開刀手術 / 血光之災 / 外傷
    reportText += `【🩸 項目四：開刀手術 / 血光之災 / 外傷】\n`;
    reportText += `● 👤 影響對象: 命主本人\n`;
    reportText += `● 🚨 具體事件: 外科手術開刀 / 金屬銳器創傷 / 急性血光事件\n`;
    reportText += `● 🩻 身體部位: 頭部 face/brain (1宮代表) / 血液與發炎 / 隱密排泄器官 (8宮)\n`;
    reportText += `● 📍 發生場所: 醫院手術室 / 機會意外現場 / 工地或廚房\n`;
    reportText += `● ⏰ 觸發時機:\n`;
    reportText += `  (1) 🪐 流年火星 (Mars) / 冥王星 (Pluto) 行經本命 1/8 宮:\n`;
    reportText += `      當流年火星或冥王星進入本命第 1 宮【${getZodiacName(natalHouse1Sign, modes)}】或第 8 宮【${getZodiacName(natalHouse8Sign, modes)}】時觸發。\n`;
    const isMarsOrPlutoIn1or8 = isMarsIn1or8 || isPlutoIn1or8;
    reportText += `      - 🎯 目前狀態: 流年火星在【${getZodiacName(transitMarsSign, modes)}】，流年冥王星在【${transitPlutoSign ? getZodiacName(transitPlutoSign, modes) : '未知'}】。` + (isMarsOrPlutoIn1or8 ? `🔴 警報：正強行穿過本命第1宮(命宮)或第8宮(疾厄宮)，手術、發炎血光風險極大！(火星=刀鋒、流血、熱毒；冥王星=深層病灶切除、破壞重組)\n\n` : `🟢 目前未重疊本命第1、8宮，意外血光機率屬正常範圍。\n\n`);
    reportText += `      - 🩸 火星行經第1宮與第8宮之詳細日期表 (此生完整記錄)：\n${formatTransitTextList(marsH1H8Transits)}\n`;
    reportText += `      - 💀 冥王星行經第1宮與第8宮之詳細日期表 (此生完整記錄)：\n${formatTransitTextList(plutoH1H8Transits)}\n\n`;

    // 項目 5：住院折磨 / 慢性病 / 精神疾病
    reportText += `【🏥 項目五：住院折磨 / 慢性病 / 精神疾病】\n`;
    reportText += `● 👤 影響對象: 命主本人\n`;
    reportText += `● 🚨 具體事件: 長期住院、精神衰弱失眠、抑鬱妄想、成癮性消耗或難以確診之慢性隱憂\n`;
    reportText += `● 🩻 身體部位: 睡眠神經中樞 / 精神潛意識 / 內臟慢性發炎 / 心理官能障礙\n`;
    reportText += `● 📍 發生場所: 醫院長期療養病房 / 心理診所 / 居家隔離臥室\n`;
    reportText += `● ⏰ 觸發時機:\n`;
    reportText += `  (1) 🪐 流年海王星 (Neptune) 進入本命第12宮與第8宮:\n`;
    reportText += `      當流年海王星進入本命第12宮【${getZodiacName(natalHouse12Sign, modes)}】時觸發。\n`;
    reportText += `      - 🎯 目前狀態: 流年海王星於【${transitNeptuneSign ? getZodiacName(transitNeptuneSign, modes) : '未知'}】。` + (isNeptuneIn12 ? `🔴 警報：海王星正行經第12宮(玄秘病院宮)，極易精神內耗、焦慮失眠、或引發頑固難醫之慢病住院！\n` : `🟢 目前並未受流年海王星進入2宮/12宮威脅。\n`);
    reportText += `      - 🌊 海王星經過本命第12宮之詳細日期表：\n${formatTransitTextList(neptuneH12Transits)}\n`;
    reportText += `      - 💀 關鍵慢性病預警：流年海王星過運【第8宮】之確切日期：\n${formatTransitTextList(neptune8HTransits)}\n`;
    reportText += `  (2) 🛡️ 本命第 12 宮 / 第 8 宮之宮位與星曜配置:\n`;
    reportText += `      - 本命第12宮星曜: ` + (hasMaleficsInH12 ? `🔴 警告：本命第12宮受凶星 (${house12Planets.filter(p => malefics.includes(p) || ['Neptune', 'Uranus'].includes(p)).map(p => getPlanetName(p, modes)).join(', ')}) 踞守，易有多思多慮、精神耗損與多夢之傾向。\n` : `🟢 良好：本命第12宮無凶星干擾，主精神平穩、神清氣和。\n`);
    if (isExchange1_8) {
      reportText += `      - 🔴 警告：本命盤呈現罕見而嚴重的【命主星 ⇄ 第8宮主星 互換】(Parivartana Yoga)，為慢性頑疾折磨、危急病痛之先天高危配置，切記定期健康檢查。\n`;
    } else {
      reportText += `      - 🟢 良好：無命主與第8宮主星互換格局。\n`;
    }
    
    reportText += `\n======================================================================\n`;
    reportText += `【🧬 古典梵天占星全身部位對照表 (Anatomy Mapping REFERENCE)】\n`;
    reportText += `======================================================================\n`;
    reportText += `● 【12宮位體系 (Bhavas)】代表身體部位：\n`;
    Object.entries(ZODIAC_BODY_PARTS).forEach(([signNum, parts]) => {
      reportText += `  - 第 ${signNum.padStart(2, '0')} 宮 : ${parts}\n`;
    });
    reportText += `● 【9大行星體系 (Grahas)】主司身體部位：\n`;
    Object.entries(PLANET_BODY_PARTS).forEach(([planet, parts]) => {
      reportText += `  - ${getPlanetName(planet, modes).padEnd(6, ' ')} (${planet.padEnd(8, ' ')}): ${parts}\n`;
    });
    reportText += `======================================================================\n`;
    reportText += `⚠️ 免責聲明：此醫療凶剋分析乃純粹基於古典印度占星學(Vedic Astrology / Jyotish)之星曜刑剋公式與古籍經驗規則推導，不代表現代正規臨床診斷與預防。若生理上有任何不適或重大疑惑，請務必尋求現代合格註冊之醫護專家做身體健康檢查與治療。\n`;
    reportText += `======================================================================\n`;
    
    return reportText;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateTextReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generateTextReport()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Vedic_Medical_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header Container with modern controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-red-600">⚠️</span> 醫療與外在凶厄預警報告
          </h2>
          <div className="text-xs text-gray-500 mt-1">
            基於古典印度梵天占星 (Jyotish) 醫療與星曜刑剋法則之大數據健康推導
          </div>
        </div>
        <button
          onClick={() => {
            setShowExportModal(true);
            setCopied(false);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-100 transition-all active:scale-95 text-sm cursor-pointer"
          id="btn-export-text-report"
        >
          <span>📤</span> 導出完整文字報告
        </button>
      </div>

      {/* 👤 個案健康星盤基本資訊 */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
          <span className="text-indigo-600 text-lg">👤</span> 個案醫學占星設定資訊 (Subject & Chart Details)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-sm text-slate-700">
          <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-lg">👤</span>
            <div>
              <p className="text-[11px] text-slate-400 font-bold leading-none mb-1">個案姓名</p>
              <p className="font-semibold text-slate-800 leading-tight">{userName || '命主本人'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-[11px] text-slate-400 font-bold leading-none mb-1">出生年月日</p>
              <p className="font-semibold text-slate-800 leading-tight">{formatBirthDate(birthDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-lg">🕒</span>
            <div>
              <p className="text-[11px] text-slate-400 font-bold leading-none mb-1">出生時間</p>
              <p className="font-semibold text-slate-800 leading-tight">{birthTime || '未提供'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-lg">🪐</span>
            <div>
              <p className="text-[11px] text-slate-400 font-bold leading-none mb-1">Lag/Asc 命宮星座</p>
              <p className="font-semibold text-slate-800 leading-tight">
                {getZodiacName(natalData.ascendantSign, modes)} (第 1 宮) | {ascDegreeInSign}°
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-lg">💫</span>
            <div>
              <p className="text-[11px] text-slate-400 font-bold leading-none mb-1">命主星 (Ascendant Lord)</p>
              <p className="font-semibold text-slate-800 leading-tight">{getPlanetName(ascLord, modes)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-lg">🌌</span>
            <div>
              <p className="text-[11px] text-slate-400 font-bold leading-none mb-1">占星歲差運算系統</p>
              <p className="font-semibold text-indigo-700 leading-tight">Lahiri Sidereal (恆星制)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ 系統危險判定規則與條件表格 */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5.5 shadow-sm mt-5">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
            <span className="text-amber-600 text-lg">⚠️</span> 印度占星凶厄與危險事件系統判定規則 (System Danger Rules Reference)
          </h3>
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            古典印占算沙法標準
          </span>
        </div>
        <p className="text-xs text-amber-800 mt-1.5 mb-4 leading-relaxed font-semibold">
          此表整理出本系統在針對五大核心「死、病、車、血、抑」災厄進行分析時，所套用的古典印度占星判定法與本命/流年條件式：
        </p>
        
        <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white shadow-inner">
          <table className="w-full text-left border-collapse text-xs min-w-[900px] table-fixed">
            <thead>
              <tr className="bg-amber-100/50 border-b border-amber-200 text-amber-950 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 w-[18%] break-words whitespace-normal">🎯 占星預警危害項目</th>
                <th className="p-3.5 w-[15%] break-words whitespace-normal">🩻 身體組織/部位</th>
                <th className="p-3.5 font-mono w-[27%] break-words whitespace-normal">🔧 核心占星判定條件式 (TypeScript 運算邏輯)</th>
                <th className="p-3.5 w-[20%] break-words whitespace-normal">🧬 本命先天體質/格局</th>
                <th className="p-3.5 w-[20%] break-words whitespace-normal">📅 流年觸發星象 (Transit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/50 text-slate-700">
              <tr className="hover:bg-amber-50/20 transition-colors">
                <td className="p-3.5 font-bold text-amber-950 break-words whitespace-normal break-all">突發死劫 / 重大健康危機</td>
                <td className="p-3.5 font-semibold text-slate-800 break-words whitespace-normal">全身器官系統、元氣生命力</td>
                <td className="p-3.5 font-mono text-xs text-slate-600 break-words break-all leading-relaxed whitespace-normal">
                  C1: Dasha / Antardasha == Lord 2 or Lord 7 (Maraka 宮)<br/>
                  C2: Saturn SAV transit (Ashtakavarga Formula A/B)
                </td>
                <td className="p-3.5 text-xs text-slate-600 leading-relaxed break-words whitespace-normal">本命第2、7宮主星（殺手星）暗伏威脅；分盤D-11 (Rudramsa) 受剋</td>
                <td className="p-3.5 font-semibold text-amber-900 text-xs leading-relaxed break-words whitespace-normal">
                  流年土星行經薩德薩提（本命月亮前後宮位）；流年土星過運點數低於 28 點之大凶限
                </td>
              </tr>
              <tr className="hover:bg-amber-50/20 transition-colors">
                <td className="p-3.5 font-bold text-amber-950 break-words whitespace-normal break-all">癌症確診 / 無名重病</td>
                <td className="p-3.5 font-semibold text-slate-800 break-words whitespace-normal">細胞病變、免疫系統、潛在隱疾</td>
                <td className="p-3.5 font-mono text-xs text-slate-600 break-words break-all leading-relaxed whitespace-normal">
                  C1: D30 Ascendant planets contains Malefics (Sun, Mars, Sat, Rah, Ket)<br/>
                  C2: Transit Rahu or Saturn enters afflictedSigns [Sun, AscLord, H6, H8 Sign]
                </td>
                <td className="p-3.5 text-xs text-slate-600 leading-relaxed break-words whitespace-normal">本命 D-30 (Trishamsha) 分盤命宮受凶星刑剋者，先天天質虛弱、帶有重疾或細胞病變隱性基因</td>
                <td className="p-3.5 font-semibold text-amber-900 text-xs leading-relaxed break-words whitespace-normal">
                  流年羅睺（代：未名毒素、突變）或土星（代：慢折、侵蝕）過運刑剋本命太陽/命主星/疾厄宮
                </td>
              </tr>
              <tr className="hover:bg-amber-50/20 transition-colors">
                <td className="p-3.5 font-bold text-amber-950 break-words whitespace-normal break-all">重大車禍 / 交通意外</td>
                <td className="p-3.5 font-semibold text-slate-800 break-words whitespace-normal">肢體、骨骼、頭部、車載物件</td>
                <td className="p-3.5 font-mono text-xs text-slate-600 break-words break-all leading-relaxed whitespace-normal">
                  C1: D16 House 4 contains malefics [Sat, Mars, Ura, Plu]<br/>
                  C2: Transit Mars or Uranus == Natal House 4 Sign
                </td>
                <td className="p-3.5 text-xs text-slate-600 leading-relaxed break-words whitespace-normal">本命 D-16 分盤之第4宮（主：車船出入、安全）遭惡星刑剋</td>
                <td className="p-3.5 font-semibold text-amber-900 text-xs leading-relaxed break-words whitespace-normal">
                  流年火星（金屬利器突發衝突）或天王星（瞬發爆裂事件）橫行穿過本命第4宮星座
                </td>
              </tr>
              <tr className="hover:bg-amber-50/20 transition-colors">
                <td className="p-3.5 font-bold text-amber-950 break-words whitespace-normal break-all">開刀手術 / 血光外傷</td>
                <td className="p-3.5 font-semibold text-slate-800 break-words whitespace-normal">頭部、全身血液循環、隱密部位</td>
                <td className="p-3.5 font-mono text-xs text-slate-600 break-words break-all leading-relaxed whitespace-normal">
                  C1: Transit Mars or Pluto == Natal House 1 or House 8 Sign
                </td>
                <td className="p-3.5 text-xs text-slate-600 leading-relaxed break-words whitespace-normal">本命第1宮（命宮頭部）或第8宮（疾厄生殖）受火星或土星感應</td>
                <td className="p-3.5 font-semibold text-amber-900 text-xs leading-relaxed break-words whitespace-normal">
                  流年火星（外科手術開刀、金屬大出血）或冥王星（重組性毀滅創傷）強烈撞擊本命 1/8 宮
                </td>
              </tr>
              <tr className="hover:bg-amber-50/20 transition-colors">
                <td className="p-3.5 font-bold text-amber-950 break-words whitespace-normal break-all">住院折磨 / 精神與隔離疾病</td>
                <td className="p-3.5 font-semibold text-slate-800 break-words whitespace-normal">神經中樞、睡眠失調、潛意識功能</td>
                <td className="p-3.5 font-mono text-xs text-slate-600 break-words break-all leading-relaxed whitespace-normal">
                  C1: House 12 planets contains Malefics or Neptune / Uranus<br/>
                  C2: Parivartana Yoga (Lord 1 in 8 AND Lord 8 in 1)<br/>
                  C3: Transit Neptune == Natal House 12 Sign
                </td>
                <td className="p-3.5 text-xs text-slate-600 leading-relaxed break-words whitespace-normal">本命第12宮（玄秘孤立宮，代：隱蔽醫院、住院隔離、失眠與精神病院）宿有凶星重犯，或命疾兩宮主星互飛交換、互為命門破敗</td>
                <td className="p-3.5 font-semibold text-amber-900 text-xs leading-relaxed break-words whitespace-normal">
                  流年海王星（麻醉、幻覺、隔離、慢性神經失調、傳染病）大跨步移入本命第12宮星座
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid gap-5">
        {warnings.map((w, i) => (
          <div key={i} className={`bg-white border ${w.event === '平安' ? 'border-green-200 shadow-green-50/50' : 'border-red-100 shadow-red-50/50'} p-5.5 rounded-2xl shadow-md relative overflow-hidden transition-all hover:translate-y-[-1px] hover:shadow-lg`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${w.event === '平安' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <span className="font-bold text-gray-400 text-xs flex items-center gap-1.5 mb-1">
                  <span>👤</span> 影響對象
                </span>
                <p className="font-semibold text-gray-800 text-sm pl-5 break-words whitespace-normal">{w.person}</p>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-gray-400 text-xs flex items-center gap-1.5 mb-1">
                  <span>🚨</span> 具體事件
                </span>
                <p className={`font-extrabold text-sm pl-5 break-words whitespace-normal ${w.event === '平安' ? 'text-green-600' : 'text-red-600'}`}>
                  {w.event}
                </p>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-gray-400 text-xs flex items-center gap-1.5 mb-1">
                  <span>🩻</span> 身體部位
                </span>
                <p className="font-semibold text-gray-800 text-sm pl-5 break-words whitespace-normal">{w.object}</p>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-gray-400 text-xs flex items-center gap-1.5 mb-1">
                  <span>📍</span> 發生場所
                </span>
                <p className="font-semibold text-gray-800 text-sm pl-5 break-words whitespace-normal">{w.location}</p>
              </div>
              <div className={`md:col-span-2 min-w-0 ${w.event === '平安' ? 'bg-green-50/40 border border-green-100/50' : 'bg-red-50/40 border border-red-100/30'} p-4.5 rounded-xl mt-1.5`}>
                <span className={`font-bold ${w.event === '平安' ? 'text-green-800' : 'text-red-800'} text-xs flex items-center gap-1.5 mb-2.5`}>
                  <span>⏰</span> 觸發時機
                </span>
                <div className={`${w.event === '平安' ? 'text-green-950' : 'text-red-950'} text-sm pl-5 break-words whitespace-normal break-all`}>{w.timing}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-indigo-600">🧬</span> 星座＆行星對應部位 (Medical Astrology Mapping)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">12 星座對應部位</h4>
            <div className="space-y-2">
              {Object.entries(ZODIAC_BODY_PARTS).map(([signNum, parts]) => (
                <div key={signNum} className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-indigo-600 min-w-[60px]">第 {signNum} 宮</span>
                  <span className="text-gray-700">{parts}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-amber-800 mb-3 border-b pb-2">9 大行星對應部位</h4>
            <div className="space-y-2">
              {Object.entries(PLANET_BODY_PARTS).map(([planet, parts]) => (
                <div key={planet} className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-amber-600 min-w-[60px]">{getPlanetName(planet, modes)}</span>
                  <span className="text-gray-700">{parts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-8">
        <h3 className="font-bold text-gray-700 mb-2">分析邏輯參考 (System Rules)</h3>
        <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
          <li>死亡/死劫：檢查 Maraka 大運 (2/7宮主)、Sade-Sati、Ashtakavarga SAV 危險歲數。</li>
          <li>癌症/重病：檢查 D-30 分盤受剋、流年羅睺/土星夾擊太陽/命主/6/8宮。</li>
          <li>車禍/意外：檢查 D-16 分盤第4宮受剋、流年火星入4宮。</li>
          <li>開刀/血光：檢查流年火星入命宮或第8宮。</li>
          <li>住院/精神：檢查第12宮凶星、命主與8宮主互換。</li>
        </ul>
      </div>

      {/* Modern Export Modal popup */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col h-[85vh] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-200" id="export-report-modal">
            {/* Header */}
            <div className="px-6 py-4 bg-indigo-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h3 className="text-lg font-bold">導出醫療與凶厄預警文字報告</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold p-1 line-clamp-1 select-none cursor-pointer focus:outline-none"
                id="btn-close-export-modal"
              >
                ✕
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 flex-1 flex flex-col min-h-0 bg-gray-50 overflow-y-auto space-y-4">
              <p className="text-xs text-gray-600 bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-2">
                <span className="text-indigo-600 font-bold">💡 提示：</span>
                您可以直接複製下方的報告內容，或者使用跨平台匯出面板將其一鍵下載為完美 PDF、或者是傳送至 Telegram 視窗或 Google 文件中進行留存！
              </p>
              
              <div className="h-44 flex-shrink-0">
                <textarea 
                  readOnly
                  value={generateTextReport()}
                  className="w-full h-full p-4 bg-gray-900 text-emerald-400 font-mono text-[11px] leading-relaxed rounded-xl border border-gray-800 resize-none focus:outline-none overflow-y-auto shadow-inner"
                  id="export-report-textarea"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>

              {/* Advanced Multi-channel Export Action Panel */}
              <ReportExportActions 
                reportTitle="醫療與外在凶厄預警分析報告" 
                reportText={generateTextReport()} 
                userName={userName || '命主本人'} 
                transitPeriods={compiledCalendarEvents}
                chartData={natalData}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
              <span className="text-xs text-gray-400 font-bold">
                運念不息，天道酬勤。解讀報告僅供人生趨吉避凶之參考。
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs text-center transition-all cursor-pointer shadow-sm"
                  id="btn-download-csv-modal"
                >
                  📥 匯出印占醫厄預警.csv
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs text-center transition-all cursor-pointer"
                  id="btn-cancel-export-modal"
                >
                  關閉與返回星盤
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReport;
