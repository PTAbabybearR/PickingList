# PickingList — 拼装模型取件表平台

高达 / 机甲拼装模型（Gunpla）的取件表（Parts Picking List）Web 平台。

- **管理员**：上传官方 PDF 说明书 → 多模态大模型识别提取 → 人工复核/编辑 → 发布取件表。
- **普通用户**：按 `等级 → 作品系列 → 型号` 分类浏览，或关键字搜索，查看取件表（整模型总表 / 按步骤分组）。

## 文档

- 产品需求文档：[PRD.md](./PRD.md)

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind v4
- Prisma 7 + SQLite（本地 MVP，驱动适配器 better-sqlite3）
- Anthropic Claude API（`claude-opus-4-8`，原生读 PDF 做结构化提取）
- 本地文件存储（存储层抽象为适配器，后期可切云存储）

## 本地运行

前置：Node 20+、pnpm（`npm i -g pnpm`）。

```bash
pnpm install
cp .env.example .env        # 然后填入 ANTHROPIC_API_KEY 等
pnpm prisma generate        # 生成 Prisma 客户端
pnpm prisma db push         # 创建本地 SQLite 库(dev.db)
pnpm dev                    # http://localhost:3000
```

常用脚本：`pnpm build`（生产构建）、`pnpm db:studio`（Prisma Studio 看数据）。

## 目录结构

```
prisma/schema.prisma     数据模型
src/app/                 页面(首页、/admin 占位)
src/lib/db.ts            Prisma 客户端
src/lib/storage/         存储适配器(LocalStorage)
src/lib/claude/          Claude 客户端 + 提取 Schema + recognize() 占位
storage/                 本地 PDF 存储(gitignore)
```

## 状态

🚧 骨架已就绪（构建通过）。待实现：管理员上传/识别/复核/发布、分类浏览、搜索、取件表展示。

## 注意

⚠️ 切勿提交受版权保护的官方说明书 PDF（`.gitignore` 已忽略 `*.pdf`、`/storage`、`.env`、本地数据库）。
