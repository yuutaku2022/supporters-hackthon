-- AI生成された文章と冷笑フラグを保存するテーブル
-- flag: 0 = 冷笑している文章, 1 = 冷笑していない文章

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(trim(content)) > 0),
  flag smallint not null check (flag in (0, 1)),
  created_at timestamptz not null default now()
);

comment on table public.comments is 'AI生成した文章と冷笑判定フラグ（0: 冷笑している, 1: 冷笑していない）を管理するテーブル';
comment on column public.comments.id is '一意のID (UUID)';
comment on column public.comments.content is 'AI生成した文章テキスト';
comment on column public.comments.flag is '0: 冷笑している文章, 1: 冷笑していない文章';
comment on column public.comments.created_at is 'レコード作成日時';

-- 検索・フィルタ用のインデックス
create index if not exists idx_comments_flag on public.comments (flag);
create index if not exists idx_comments_created_at on public.comments (created_at desc);

-- Row Level Security (RLS) の有効化
alter table public.comments enable row level security;

-- 公開読み取りポリシー（anon / authenticated から SELECT 可能）
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comments'
      and policyname = 'Allow public read access on comments'
  ) then
    create policy "Allow public read access on comments"
      on public.comments
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;
