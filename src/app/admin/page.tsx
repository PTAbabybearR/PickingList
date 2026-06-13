import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← 返回首页
      </Link>
      <h1 className="mt-4 text-2xl font-bold">管理员控制台</h1>
      <p className="mt-2 text-neutral-600">骨架占位。后续在此实现：</p>
      <ol className="mt-4 list-decimal space-y-1 pl-6 text-sm text-neutral-700">
        <li>登录鉴权（单管理员凭据）</li>
        <li>新建/选择型号、上传 PDF（存本地）</li>
        <li>触发 Claude 识别（进程内后台任务）</li>
        <li>复核界面：左侧 PDF 原页 · 右侧结构化数据</li>
        <li>发布 / 下架、分类管理</li>
      </ol>
    </main>
  );
}
