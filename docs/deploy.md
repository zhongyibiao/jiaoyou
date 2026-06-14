# 部署文档

> 项目：jiaoyou
> 编写日期：2026-06-14
> 适配后端栈：Node.js 20 + Express 4 + MySQL 8.0 + Socket.io 4（单端口 3000 同时承载 HTTP + WS）

---

## 一、环境要求

### 1.1 操作系统

| 环境 | 版本 |
|------|------|
| 开发 | macOS 13+ / Ubuntu 22.04+ |
| 生产 | Ubuntu 22.04 LTS / Alibaba Cloud Linux 3 |
| 容器 | Docker 24+ |

### 1.2 运行时（与后端实际栈对齐）

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | 20 LTS（≥18） | API + Socket.io 单进程 |
| MySQL | 8.0+ | 主库，字符集 utf8mb4 |
| Redis | 7+ | **可选**，当前实现未强依赖；扩缩容时建议加 |
| Nginx | 1.24+ | 反向代理 + 静态资源 + HTTPS |
| PM2 | 5+ | 进程管理与零停机发布 |

### 1.3 端口规划

| 端口 | 服务 | 备注 |
|------|------|------|
| 80 / 443 | Nginx | 对外 |
| 3000 | API + Socket.io | 内网，单进程（`http.createServer(app)` 复用） |
| 3306 | MySQL | 仅本机 |
| 6379 | Redis | 仅本机（可选） |

> 注意：后端用 `http.createServer(app)` 复用同一 server，Socket.io 路径 `/socket.io/` 也走 3000 端口，Nginx 只需一个 upstream。

### 1.4 关键约束（来自 backend-architect）

| 约束 | 说明 |
|------|------|
| **Socket.io / HTTP 同进程** | 都监听 3000，路径 `/socket.io/`；客户端 `io(url, { path: '/socket.io/' })` |
| **CORS** | `CLIENT_ORIGIN` 必须与前端域名**完全一致**（含协议），否则跨域失败 |
| **WebSocket 反代** | Nginx 需透传 `Upgrade` / `Connection: upgrade` 头（已配置） |
| **JWT_SECRET** | 必须用强随机串（≥64 字符），泄漏后立即吊销；HTTP 与 Socket.io 共享同一密钥（`src/sockets/chat.js:9-22`） |

---

## 二、目录结构

```
/opt/jiaoyou
├── server                  # 后端
│   ├── src
│   │   ├── app.js          # HTTP + Socket.io 入口
│   │   ├── config.js
│   │   ├── controllers
│   │   ├── routes
│   │   ├── middleware
│   │   ├── sockets
│   │   └── utils
│   ├── db
│   │   ├── init.sql        # 表结构（幂等 CREATE IF NOT EXISTS）
│   │   └── indexes.sql     # 索引（性能优化）
│   ├── uploads/avatars/    # 头像上传（建议改 OSS）
│   ├── nginx/jiaoyou.conf
│   ├── scripts/deploy.sh
│   ├── .env                # 生产环境变量
│   └── package.json
├── client                  # 前端
│   ├── src
│   ├── .env.production
│   └── package.json
└── logs
```

---

## 三、部署步骤

### 3.1 系统初始化

```bash
# Ubuntu 22.04
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server redis-server

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 3.2 MySQL 初始化

```bash
sudo mysql_secure_installation
sudo mysql <<'SQL'
CREATE DATABASE IF NOT EXISTS `jiaoyou` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'jiaoyou'@'127.0.0.1' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON `jiaoyou`.* TO 'jiaoyou'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
```

### 3.3 后端部署

```bash
cd /opt/jiaoyou/server
npm ci --production
cp .env.example .env
# 编辑 .env 填入 DB_*/JWT_SECRET/CLIENT_ORIGIN/UPLOAD_DIR

# 初始化表结构 + 索引
mysql -h127.0.0.1 -ujiaoyou -p jiaoyou < db/init.sql
mysql -h127.0.0.1 -ujiaoyou -p jiaoyou < db/indexes.sql

