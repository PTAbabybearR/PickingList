import Link from "next/link";
import { login } from "./actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <main className="mx-auto flex max-w-sm flex-col px-6 py-24">
      <h1 className="text-2xl font-bold">管理员登录</h1>
      <p className="mt-1 text-sm text-neutral-500">仅管理员可上传识别与发布。</p>

      <form action={login} className="mt-6 space-y-3">
        <input type="hidden" name="from" value={from ?? "/admin"} />
        <input
          type="password"
          name="password"
          placeholder="管理员密码"
          required
          autoFocus
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-neutral-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">密码错误</p>}
        <SubmitButton pendingText="登录中…" className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
          登录
        </SubmitButton>
      </form>

      <Link href="/" className="mt-6 text-xs text-neutral-400 hover:text-neutral-700">
        ← 返回首页
      </Link>
    </main>
  );
}
