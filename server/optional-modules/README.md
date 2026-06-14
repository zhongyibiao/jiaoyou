# optional-modules（可选模块）

> **状态（2026-06-14 决策）：保留为参考，不合入主代码，不挂载。**
> 等真实用户反馈某能力缺失时再单独评估（避免后端先造孤岛 API）。
> 详见：[`DIFFERENCES.md`](./DIFFERENCES.md) §5 决策结果。

本目录是「功能强化」阶段产出的代码参考，与后端主项目（`src/`）完全解耦：

```
server/
├── src/                  # 主项目（backend-architect 维护）
├── db/                   # 主项目 SQL（init.sql + indexes.sql）
├── nginx/                # 主项目部署配置
├── scripts/              # 主项目部署脚本
├── optional-modules/     # 本目录：可选模块（devops-deploy 产出）
│   ├── controllers/      # 隐私/拉黑/举报 controller（带 reason/列表/审核/24h 去重）
│   ├── models/           # 对应 model 定义
│   ├── middlewares/      # auth / rate-limit / cache 中间件
│   ├── routes/           # security.routes.js
│   ├── services/         # 短信/存储/推送/缓存/推荐 service
│   ├── utils/            # logger / store
│   ├── services/README.md  # 旧 README
│   └── DIFFERENCES.md    # 与主实现的差异点对比 + 决策项
└── uploads/              # 主项目上传目录
```

## 启用方式

1. 阅读 [`DIFFERENCES.md`](./DIFFERENCES.md) 了解与主实现的差异
2. 决策需要合入哪些功能
3. 装依赖：`npm i @alicloud/dysmsapi-core ali-oss jpush-sdk firebase-admin ioredis`
4. 取消 service 内对应 provider 分支的注释
5. 在 `src/controllers/` 中编写 controller 调用本 service，或将本目录 controller 改造后并入
6. 在 `src/routes/` 中挂载路由

## 主项目当前实际架构（backend-architect 已实现）

- 单进程：`src/app.js` 启动 HTTP + Socket.io（端口 3000）
- 数据库：MySQL 8，schema 在 `db/init.sql` + `db/indexes.sql`
- 鉴权：JWT（`src/middleware/auth.js`）
- 安全：helmet + CORS（按 `CLIENT_ORIGIN` 白名单）+ express-rate-limit（300 req/min/IP）
- 上传：multer → `uploads/avatars/`
- 拉黑/举报：已存在 `src/controllers/userController.js:blockUser / reportUser`，路由 `/api/users/block`、`/api/users/report`
- Socket.io：复用 HTTP server，路径 `/socket.io/`，handshake 时 `auth.token` 携带 JWT

## 重要

- `optional-modules/**` **不会**被 `src/app.js` 自动加载
- `db/indexes.sql` 已重写为 MySQL 8 语法，`scripts/deploy.sh` 在发布时会自动应用
- `nginx/jiaoyou.conf` + `scripts/deploy.sh` 已对齐单端口 3000（HTTP + WS 同进程）部署
