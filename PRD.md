# PRD：拼装模型取件表平台（PickingList）

> 英文名：**Parts Picking List** — 高达 / 机甲拼装模型的取件表 Web 平台。

---

## 一、Context（背景与目标）

### 1.1 问题与动机
高达 / 机甲拼装模型（Gunpla）的官方说明书以 PDF 形式提供，玩家在拼装前需要**对照说明书逐页找出每个步骤要用的板件（Runner）和剪口编号**，再从一堆塑料板件中取出对应零件。这个"取件"过程繁琐、易漏件、易拿错。

目前没有一个集中、结构化、可检索的"取件表"工具：
- 玩家无法快速查到"某型号一共要用哪些零件、各多少个"；
- 也无法按拼装步骤分组边拼边取；
- 管理员（站点维护者）整理取件表全靠人工抄录，效率极低。

### 1.2 解决方案
构建一个 Web 应用，分两类角色：
1. **管理员**：上传官方 PDF 说明书 → 调用**多模态大模型**自动识别提取取件信息 → 人工复核/编辑 → 发布；
2. **普通用户**：通过 `等级 → 作品系列 → 型号` 的分类层级，或关键字搜索，找到目标模型 → 查看其取件表（支持"整模型总表"与"按步骤分组"两种视图）。

### 1.3 预期成果（MVP）
- 管理员可在 10 分钟内将一本 PDF 说明书转为一份可发布、经复核的取件表；
- 普通用户可在 3 次点击内或一次搜索内定位到任意已发布型号并查看其取件表；
- 识别提取的准确率达到"人工只需少量修正"的可用程度（目标：字段级准确率 ≥ 90%，剩余由复核环节兜底）。

---

## 二、已确认的关键决策

| 决策项 | 选择 |
|---|---|
| 模型品类 | 高达 / 机甲模型（Gunpla） |
| 识别引擎 | 多模态大模型（Claude Vision，直接理解 PDF 页面） |
| 技术栈 | Next.js 全栈（App Router）+ Postgres + Prisma，Vercel 部署 |
| 取件表用途 | **整模型零件总表（核心）** + 按步骤分组取件（降级：尽力识别 + 人工补全） |
| 分类层级 | 等级（HG/RG/MG/PG/SD）→ 作品系列 → 具体型号 |
| 识别后流程 | **需要人工复核/编辑**（识别结果先进草稿，复核后发布） |
| 原版 PDF 可见性 | **仅管理员内部可见**（用于识别与复核），不向普通用户展示原页（降低版权风险） |
| 普通用户体系 | 匿名浏览，**MVP 不做"勾选已取/缺件"功能**（留待后续版本） |
| 平台定位 | **先做 MVP 验证核心流程**，规模/架构优化后续再定 |
| 搜索实现 | MVP 用 Postgres `ILIKE` 模糊匹配（中文够用），全文检索/分词后续再说 |

---

## 三、用户角色

| 角色 | 说明 | 是否登录 |
|---|---|---|
| 管理员（Admin） | 上传 PDF、触发识别、复核编辑、发布/下架取件表、维护分类 | 需要登录鉴权 |
| 普通用户（Visitor） | 浏览分类、搜索、查看已发布取件表 | 匿名，无需登录 |

---

## 四、核心概念与数据模型

> 术语对齐：**板件 = Runner（一整块塑料框）**，板件上每个零件有**剪口编号（Gate No.）**；颜色指该板件/零件的注塑颜色。

### 4.1 实体关系
```
Grade (等级 HG/RG/MG/PG/SD)
  └─ Series (作品系列, 如 UC / SEED / 水星的魔女)
       └─ ModelKit (具体型号, 如 RG RX-78-2 高达)
            ├─ Manual (上传的 PDF 说明书 + 识别状态)
            ├─ Runner (板件: 编号如 A/B/C, 颜色, 数量)
            │     └─ Part (零件: 剪口编号, 数量, 备注)
            └─ Step (拼装步骤: 步号, 页码)
                  └─ StepPart (该步骤需要的零件引用 + 用量)
```

### 4.2 主要表（Prisma 模型草案）
- **Grade**：`id, name, sortOrder`
- **Series**：`id, gradeId, name, sortOrder`
- **ModelKit**：`id, seriesId, name, code(型号编号), scale(比例,可选), boxArtUrl, status(draft/published/archived), createdAt`
- **Manual**：`id, modelKitId, pdfUrl, pageCount, recognizeStatus(pending/processing/done/failed), recognizedAt`
- **Runner**：`id, modelKitId, label(A/B/C…), color, count(同款板件张数)`
- **Part**：`id, runnerId, gateNo(剪口号), quantity(单张板件上该零件数量), note`
- **Step**：`id, modelKitId, stepNo, pageNo`
- **StepPart**：`id, stepId, partId, quantity`

