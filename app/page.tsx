export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center border-x border-[#eff3f4] bg-white px-6">
      <button
        className="inline-flex min-h-14 min-w-56 items-center justify-center rounded-full bg-[#1d9bf0] px-8 text-base font-bold text-white shadow-[0_8px_20px_rgba(29,155,240,0.22)] transition-colors hover:bg-[#1688d4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d9bf0] active:bg-[#1478be] motion-reduce:transition-none"
        type="button"
      >
        ゲームスタート
      </button>
    </main>
  );
}
