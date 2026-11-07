import CommentsManager from "@/DB/CommentsManager";

export default function DbAdminPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black py-10">
      <main className="w-full">
        <CommentsManager />
      </main>
    </div>
  );
}
