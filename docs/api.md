# jiaoyou API 接口文档

> Base URL: `http://<host>:3000`
> 统一响应：`{ "code": 0, "message": "ok", "data": ... }`；失败时 `code` 为业务错误码，`HTTP status` 与错误级别对齐。

## 0. 鉴权
除 `/api/auth/*` 与 `/health` 外，其余接口需要在请求头携带 JWT：

```
Authorization: Bearer <token>
```

注册/登录成功后返回的 `token` 即为 JWT；默认有效期 7 天。Socket.io 连接时通过 `auth.token` 或 `?token=` 传入。

### 通用错误码
| code | http | 含义 |
| ---- | ---- | ---- |
| 40001 | 400  | 参数校验失败 |
| 40101 | 401  | 缺少 token |
| 40102 | 401  | token 无效或过期 |
| 40310 | 403  | 非参与者，无权访问 |
| 40400 | 404  | 路由不存在 |
| 40401-40405 | 404 | 资源不存在 |
| 40910 | 409  | 手机号已注册 |
| 42900 | 429  | 触发限流 |
| 50000 | 500  | 服务异常 |

---

## 1. 鉴权 Auth

### 1.1 注册 `POST /api/auth/register`
Body:
```json
{ "phone": "13800000000", "email": "a@b.com", "password": "abcdef12" }
```
- `phone` 必填，正则 `^1[3-9]\d{9}$`
- `password` 必填，长度 ≥ 8
- `email` 可选，必须是合法邮箱

Response `data`:
```json
{ "token": "<jwt>", "user": { "id": 1, "phone": "13800000000", "email": "a@b.com" } }
```

### 1.2 登录 `POST /api/auth/login`
Body: `{ "phone": "13800000000", "password": "abcdef12" }`
Response：同 1.1。

### 1.3 当前用户 `GET /api/auth/me`
需要 JWT。返回字段同 2.1（不含 phone/email）。前端可在刷新时用于重新水合用户资料。

---

## 2. 用户 Users

### 2.1 我的资料 `GET /api/users/me`
Response `data`:
```json
{
  "id": 1, "nickname": "...", "avatar": "/static/avatars/x.jpg",
  "gender": 1, "birthday": "2000-01-01", "bio": "...",
  "province": "北京", "city": "北京", "interests": ["music","travel"],
  "last_active": "2026-06-14 12:00:00"
}
```
`gender`: 0 unknown, 1 male, 2 female。

### 2.2 修改资料 `PUT /api/users/me`
Body 字段均可选：`nickname, gender, birthday, bio, province, city, interests`
`interests` 传数组或 JSON 字符串；后端会做 XSS 清理与长度限制。

### 2.3 上传头像 `POST /api/users/avatar`
- `Content-Type: multipart/form-data`
- 字段 `file`，类型 `image/jpeg|png|webp`，大小 ≤ 2MB（默认）。
Response `data`：`{ "avatar": "/static/avatars/u1_xxx.jpg" }`
可访问 URL：`http://<host>:3000/static/avatars/u1_xxx.jpg`

### 2.4 查看他人 `GET /api/users/:id`
返回字段同 2.1（不含 phone/email）。

### 2.5 拉黑 `POST /api/users/block`
Body：`{ "blocked_id": 2 }`

### 2.6 举报 `POST /api/users/report`
Body：`{ "reported_id": 2, "reason": "..." }`

---

## 3. 匹配 Match

### 3.1 推荐 `GET /api/match/recommendations?limit=20`
返回排除：自己、已滑过、被自己/对方拉黑的用户，按 `last_active` 倒序。
默认 20，最大 50。

### 3.2 滑动 `POST /api/match/swipe`
Body：`{ "swiped_id": 2, "action": 1 }`，`action`: 1 like, 2 pass。
Response:
```json
{ "matched": true, "match_id": 5, "peer_id": 2 }
```
当且仅当对方也 like 过你时 `matched=true`，并创建一条 `matches` 记录。

