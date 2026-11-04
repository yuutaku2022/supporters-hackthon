"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMMENT_FLAG_LABELS,
  type CommentFlag,
  type CommentRecord,
} from "@/DB/comment";
import { fetchRandomComments } from "@/DB/frontendClient";

type FilterFlag = "all" | "0" | "1";

export default function CommentsManager() {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [filterFlag, setFilterFlag] = useState<FilterFlag>("all");
  const [isRandomMode, setIsRandomMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 新規追加フォーム用の状態
  const [newContent, setNewContent] = useState<string>("");
  const [newFlag, setNewFlag] = useState<CommentFlag>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  // インライン編集用の状態
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [editingFlag, setEditingFlag] = useState<CommentFlag>(0);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const fetchComments = useCallback(async (selectedFilter: FilterFlag) => {
    try {
      const query =
        selectedFilter === "all"
          ? ""
          : `?flag=${encodeURIComponent(selectedFilter)}`;
      const response = await fetch(`/api/comments${query}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "APIからのデータ取得に失敗しました。");
      }

      setComments(result.data ?? []);
      setIsRandomMode(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "通信エラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialOrFiltered() {
      try {
        const query =
          filterFlag === "all"
            ? ""
            : `?flag=${encodeURIComponent(filterFlag)}`;
        const response = await fetch(`/api/comments${query}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "APIからのデータ取得に失敗しました。");
        }

        if (!cancelled) {
          setComments(result.data ?? []);
          setIsRandomMode(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "通信エラーが発生しました。"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialOrFiltered();

    return () => {
      cancelled = true;
    };
  }, [filterFlag]);

  const handleFilterChange = (nextFilter: FilterFlag) => {
    setLoading(true);
    setError(null);
    if (nextFilter === filterFlag) {
      void fetchComments(nextFilter);
    } else {
      setFilterFlag(nextFilter);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    void fetchComments(filterFlag);
  };

  const handleFetchRandom50 = async () => {
    setLoading(true);
    setError(null);
    try {
      const flagOption =
        filterFlag === "all" ? undefined : (Number(filterFlag) as CommentFlag);
      const randomItems = await fetchRandomComments(50, flagOption);
      setComments(randomItems);
      setIsRandomMode(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ランダム50件の取得中にエラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSeed100 = async (replaceExisting: boolean) => {
    setSeeding(true);
    setError(null);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seed: true, replace: replaceExisting }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "100件の一括登録に失敗しました。");
      }

      await fetchComments(filterFlag);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "一括登録中にエラーが発生しました。"
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("DB内の文章データをすべて削除しますか？")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/comments?all=true", {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "全件削除に失敗しました。");
      }
      await fetchComments(filterFlag);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "削除中にエラーが発生しました。"
      );
      setLoading(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newContent.trim(),
          flag: newFlag,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "データの登録に失敗しました。");
      }

      setNewContent("");
      await fetchComments(filterFlag);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "登録中にエラーが発生しました。"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (item: CommentRecord) => {
    setEditingId(item.id);
    setEditingContent(item.content);
    setEditingFlag(item.flag);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleSaveEdit = async (id: number | string) => {
    if (!editingContent.trim()) return;
    setSavingEdit(true);
    setError(null);
    try {
      const response = await fetch("/api/comments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          content: editingContent.trim(),
          flag: editingFlag,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "更新に失敗しました。");
      }
      setEditingId(null);
      await fetchComments(filterFlag);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "更新中にエラーが発生しました。"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteOne = async (id: number | string) => {
    setError(null);
    try {
      const response = await fetch(
        `/api/comments?id=${encodeURIComponent(String(id))}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "削除に失敗しました。");
      }
      await fetchComments(filterFlag);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "削除中にエラーが発生しました。"
      );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <header className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            AI生成文章 データベース管理・編集・出力確認
          </h1>
          <div className="flex items-center gap-2">
            {isRandomMode && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-3 py-1 text-xs font-medium">
                ランダム50件抽出モード中
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
              表示件数: {comments.length} 件
            </span>
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          API（<code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">/api/comments</code>）経由で Supabase の{" "}
          <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">comments</code>{" "}
          テーブルの取得・ランダム50件抽出・追加・編集・削除を行えます。
        </p>
      </header>

      {/* 新規文章追加フォーム & 一括操作 */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            文章データの新規追加・一括リセット
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSeed100(true)}
              disabled={seeding}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {seeding
                ? "処理中..."
                : "DBをリセットして DB/seedData.ts の100件で入れ直す"}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={seeding || loading}
              className="rounded-lg border border-rose-300 dark:border-rose-800 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 cursor-pointer"
            >
              全件削除
            </button>
          </div>
        </div>
        <form onSubmit={handleCreateComment} className="space-y-4">
          <div>
            <label
              htmlFor="content-input"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              AI生成した文章 (content)
            </label>
            <textarea
              id="content-input"
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="保存するAI生成文章を入力してください..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                フラグ (flag):
              </span>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="flag"
                  checked={newFlag === 0}
                  onChange={() => setNewFlag(0)}
                  className="accent-rose-600"
                />
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                  0
                </span>
                <span>（冷笑している文章）</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="flag"
                  checked={newFlag === 1}
                  onChange={() => setNewFlag(1)}
                  className="accent-emerald-600"
                />
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  1
                </span>
                <span>（冷笑していない文章）</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "保存中..." : "1件追加する"}
            </button>
          </div>
        </form>
      </section>

      {/* フィルタ & ランダム50件取得 & 再読み込み */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              表示フィルタ:
            </span>
            {(
              [
                { value: "all", label: "すべて" },
                { value: "0", label: "0: 冷笑している" },
                { value: "1", label: "1: 冷笑していない" },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleFilterChange(item.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filterFlag === item.value && !isRandomMode
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFetchRandom50}
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              ランダムで50件取得する (APIテスト)
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              全件表示に戻す
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300 space-y-1">
            <p className="font-semibold">エラーが発生しました</p>
            <p className="font-mono text-xs">{error}</p>
          </div>
        )}

        {/* 表形式の出力・インライン編集 */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300">
                <th className="py-3 px-4 font-semibold w-16">#</th>
                <th className="py-3 px-4 font-semibold w-28">フラグ (flag)</th>
                <th className="py-3 px-4 font-semibold w-44">判定ラベル</th>
                <th className="py-3 px-4 font-semibold">AI生成した文章 (content)</th>
                <th className="py-3 px-4 font-semibold w-36 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    読み込み中...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    登録されている文章データがありません。上の「DBをリセットして DB/seedData.ts の100件で入れ直す」ボタンを押すか、新規追加してください。
                  </td>
                </tr>
              ) : (
                comments.map((item, index) => {
                  const isEditing = editingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {isEditing ? (
                          <select
                            value={editingFlag}
                            onChange={(e) =>
                              setEditingFlag(Number(e.target.value) as CommentFlag)
                            }
                            className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
                          >
                            <option value={0}>0 (冷笑)</option>
                            <option value={1}>1 (非冷笑)</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-bold ${
                              item.flag === 0
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {item.flag}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {COMMENT_FLAG_LABELS[isEditing ? editingFlag : item.flag]}
                      </td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-sm"
                          />
                        ) : (
                          item.content
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={savingEdit}
                              className="rounded bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1 text-xs font-medium text-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="rounded border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              className="rounded border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOne(item.id)}
                              className="rounded border border-rose-200 dark:border-rose-900 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              削除
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