# PM2 启动
pm2 start src/app.js --name jiaoyou-api
pm2 save
pm2 startup
```

### 3.4 前端构建

```bash
cd /opt/jiaoyou/client
npm ci
# 配置 .env.production
cat > .env.production <<EOF
VITE_API_BASE_URL=https://api.jiaoyou.example.com
VITE_SOCKET_URL=https://api.jiaoyou.example.com
VITE_CDN_DOMAIN=https://cdn.jiaoyou.example.com
EOF
npm run build        # 产物在 dist/
sudo cp -r dist/* /var/www/jiaoyou/
```

### 3.5 Nginx 配置

```bash
sudo ln -s /opt/jiaoyou/server/nginx/jiaoyou.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/jiaoyou.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

完整配置见 `server/nginx/jiaoyou.conf`，要点：

- **`/health` 直返**：可做 LB 健康检查
- **`/socket.io/` 透传 Upgrade 头**：`proxy_read_timeout 86400s`
- **`/api/` 业务接口**：30s 超时
- **`/static/`** 头像/上传文件代理到 API（生产建议替换为 OSS / CDN）
- **HSTS / X-Frame-Options / X-Content-Type-Options** 安全头齐备

> **TODO**: `/static/avatars/` 当前走 Nginx 反代到 API 进程，磁盘 IO 与 API 实例绑定。生产规模上来后替换为 OSS / S3 + CDN，标签 `replace with OSS/S3`。替换时同步去掉 Nginx `/static/` 反代段，让前端 `VITE_CDN_DOMAIN` 直出。

### 3.6 HTTPS 证书

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d jiaoyou.example.com -d api.jiaoyou.example.com
# 自动续期已配置到 systemd timer
```

---

## 四、环境变量

后端 `.env`（与 `server/.env.example` 对齐）：

```bash
NODE_ENV=production
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=jiaoyou
DB_PASSWORD=STRONG_PASSWORD
DB_NAME=jiaoyou

JWT_SECRET=please-change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d

CLIENT_ORIGIN=https://jiaoyou.example.com
UPLOAD_DIR=uploads/avatars
MAX_UPLOAD_SIZE=2097152
```

前端 `client/.env.production`：

```bash
VITE_API_BASE_URL=https://api.jiaoyou.example.com
VITE_SOCKET_URL=https://api.jiaoyou.example.com
VITE_CDN_DOMAIN=https://cdn.jiaoyou.example.com
```

> 安全项 `helmet` 已默认开启（X-DNS-Prefetch-Control / X-Content-Type-Options / X-Frame-Options 等）；CORS 已按 `CLIENT_ORIGIN` 严格限制；全局限流 300 req/min/IP（`express-rate-limit`）。

### 4.1 JWT_SECRET 生成

```bash
# 三选一，生成后立即写入 .env 并 chmod 600
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
openssl rand -base64 48
head -c 48 /dev/urandom | base64
```

### 4.2 Socket.io 鉴权（实现位于主项目）

> **参考实现，与服务端 `src/sockets/chat.js` 等价**。本文档不再贴实现代码，避免与主项目双向维护。客户端按此规范对接。

| 能力 | 主项目位置 |
|------|-----------|
| JWT 鉴权（handshake `auth.token`） | `src/sockets/chat.js:9-22`（`io.use` 中间件，HS256 + `config.jwt.secret`） |
| 房间机制 | `src/sockets/chat.js:30-50`（`match:join/leave` → `match:{id}` 房间） |
| 消息发送 + 广播 | `src/sockets/chat.js:52-86`（持久化后 `io.to(matchId).emit('message:new')` 双方广播） |
| 已读回执 | `src/sockets/chat.js:88-95` |
| 错误处理 | 缺/错 token 时 `next(new Error(...))`，客户端收到 `Error: invalid token` 后断开 |

**客户端对接规范：**

```ts
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  path: '/socket.io/',                  // 必填，与服务端默认一致
  auth: { token: localStorage.getItem('token') },  // 必填，handshake 时携带
  transports: ['websocket', 'polling'], // 先 WS，不行回退 polling
});
```

**未来扩展（暂不实现）：**
- 多实例 WS 同步 → 引入 `@socket.io/redis-adapter`，需改造 `src/sockets/chat.js`
- 当前单进程 :3000 承载 HTTP + WS 足够（8 核 16G 约 5~8 万 WS 并发）

---

## 五、监控 & 运维

### 5.1 健康检查

```bash
curl https://api.jiaoyou.example.com/health
# {"status":"ok"}
```

### 5.2 日志

- API 日志：PM2 收集到 `~/.pm2/logs/`
- Nginx 日志：`/var/log/nginx/`
- 应用日志建议接入 ELK / Loki

### 5.3 监控指标

| 指标 | 工具 | 告警阈值 |
|------|------|----------|
| API p99 延迟 | Prometheus + Grafana | > 500ms |
| 错误率 | Prometheus | > 1% |
| CPU / 内存 | node_exporter | > 80% |
| DB 连接数 | mysqld_exporter | > 80% pool |
| Socket.io 连接数 | 自定义 metric | > 80% capacity |

### 5.4 备份

```bash
# 数据库每日全量
mysqldump -ujiaoyou -p --single-transaction --routines --triggers jiaoyou \
  | gzip > /backup/jiaoyou-$(date +%F).sql.gz
# 保留 30 天，异地同步到 OSS
```

### 5.5 滚动发布

```bash
bash /opt/jiaoyou/server/scripts/deploy.sh
# 等价于：git pull → npm ci → DB migrate → pm2 reload → npm run build → rsync dist → nginx reload
```

---

## 六、容量规划

| DAU | API 实例 | DB | 带宽 |
|-----|----------|----|----|
| 1 万 | 1 × 2C4G | 1 × 4C8G | 50 Mbps |
| 10 万 | 2 × 4C8G | 1 主 1 从 8C16G | 200 Mbps |
| 100 万 | 8 × 8C16G + Redis 集群 | 1 主 2 从 16C64G | 1 Gbps |

> 单进程承载 HTTP + WS 的瓶颈在 8 核 16G 大约 5~8 万 WS 并发；超此规模需把 Socket.io 拆到独立进程 + Redis adapter。

---

## 七、回滚

```bash
# API
pm2 reload jiaoyou-api
# 紧急回滚到上一版本
git checkout HEAD~1 -- server/
cd server && pm2 reload jiaoyou-api

# 前端
sudo rsync -a --delete /var/www/jiaoyou-backup/ /var/www/jiaoyou/
```

---

## 八、常见问题

**Q: Socket.io 连接断开？**
A: 检查 Nginx `proxy_read_timeout` 是否足够（建议 86400s），确认 `Upgrade` / `Connection` 头透传。

**Q: 头像上传 413？**
A: `client_max_body_size` 调到 4m+；同时确认 `MAX_UPLOAD_SIZE` ≥ 前端限制。

**Q: MySQL 连接耗尽？**
A: `mysql2` 默认 pool 10，单实例 10 连接 + 后台任务；多实例部署按需调整 `connectionLimit`。

**Q: 静态资源 404？**
A: 确认 `root` 路径正确，Nginx 用户有读权限（`chmod -R 755 /var/www/jiaoyou`）。

**Q: CORS 跨域失败？**
A: 后端 `CLIENT_ORIGIN` 必须与前端实际域名完全一致（含协议，不带尾部斜杠）。多环境时逗号分隔后端需做白名单逻辑。

**Q: WebSocket 握手 400/403？**
A: 检查 `auth.token` 是否带正确 JWT；Nginx 是否 1.24+；检查 `proxy_http_version 1.1` 是否设置。

**Q: JWT 校验失败 invalid signature？**
A: 多实例共享 `JWT_SECRET`；滚动发布时不要更换 SECRET（会令所有 token 失效）。
