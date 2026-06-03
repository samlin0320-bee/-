export interface AstrologyRule {
  ruleName: string;
  system: string;
  category: string;
  conditions: {
    description: string;
  };
  interpretation: string;
}

export const ASTROLOGY_RULES: AstrologyRule[] = [
  {
    "ruleName": "大象獅子瑜伽 (Gaja Kesari Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：木星與月亮。要求宮位：木星位於月亮起算的四正宮（第1, 4, 7, 10宮）。"
    },
    "interpretation": "象徵智慧、名望、財富與領導力。命主如獅子般能克服一切障礙，享有高尚理念與長壽。"
  },
  {
    "ruleName": "火星得地格 / 五大貴格 (Ruchaka Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：火星。要求宮位：位於本命盤的四正宮（1, 4, 7, 10）。要求的星座狀態：火星必須在牡羊座、天蠍座（本垣 Own Sign）或摩羯座（廟旺 Exalted）。"
    },
    "interpretation": "賦予命主極大的勇氣、體力與領導力，可能從事軍警、體育或統帥行業。"
  },
  {
    "ruleName": "水星得地格 / 五大貴格 (Bhadra Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：水星。要求宮位：位於本命盤的四正宮（1, 4, 7, 10）。要求的星座狀態：水星必須在雙子座、處女座（本垣 Own Sign 或 廟旺 Exalted）。"
    },
    "interpretation": "命主聰明、心地善良、博學多聞，具備獨立思想，可能成為優秀的演講者或富有的人。"
  },
  {
    "ruleName": "木星得地格 / 五大貴格 (Hamsa Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：木星。要求宮位：位於本命盤的四正宮（1, 4, 7, 10）。要求的星座狀態：木星必須在射手座、雙魚座（本垣 Own Sign）或巨蟹座（廟旺 Exalted）。"
    },
    "interpretation": "受到智者讚美，擁有良好的體格與正直、神聖的性情。"
  },
  {
    "ruleName": "金星得地格 / 五大貴格 (Malavya Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：金星。要求宮位：位於本命盤的四正宮（1, 4, 7, 10）。要求的星座狀態：金星必須在金牛座、天秤座（本垣 Own Sign）或雙魚座（廟旺 Exalted）。"
    },
    "interpretation": "對美感與藝術有極高要求，能享受美食、名車與奢華的物質生活，擁有吸引人的外貌。"
  },
  {
    "ruleName": "土星得地格 / 五大貴格 (Sasa Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：土星。要求宮位：位於本命盤的四正宮（1, 4, 7, 10）。要求的星座狀態：土星必須在摩羯座、水瓶座（本垣 Own Sign）或天秤座（廟旺 Exalted）。"
    },
    "interpretation": "受眾人讚美，擁有忠誠追隨者，身強體壯，具備成為領袖或村長的潛質。"
  },
  {
    "ruleName": "右臂格 (Vesi Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：太陽與吉星（木、金、水，排除月亮、羅睺、計都）。要求宮位：從太陽所在宮位起算的第2宮（右側）有吉星落入。"
    },
    "interpretation": "命主生性令人愉快，勇敢且能建立功勳，具有如領導者般的地位。"
  },
  {
    "ruleName": "左輔格 (Vasi Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：太陽與吉星（木、金、水，排除月亮）。要求宮位：從太陽所在宮位起算的第12宮（左側）有吉星落入。"
    },
    "interpretation": "命主待人寬厚，廣受歡迎，能獲得極大的名氣與財富。"
  },
  {
    "ruleName": "輔弼雙重格 / 左右夾格 (Ubhayachari Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：太陽與吉星（排除月亮）。要求宮位：太陽的第2宮與第12宮同時有吉星落入（夾太陽）。"
    },
    "interpretation": "命主出眾，辯才無礙，演講具有極強的號召力，帶來巨大的財富與名氣。"
  },
  {
    "ruleName": "水日充會格 / 聰慧格 (Budha Aditya Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：水星與太陽。相位關係：水星與太陽同宮（合相）。其他條件：水星不能被太陽嚴重灼傷（Combustion），需保持一定度數距離（如相差11度以上）。"
    },
    "interpretation": "賦予命主極高的聰明才智與外貌；若受嚴重灼傷，則在權威人士面前容易害怕表達意見。"
  },
  {
    "ruleName": "吉祥天女格 (Lakshmi Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：第9宮主星、命主星（Lagna Lord）或金星。要求宮位與狀態：第9宮主星位於四正宮（1,4,7,10）或三方宮（1,5,9），且處於本垣、根垣或廟旺狀態，同時命主星強勢。"
    },
    "interpretation": "強大的財格與貴格，命主充滿魅力、聲名遠播，享有國王般地位與鼎盛財富。"
  },
  {
    "ruleName": "王者瑜伽 / 正宗貴格 (Raja Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：四正宮（1,4,7,10宮）的主星與三方宮（1,5,9宮）的主星。相位關係：這兩組宮主星產生合相（同宮）、互換宮位（Exchange）或互相映射（Mutual Aspect）。"
    },
    "interpretation": "帶來巨大的權力、晉升、社會地位與事業成功。"
  },
  {
    "ruleName": "財富瑜伽 (Dhana Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：財富宮（第2、11宮）的主星與吉宮（第1、5、9宮）的主星。相位關係：彼此產生合相、互相映射 or 互換宮位。"
    },
    "interpretation": "帶來顯著的財富積累、高收入與財務上的巨大成功。"
  },
  {
    "ruleName": "逆轉類瑜伽 (Viparita Raja Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：凶宮/難宮主星（第6、8、12宮的主星）。要求宮位：這些凶宮的主星落入其他的凶宮中（例如第8宮主星落入第12宮，或第12宮主星落入第12宮構成 Vimala Yoga）。"
    },
    "interpretation": "命主在經歷逆境、損失與突如其來的變故後，反敗為勝，獲得意想不到的巨大成功與地位提升。"
  },
  {
    "ruleName": "落陷解救格 (Neechabhanga Raja Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：處於落陷狀態（Debilitated）的行星及其定位星（Dispositor）。條件（滿足其一）：1. 定位星入命宮或月亮起算的四正宮；2. 定位星映射該落陷星；3. 兩顆落陷星互照或互換宮位；4. 定位星處於廟旺狀態。"
    },
    "interpretation": "取消行星落陷的負面影響，轉化為強大貴格；通常早年辛苦挫折，隨後大放異彩。"
  },
  {
    "ruleName": "黑蛇 / 甘露瑜伽 (Kala Sarpa / Kala Amrita Yoga)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：所有實星與羅睺(Rahu)、計都(Ketu)。要求狀態：命盤中所有的七顆行星（日、月、火、水、木、金、土）全部被夾在羅睺與計都軸線的同一側。"
    },
    "interpretation": "常帶來命運的戲劇性起伏與特殊的生命課題，人生容易經歷大起大落。"
  },
  {
    "ruleName": "瑜伽之星法則 (Yogakaraka)",
    "system": "Parashara",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：單一星曜。要求條件：當一顆行星同時主宰一個四正宮（1, 4, 7, 10宮）和一個三方宮（1, 5, 9宮）時（例如金牛上升的土星掌管9宮和10宮）。"
    },
    "interpretation": "該星曜會成為極其強大的吉星（即使其自然屬性為凶星），單獨即可成格，帶來極佳運勢與事業成功。"
  },
  {
    "ruleName": "分盤同座加持 (Vargottama)",
    "system": "Parashara",
    "category": "Divisional Chart",
    "conditions": {
      "description": "涉及行星：任意行星或上升點。要求狀態：行星在主盤 D-1 (Rasi) 和九分盤 D-9 (Navamsa) 中落入完全相同的星座。"
    },
    "interpretation": "極大地增強該行星的力量（即使在D-1中落陷，若同座也能得救），使其能夠極為穩定地給出其所象徵的結果與福報。"
  },
  {
    "ruleName": "殊象盤例外規則 (Arudha Pada Exception)",
    "system": "Parashara",
    "category": "Arudha",
    "conditions": {
      "description": "涉及宮位：任意宮位的 Arudha Pada（如 AL）。要求條件：若按照常規等距計算出的 Arudha Pada 落回了其原始宮位的第一宮（即本身）或第七宮，則必須取該位置之後的「第十宮」作為最終的 Arudha Pada。"
    },
    "interpretation": "校正形象與世俗體現。忽略此規則將導致對命主在世俗眼中的「形象（Maya）」解讀完全失準。"
  },
  {
    "ruleName": "入相位瑜伽 (Ithasala Yoga)",
    "system": "Tajaka",
    "category": "Yoga",
    "conditions": {
      "description": "使用系統：年盤 (Tajaka Chart)。涉及行星：年盤中的兩顆行星（如年主星與特定宮主星）。相位關係：兩顆行星正在靠近並形成準確的交感相位。"
    },
    "interpretation": "預示著在該年盤所涵蓋的年度內，相關事件將會成功實現與完成（若正在分離則預示失敗或已成過去）。"
  },
  {
    "ruleName": "流土掩月 (Sade-Sati)",
    "system": "Parashara",
    "category": "Transit",
    "conditions": {
      "description": "涉及行星：流年土星（Transit Saturn）與本命月亮。要求宮位：流年土星運行至本命月亮所在星座的第12宮、第1宮或第2宮。"
    },
    "interpretation": "為期約7.5年的壓力期，常伴隨業力考驗、破財、降職、生重病、失去親人與嚴重情緒憂鬱。"
  },
  {
    "ruleName": "木土雙重引動 (Double Transit)",
    "system": "Parashara",
    "category": "Transit",
    "conditions": {
      "description": "涉及行星：流年木星（Transit Jupiter）與流年土星（Transit Saturn）。映射關係：兩星同時「同宮」或「映射交感」本命盤中的同一個宮位，或該宮位的宮主星。"
    },
    "interpretation": "觸發重大事件的精確時機點（扳機）。若引動10宮主事業，引動5宮主生育，若引動6/8/12宮或殺手星，則引發重大疾病、手術或災厄。"
  },
  {
    "ruleName": "分區軌道引動 (Kakshya Transit)",
    "system": "Parashara",
    "category": "Transit",
    "conditions": {
      "description": "使用系統：單一行星八分位展開表（PAV）。要求狀態：流年行星進入某個星座特定的 3度45分 區間（Kakshya），且該區間的掌管星在 PAV 中有為該流年星貢獻吉點（Bindu）。"
    },
    "interpretation": "用於極精確的流日/流月預測。在經過該 3.75 度的短暫時間內，精準觸發吉利事件（若有給點）或挫折（若無給點）。"
  },
  {
    "ruleName": "八分位死劫預測公式A (Ashtakavarga Saturn Danger Formula A)",
    "system": "Parashara",
    "category": "Ashtakavarga",
    "conditions": {
      "description": "使用八分位總點數（SAV）。算法：從命宮開始順數，將 SAV 總點數一路加到「本命土星」所在的宮位。將總和乘以7，再除以27。商數 = 歲數；餘數 = 從 Ashwini 起算的第N個星宿（Nakshatra）。"
    },
    "interpretation": "預測命主極易發生死劫或巨大災難的精確歲數，當流年土星行經計算出的餘數星宿時，將引發極凶事件。"
  },
  {
    "ruleName": "八分位災厄預測公式B (Ashtakavarga Saturn Danger Formula B)",
    "system": "Parashara",
    "category": "Ashtakavarga",
    "conditions": {
      "description": "使用八分位總點數（SAV）。算法：從「本命土星」所在宮位開始順數，將 SAV 總點數一路加回「命宮」。將總和乘以7，再除以27。商數 = 歲數；餘數 = 星宿（Nakshatra）。"
    },
    "interpretation": "預測生命中發生災厄、阻礙或重大壓力的特定歲數，流年土星過運該星宿時將應驗。"
  },
  {
    "ruleName": "三十分盤潛意識與疾病根源 (D-30 Trimsamsa Mental/Disease Rule)",
    "system": "Parashara",
    "category": "Medical",
    "conditions": {
      "description": "使用三十分盤（D-30）。涉及行星：月亮（代表心智）、本命盤命主星、羅睺/計都。要求狀態：月亮落在 D-30 的火星/水星星座，或月亮/木星在 D-30 受羅睺、計都、土星嚴重刑剋（絕對禁用 Arudha Padas 分析）。"
    },
    "interpretation": "揭示深層疾病根源、心理創傷或精神疾病（如產後憂鬱症）。若本命主星在 D-30 受剋，代表潛意識有負面干擾，易遭受災難懲罰。"
  },
  {
    "ruleName": "十一分盤毀滅宮法則 (D-11 Rudramsa Hara Sthana Rule)",
    "system": "Parashara",
    "category": "Longevity",
    "conditions": {
      "description": "使用十一分盤（D-11）。涉及宮位：D-11的第11宮（即第6宮的第6宮，Hara Sthana 毀滅宮）或第8宮。要求狀態：多顆凶星、殺手星或 A8（死亡點）聚集在 D-11 的第11宮；或行運 D-11 凶星死剋本命盤（Rasi）太陽/命宮。"
    },
    "interpretation": "用於評估死亡、毀滅及致命弱點。凶星雲集預示著致命事故、空難、大規模死亡（如洪水），或個人的毀滅性成癮。"
  },
  {
    "ruleName": "賈米尼交感法則 (Jaimini Aspects)",
    "system": "Jaimini",
    "category": "Core Rule",
    "conditions": {
      "description": "星座之間的交感邏輯。規則：1. 變動宮（1,4,7,10）與固定宮（2,5,8,11）互相交感，但必須排除彼此緊鄰（隔壁）的星座。2. 雙性宮（3,6,9,12）彼此互相交感。"
    },
    "interpretation": "這是賈米尼系統的基礎，只要宮位之間互相交感，落在這些宮位裡面的星曜也會隨之產生交感互動與影響。"
  },
  {
    "ruleName": "轉角大運雙宮主法則 (Chara Dasha Dual Lord Exception)",
    "system": "Jaimini",
    "category": "Dasha",
    "conditions": {
      "description": "計算天蠍座與水瓶座的轉角大運年數。涉及行星：天蠍座（火星、計都）；水瓶座（土星、羅睺）。判斷條件：比較兩顆宮主星「身旁相伴（同宮）的星曜數量」，相伴多者勝出作為計算終點；若數量平手，則「度數較高」的星勝出。"
    },
    "interpretation": "決定天蠍座與水瓶座在轉角大運中所運行的精確年數。"
  },
  {
    "ruleName": "賈米尼王之瑜伽 (Jaimini Raja Yoga)",
    "system": "Jaimini",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：七種真相星中的 AK、AMK、PK、DK，以及第5宮主星。相位關係：上述行星之間發生同宮，或透過賈米尼星座交感法則（Jaimini Aspects）互相映射。"
    },
    "interpretation": "代表強大權力與事業成功。當轉角大運（Chara Dasha）走到受此格局交感的星座，或其第10、11宮受交感時，將大發事業與權威。"
  },
  {
    "ruleName": "賈米尼太陰金星貴格 (Jaimini Moon-Venus Yoga)",
    "system": "Jaimini",
    "category": "Yoga",
    "conditions": {
      "description": "涉及行星：月亮與金星。相位關係：兩者同宮，或透過賈米尼系統的星座交感法則互相映射。"
    },
    "interpretation": "在賈米尼系統中自成一組強大的貴格（Raja Yoga），能為命主帶來繁榮、地位與極高的世俗成就。"
  },
  {
    "ruleName": "賈米尼特考上榜法則 (Jaimini Chara Dasha Exam Success)",
    "system": "Jaimini",
    "category": "Dasha",
    "conditions": {
      "description": "使用轉角大運（Chara Dasha）。涉及指標：代表考試競爭的 PK（Putra Karaka）星. 要求宮位：目前大運或亞運星座起算的「第 5 宮」受到 PK 星的賈米尼相位交感（映照）。"
    },
    "interpretation": "精準預測命主能在激烈的考試或競爭中脫穎而出，順利考取功名。"
  },
  {
    "ruleName": "婚姻時機引動法則 (Marriage Timing Rule)",
    "system": "Parashara / Jaimini",
    "category": "Predictive",
    "conditions": {
      "description": "綜合判斷條件：1. Vimsottari 大運或 Navamsa Narayana Dasa 主星與第7宮、7宮主、UL(Upapada) 或金星/木星（徵象星）產生關聯。2. 年盤 (Tajaka Chart) 中的婚姻點 (Vivaha Sahama) 被強烈觸發。"
    },
    "interpretation": "精確鎖定個人結婚、訂立婚姻承諾的年份與時機點。"
  },
  {
    "ruleName": "事業高峰引動法則 (Career Peak Rule)",
    "system": "Parashara",
    "category": "Predictive",
    "conditions": {
      "description": "綜合判斷條件：Vimsottari 或 Dasamsa Narayana Dasa 的大運/分運主星，與 D-10（事業十分盤）中的第10宮主星、上升點、A10(Rajya Pada) 或其他吉利宮位產生緊密連結與引動。"
    },
    "interpretation": "預示職業生涯中的關鍵晉升、獲得社會認可或開創新事業的時期。若遇凶星引動則可能失業或遇阻。"
  },
  {
    "ruleName": "海外遷移機遇法則 (Overseas Relocation Rule)",
    "system": "Parashara",
    "category": "Predictive",
    "conditions": {
      "description": "涉及要素：第9宮（長途旅行）、第12宮（海外/隔離）、第7宮；水象星座（巨蟹、天蠍、雙魚）；羅睺（Rahu，異域指標星）。要求狀態：在大運（Dasa）運行期間，上述星體、宮位在主盤 (D-1) 及四分盤 (D-4，看住所變動) 中被強烈引動。"
    },
    "interpretation": "指示跨國長途旅行、定居海外、移民或發展異國相關事務的強烈機遇。"
  },
  {
    "ruleName": "世俗占星毀滅法則 (Mundane Destruction Rule)",
    "system": "Parashara",
    "category": "Mundane",
    "conditions": {
      "description": "分析對象：國家成立盤或年盤。涉及要素：日月食發生時的星盤強烈刑剋國家盤；或在國運 D-11 (Rudramsa) 盤中凶星雲集；或 D-30 (Trimsamsa) 盤中代表集體不幸的宮位受剋。"
    },
    "interpretation": "預測國家或地區發生重大自然災害（地震、洪水）、政治動盪、戰爭或大規模流行病等集體災難事件。"
  }
];
