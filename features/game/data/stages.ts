export type Platform = 'timeline' | 'comment' | 'short' | 'bbs' | 'chat';

/** ステージの表示情報（問題は API から取る） */
export type StageInfo = {
  id: number;
  name: string;
  platform: Platform;
  description: string;
  boss?: boolean;
};

export const STAGES: StageInfo[] = [
  { id: 1, name: 'タイムラインの森', platform: 'timeline', description: '投稿へのリプライに潜む冷笑モンスターを倒そう。' },
  { id: 2, name: 'コメント欄の洞窟', platform: 'comment', description: '動画のコメント欄から冷笑を見抜こう。' },
  { id: 3, name: 'ショート動画の街', platform: 'short', description: '流れてくるキャプションの冷笑を見抜こう。' },
  { id: 4, name: '掲示板の沼', platform: 'bbs', description: '匿名の書き込みに潜む冷笑。' },
  { id: 5, name: 'グループトーク城', platform: 'chat', description: '身内のトークに潜む冷笑。' },
  { id: 6, name: '冷笑王', platform: 'timeline', description: 'すべての冷笑を操るボス。', boss: true },
];

export const stageById = (id: number): StageInfo | undefined => STAGES.find((s) => s.id === id);