### 3.3 我的匹配列表 `GET /api/match/matches`
Response `data` (数组):
```json
[
  {
    "match_id": 5,
    "peer": { "id": 2, "nickname": "...", "avatar": "..." },
    "last_message": "hi",
    "last_message_at": "2026-06-14 12:30:00",
    "unread": 3,
    "matched_at": "2026-06-14 12:00:00"
  }
]
```

---

## 4. 消息 Messages

### 4.1 获取会话消息 `GET /api/messages/:matchId?before_id=&limit=30`
- 只能拉取自己作为参与者的 match。
- 默认按时间正序返回最新 `limit` 条；用 `before_id` 翻页。
- 该接口会顺带把对方未读消息标记为已读。

Response `data`：消息数组：
```json
[
  { "id": 1, "match_id": 5, "sender_id": 2, "content": "hi",
    "content_type": 1, "read_at": null, "created_at": "..." }
]
```
`content_type`: 1 text, 2 image, 3 system。

### 4.2 发送消息 `POST /api/messages`
Body：`{ "match_id": 5, "content": "hi", "content_type": 1 }`
- HTTP 同步接口；实时推送建议走 Socket.io。

### 4.3 未读汇总 `GET /api/messages/unread`
Response `data`:
```json
{
  "total": 5,
  "by_match": [ { "match_id": 5, "unread": 3 }, { "match_id": 8, "unread": 2 } ]
}
```

---

## 5. Socket.io 实时聊天

### 5.1 连接
```js
const socket = io('http://<host>:3000', { auth: { token: '<jwt>' } });
```
鉴权失败会断开连接并收到 `Error: invalid token`。

### 5.2 事件

#### 客户端 → 服务端
| 事件 | payload | 说明 |
| ---- | ------- | ---- |
| `match:join` | `{ match_id }` | 进入会话房间，回调 `{ ok, error? }` |
| `match:leave` | `{ match_id }` | 离开房间 |
| `message:send` | `{ match_id, content, content_type? }` | 发送消息；服务端会持久化并广播 `message:new` |
| `message:read` | `{ match_id }` | 把对方消息标记为已读 |
| `typing` | `{ match_id }` | 通知对端正在输入 |

#### 服务端 → 客户端
| 事件 | payload | 说明 |
| ---- | ------- | ---- |
| `connected` | `{ user_id }` | 连接成功 |
| `message:new` | 消息对象 | 新消息（含自己发的，便于多端同步） |
| `message:read` | `{ match_id, reader_id }` | 对端已读 |
| `typing` | `{ match_id, user_id }` | 对端正在输入 |

---

## 6. 安全策略
- **JWT**：`HS256`，默认 7d；`JWT_SECRET` 由环境变量注入。
- **密码**：bcrypt（cost=10）单向哈希。
- **XSS**：所有用户文本字段经 `xss` 过滤；头像走 multipart + mime 白名单。
- **限流**：
  - `/api/auth/*` 每 IP 每 15 分钟 20 次
  - `/api/match/swipe` 每 IP 每分钟 120 次
  - 全局默认每 IP 每分钟 300 次
- **CORS**：默认允许 `CLIENT_ORIGIN`；生产环境务必改成真实前端域名。
- **Helmet**：默认开启安全响应头。
- **输入校验**：`express-validator` 校验关键字段；服务侧再做一次业务校验。

## 7. 文件上传
- 默认本地存储：`server/uploads/avatars/`。
- 通过 `MAX_UPLOAD_SIZE` 控制上限（默认 2MB）。
- 静态访问路径：`/static/avatars/<filename>`。
- 生产环境建议替换为对象存储（OSS/S3），保留签名 URL + CDN。

## 8. 数据库
- 见 `server/db/init.sql`，7 张表：`users, profiles, swipes, matches, messages, reports, blocks`。
- `matches` 使用 `user_a_id < user_b_id` 的规范顺序避免重复。
- 所有大表均带必要索引；外键 `ON DELETE CASCADE` 保证清理一致。

## 9. 环境变量
见 `server/.env.example`。生产部署请确保：
- `JWT_SECRET` 使用长随机字符串
- `CLIENT_ORIGIN` 设置为前端域名
- `DB_*` 配置独立数据库账号（最小权限）