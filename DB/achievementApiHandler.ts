import { NextResponse } from 'next/server';
import { evaluateAchievement } from '@/DB/achievement';
import { createPlayAchievement } from '@/DB/achievementRepository';
import { findPostsByIds } from '@/server/repositories/posts';
import { score } from '@/server/services/scoring';
import type { ScoreRequest } from '@/types/game';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ScoreRequest> | null;
  if (
    !isStringArray(body?.pressed) ||
    !isStringArray(body?.timeline) ||
    body.timeline.length === 0 ||
    body.timeline.length > 50
  ) {
    return NextResponse.json(
      { error: 'pressed / timeline が不正です' },
      { status: 400 },
    );
  }

  const pressedIds = [...new Set(body.pressed)];
  const timelineIds = [...new Set(body.timeline)];
  if (pressedIds.some((id) => !timelineIds.includes(id))) {
    return NextResponse.json(
      { error: 'pressed にタイムライン外の ID が含まれています' },
      { status: 400 },
    );
  }

  try {
    const allIds = [...new Set([...pressedIds, ...timelineIds])];
    const posts = await findPostsByIds(allIds);
    if (posts.length !== allIds.length) {
      return NextResponse.json({ error: 'ポストが見つかりません' }, { status: 400 });
    }

    const postsById = new Map(posts.map((post) => [post.id, post]));
    const pressed = pressedIds.flatMap((id) => {
      const post = postsById.get(id);
      return post ? [post] : [];
    });
    const timeline = timelineIds.flatMap((id) => {
      const post = postsById.get(id);
      return post ? [post] : [];
    });
    const result = score(pressed, timeline);
    const stats = { ...result, timedOut: true };
    const achievement = evaluateAchievement(stats);
    await createPlayAchievement(stats);
    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '実績データを保存できませんでした';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
