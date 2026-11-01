// APIのレスポンス確認スクリプト
//   npm run api:check                               → http://localhost:3000/api（npm run dev 中に実行）
//   npm run api:check -- https://xxx.vercel.app/api → Preview / Production を確認
// GET {base}/questions を叩き、ステータス・件数・形をチェックする。
// 答え（cold）や解説（explanation）が漏れていないか、最初の1問で判定APIが返るかも確認する。

const base = (process.argv[2] || 'http://localhost:3000/api').replace(/\/$/, '');

function problemOf(q) {
  if (typeof q !== 'object' || q === null) return 'オブジェクトではない';
  if (typeof q.id !== 'string') return 'id が文字列ではない';
  if (!Array.isArray(q.posts) || q.posts.length === 0) return 'posts が空';
  if (!q.posts.every((p) => typeof p?.speaker === 'string' && typeof p?.text === 'string')) {
    return 'posts[].speaker / posts[].text が文字列ではない';
  }
  for (const key of ['cold', 'monsterId', 'explanation']) {
    if (q.posts.some((p) => key in p)) return `答え（${key}）がブラウザに漏れている`;
  }
  return null;
}

async function getJson(url, init) {
  const started = Date.now();
  const res = await fetch(url, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });
  const ms = Date.now() - started;
  const text = await res.text();
  try {
    return { res, ms, body: JSON.parse(text) };
  } catch {
    return { res, ms, body: null, text };
  }
}

console.log(`API: ${base}\n`);
let failed = 0;
let firstQuestion = null;

{
  const url = `${base}/questions`;
  try {
    const { res, ms, body, text } = await getJson(url);
    if (body === null) {
      failed++;
      console.log(`NG  questions  HTTP ${res.status}  ${ms}ms  JSONではない: ${text.slice(0, 80)}`);
    } else if (!res.ok || !Array.isArray(body.questions) || body.questions.length === 0) {
      failed++;
      console.log(`NG  questions  HTTP ${res.status}  ${ms}ms  ${JSON.stringify(body).slice(0, 80)}`);
    } else {
      const problems = body.questions.map(problemOf).map((p, i) => (p ? `questions[${i}]: ${p}` : null)).filter(Boolean);
      if (problems.length) failed++;
      console.log(`${problems.length ? 'NG' : 'OK'}  questions  HTTP ${res.status}  ${ms}ms  ${body.questions.length}問`);
      problems.forEach((p) => console.log(`      ${p}`));
      firstQuestion = body.questions[0];
    }
  } catch (e) {
    failed++;
    console.log(`NG  questions  接続できません: ${e.cause?.code ?? e.message}`);
  }
}

if (firstQuestion) {
  const url = `${base}/questions/${encodeURIComponent(firstQuestion.id)}/judge`;
  try {
    const { res, ms, body } = await getJson(url, {
      method: 'POST',
      body: JSON.stringify({ selected: [0], timeLeft: 20, combo: 0 }),
    });
    const ok = res.ok && typeof body?.rating === 'string' && Array.isArray(body?.hits) && Array.isArray(body?.coldPosts) && body.coldPosts.length > 0;
    if (!ok) failed++;
    console.log(`${ok ? 'OK' : 'NG'}  judge ${firstQuestion.id}  HTTP ${res.status}  ${ms}ms  ${JSON.stringify(body).slice(0, 80)}`);
  } catch (e) {
    failed++;
    console.log(`NG  judge  接続できません: ${e.cause?.code ?? e.message}`);
  }
}

console.log(failed ? `\n${failed}件 NG` : '\nすべて OK');
process.exitCode = failed ? 1 : 0;
