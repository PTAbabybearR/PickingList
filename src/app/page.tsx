import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        PickingList · 拼装模型取件表
      </h1>
      <p className="mt-3 text-neutral-600">
        高达 / 机甲拼装模型说明书识别与取件表平台 —— 项目骨架已就绪。
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin"
          className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
        >
          <div className="text-lg font-semibold">管理员</div>
          <p className="mt-1 text-sm text-neutral-600">
            上传 PDF 说明书 · 识别 · 复核 · 发布
          </p>
        </Link>

        <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 p-5">
          <div className="text-lg font-semibold text-neutral-400">浏览（待建）</div>
          <p className="mt-1 text-sm text-neutral-500">
            按 等级 → 作品系列 → 型号 浏览 · 搜索 · 查看取件表
          </p>
        </div>
      </div>

      <p className="mt-10 text-xs text-neutral-400">
        MVP：本地运行 · SQLite · 本地 PDF 存储 · Claude 识别。详见仓库 PRD.md。
      </p>
    </main>
  );
}
