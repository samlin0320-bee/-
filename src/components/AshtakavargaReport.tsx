import React, { useState } from 'react';
import { ChartData, getZodiacName, NAKSHATRAS, getPlanetName, getKakshyaIndex, getKakshyaLord, KAKSHYA_LORDS } from '../utils/astrology';

interface Props {
  data: ChartData;
  transitData?: ChartData;
  modes?: string[];
}

const AshtakavargaReport: React.FC<Props> = ({ data, transitData, modes = ['zh'] }) => {
  const [selectedPavPlanet, setSelectedPavPlanet] = useState<string>('Sun');
  
  if (!data.sav || !data.pav) return null;

  const ascSign = data.ascendantSign;
  const satSign = data.planets['Saturn']?.sign;
  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  if (!satSign) return null;

  // Formula A: Ascendant to Saturn
  let sumA = 0;
  let currA = ascSign;
  while (true) {
    sumA += data.sav[currA - 1];
    if (currA === satSign) break;
    currA = (currA % 12) + 1;
  }
  const productA = sumA * 7;
  const ageA = Math.floor(productA / 27);
  const remainderA = productA % 27 || 27;
  const nakshatraA = NAKSHATRAS[remainderA - 1];

  // Formula B: Saturn to Ascendant
  let sumB = 0;
  let currB = satSign;
  while (true) {
    sumB += data.sav[currB - 1];
    if (currB === ascSign) break;
    currB = (currB % 12) + 1;
  }
  const productB = sumB * 7;
  const ageB = Math.floor(productB / 27);
  const remainderB = productB % 27 || 27;
  const nakshatraB = NAKSHATRAS[remainderB - 1];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-indigo-600">📊</span> 星宮八分位 (Ashtakavarga) 系統
        </h2>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          傻瓜/伯特占星法 (Bot Astrology)
        </div>
      </div>
      
      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-indigo-900">
        <p className="mb-4 text-lg"><strong>規則 2-8-02：</strong>印度占星有一套精密到數字的「動態力場」評估系統。</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>八個力量來源（Ashtaka = 8）：</strong>任何一個宮位的強弱，是由「日、月、金、木、水、火、土」七顆實星，加上「命宮（Ascendant）」，共 8 個參考點共同賦予的。</li>
          <li><strong>動態的能量貢獻：</strong>這 8 個參考點會根據自己所在的位置，對特定的宮位投射「吉利的點數（Bindu）」。這就像是一個動態的力場，各星匯聚而成的點數總和，決定了該宮位的強弱。</li>
          <li><strong>傻瓜/伯特占星法：</strong>如果初學者覺得各種相位、吉凶星交感太複雜，可以直接看 Ashtakavarga 的「總分數」。分數越高的宮位，該領域就越順利、力量越強。這背後雖然蘊藏複雜的運算，但結果一目瞭然。</li>
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-600 rounded-full"></div> 12宮位動態力場總分數 (SAV)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.sav.map((score, index) => {
            const houseNum = ((index - data.ascendantSign + 1 + 12) % 12) || 12;
            const signName = getZodiacName(index + 1, modes);
            
            // Determine strength color
            let colorClass = "bg-gray-50 border-gray-200 text-gray-700";
            let strengthLabel = "平平";
            if (score >= 30) {
              colorClass = "bg-green-50 border-green-200 text-green-800";
              strengthLabel = "極強 (順利)";
            } else if (score >= 25) {
              colorClass = "bg-blue-50 border-blue-200 text-blue-800";
              strengthLabel = "強 (佳)";
            } else if (score < 20) {
              colorClass = "bg-red-50 border-red-200 text-red-800";
              strengthLabel = "弱 (需注意)";
            }

            return (
              <div key={index} className={`p-4 rounded-xl border ${colorClass} flex flex-col items-center justify-center relative overflow-hidden`}>
                <div className="absolute top-2 left-2 text-xs font-bold opacity-50">第 {houseNum} 宮</div>
                <div className="absolute top-2 right-2 text-xs opacity-50">{signName}</div>
                <div className="text-4xl font-black my-2">{score}</div>
                <div className="text-sm font-bold">{strengthLabel}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAV Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-600 rounded-full"></div> 星宮八分點數明細表 (PAV)
        </h3>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {planets.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPavPlanet(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
                selectedPavPlanet === p 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getPlanetName(p, modes)}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-2 text-left">參考星 \ 星座</th>
                {Array.from({ length: 12 }).map((_, i) => (
                  <th key={i} className="border border-gray-200 p-2 text-center min-w-[40px]">
                    {getZodiacName(i + 1, modes)}
                  </th>
                ))}
                <th className="border border-gray-200 p-2 text-center bg-indigo-50 font-bold">總計</th>
              </tr>
            </thead>
            <tbody>
              {[...planets, 'Ascendant'].map(refP => (
                <tr key={refP}>
                  <td className="border border-gray-200 p-2 font-bold bg-gray-50">
                    {getPlanetName(refP, modes)}
                  </td>
                  {data.pav[selectedPavPlanet][refP].map((val, i) => (
                    <td key={i} className={`border border-gray-200 p-2 text-center ${val === 1 ? 'bg-indigo-50 font-bold text-indigo-600' : 'text-gray-300'}`}>
                      {val}
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 text-center bg-indigo-50 font-bold">
                    {data.pav[selectedPavPlanet][refP].reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-indigo-50 font-bold">
                <td className="border border-gray-200 p-2">總計 (Bindu)</td>
                {Array.from({ length: 12 }).map((_, i) => {
                  const total = [...planets, 'Ascendant'].reduce((sum, refP) => sum + data.pav[selectedPavPlanet][refP][i], 0);
                  return (
                    <td key={i} className="border border-gray-200 p-2 text-center">
                      {total}
                    </td>
                  );
                })}
                <td className="border border-gray-200 p-2 text-center">
                  {[...planets, 'Ascendant'].reduce((sum, refP) => sum + data.pav[selectedPavPlanet][refP].reduce((a, b) => a + b, 0), 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Kakshya Transit Section */}
      {transitData && (
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">✨</span> Kakshya (星曜界) 流年精確判定
          </h3>
          <p className="text-purple-800 mb-6 text-sm">
            將每個星座 30 度精確切分為 8 個等分 (3.75°)，每個等分由特定的行星守護。當流年行星進入有給分 (Bindu) 的 Kakshya 時，該時段為吉。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planets.map(p => {
              const tp = transitData.planets[p];
              if (!tp) return null;
              const kIndex = getKakshyaIndex(tp.degreeInSign);
              const kLord = getKakshyaLord(kIndex);
              const hasBindu = data.pav[p][kLord][tp.sign - 1] === 1;

              return (
                <div key={p} className={`p-4 rounded-lg border flex items-center justify-between ${hasBindu ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${hasBindu ? 'bg-green-500' : 'bg-gray-400'}`}>
                      {getPlanetName(p, modes).substring(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{getPlanetName(p, modes)}</div>
                      <div className="text-xs text-gray-500">
                        位於 {getZodiacName(tp.sign, modes)} {tp.degreeInSign.toFixed(2)}°
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">當前 Kakshya 守護星</div>
                    <div className="font-bold text-indigo-600">{getPlanetName(kLord, modes)}</div>
                    <div className={`text-xs font-bold mt-1 ${hasBindu ? 'text-green-600' : 'text-red-500'}`}>
                      {hasBindu ? '✅ 有給分 (吉)' : '❌ 無給分 (平)'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-red-50 p-6 rounded-xl border border-red-100">
        <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
          <span className="text-red-600">⚠️</span> 土星引發的危險流年與凶險星宿預測
        </h3>
        <p className="text-red-800 mb-6">
          在星宮八分位（Ashtakavarga）系統中，預測由土星引發的危險流年與凶險星宿，主要有兩個具體的計算公式，操作方式如下：
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formula A */}
          <div className="bg-white p-5 rounded-lg border border-red-200 shadow-sm">
            <h4 className="text-lg font-bold text-red-800 mb-3 border-b border-red-100 pb-2">
              【公式 A：從命宮算到土星】
            </h4>
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>加總點數：</strong>從命宮開始，順著宮位將星宮八分位的總點數（SAV）一路加到「土星」所在的宮位。</p>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs">
                命宮({getZodiacName(ascSign, modes)}) 到 土星({getZodiacName(satSign, modes)})<br/>
                區間點數加總 = <span className="text-red-600 font-bold text-sm">{sumA}</span>
              </div>
              
              <p><strong>套用公式：</strong>將總數乘上 7，再除以 27 星宿的 27。</p>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs">
                {sumA} × 7 ÷ 27 = {productA} ÷ 27<br/>
                商數 = <span className="text-red-600 font-bold text-sm">{ageA}</span><br/>
                餘數 = <span className="text-red-600 font-bold text-sm">{remainderA}</span>
              </div>

              <p><strong>解讀商數與餘數：</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>商數代表歲數：</strong>算出的商數為 {ageA}，這代表命主在 <strong>{ageA} 歲</strong> 時要特別注意是否有大難或死劫。</li>
                <li><strong>餘數代表星宿：</strong>餘數為 {remainderA}，代表從第一個星宿（Ashwini）起算的第 {remainderA} 個星宿（<strong>{nakshatraA}</strong>）。當流年土星行經這個星宿時，就會對命盤產生極凶的影響。</li>
              </ul>
            </div>
          </div>

          {/* Formula B */}
          <div className="bg-white p-5 rounded-lg border border-red-200 shadow-sm">
            <h4 className="text-lg font-bold text-red-800 mb-3 border-b border-red-100 pb-2">
              【公式 B：從土星算到命宮】
            </h4>
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>加總點數：</strong>反過來，從「土星」所在的宮位開始計算，順著宮位一路將點數加回「命宮」。</p>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs">
                土星({getZodiacName(satSign, modes)}) 到 命宮({getZodiacName(ascSign, modes)})<br/>
                區間點數加總 = <span className="text-red-600 font-bold text-sm">{sumB}</span>
              </div>
              
              <p><strong>套用公式：</strong>同樣將總數乘上 7，再除以 27。</p>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs">
                {sumB} × 7 ÷ 27 = {productB} ÷ 27<br/>
                商數 = <span className="text-red-600 font-bold text-sm">{ageB}</span><br/>
                餘數 = <span className="text-red-600 font-bold text-sm">{remainderB}</span>
              </div>

              <p><strong>解讀商數與餘數：</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>商數代表歲數：</strong>算出的商數為 {ageB}，代表命主在 <strong>{ageB} 歲</strong> 時會有災厄發生。</li>
                <li><strong>餘數代表星宿：</strong>餘數為 {remainderB}，代表第 {remainderB} 個星宿（<strong>{nakshatraB}</strong>）。當流年的土星過運到這個星宿時，也會引發不好的事件。</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center text-red-700 font-bold bg-white/50 py-3 rounded-lg border border-red-200">
          只要透過這樣簡單的四則運算找出對應的歲數與星宿，就能提前預知並防範土星過運所帶來的壓力與危機。
        </div>
      </div>
    </div>
  );
};

export default AshtakavargaReport;