**统计口径（必须遵守，避免算错）：**
- 某零件实际总数 = `Runner.count`（同款板件张数）× `Part.quantity`（单张上的数量）。总表统计以此为准。
- `StepPart` 为多对多：一个剪口号零件可在多个步骤复用。
- **以总表为权威数据源**；步骤映射可能不完整（说明书未必每步都标全），步骤各用量之和不要求与总表严格相等，UI 不做强一致校验。

> 「整模型总表（核心）」= 按 Runner 聚合所有 Part 的视图；「按步骤分组（降级）」= 遍历 Step → StepPart 的视图。两者共用同一份底层零件数据，避免重复维护。

---

## 五、功能需求

### 5.1 管理员侧

**F1 PDF 上传**
- 支持上传单本 PDF 说明书，关联到一个 ModelKit（可在上传时新建型号或选择已有型号）。
- 存储到对象存储（Vercel Blob / S3），记录页数。

**F2 多模态大模型识别（核心）**
- 触发后台任务（托管队列）：把 PDF（R2 签名 URL）直接交给 Claude **原生读取**（无需转图），按约定 JSON Schema 结构化提取：
  - **【核心，准确率优先】** 板件列表（编号、颜色、张数）+ 每板件上的零件（剪口号、数量）——对应总表；
  - **【降级，尽力而为】** 步骤列表（步号、页码、该步用到的零件及数量）——识别难度高（装配示意图而非表格），不追求高准确率，重度依赖人工复核补全。
- 识别结果写入草稿（status=draft），记录 `recognizeStatus`。
- 失败可重试；长文档分批/分页调用以控制单次 token 与成本。

> **成本控制**：单本说明书几十页图像 token 有实际 API 成本。策略：按页/批调用、识别结果落库缓存（不重复识别）、识别失败不重复计费的重试边界、必要时对总览页优先识别以降本。

**F3 复核与编辑（人工兜底）**
- 提供编辑界面，左侧显示 PDF 原页，右侧显示识别出的结构化数据，便于对照。
- 可增删改：板件、零件、剪口号、数量、步骤-零件映射。
- 标记每条记录"已复核"，全部复核后方可发布。

**F4 发布 / 下架**
- 草稿 → 发布（published，普通用户可见）；可下架（archived）。

**F5 分类管理**
- 维护 Grade / Series 列表与排序，型号挂载到对应系列。

### 5.2 普通用户侧

**F6 分类层级浏览**
- 首页按 `等级 → 作品系列 → 型号` 三级导航；每级展示卡片/列表，型号卡片显示盒绘图与名称。

**F7 关键字搜索**
- 按型号名、型号编号、作品名搜索；支持模糊匹配；结果直达型号取件表页。

**F8 取件表查看**
- 型号详情页展示取件表，提供两种视图切换：
  - **总表视图（核心）**：按板件分组，列出每板件颜色、所有剪口号与数量，含"零件总数"统计（按统计口径计算）；
  - **步骤视图（降级）**：按拼装步骤顺序列出，每步显示页码与所需零件清单；若某型号步骤数据不完整，可仅提供总表视图。
- **不向普通用户展示原版 PDF 页面**（版权考量，原页仅管理员复核时可见）。
- 响应式布局，移动端友好（拼装时多用手机/平板对照）。

> MVP 不含：用户登录、勾选已取/缺件、收藏、缺件清单导出。这些列入后续版本（见第八节）。

---

## 六、技术架构

- **前端 + 后端**：Next.js（App Router）+ TypeScript，Server Actions / Route Handlers 提供 API。包管理器用 pnpm。
- **数据库**：Postgres + Prisma ORM。搜索 MVP 用 `ILIKE` 模糊匹配（型号名/编号/作品名），暂不引入中文分词全文检索。
- **文件存储（对象存储为准）**：**Cloudflare R2**（S3 兼容、无出流量费）私有 bucket 存 PDF 原件与盒绘图。
  - 复核界面通过 R2 **签名 URL** 把 PDF 原页展示给管理员（满足"仅管理员可见"）。
  - 识别时把同一个签名 URL 作为 PDF 源传给 Claude（见下）。**Claude Files API 留作可选降本项**——它能托管文件供模型多次引用，但**用户上传的文件不能下载回前端**，无法独立支撑复核界面，故不作主存储。
