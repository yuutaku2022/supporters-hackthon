import { createClient } from "@supabase/supabase-js";

/**
 * サーバー側（Route Handlers / Server Components / Repositories）専用の Supabase クライアントを取得します。
 * SUPABASE_SERVICE_ROLE_KEY が設定されている場合は優先して使用し、未設定の場合は NEXT_PUBLIC_SUPABASE_ANON_KEY にフォールバックします。
 */
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase の環境変数（NEXT_PUBLIC_SUPABASE_URL / キー）が .env.local に設定されていません。"
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
