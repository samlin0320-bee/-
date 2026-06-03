# 系統核心協作規則 (Agent Rules)

## 一、程式碼基底修改規則
1. **絕不刪減既有功能**：不要隨意修改或刪除原有的程式碼與排版架構。
2. **只允許新增**：當使用者要求加入新功能、新數據顯示或新 Tab 時，只能以「並列疊加 (Append)」的方式新增，不可以將舊有版面覆蓋或刪減。
3. **保留舊有數據**：等到使用者明確下達「可以刪除」的指令時，才能將舊版面移除。

---

## 二、恆星黃道 (Sidereal Zodiac) 數據資料庫介接格式
為了讓系統能最高效率地讀取由其他 AI 生成的「恆星黃道」數據文本，請其他 AI 助理務必將算出的占星分析結果、推運預測等字串，輸出成以下標準的 **JSON 格式**。系統會直接把這些 JSON 資料納入 TypeScript 渲染，確保精確無誤且無須再次人工解析。

### A. 占星術語與行星字串 (用語定義表 / 靜態資料庫)
```json
{
  "entity": "planet | nakshatra | yoga | dasha",
  "identifier": "Ju", // 代表木星 Jupiter, 或填寫星宿名稱
  "name_zh": "木星",
  "name_en": "Jupiter",
  "category": "benefic", // 吉凶屬性
  "description": "這是一段針對該星體的占星含義描述...",
  "attributes": {
    "dignity": "Exalted", 
    "element": "Fire"
  }
}
```

### B. 推運報告 (Transit Reports) / 流年動態資料庫
```json
{
  "transitDate": "2026-04-18",
  "analysisType": "Gochar", // 或 "Dashas"
  "targetBeneficiary": "Moon_Lagna",
  "planetaryEvents": [
    {
      "planet": "Jupiter",
      "position": {
        "sign": "Aries",
        "house_from_moon": 11,
        "degree": 15.34
      },
      "aspects_natal_planets": ["Sun", "Mercury"],
      "rule_matched": "Jupiter transiting 11th house from Natal Moon",
      "rule_explanation": "在此運位時，木星進入第11宮，主司利潤、社群與人際開拓...",
      "priority": 1, // 排序依據，全顯示不刪減
      "forecast": "社交活動將大幅度增加，且可能獲得有力人士金援或提攜。"
    }
  ]
}
```

### C. 特殊占星格局 (Yogas) 或 D-11 (Rudramsa) 等分盤資料庫
```json
{
  "chartDefinition": "D-11",
  "name": "Rudramsa",
  "calculationRule": "Each sign divided into 11 parts...",
  "planetaryPositions": [
    {
      "planet": "Mars",
      "sign": "Scorpio",
      "description": "火星落入天蠍於D-11，暗示強大的內在動能與勝利潛質..."
    }
  ]
}
```

### 給其他 AI 的提示（Prompt to other AIs）：
「請將占星規則化作上述結構化的 JSON 陣列。**所有的預測文本必須完整保留，不可隨便刪減長度**，並且附上其判定規則 (`rule_explanation`) 作為參考，確保 Gemini 系統能夠直接載入這些 JSON 並動態顯示於 React UI 的畫面上。」

---

## 三、星盤解讀規則呈現要求
1. **強制呈現與解釋 (Mandatory Rule Display)**：每一個星盤都必須呈現所觸發的占星規則（例如：宮主星落宮、貴格等），並且**必須將它的解釋完整講出來**（Rule Explanation），不可省略或隱藏在背景中。
2. **宮主星落宮資料庫 (House Lord Placements)**：新增對各宮主星飛入特定宮位的解讀。必須在 UI 上清楚顯示「宮主星 (X宮主) 飛入 Y宮」，並列出對應的含義。

