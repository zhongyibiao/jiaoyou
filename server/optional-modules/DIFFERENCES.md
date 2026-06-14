# 可选模块与主实现差异点对比

> 目的：让 backend-architect 决定 server/optional-modules/{controllers,models}/* 是否替换、共存或删除
> 状态：未挂载，未启用

## 1. Block（拉黑）

| 维度 | 主实现（src/） | 可选模块（optional-modules/） |
|------|---------------|------------------------------|
| 路由 | `POST /api/users/block` | `POST /api/blocks`、`DELETE /api/blocks`、`GET /api/blocks` |
| 控制器 | `src/controllers/userController.js:blockUser` | `optional-modules/controllers/block.controller.js:block` |
| 表 | `blocks(blocker_id, blocked_id)` | 同 `blocks`，字段命名一致 |
| 入参 | `{ blocked_id }` | `{ blocked_id, reason }`（多了 reason） |
| 副作用 | 无 | 同步清理 Redis 滑卡池（`swipe:candidate:{userId}`） |
| 列表 | ❌ 无 | ✅ `GET /api/blocks` 返回分页 |
| 解除 | ❌ 无（依赖 SQL 手动） | ✅ `DELETE /api/blocks` |
| 24h 去重 | ❌ 无 | ❌ 无（仅靠 `UNIQUE KEY uk_blocks_pair` 兜底） |

**差异点：**
- 选模块增加了 `reason` 字段（表里没存，存哪儿？）
- 选模块增加了 `GET / DELETE` 列表/解除接口
- 选模块假定存在 Redis（主实现未强依赖）

## 2. Report（举报）

| 维度 | 主实现（src/） | 可选模块（optional-modules/） |
|------|---------------|------------------------------|
| 路由 | `POST /api/users/report` | `POST /api/reports`、`GET /api/reports`、`PUT /api/reports/:id/review` |
| 控制器 | `src/controllers/userController.js:reportUser` | `optional-modules/controllers/report.controller.js:createReport` |
| 表 | `reports(reporter_id, reported_id, reason, status)` | 同 `reports` |
| 入参 | `{ reported_id, reason? }` | `{ target_type, target_id, reason, description?, evidence? }` |
| target_type | ❌ 只支持 user | ✅ user / moment / message / comment |
| reason 枚举 | ❌ 自由文本 max 500 | ✅ 8 种枚举（harassment/fraud/porn/spam/fake_info/underage/hate/other） |
| description/evidence | ❌ 无 | ✅ 有 |
| 24h 去重 | ❌ 无 | ✅ 同一 reporter × target 24h 一次 |
| 自动升级 | ❌ 无 | ✅ fraud/underage/hate → reviewing |
| 后台审核 | ❌ 无 | ✅ `PUT /api/reports/:id/review` |

**差异点（最大）：**
- 选模块用通用 `target_type + target_id`，可指向 user/moment/message/comment，**表结构不变**（仍可 `reported_id` 当 `target_id` 用）
- 选模块加 `description` 与 `evidence JSON` 字段——**表里没存**，需要 ALTER TABLE
- reason 改为枚举，需要前端配合（之前是自由文本）

## 3. Privacy（隐私设置）

| 维度 | 主实现（src/） | 可选模块（optional-modules/） |
|------|---------------|------------------------------|
| 路由 | ❌ 无 | `GET /api/privacy`、`PUT /api/privacy` |
| 表 | ❌ 无 `privacy` 表 | ✅ 需要新建 |
| 字段 | — | profile_visibility / show_distance / show_online / show_age / allow_stranger_msg / allow_search_by_phone / show_in_recommend / read_receipt |

**差异点（最大）：**
- 主实现**完全没有隐私设置模块**——选模块需要新建 `privacy` 表 + 加 8 个字段
- 涉及 profiles/users 两张表联合读取（隐私影响「谁能看到我」），改动面较大

## 4. 建议

| 优先级 | 建议 | 理由 |
|--------|------|------|
| **P1** | 保留主实现的 block / report，**不接入**可选模块 | 避免双实现；可选模块的「列表/解除/审核/24h 去重」是合理的演进方向，但需要先改表结构 + 文档 |
| **P1** | `description` 与 `evidence` 字段加到 `reports` 表 | ALTER TABLE 加 2 列，影响小 |
| **P2** | reason 改为枚举 + 前端联动 | 需前后端协同 |
| **P2** | 引入 privacy 表 + 8 个字段 | 影响推荐/搜索/匹配过滤，需较大改动 |
| **P3** | 接入 Redis 缓存（`cache.service.js` + `recommend.service.js`） | 与后端当前「不强依赖 Redis」原则有冲突；建议先做压力测试，再决定 |

## 5. 决策结果（backend-architect 2026-06-14 回复）

执行策略：**全部 4 项均不接入**，可选模块维持现状，挂在 `server/optional-modules/` 不挂载。

| # | 决策项 | 结论 | 理由 |
|---|--------|------|------|
| 1 | `reports` 加 `description` + `evidence` 字段 | ❌ 不 ALTER | 避免「字段写了但永远为 null」的脏数据；前端无对应输入 |
| 2 | reason 改为 8 种枚举 | ❌ 不改 | 需前后端联动重新发版，本期收益低；后端继续做长度校验（≤500）+ XSS 清理 |
| 3 | 新增 `privacy` 表 | ❌ 不建 | 前端 `/privacy` 已用 localStorage 兜底；如需云端同步另起一期「隐私设置中心」 |
| 4 | block 增强合入主 `userController.js` | ❌ 不合入 | 当前 `POST /api/users/block` 已满足产品诉求（INSERT IGNORE 去重）；解除拉黑等前端有 UI 时再评估 |

> 触发再评估的条件：**用户真实反馈某个能力缺失**。避免后端先造孤岛 API。

## 6. 文件清单（不动，仅供查阅）

```
server/
├── optional-modules/                 # 本目录 + 父级可选模块
│   ├── controllers/
│   │   ├── block.controller.js       # 选模块实现
│   │   ├── privacy.controller.js     # 选模块实现
│   │   └── report.controller.js      # 选模块实现
│   ├── models/
│   │   ├── block.model.js
│   │   ├── privacy.model.js
│   │   └── report.model.js
│   ├── middlewares/
│   │   ├── auth.middleware.js        # JWT 解析
│   │   ├── cache.middleware.js       # 响应缓存
│   │   └── rate-limit.middleware.js  # 滑窗限流
│   ├── routes/
│   │   └── security.routes.js        # 选模块路由
│   ├── services/
│   │   ├── sms.service.js            # 外部服务预留
│   │   ├── storage.service.js
│   │   ├── push.service.js
│   │   ├── cache.service.js
│   │   └── recommend.service.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── store.js                  # 内存 store 演示
│   └── DIFFERENCES.md                # 本文档
└── services/README.md                # 服务层边界说明
```
