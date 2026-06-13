# PickingList — 拼装模型取件表平台

高达 / 机甲拼装模型（Gunpla）的取件表（Parts Picking List）Web 平台。

- **管理员**：上传官方 PDF 说明书 → 多模态大模型识别提取 → 人工复核/编辑 → 发布取件表。
- **普通用户**：按 `等级 → 作品系列 → 型号` 分类浏览，或关键字搜索，查看取件表（整模型总表 / 按步骤分组）。

## 文档

- 产品需求文档：[PRD.md](./PRD.md)

## 技术栈（规划）

- Next.js（App Router）+ TypeScript 全栈
- Postgres + Prisma
- Anthropic Claude API（多模态 / Vision）做说明书识别
- Vercel 部署

## 状态

🚧 规划阶段 —— 目前仅含 PRD，代码骨架待初始化。

## 注意

⚠️ 切勿提交受版权保护的官方说明书 PDF（已在 `.gitignore` 中忽略 `*.pdf` 与 `/uploads`、`/storage`）。
