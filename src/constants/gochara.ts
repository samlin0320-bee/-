export interface GocharaEffect {
  house: number;
  result: 'Auspicious' | 'Malefic';
  description: string;
}

export const GOCHARA_DATA: Record<string, GocharaEffect[]> = {
  Sun: [
    { house: 1, result: 'Malefic', description: '無精打采、容易疲勞、容易生氣、生病' },
    { house: 2, result: 'Malefic', description: '破財、悶悶不樂、眼疾、家庭失和' },
    { house: 3, result: 'Auspicious', description: '晉升、賺錢輕鬆、健康、擊退小人、與手足分開' },
    { house: 4, result: 'Malefic', description: '夫妻失和、不開心' },
    { house: 5, result: 'Malefic', description: '事不從人願、不順、無助、尷尬' },
    { house: 6, result: 'Auspicious', description: '痊癒、擊退敵人、成功' },
    { house: 7, result: 'Malefic', description: '沒面子、疾病、旅行不利' },
    { house: 8, result: 'Malefic', description: '畏懼、病、口角、長上不合' },
    { house: 9, result: 'Malefic', description: '分手、倒楣、失意' },
    { house: 10, result: 'Auspicious', description: '成功、完成要做的事' },
    { house: 11, result: 'Auspicious', description: '履新職、受褒揚、被認同、進財' },
    { house: 12, result: 'Malefic', description: '悲傷、破財、失意、朋友間口角' }
  ],
  Moon: [
    { house: 1, result: 'Auspicious', description: '前程露出曙光' },
    { house: 2, result: 'Malefic', description: '破財' },
    { house: 3, result: 'Auspicious', description: '成功' },
    { house: 4, result: 'Malefic', description: '恐懼' },
    { house: 5, result: 'Malefic', description: '失意' },
    { house: 6, result: 'Auspicious', description: '健康' },
    { house: 7, result: 'Auspicious', description: '快樂' },
    { house: 8, result: 'Malefic', description: '不順' },
    { house: 9, result: 'Malefic', description: '病' },
    { house: 10, result: 'Auspicious', description: '滿願' },
    { house: 11, result: 'Auspicious', description: '喜悅' },
    { house: 12, result: 'Malefic', description: '花費' }
  ],
  Mars: [
    { house: 1, result: 'Malefic', description: '與所愛分手、血光' },
    { house: 2, result: 'Malefic', description: '口角引起的麻煩' },
    { house: 3, result: 'Auspicious', description: '成功、快樂' },
    { house: 4, result: 'Malefic', description: '解雇、沒面子、手足失和' },
    { house: 5, result: 'Malefic', description: '發燒、為子女煩惱' },
    { house: 6, result: 'Auspicious', description: '戰勝對手、痊癒、獲益、成功' },
    { house: 7, result: 'Malefic', description: '夫妻失和、病' },
    { house: 8, result: 'Malefic', description: '病、失去榮譽' },
    { house: 9, result: 'Malefic', description: '身體虛弱、無精打采' },
    { house: 10, result: 'Malefic', description: '失言' },
    { house: 11, result: 'Auspicious', description: '進財、健康' },
    { house: 12, result: 'Malefic', description: '生病與破財' }
  ],
  Mercury: [
    { house: 1, result: 'Malefic', description: '破財' },
    { house: 2, result: 'Auspicious', description: '進財' },
    { house: 3, result: 'Malefic', description: '畏懼小人' },
    { house: 4, result: 'Auspicious', description: '進財' },
    { house: 5, result: 'Malefic', description: '夫妻間、子女間的誤會' },
    { house: 6, result: 'Auspicious', description: '成功' },
    { house: 7, result: 'Malefic', description: '誤解' },
    { house: 8, result: 'Auspicious', description: '進財' },
    { house: 9, result: 'Malefic', description: '不順' },
    { house: 10, result: 'Auspicious', description: '快樂' },
    { house: 11, result: 'Auspicious', description: '感覺豐盛' },
    { house: 12, result: 'Malefic', description: '怕失去面子' }
  ],
  Jupiter: [
    { house: 1, result: 'Malefic', description: '出國、花費大' },
    { house: 2, result: 'Auspicious', description: '掌權、進財' },
    { house: 3, result: 'Malefic', description: '失位、事業不順、朋友間關係不佳' },
    { house: 4, result: 'Malefic', description: '人際不合引起的悲傷、車關' },
    { house: 5, result: 'Auspicious', description: '偏財、得子、得貴' },
    { house: 6, result: 'Malefic', description: '病、因上司惹來的不順' },
    { house: 7, result: 'Auspicious', description: '旅行開心、出行得利、子女孝順' },
    { house: 8, result: 'Malefic', description: '身體感覺無力、出行不利、倒楣破財' },
    { house: 9, result: 'Auspicious', description: '行大運、豐盛之年' },
    { house: 10, result: 'Malefic', description: '留意子女、錢財' },
    { house: 11, result: 'Auspicious', description: '子女、榮耀、晉升' },
    { house: 12, result: 'Malefic', description: '貪婪與恐懼' }
  ],
  Venus: [
    { house: 1, result: 'Auspicious', description: '享受、獲得財富、舒適生活' },
    { house: 2, result: 'Auspicious', description: '財運佳、家庭和諧、快樂' },
    { house: 3, result: 'Auspicious', description: '繁榮、地位提升、社交順利' },
    { house: 4, result: 'Auspicious', description: '獲得不動產、家庭幸福' },
    { house: 5, result: 'Auspicious', description: '得子、感情順遂、創造力強' },
    { house: 6, result: 'Malefic', description: '小人干擾、健康微恙、爭執' },
    { house: 7, result: 'Malefic', description: '配偶困擾、人際關係緊張' },
    { house: 8, result: 'Auspicious', description: '意外之財、獲得遺產、長壽' },
    { house: 9, result: 'Auspicious', description: '好運、精神愉悅、長途旅行' },
    { house: 10, result: 'Malefic', description: '名譽受損、事業壓力、口角' },
    { house: 11, result: 'Auspicious', description: '多方進財、朋友相助、願望達成' },
    { house: 12, result: 'Auspicious', description: '獲得財富、舒適、愉快的旅行' }
  ],
  Saturn: [
    { house: 1, result: 'Malefic', description: '生病、負責不開心的項目' },
    { house: 2, result: 'Malefic', description: '破財、喪子' },
    { house: 3, result: 'Auspicious', description: '獲得、財運佳' },
    { house: 4, result: 'Malefic', description: '喪偶、破財' },
    { house: 5, result: 'Malefic', description: '心情低落、財富縮減、子女本身運勢不佳' },
    { house: 6, result: 'Auspicious', description: '開心、快樂' },
    { house: 7, result: 'Malefic', description: '失意、恐懼、喪偶、流浪' },
    { house: 8, result: 'Malefic', description: '損失、因子女、朋友間蒙受的苦難' },
    { house: 9, result: 'Malefic', description: '破財、不順' },
    { house: 10, result: 'Malefic', description: '名譽受損、邪惡的舉動、生病' },
    { house: 11, result: 'Auspicious', description: '幸福、得財、獲得榮譽' },
    { house: 12, result: 'Malefic', description: '生意沒賺錢、配偶子女生病' }
  ],
  Rahu: [
    { house: 1, result: 'Malefic', description: '困惑、健康問題、意外' },
    { house: 2, result: 'Malefic', description: '財務損失、家庭紛爭' },
    { house: 3, result: 'Auspicious', description: '勇氣、獲得財富、擊敗敵人' },
    { house: 4, result: 'Malefic', description: '家庭不寧、母親健康問題' },
    { house: 5, result: 'Malefic', description: '子女問題、投機損失' },
    { house: 6, result: 'Auspicious', description: '戰勝敵人、健康改善、成功' },
    { house: 7, result: 'Malefic', description: '婚姻問題、合作不順' },
    { house: 8, result: 'Malefic', description: '意外、慢性病、財務危機' },
    { house: 9, result: 'Malefic', description: '父親健康、運氣不佳' },
    { house: 10, result: 'Malefic', description: '事業變動、名譽受損' },
    { house: 11, result: 'Auspicious', description: '多方收益、願望實現、地位提升' },
    { house: 12, result: 'Malefic', description: '不必要的花費、失眠、法律問題' }
  ],
  Ketu: [
    { house: 1, result: 'Malefic', description: '精神壓力、健康問題' },
    { house: 2, result: 'Malefic', description: '言語衝突、財務不穩' },
    { house: 3, result: 'Auspicious', description: '成功、勇氣、手足獲益' },
    { house: 4, result: 'Malefic', description: '內心不安、家庭變動' },
    { house: 5, result: 'Malefic', description: '子女煩惱、判斷失誤' },
    { house: 6, result: 'Auspicious', description: '克服困難、健康好轉' },
    { house: 7, result: 'Malefic', description: '伴侶疏離、合作破裂' },
    { house: 8, result: 'Malefic', description: '意外、隱疾、恐懼' },
    { house: 9, result: 'Malefic', description: '信仰動搖、旅行不順' },
    { house: 10, result: 'Malefic', description: '工作不穩、名聲受損' },
    { house: 11, result: 'Auspicious', description: '意外收益、社交圈擴大' },
    { house: 12, result: 'Malefic', description: '花費大、精神困擾' }
  ]
};
