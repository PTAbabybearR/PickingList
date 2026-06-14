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
cp .env.example .env        # 按下方说明填写 GEMINI_API_KEY / AUTH_SECRET / 管理员密码哈希
pnpm prisma generate        # 生成 Prisma 客户端
pnpm prisma db push         # 创建本地 SQLite 库(dev.db)
pnpm db:seed                # 灌入分类种子(等级/系列)
pnpm dev                    # http://localhost:3000
```

常用脚本：`pnpm build`（生产构建）、`pnpm db:studio`（Prisma Studio 看数据）、`pnpm hash-password "密码"`（生成管理员密码哈希）。

## 环境变量（.env）

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | 本地 SQLite，默认 `file:./dev.db` |
| `GEMINI_API_KEY` | 识别用，[aistudio.google.com](https://aistudio.google.com/apikey) 免费申请 |
| `GEMINI_MODEL` | 默认 `gemini-2.5-flash` |
| `RECOGNITION_SCALE` / `TILE_COLS` / `TILE_ROWS` | 渲染倍率与切块（默认 6 / 2 / 2，越大越准越耗） |
| `ADMIN_PASSWORD_HASH` | 管理员密码的 scrypt 哈希（**不存明文**），默认密码 `changeme` |
| `AUTH_SECRET` | 会话 Cookie 签名密钥（随机长串，勿外泄） |

> `.env` 已 gitignore，不会进仓库。API key / 密钥按惯例明文存（程序需用）；管理员密码只存哈希。

## 管理员登录

- 访问 `/admin` 未登录会跳 `/login`；默认密码 `changeme`。
- 改密码（不暴露明文）：
  ```bash
  pnpm hash-password "你的新密码"   # 输出 ADMIN_PASSWORD_HASH="..."
  ```
  把输出粘到 `.env` 替换原值，重启即可。
- ⚠️ 上线前：换强密码、各环境单独设 `AUTH_SECRET`。

## 目录结构

```
prisma/schema.prisma     数据模型(Grade/Series/ModelKit/Manual/Section/SectionPart)
src/app/                 页面(首页/浏览/搜索/取件表 + /admin 管理端 + /login)
src/middleware.ts        鉴权拦截 /admin/*
src/lib/db.ts            Prisma 客户端
src/lib/auth.ts          会话签名(Web Crypto); src/lib/password.ts 密码哈希(scrypt)
src/lib/storage/         存储适配器(LocalStorage)
src/lib/recognize/       识别层(切块+Gemini、Zod Schema、persist、provider适配器)
src/components/          PickingTable 共享展示组件(按部位/按板件)
scripts/hash-password.mjs 生成管理员密码哈希
storage/                 本地 PDF 存储(gitignore)
```

## 状态

✅ MVP 主线已打通：
- 管理员（需登录）：型号管理 / PDF 上传 / 识别(高倍切块 + Gemini) / 复核编辑 / 发布
- 普通用户：按等级→系列→型号浏览 / 关键字搜索 / 取件表(按部位 · 按板件，仅已发布)
- 鉴权：管理端密码登录（密码存 scrypt 哈希）+ 签名 Cookie + middleware 拦截

识别准确率（对 dammiz 同款基准）：切块后精确 ~94–98% / 召回 ~92–94%，数量靠人工复核兜底。

后续可选：盒绘图、识别参数按 RG/MG 调优、云部署(R2/Supabase + 托管队列)。

## 注意

⚠️ 切勿提交受版权保护的官方说明书 PDF（`.gitignore` 已忽略 `*.pdf`、`/storage`、`.env`、本地数据库）。
