import type { PostRecord } from './posts';

type MockGroup = { id: string; posts: Omit<PostRecord, 'id'>[] };

/**
 * ポストのモック（すべて仮のサンプル、30件）
 * 話題ごとにまとめて書いているだけで、ゲームではバラバラにしてタイムラインに混ぜる。ポストの id は「話題id-番号」。
 * 冷笑ポストには cold: true を付ける（モンスター・解説は今は使っていないが、解説画面用に残している）。
 * ふつうのポストにも「笑」「w」を混ぜて、見た目だけで判断できないようにする。
 * 実在の人物・アカウント名・企業名は使わない。特定の属性を下げる内容にしない。
 */
const MOCK_GROUPS: MockGroup[] = [
  // ---- サンプル 1 ----
  {
    id: '1-1',
    posts: [
      { speaker: '@run_daily', text: '人生初のフルマラソン、なんとか完走できました！応援してくれたみんなありがとう' },
      {
        speaker: '@observer_xx',
        text: 'マラソン完走報告がたくさん流れてくる。まあ、そういう「頑張ってる自分」を発信したい気持ちもわかりますよ笑',
        cold: true,
        monsterId: 'uekarame',
        explanation:
          '理解者のふりをしつつ、相手の努力を「承認欲求」に言い換えて一段上から見下ろしている。語尾の「笑」で本気じゃない逃げ道も確保している。',
      },
      { speaker: '@sakura_jog', text: '来年こそフルマラソン出たい。まずは10kmの大会から！' },
      {
        speaker: '@kanso_man',
        text: 'フルマラソンって結局ただ走るだけですよねw まあ本人たちが楽しいならいいんじゃないですか',
        cold: true,
        monsterId: 'hokenwara',
        explanation:
          '「ただ走るだけ」と相手の挑戦を小さく言い換え、「w」で本気じゃない逃げ道を作っている。「いいんじゃないですか」も突き放した言い方。',
      },
    ],
  },
  {
    id: '1-2',
    posts: [
      { speaker: '@kirei_machi', text: '地元のゴミ拾いボランティアに参加してきた！20人も集まってびっくり' },
      {
        speaker: '@realist_404',
        text: 'ゴミ拾いで世の中が変わると本気で思ってる人、ある意味すごいと思う',
        cold: true,
        monsterId: 'douseMuda',
        explanation:
          '「すごい」はほめ言葉ではなく皮肉。行動そのものではなく「意味がない」という前提を押しつけて、行動する人の熱を冷ましている。',
      },
      { speaker: '@gomi_hiroi_bu', text: '来月のゴミ拾い、トングと軍手は貸し出しあります。初めての人も気軽にどうぞ' },
    ],
  },
  {
    id: '1-3',
    posts: [
      { speaker: '@onkai_love', text: '好きなバンドの新曲、今回も最高だった…！' },
      { speaker: '@ongaku_suki', text: '新曲のサビの転調で鳥肌たった笑' },
      {
        speaker: '@kosan_listener',
        text: '新曲で盛り上がってる人多いけど、初期から聴いてる身からすると最近のは売れ線すぎてちょっとね。まあ好みは人それぞれ',
        cold: true,
        monsterId: 'niwakagari',
        explanation:
          '「初期から」という古参アピールで、いま楽しんでいる人の感想を一段低く見せている。最後の「人それぞれ」はフォローに見えて距離を置く一言。',
      },
      {
        speaker: '@hikaku_zuki',
        text: '新曲ひとつでそこまで盛り上がれる人たち、正直うらやましい',
        cold: true,
        monsterId: 'urayamashiiga',
        explanation: '「うらやましい」は本心ではなく、夢中になっている人たちを一段下に見る皮肉として使われている。',
      },
    ],
  },

  // ---- サンプル 2 ----
  {
    id: '2-1',
    posts: [
      { speaker: '@jisui_hajimete', text: '自炊歴1ヶ月で手打ちパスタに挑戦してみた！形はいびつだけど美味しかった' },
      {
        speaker: '@tadano_shichousha',
        text: '手打ちパスタとか、本場の人が見たらどう思うかは知らんけど。まあ趣味ならアリでしょ',
        cold: true,
        monsterId: 'shirankedo',
        explanation:
          '「知らんけど」で否定を言い切らずに逃げつつ、「趣味なら」と条件付きでしか認めない。相手の挑戦を小さく見積もる言い方。',
      },
      { speaker: '@pasta_love', text: '手作りの麺って、太さが不揃いなのも味があっていいよね' },
    ],
  },
  {
    id: '2-2',
    posts: [
      { speaker: '@chiisana_ch', text: 'チャンネル登録者1000人いきました！見てくれてる皆さん本当にありがとう' },
      {
        speaker: '@nanashi_77',
        text: '登録者1000人で報告動画出すの、なんか微笑ましいですね w',
        cold: true,
        monsterId: 'hokenwara',
        explanation:
          '「微笑ましい」は相手を子ども扱いする言葉。そこに「w」を付けることで、指摘されても冗談だと言える保険をかけている。',
      },
      { speaker: '@douga_tsukuru', text: '動画編集の勉強はじめて3ヶ月。やっとテロップ入れるのが速くなってきた w' },
    ],
  },
  {
    id: '2-3',
    posts: [
      { speaker: '@bunkasai_2nen', text: '文化祭のダンス、今日やっと全員そろって通しできた！' },
      {
        speaker: '@otona_no_iken',
        text: '文化祭で全力ダンスとか、大人になったら黒歴史になるやつ。でもまあ楽しそう',
        cold: true,
        monsterId: 'majisamu',
        explanation:
          'いま全力で楽しんでいることを、未来の「黒歴史」として先にラベル貼りしている。後半の「楽しそう」で中和しても、最初の一言の冷たさは残る。',
      },
      { speaker: '@class_no_tomo', text: '文化祭のダンス練習を見せてもらった。もう当日が楽しみ' },
      {
        speaker: '@reitan_kun',
        text: '文化祭でみんなで盛り上がれていいですね。楽しそうで何より',
        cold: true,
        monsterId: 'naniyorin',
        explanation: '「楽しそうで何より」は、相手と同じ熱量で楽しむことを拒否して、外から眺める立場をとる言葉。',
      },
    ],
  },

  // ---- サンプル 3 ----
  {
    id: '3-1',
    posts: [
      { speaker: '@asakatsu_note', text: '朝5時起きで勉強するルーティン、1ヶ月続いた #朝活' },
      {
        speaker: '@yoyuu_no_hito',
        text: '朝5時起きで勉強とか、そこまでストイックになれる人、ある意味うらやましいです',
        cold: true,
        monsterId: 'urayamashiiga',
        explanation:
          '「うらやましい」と言いながら、「そこまで」「ある意味」で相手の努力を引いた目で見ている。ほめ言葉の形をした皮肉。',
      },
      { speaker: '@nemui_neko', text: '早起き苦手だけど、明日は10分だけ早く起きてみる笑' },
    ],
  },
  {
    id: '3-2',
    posts: [
      { speaker: '@cafe_meguri', text: '話題のカフェ行ってきた！パフェが想像以上の大きさ #カフェ巡り' },
      { speaker: '@amai_mono', text: 'あのパフェずっと気になってる。平日なら並ばずに入れるかな' },
      {
        speaker: '@hihyouka_san',
        text: '話題のカフェ、並んでまで食べるほどかは……まあ、映えはするよね',
        cold: true,
        monsterId: 'uekarame',
        explanation:
          '並んでいる人たちを「映えのためだけ」に見せる言い方。自分は流行に流されない冷静な側だ、という立ち位置を取っている。',
      },
    ],
  },
  {
    id: '3-3',
    posts: [
      {
        speaker: '@cool_kansou',
        text: '話題のドラマ、考察とかしてる人たち楽しそうで何より',
        cold: true,
        monsterId: 'naniyorin',
        explanation:
          '「楽しそうで何より」は、相手と同じ熱量で楽しむことを拒否して、外から眺める立場をとる言葉。やわらかい表現ほど冷笑は見えにくい。',
      },
      { speaker: '@kousatsu_bu', text: '最終回の伏線回収よかった！2話のあのシーンとつながってて鳥肌' },
      { speaker: '@mada_mitenai', text: 'まだ途中だからネタバレ避けながらタイムライン見てる笑 週末に一気見する' },
    ],
  },
];

export const MOCK_POSTS: PostRecord[] = MOCK_GROUPS.flatMap((g) => g.posts.map((p, i) => ({ ...p, id: `${g.id}-${i}` })));
