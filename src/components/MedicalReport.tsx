import React from 'react';
import { ChartData, getPlanetName, getZodiacName } from '../utils/astrology';

interface Props {
  natalData: ChartData;
  transitData: ChartData | null;
  modes: string[];
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

const MedicalReport: React.FC<Props> = ({ natalData, transitData, modes }) => {
  if (!transitData) return <div className="text-center p-8 text-gray-500">載入流年數據中...</div>;

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

  // Ashtakavarga danger year (Approximation using 28 points per house)
  const ascSign = natalData.ascendantSign;
  const saturnSign = natalData.planets['Saturn'].sign;
  const housesToSaturn = (saturnSign - ascSign + 12) % 12 + 1;
  const approxSAVSum = housesToSaturn * 28;
  const dangerAge = Math.floor((approxSAVSum * 7) / 27);
  const dangerNakshatraIdx = Math.floor((approxSAVSum * 7) % 27);
  const dangerNakshatra = NAKSHATRAS[dangerNakshatraIdx];

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
            估算危險歲數約為 <span className="font-bold text-red-600">{dangerAge} 歲</span>，需特別留意流年土星經過 <span className="font-bold">{dangerNakshatra}</span> 星宿的時期。
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

  const ascLord = getLord(1);
  const sunSign = natalData.planets['Sun'].sign;
  const ascLordSign = natalData.planets[ascLord]?.sign;
  const house6Sign = natalData.houses[5].sign;
  const house8Sign = natalData.houses[7].sign;

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
          <strong className="text-red-800">【流年羅睺/土星刑剋觸發條件】</strong>
          <p className="text-xs text-gray-700">
            當流年羅睺或土星進入以下星座時觸發：<br/>
            <span className="font-bold">{afflictedSigns.map(s => getZodiacName(s, modes)).join('、')}</span> 
            (本命太陽、命主星、第6宮、第8宮所在星座)。
          </p>
          {isRahuSaturnAfflicting ? (
            <div className="text-red-600 font-bold text-xs mt-1 bg-red-50 p-2 rounded">
              👉 警告：目前流年羅睺位於 {getZodiacName(transitRahuSign, modes)}，流年土星位於 {getZodiacName(transitSaturnSign2, modes)}，正形成刑剋！
              <br/>
              <span className="text-gray-600 font-normal">
                (羅睺代表：免疫系統異常、未確診疾病、毒素累積；土星代表：慢性消耗、骨骼/皮膚病變、長期折磨)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mt-1">目前流年羅睺與土星未形成刑剋。</div>
          )}
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
  const natalHouse4Sign = natalData.houses[3].sign;
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
          <strong className="text-red-800">【流年火星/天王星入4宮觸發條件】</strong>
          <p className="text-xs text-gray-700">
            當流年火星或天王星進入本命第4宮 (<span className="font-bold">{getZodiacName(natalHouse4Sign, modes)}</span>) 時觸發。
          </p>
          {(isTransitMarsInH4 || isTransitUranusInH4) ? (
            <div className="text-red-600 font-bold text-xs mt-1 bg-red-50 p-2 rounded">
              👉 警告：目前流年
              {isTransitMarsInH4 && `火星位於 ${getZodiacName(transitMarsSign, modes)} `}
              {isTransitUranusInH4 && `天王星位於 ${getZodiacName(transitUranusSign, modes)} `}
              正行經本命第4宮，極易引發突發交通意外！
              <br/>
              <span className="text-gray-600 font-normal">
                (火星代表：急性發炎、金屬創傷、流血、衝動駕駛；天王星代表：突如其來的意外、不可預測的災難、神經緊繃)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mt-1">目前流年火星與天王星未進入本命第4宮。</div>
          )}
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
  const natalHouse1Sign = natalData.houses[0].sign;
  const natalHouse8Sign = natalData.houses[7].sign;
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
          <strong className="text-red-800">【流年火星/冥王星入1/8宮觸發條件】</strong>
          <p className="text-xs text-gray-700">
            當流年火星或冥王星進入本命第1宮 (<span className="font-bold">{getZodiacName(natalHouse1Sign, modes)}</span>) 或第8宮 (<span className="font-bold">{getZodiacName(natalHouse8Sign, modes)}</span>) 時觸發。
          </p>
          {(isMarsIn1or8 || isPlutoIn1or8) ? (
            <div className="text-red-600 font-bold text-xs mt-1 bg-red-50 p-2 rounded">
              👉 警告：目前流年
              {isMarsIn1or8 && `火星位於 ${getZodiacName(transitMarsSign, modes)} `}
              {isPlutoIn1or8 && `冥王星位於 ${getZodiacName(transitPlutoSign, modes)} `}
              正行經本命第1或8宮，為意外血光、開刀高危期！
              <br/>
              <span className="text-gray-600 font-normal">
                (火星代表：刀傷、手術、急性出血；冥王星代表：毀滅性創傷、深層手術、生死交關的巨變)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mt-1">目前流年火星與冥王星未進入本命第1或8宮。</div>
          )}
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
  const natalHouse12Sign = natalData.houses[11].sign;
  const isNeptuneIn12 = transitNeptuneSign === natalHouse12Sign;

  warnings.push({
    person: "命主本人",
    event: "住院折磨 / 慢性病 / 精神疾病",
    object: "神經系統 / 睡眠中樞 / 潛意識",
    location: "醫院病房 / 居家臥室 / 隔離場所",
    timing: (
      <div className="space-y-3 mt-2">
        <div>
          <strong className="text-red-800">【流年海王星入12宮觸發條件】</strong>
          <p className="text-xs text-gray-700">
            當流年海王星進入本命第12宮 (<span className="font-bold">{getZodiacName(natalHouse12Sign, modes)}</span>) 時觸發。
          </p>
          {isNeptuneIn12 ? (
            <div className="text-red-600 font-bold text-xs mt-1 bg-red-50 p-2 rounded">
              👉 警告：目前流年海王星位於 {getZodiacName(transitNeptuneSign, modes)}，正行經本命第12宮！
              <br/>
              <span className="text-gray-600 font-normal">
                (海王星代表：精神耗弱、成癮、傳染病、難以診斷的疾病、長期住院或隔離)
              </span>
            </div>
          ) : (
            <div className="text-green-600 text-xs mt-1">目前流年海王星未進入本命第12宮。</div>
          )}
        </div>
        <div>
          <strong className="text-red-800">【本命第12宮/8宮潛在體質】</strong>
          {hasMaleficsInH12 ? (
            <p className="text-xs text-red-600 font-bold">
              👉 警告：本命第12宮受凶星 ({house12Planets.filter(p => malefics.includes(p) || ['Neptune', 'Uranus'].includes(p)).map(p => getPlanetName(p, modes)).join(', ')}) 影響，易有睡眠障礙或潛意識焦慮。
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-red-600">⚠️</span> 醫療與凶厄預警報告
        </h2>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          基於醫療占星法則自動化分析
        </div>
      </div>
      
      <div className="grid gap-4">
        {warnings.map((w, i) => (
          <div key={i} className={`bg-white border ${w.event === '平安' ? 'border-green-200' : 'border-red-200'} p-5 rounded-xl shadow-sm relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${w.event === '平安' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="font-bold text-gray-500 text-sm">影響對象 (人)</span><p className="font-medium text-gray-900">{w.person}</p></div>
              <div><span className="font-bold text-gray-500 text-sm">具體事件 (事)</span><p className={`font-bold ${w.event === '平安' ? 'text-green-600' : 'text-red-600'}`}>{w.event}</p></div>
              <div><span className="font-bold text-gray-500 text-sm">身體/物體 (物)</span><p className="font-medium text-gray-900">{w.object}</p></div>
              <div><span className="font-bold text-gray-500 text-sm">發生場所 (地)</span><p className="font-medium text-gray-900">{w.location}</p></div>
              <div className={`md:col-span-2 ${w.event === '平安' ? 'bg-green-50' : 'bg-red-50'} p-3 rounded-lg mt-2`}>
                <span className={`font-bold ${w.event === '平安' ? 'text-green-800' : 'text-red-800'} text-sm`}>觸發時機 (預告)</span>
                <div className={`${w.event === '平安' ? 'text-green-900' : 'text-red-900'} text-sm mt-1`}>{w.timing}</div>
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
            <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">9 大行星對應部位</h4>
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
    </div>
  );
};

export default MedicalReport;
