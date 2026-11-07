import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";

function readSupabaseServerConfig() {
  const env = process.env;
  const supabaseUrl = env[SUPABASE_URL_ENV];
  const supabaseKey =
    env[SUPABASE_SERVICE_ROLE_KEY_ENV] || env[SUPABASE_ANON_KEY_ENV];

  return { supabaseUrl, supabaseKey };
}

export function hasSupabaseServerConfig() {
  const { supabaseUrl, supabaseKey } = readSupabaseServerConfig();
  return Boolean(supabaseUrl && supabaseKey);
}

/**
 * サーバー側（Route Handlers / Server Components / Repositories）専用の Supabase クライアントを取得します。
 * SUPABASE_SERVICE_ROLE_KEY が設定されている場合は優先して使用し、未設定の場合は NEXT_PUBLIC_SUPABASE_ANON_KEY にフォールバックします。
 */
export function getSupabaseServerClient() {
  const { supabaseUrl, supabaseKey } = readSupabaseServerConfig();

  if (!supabaseUrl || !supabaseKey) {
    const missing = [
      !supabaseUrl && SUPABASE_URL_ENV,
      !supabaseKey &&
        `${SUPABASE_ANON_KEY_ENV} (または ${SUPABASE_SERVICE_ROLE_KEY_ENV})`,
    ].filter(Boolean);

    throw new Error(
      `Supabase の環境変数 ${missing.join(" / ")} が実行環境に設定されていません。Vercelでは対象の環境に設定後、再デプロイしてください。`,
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
