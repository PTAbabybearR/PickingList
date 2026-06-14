import Link from "next/link";
import { logout } from "@/app/login/actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← 返回首页
        </Link>
        <form action={logout}>
          <SubmitButton
            pendingText="…"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
          >
            退出登录
          </SubmitButton>
        </form>
      </div>
      <h1 className="mt-4 text-2xl font-bold">管理员控制台</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/kits"
          className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
        >
          <div className="text-lg font-semibold">型号管理</div>
          <p className="mt-1 text-sm text-neutral-600">
            新建型号 · 上传 PDF 说明书
          </p>
        </Link>

        <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 p-5">
          <div className="text-lg font-semibold text-neutral-400">识别 / 复核（待建）</div>
          <p className="mt-1 text-sm text-neutral-500">Claude 识别 · 复核 · 发布</p>
        </div>
      </div>

    </main>
  );
}