- **识别服务**：Anthropic Claude API，模型默认 **`claude-opus-4-8`**（提取准确率最高；高量产可降级到 `claude-sonnet-4-6`）。
  - **PDF 原生识别**：Claude 直接读取 PDF 文档（URL / base64 / file_id 源），**无需 PDF→图像转换**（省去 Ghostscript/GraphicsMagick 等原生依赖，利于部署）。单次请求 PDF 有页数/大小上限（约 100 页 / 32MB 量级，开发时按当时官方文档确认），超长说明书分批。
  - **结构化输出**：用 `messages.parse()` + Zod（`zodOutputFormat`）对应附录 B 的 Schema，SDK 层自动校验、不符自动重试，免手动解析。
  - **Prompt Caching**：总表 pass 与步骤 pass 是对同一 PDF 的两遍提取，给 document 块加 `cache_control`，第二遍按缓存读计费（~0.1×）降本。
  - 大输出需 streaming（`max_tokens` 较大时）。
- **后台任务**：识别为异步任务，用**托管队列（Inngest / Trigger.dev）**承载几分钟级长耗时调用，提供重试与状态追踪；前端轮询展示 `recognizeStatus`。（避免 Vercel Serverless 函数执行时长上限的冲突。）
- **鉴权**：管理员用 NextAuth（单管理员也可简化为凭据 + 签名 Cookie）；普通用户路由无需鉴权。
- **部署**：Vercel + 托管 Postgres（Neon / Supabase）+ Cloudflare R2 + 托管队列。

---

## 七、关键流程

### 7.1 管理员：从 PDF 到发布
```
登录 → 新建/选择型号 → 上传 PDF → 触发识别(异步)
     → 查看识别进度 → 进入复核界面(原页 vs 结构化数据)
     → 修正/确认 → 全部复核 → 发布 → 普通用户可见
```

### 7.2 普通用户：找到并查看取件表
```
首页 → 选等级 → 选作品系列 → 选型号    （或：搜索关键字 → 型号）
     → 型号详情页 → 切换[总表 / 按步骤]视图查看取件表
```

---

## 八、范围与后续版本

**MVP（本期）**：F1–F8 全部；高达品类；多模态识别 + 人工复核；匿名浏览。

**后续版本候选**：
- 用户登录 + 云端"勾选已取/缺件"状态同步（已确认本期不做）；
- 取件表导出（PDF / 打印友好 / 缺件清单）；
- 收藏与拼装进度；
- 扩展到军事/汽车模型（数据模型字段已预留可扩展性）；
- 识别质量看板与批量复核工具。

---

## 九、验收标准（MVP）

1. 管理员上传一本真实 Gunpla PDF，识别任务能完成并产出结构化草稿；
2. 复核界面可对照原页修改板件/零件/步骤数据并发布；
3. 普通用户可通过三级分类与搜索两种方式定位到该型号；
4. 型号详情页可正确显示总表视图；若有步骤数据，可切换步骤视图，数据与总表口径一致；
5. 移动端可正常浏览查看；
6. **总表字段级准确率**抽样 ≥ 90%（不足部分由复核兜底）；
7. **步骤映射不设硬性准确率指标**，验收以"复核工具能否高效补全/修正步骤数据"为准。

---

## 十、版权与合规

- 原版 PDF 说明书**仅管理员内部可见**，用于识别与复核，**不向普通用户展示原页**。
- 对普通用户仅展示**提取后的结构化取件表数据**（板件、剪口号、数量等事实性信息），以降低版权风险。
- 平台当前定位为先做 MVP 验证；若后续转为面向公众的运营平台，需重新评估版权合规（如取得授权或进一步限制内容范围）。

### 资产分层与存储归属（重要）
风险载体是 PDF 文件本身，而非"代码仓库"。三类资产严格分开存放：

| 资产 | 版权风险 | 存放位置 |
|---|---|---|
| 平台代码 | 无 | **公开 git 仓库**（开源） |
| 官方 PDF 原件 | 高 | **对象存储**（私有 bucket + 平台鉴权）。**严禁提交进任何 git 仓库**（即使私有）——既因二进制大文件不适合 git，也因上传至第三方仍属复制行为 |
| 提取后的取件表数据 | 低（事实性信息） | **数据库**。MVP 不单独建数据仓库 |

