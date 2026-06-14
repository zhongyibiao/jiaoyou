# 外部服务接口预留（可选模块）

本目录为功能强化预留的外部服务接口，与后端主项目（`src/`）解耦，**默认不挂载到主路由**，按需启用。

## 包含文件

| 文件 | 作用 | 默认状态 |
|------|------|----------|
| `sms.service.js` | 短信（阿里云/腾讯云/Twilio） | mock |
| `storage.service.js` | 图片存储（OSS/COS/S3/七牛） | mock |
| `push.service.js` | 推送（极光/FCM/APNs/个推） | mock |
| `cache.service.js` | Redis 缓存 | 未启用 |
| `recommend.service.js` | 推荐/滑卡池 | 未启用 |

## 启用方式

1. 装 SDK：`npm i @alicloud/dysmsapi-core ali-oss jpush-sdk firebase-admin`
2. 取消 `sms.service.js` / `storage.service.js` / `push.service.js` 内对应 provider 分支的注释
3. 在 `.env` 中填入凭据
4. 在 `src/controllers/` 中编写 controller 调用本 service
5. 在 `src/routes/` 中挂载路由

## 主项目当前实际架构（backend-architect 已实现）

- 单进程：`src/app.js` 启动 HTTP + Socket.io
- 数据库：MySQL 8，schema 在 `db/init.sql` + `db/indexes.sql`
- 鉴权：JWT（`middleware/auth.js`）
- 安全：helmet + CORS + express-rate-limit
- 限流：全局 300 req/min/IP
- 上传：multer → `uploads/avatars/`
- 文件：multer + xss 清洗

## 重要

- `controllers/`、`models/`、`middlewares/`、`routes/`、`utils/`（在 `server/` 根下）是本模块的代码，**不会**与 `src/` 下的同名目录冲突，**不会**自动加载。
- `db/indexes.sql` 已重写为 MySQL 8 语法，deploy.sh 在发布时会自动应用。
- `nginx/jiaoyou.conf` + `scripts/deploy.sh` 已对齐单端口 3000（HTTP + WS 同进程）部署。
