// APIのレスポンス確認スクリプト
//   npm run api:check                               → http://localhost:3000/api（npm run dev 中に実行）
//   npm run api:check -- https://xxx.vercel.app/api → Preview / Production を確認
// GET {base}/timeline を叩いて形と件数をチェックし、答え（cold）が漏れていないか確認する。
// あわせて check / score / hint が返るかも確認する。

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
  const t = await call('/timeline');
  const posts = t.body?.posts;
  const shapeOk =
    t.res.ok &&
    Array.isArray(posts) &&
    posts.length > 0 &&
    posts.every((p) => typeof p?.id === 'string' && typeof p?.speaker === 'string' && typeof p?.text === 'string');
  const leaked = Array.isArray(posts) && posts.some((p) => 'cold' in p || 'monsterId' in p || 'explanation' in p);
  report(shapeOk && !leaked, 'timeline', `HTTP ${t.res.status}  ${t.ms}ms  ${Array.isArray(posts) ? `${posts.length}件` : t.text.slice(0, 80)}${leaked ? '  答えがブラウザに漏れている' : ''}`);

  if (shapeOk) {
    const ids = posts.map((p) => p.id);
    const c = await call(`/posts/${encodeURIComponent(ids[0])}/check`, { method: 'POST' });
    report(c.res.ok && typeof c.body?.cold === 'boolean', `check ${ids[0]}`, `HTTP ${c.res.status}  ${c.ms}ms  ${JSON.stringify(c.body)}`);

    const s = await call('/score', { method: 'POST', body: JSON.stringify({ pressed: ids.slice(0, 3) }) });
    report(s.res.ok && typeof s.body?.score === 'number', 'score', `HTTP ${s.res.status}  ${s.ms}ms  ${JSON.stringify(s.body)}`);

    const h = await call('/hint', { method: 'POST', body: JSON.stringify({ timeline: ids, pressed: [] }) });
    report(h.res.ok && 'postId' in (h.body ?? {}), 'hint', `HTTP ${h.res.status}  ${h.ms}ms  ${JSON.stringify(h.body)}`);
  }
} catch (e) {
  report(false, 'API', `接続できません: ${e.cause?.code ?? e.message}`);
}

console.log(failed ? `\n${failed}件 NG` : '\nすべて OK');
process.exitCode = failed ? 1 : 0;