> `.gitignore` 已忽略 `*.pdf`、`/uploads/`、`/storage/`、`.env*` 作为兜底，防止误提交版权内容与密钥。

---

## 附录 A：分类初始种子数据

> 建库时可直接导入，后续在"分类管理（F5）"中增删改。`sortOrder` 数字越小越靠前。

### A.1 Grade（等级）
| name | sortOrder | 说明 |
|---|---|---|
| SD | 10 | Super Deformed，Q 版 |
| EG | 20 | Entry Grade，入门 |
| HG | 30 | High Grade，1/144 主力 |
| RG | 40 | Real Grade，1/144 高细节 |
| MG | 50 | Master Grade，1/100 |
| PG | 60 | Perfect Grade，1/60 旗舰 |
| FM | 70 | Full Mechanics，1/100 |
| 其他 | 99 | 兜底分类 |

### A.2 Series（作品系列，挂在某 Grade 下；同名系列可在多个 Grade 各建一条）
| name | 备注 |
|---|---|
| UC（宇宙世纪） | 0079 / Z / ZZ / 逆袭的夏亚 / 独角兽 等 |
| SEED | SEED / SEED Destiny |
| 00（Double O） | 机动战士高达 00 |
| Wing（飞翼） | 新机动战记 W |
| 铁血的奥尔芬斯 | 铁血 |
| 水星的魔女 | 最新世代 |
| 雷霆宙域 | Thunderbolt |
| 创战者系列 | Build Fighters / Build Divers |
| 其他/原创 | 兜底分类 |

> 说明：实际 `Series` 与 `Grade` 是一对多（A.2 的系列会按需挂到对应等级下）。导入脚本可生成"常见 Grade × Series"组合，无对应实物的组合不建。

---

## 附录 B：识别提取 JSON Schema（F2 约定）

> 多模态模型须通过结构化输出（tool / JSON Schema）返回此结构，保证可解析。字段与第四节数据模型对齐。

```json
{
  "type": "object",
  "required": ["modelKit", "runners"],
  "properties": {
    "modelKit": {
      "type": "object",
      "properties": {
        "name":  { "type": "string", "description": "型号名称，如 RX-78-2 高达" },
        "code":  { "type": "string", "description": "型号编号，可空" },
        "scale": { "type": "string", "description": "比例，如 1/144，可空" }
      }
    },
    "runners": {
      "type": "array",
      "description": "板件列表（核心，准确率优先）",
      "items": {
        "type": "object",
        "required": ["label", "parts"],
        "properties": {
          "label": { "type": "string", "description": "板件编号，如 A / B / C" },
          "color": { "type": "string", "description": "注塑颜色，如 白 / 灰，可空" },
          "count": { "type": "integer", "description": "同款板件张数，默认 1" },
          "parts": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["gateNo", "quantity"],
              "properties": {
                "gateNo":   { "type": "string",  "description": "剪口编号，如 A-3" },
                "quantity": { "type": "integer", "description": "单张板件上该零件数量" },
                "note":     { "type": "string",  "description": "备注，可空" }
              }
            }
          }
        }
      }
    },
    "steps": {
      "type": "array",
      "description": "拼装步骤（降级：尽力而为，可为空数组）",
      "items": {
        "type": "object",
        "required": ["stepNo", "parts"],
        "properties": {
          "stepNo": { "type": "integer", "description": "步骤序号" },
          "pageNo": { "type": "integer", "description": "对应说明书页码，可空" },
          "parts": {
            "type": "array",
            "description": "该步用到的零件",
            "items": {
              "type": "object",
              "required": ["gateNo", "quantity"],
              "properties": {
                "gateNo":   { "type": "string",  "description": "引用 runners 中的剪口编号" },
                "quantity": { "type": "integer", "description": "该步该零件用量" }
              }
            }
          }
        }
      }
    },
    "confidence": {
      "type": "object",
      "description": "模型自评置信度，供复核排序参考",
      "properties": {
        "runners": { "type": "number", "description": "0~1" },
        "steps":   { "type": "number", "description": "0~1" }
      }
    }
  }
}
```

**落库映射说明：**
- `steps[].parts[].gateNo` 通过剪口号关联到已入库的 `Part`，生成 `StepPart`；找不到对应零件时标记为"待复核"，不丢弃。
- `confidence` 仅用于复核界面排序（低置信度优先人工查看），不写入业务表。
- 长文档分页识别时，按页返回片段，后端合并同 `label` 板件、按 `stepNo` 归并步骤。
