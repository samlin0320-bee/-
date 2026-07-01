import React, { useMemo } from 'react';
import { ChartData, getPlanetName, getZodiacName, PlanetPosition } from '../utils/astrology';
import { Sparkles, ArrowLeftRight, Eye, ShieldAlert, Zap } from 'lucide-react';

interface Props {
  vargaId: string;
  vargaName: string;
  vargaData: ChartData;
  d1Data: ChartData;
  modes?: string[];
}

const SIGN_LORDS = ['', 'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

export const VargaExplanationPanel: React.FC<Props> = ({
  vargaId,
  vargaName,
  vargaData,
  d1Data,
  modes = ['zh']
}) => {
  const analysis = useMemo(() => {
    const planets = vargaData.planets;
    const d1Planets = d1Data.planets;

    // 1. Parivartana (互容)
    const parivartanas: string[] = [];
    const processedPairs = new Set<string>();

    Object.entries(planets as Record<string, PlanetPosition>).forEach(([p1Name, p1]) => {
      const s1 = p1.sign;
      const lord1 = SIGN_LORDS[s1];
      if (lord1 && lord1 !== p1Name && planets[lord1]) {
        const p2 = planets[lord1] as PlanetPosition;
        const s2 = p2.sign;
        const lord2 = SIGN_LORDS[s2];
        if (lord2 === p1Name) {
          const pairKey = [p1Name, lord1].sort().join('-');
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            parivartanas.push(
              `${getPlanetName(p1Name, modes)} 落入 ${getZodiacName(s1, modes)}（由 ${getPlanetName(lord1, modes)} 守護） ↔️ ${getPlanetName(lord1, modes)} 落入 ${getZodiacName(s2, modes)}（由 ${getPlanetName(p1Name, modes)} 守護）`
            );
          }
        }
      }
    });

    // 2. Aspects (Drishti 映射)
    const aspects: string[] = [];
    const getAspectsForPlanet = (name: string, sign: number): number[] => {
      const targets = [((sign + 6 - 1) % 12) + 1]; // All planets aspect 7th
      if (name === 'Mars') targets.push(((sign + 3 - 1) % 12) + 1, ((sign + 7 - 1) % 12) + 1); // 4th, 8th
      if (name === 'Jupiter' || name === 'Rahu' || name === 'Ketu') targets.push(((sign + 4 - 1) % 12) + 1, ((sign + 8 - 1) % 12) + 1); // 5th, 9th
      if (name === 'Saturn') targets.push(((sign + 2 - 1) % 12) + 1, ((sign + 9 - 1) % 12) + 1); // 3rd, 10th
      return targets;
    };

    Object.entries(planets as Record<string, PlanetPosition>).forEach(([pName, p]) => {
      const aspectedSigns = getAspectsForPlanet(pName, p.sign);
      const aspectedPlanets: string[] = [];

      Object.entries(planets as Record<string, PlanetPosition>).forEach(([otherName, otherP]) => {
        if (otherName !== pName && aspectedSigns.includes(otherP.sign)) {
          aspectedPlanets.push(getPlanetName(otherName, modes));
        }
      });

      if (aspectedSigns.includes(vargaData.ascendantSign)) {
        aspectedPlanets.push('命宮 (ASC)');
      }

      if (aspectedPlanets.length > 0) {
        aspects.push(
          `【${getPlanetName(pName, modes)}】投射相位至：${aspectedPlanets.join('、')}`
        );
      }
    });

    // 3. Sambandha (交感/聯結)
    const sambandhas: string[] = [];
    const sambandhaProcessed = new Set<string>();

    Object.entries(planets as Record<string, PlanetPosition>).forEach(([p1Name, p1]) => {
      Object.entries(planets as Record<string, PlanetPosition>).forEach(([p2Name, p2]) => {
        if (p1Name === p2Name) return;
        const pairKey = [p1Name, p2Name].sort().join('-');
        if (sambandhaProcessed.has(pairKey)) return;

        let isSambandha = false;
        let reason = '';

        // Same sign (Conjunction)
        if (p1.sign === p2.sign) {
          isSambandha = true;
          reason = `同宮合相於 ${getZodiacName(p1.sign, modes)}`;
        } else {
          // Mutual aspects
          const p1Aspects = getAspectedSigns(p1.name || p1Name, p1.sign);
          const p2Aspects = getAspectedSigns(p2.name || p2Name, p2.sign);

          const p1AspectsP2 = p1Aspects.includes(p2.sign);
          const p2AspectsP1 = p2Aspects.includes(p1.sign);

          if (p1AspectsP2 && p2AspectsP1) {
            isSambandha = true;
            reason = '相互映射投射（互照）';
          }
        }

        if (isSambandha) {
          sambandhaProcessed.add(pairKey);
          sambandhas.push(
            `【${getPlanetName(p1Name, modes)} - ${getPlanetName(p2Name, modes)}】 ${reason}`
          );
        }
      });
    });

    function getAspectedSigns(name: string, sign: number): number[] {
      const targets = [((sign + 6 - 1) % 12) + 1];
      if (name === 'Mars') targets.push(((sign + 3 - 1) % 12) + 1, ((sign + 7 - 1) % 12) + 1);
      if (name === 'Jupiter' || name === 'Rahu' || name === 'Ketu') targets.push(((sign + 4 - 1) % 12) + 1, ((sign + 8 - 1) % 12) + 1);
      if (name === 'Saturn') targets.push(((sign + 2 - 1) % 12) + 1, ((sign + 9 - 1) % 12) + 1);
      return targets;
    }

    // 4. Relation to D1 Rashi Chart (與D1盤關係)
    const d1Relations: string[] = [];
    Object.entries(planets as Record<string, PlanetPosition>).forEach(([pName, p]) => {
      const d1P = d1Planets[pName] as PlanetPosition | undefined;
      if (d1P) {
        if (p.sign === d1P.sign) {
          d1Relations.push(`🌟 **${getPlanetName(pName, modes)}** 處於 **Vargottama (分盤同宮)** 狀態！在 D1 和 ${vargaId} 均落在 ${getZodiacName(p.sign, modes)}，這極大增強了該星體的穩定度與正向福報。`);
        }
        
        // Exaltation / Debilitation difference
        if (p1Name_is_Exalted_in_D1_and_Debilitated_in_Varga(pName, d1P, p)) {
          d1Relations.push(
            `⚠️ **${getPlanetName(pName, modes)}** 在 D1 旺相但在此分盤【落陷】，暗示「先甜後苦」或表面風光、實質脆弱的隱藏功課。`
          );
        } else if (p1Name_is_Debilitated_in_D1_and_Exalted_in_Varga(pName, d1P, p)) {
          d1Relations.push(
            `🔥 **${getPlanetName(pName, modes)}** 在 D1 落陷但在分盤【旺相】，代表「先苦後甜」的 Neecha Bhanga 格局，經歷磨練後將展現強大爆發力！`
          );
        }
      }
    });

    return { parivartanas, aspects, sambandhas, d1Relations };
  }, [vargaData, d1Data, vargaId, modes]);

  function p1Name_is_Exalted_in_D1_and_Debilitated_in_Varga(name: string, d1P: any, vP: any): boolean {
    return d1P.dignity === 'Exalted' && vP.sign === getDebilitatedSign(name);
  }

  function p1Name_is_Debilitated_in_D1_and_Exalted_in_Varga(name: string, d1P: any, vP: any): boolean {
    return d1P.dignity === 'Debilitated' && vP.sign === getExaltedSign(name);
  }

  function getExaltedSign(name: string): number {
    const exalt: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7, Rahu: 3, Ketu: 9 };
    return exalt[name] || 0;
  }

  function getDebilitatedSign(name: string): number {
    const debil: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1, Rahu: 9, Ketu: 3 };
    return debil[name] || 0;
  }

  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          <h4 className="font-extrabold text-slate-800 text-base">
            {vargaId} {vargaName} 關係交感星盤解讀
          </h4>
        </div>

        {/* 1. Parivartana */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>1. 互容格局 (Parivartana)</span>
          </div>
          {analysis.parivartanas.length > 0 ? (
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              {analysis.parivartanas.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">當前分盤未偵測到明顯的互容（交換星座）格局。</p>
          )}
        </div>

        {/* 2. Aspects */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit">
            <Eye className="w-3.5 h-3.5" />
            <span>2. 映射光芒 (Aspects / Drishti)</span>
          </div>
          {analysis.aspects.length > 0 ? (
            <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              {analysis.aspects.map((item, i) => (
                <p key={i} className="text-xs text-slate-600 leading-relaxed bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                  {item}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">當前分盤星體能量映射極為純淨，無強烈干擾。</p>
          )}
        </div>

        {/* 3. Sambandha */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit">
            <Zap className="w-3.5 h-3.5" />
            <span>3. 交感共振 (Sambandha)</span>
          </div>
          {analysis.sambandhas.length > 0 ? (
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              {analysis.sambandhas.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">當前分盤星體主要各自獨立運作。</p>
          )}
        </div>

        {/* 4. D1 Relations */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded w-fit">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>4. 與 D1 本命盤的內外關係</span>
          </div>
          {analysis.d1Relations.length > 0 ? (
            <div className="space-y-1.5">
              {analysis.d1Relations.map((item, i) => (
                <p key={i} className="text-xs text-slate-600 leading-relaxed bg-rose-50/30 p-2 rounded border border-rose-100">
                  {item}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">星盤在此分盤的落點與 D1 本命具有穩健的和諧呼應（無反差反轉）。</p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-400">
        💡 <strong className="text-slate-500">占星觀點：</strong>分盤是本命盤細分出的隱藏能量。如果星體在分盤有互容或與 D1 的格局呼應（如 Vargottama 或 Neecha Bhanga），其在相關人生領域的真實力量將更為厚重。
      </div>
    </div>
  );
};
