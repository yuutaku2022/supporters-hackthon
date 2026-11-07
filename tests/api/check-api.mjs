// APIのレスポンス確認スクリプト
//   npm run api:check                               → http://localhost:3000/api（npm run dev 中に実行）
//   npm run api:check -- https://xxx.vercel.app/api → Preview / Production を確認
// GET {base}/timeline を叩いてランダムページングとレスポンスの形を確認する。
// あわせて score / hint とランキング登録の入力検証も確認する。

const base = (process.argv[2] || 'http://localhost:3000/api').replace(/\/$/, '');

async function call(path, init) {
  const started = Date.now();
  const res = await fetch(`${base}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });
  const ms = Date.now() - started;
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* JSON ではない */
  }
  return { res, ms, body, text };
}

let failed = 0;
const report = (ok, label, detail) => {
  if (!ok) failed++;
  console.log(`${ok ? 'OK' : 'NG'}  ${label}  ${detail}`);
};

console.log(`API: ${base}\n`);
try {
  const invalidRanking = await call('/rankings', {
    method: 'POST',
    body: JSON.stringify({ name: '', score: 1, resultId: 'invalid' }),
  });
  report(invalidRanking.res.status === 400, 'invalid ranking entry', `HTTP ${invalidRanking.res.status}  ${invalidRanking.ms}ms`);

  const t = await call('/timeline');
  const posts = t.body?.posts;
  const shapeOk =
    t.res.ok &&
    Array.isArray(posts) &&
    posts.length > 0 &&
    posts.length <= 25 &&
    Array.isArray(t.body?.postIds) &&
    t.body.postIds.length >= posts.length &&
    new Set(t.body.postIds).size === t.body.postIds.length &&
    posts.every((p, index) => p.id === t.body.postIds[index]) &&
    typeof t.body?.hasMore === 'boolean' &&
    posts.every((p) =>
      typeof p?.id === 'string' &&
      typeof p?.speaker === 'string' &&
      typeof p?.text === 'string' &&
      typeof p?.cold === 'boolean'
    );
  const leaked = Array.isArray(posts) && posts.some((p) => 'monsterId' in p || 'explanation' in p);
  report(shapeOk && !leaked, 'timeline', `HTTP ${t.res.status}  ${t.ms}ms  ${Array.isArray(posts) ? `${posts.length}件` : t.text.slice(0, 80)}${leaked ? '  不要な情報が返っている' : ''}`);

  const invalidPostId = await call('/timeline?postId=');
  report(invalidPostId.res.status === 400, 'invalid post ID', `HTTP ${invalidPostId.res.status}  ${invalidPostId.ms}ms`);

  if (shapeOk) {
    const ids = posts.map((p) => p.id);
    if (t.body.hasMore) {
      const nextIds = t.body.postIds.slice(25, 51);
      const nextParams = new URLSearchParams();
      nextIds.forEach((id) => nextParams.append('postId', id));
      const next = await call(`/timeline?${nextParams}`);
      const nextPosts = next.body?.posts;
      const nextOk =
        next.res.ok &&
        Array.isArray(nextPosts) &&
        nextPosts.length <= 25 &&
        typeof next.body?.hasMore === 'boolean' &&
        nextPosts.every((p, index) => p.id === nextIds[index]) &&
        nextPosts.every((p) =>
          typeof p?.id === 'string' &&
          typeof p?.speaker === 'string' &&
          typeof p?.text === 'string' &&
          typeof p?.cold === 'boolean'
        ) &&
        !nextPosts.some((p) => ids.includes(p.id));
      report(nextOk, 'timeline pagination', `HTTP ${next.res.status}  ${next.ms}ms  ${Array.isArray(nextPosts) ? `${nextPosts.length}件` : next.text.slice(0, 80)}`);
    }

    const s = await call('/score', { method: 'POST', body: JSON.stringify({ pressed: ids.slice(0, 3), timeline: ids }) });
    report(s.res.ok && typeof s.body?.score === 'number' && typeof s.body?.missed === 'number', 'score', `HTTP ${s.res.status}  ${s.ms}ms  ${JSON.stringify(s.body)}`);

    const h = await call('/hint', { method: 'POST', body: JSON.stringify({ timeline: ids, pressed: [] }) });
    report(h.res.ok && 'postId' in (h.body ?? {}), 'hint', `HTTP ${h.res.status}  ${h.ms}ms  ${JSON.stringify(h.body)}`);
  }
} catch (e) {
  report(false, 'API', `接続できません: ${e.cause?.code ?? e.message}`);
}

console.log(failed ? `\n${failed}件 NG` : '\nすべて OK');
process.exitCode = failed ? 1 : 0;
