export type Monster = {
  id: string;
  no: number;
  name: string;
  color: string;
  description: string;
};

/** 冷笑の「型」をモンスター化したもの。解説＝ずかんのご褒美になる */
export const MONSTERS: Monster[] = [
  { id: 'uekarame', no: 1, name: 'ウエカラーメ', color: '#BFEFFF', description: '「気持ちはわかるよ」と理解者のふりをして、一段上から見下ろす。' },
  { id: 'hokenwara', no: 2, name: 'ホケンワラ', color: '#FFE38A', description: '語尾の「笑」「w」で、本気じゃないという逃げ道を確保する。' },
  { id: 'shirankedo', no: 3, name: 'シランケド', color: '#C9F5B0', description: '否定的なことを言った直後に「知らんけど」で責任から逃げる。' },
  { id: 'urayamashiiga', no: 4, name: 'ウラヤマシーガ', color: '#FFC2D9', description: '「うらやましい」と言いながら、実は相手を下に見ている皮肉の使い手。' },
  { id: 'douseMuda', no: 5, name: 'ドウセムーダ', color: '#D9CCFF', description: '「それで何か変わるの？」と、行動する人の熱を先回りして冷ます。' },
  { id: 'majisamu', no: 6, name: 'マジサムー', color: '#B5E8FF', description: '一生懸命な人や盛り上がりを「寒い」「黒歴史」とラベル貼りする。' },
  { id: 'niwakagari', no: 7, name: 'ニワカガリ', color: '#FFD0A8', description: '古参マウントで、いま楽しんでいる人の「好き」を小さく見せる。' },
  { id: 'naniyorin', no: 8, name: 'ナニヨリン', color: '#E0F7F2', description: '「楽しそうで何より」と距離を置き、自分は冷静な側だと示す。' },
];

export const monsterById = (id: string): Monster => MONSTERS.find((m) => m.id === id) ?? MONSTERS[0];
