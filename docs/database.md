# 数据库设计文档

> 项目：jiaoyou
> 编写日期：2026-06-14
> 目标库：**MySQL 8.0+**（主库，utf8mb4）、Redis 7+（可选缓存）、MongoDB（可选，日志/动态扩展）

---

## 一、ER 图

```
                            ┌──────────────┐
                            │   users      │
                            └──────┬───────┘
                                   │ 1:1
                            ┌──────┴───────┐
                            │  profiles    │
                            └──────┬───────┘
                                   │ 1:N
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        ┌─────┴─────┐        ┌─────┴─────┐        ┌─────┴─────┐
        │  photos   │        │ moments   │        │ interests │ M:N
        └───────────┘        └───────────┘        └─────┬─────┘
                                                         │
                                                   user_interests

   users ──< swipes >── users
   users ──< blocks >── users
   users ──< reports >── (users|moments|messages)
   matches ──< messages
```

---

## 二、表结构

### 2.1 users（用户账号）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| phone | VARCHAR(20) | UNIQUE | 手机号 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 哈希 |
| status | SMALLINT | DEFAULT 1 | 1=正常 2=禁用 3=注销 |
| last_login_at | TIMESTAMP | | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

### 2.2 profiles（用户资料）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | FK→users.id, UNIQUE | |
| nickname | VARCHAR(50) | | |
| avatar_url | VARCHAR(500) | | |
| gender | SMALLINT | | 1=男 2=女 3=未设置 |
| birthday | DATE | | |
| bio | VARCHAR(500) | | |
| location | GEOMETRY(Point, 4326) | | 经纬度 |
| city | VARCHAR(50) | | |
| height | SMALLINT | | cm |
| occupation | VARCHAR(100) | | |
| last_active_at | TIMESTAMP | | 用于活跃度排序 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

### 2.3 photos（相册）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | FK→users.id | |
| url | VARCHAR(500) | NOT NULL | |
| sort_order | SMALLINT | DEFAULT 0 | |
| audit_status | SMALLINT | DEFAULT 0 | 0=待审 1=通过 2=拒绝 |
| created_at | TIMESTAMP | | |

### 2.4 interests（兴趣标签）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| name | VARCHAR(50) | UNIQUE | |
| category | VARCHAR(50) | | 分类：运动/音乐/旅行… |

### 2.5 user_interests（用户-兴趣 关联）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| user_id | BIGINT | PK, FK→users.id | |
| interest_id | BIGINT | PK, FK→interests.id | |

### 2.6 swipes（滑动记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| swiper_id | BIGINT | FK→users.id | 滑动发起人 |
| swiped_id | BIGINT | FK→users.id | 被滑用户 |
| action | SMALLINT | | 1=喜欢 2=拒绝 3=超级喜欢 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

### 2.7 matches（匹配）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_a_id | BIGINT | FK→users.id | 始终 user_a_id < user_b_id |
| user_b_id | BIGINT | FK→users.id | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| last_message_at | TIMESTAMP | | 用于列表排序 |

UNIQUE(user_a_id, user_b_id)

### 2.8 messages（消息）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| match_id | BIGINT | FK→matches.id | |
| sender_id | BIGINT | FK→users.id | |
| content_type | SMALLINT | | 1=文字 2=图片 3=表情 4=语音 |
| content | TEXT | | |
| read_at | TIMESTAMP | | NULL=未读 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

### 2.9 moments（动态）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | FK→users.id | |
| content | TEXT | | |
| images | JSONB | | ["url1","url2"] |
| location | VARCHAR(100) | | |
| likes_count | INT | DEFAULT 0 | 冗余计数 |
| comments_count | INT | DEFAULT 0 | 冗余计数 |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | | 软删 |

### 2.10 privacy（隐私设置）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| user_id | BIGINT | PK, FK→users.id | |
| profile_visibility | VARCHAR(20) | DEFAULT 'public' | public/registered/matched |
| show_distance | BOOLEAN | DEFAULT true | |
| show_online | BOOLEAN | DEFAULT true | |
| show_age | BOOLEAN | DEFAULT true | |
| allow_stranger_msg | BOOLEAN | DEFAULT false | |
| allow_search_by_phone | BOOLEAN | DEFAULT false | |
| show_in_recommend | BOOLEAN | DEFAULT true | |
| read_receipt | BOOLEAN | DEFAULT true | |
| updated_at | TIMESTAMP | | |

### 2.11 blocks（黑名单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | FK→users.id | 发起人 |
| blocked_id | BIGINT | FK→users.id | 被拉黑 |
| reason | VARCHAR(200) | | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

UNIQUE(user_id, blocked_id)

### 2.12 reports（举报）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| reporter_id | BIGINT | FK→users.id | 举报人 |
| target_type | VARCHAR(20) | | user/moment/message/comment |
| target_id | BIGINT | | |
| reason | VARCHAR(30) | | 枚举见下 |
| description | TEXT | | 补充说明 |
| evidence | JSONB | | 截图、消息ID |
| status | VARCHAR(20) | DEFAULT 'pending' | pending/reviewing/resolved/rejected |
| reviewed_by | BIGINT | | 审核管理员 |
| reviewed_at | TIMESTAMP | | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

举报 reason 枚举：`harassment / fraud / porn / spam / fake_info / underage / hate / other`

---

## 三、索引策略

详见 `server/db/indexes.sql`。核心原则：

1. **复合索引遵循最左前缀**：`(user_id, created_at DESC)` 覆盖"按用户查最近"场景
2. **唯一索引替代应用层去重**：`UNIQUE(swiper_id, swiped_id)`、`UNIQUE(user_id, blocked_id)`
3. **空间索引支持 LBS**：`USING GIST(location)`，配合 `ST_DWithin` 做附近的人
4. **部分索引**：`messages WHERE read_at IS NULL`，减小索引体积
5. **JSONB GIN**：`moments.images` 复杂查询时按需添加

---

## 四、缓存策略

| 场景 | Key 模式 | 类型 | TTL |
|------|----------|------|-----|
| 滑卡候选池 | `swipe:candidate:{userId}` | ZSET | 30 min |
| 用户资料 | `profile:{userId}` | STRING(JSON) | 10 min |
| 匹配列表 | `match:list:{userId}` | ZSET | 5 min |
| 在线状态 | `online:user:{userId}` | STRING | 5 min |
| 验证码 | `sms:code:{phone}` | STRING | 5 min |
| 限流 | `rl:{api}:{userId}` | ZSET | 60 s |
| 滑动计数 | `counter:swipe:{userId}:{date}` | STRING | 7 d |
| 会话 | `session:{userId}` | HASH | 7 d |

---

## 五、数据生命周期

- 软删：moments、messages、photos 使用 `deleted_at` 字段
- 硬删：拉黑、滑动记录永久保留用于审计
- 归档：90 天前的消息归档到 `messages_archive` 分区表
- 合规：用户注销 30 天后物理删除账号及关联数据（个人信息保护法）

---

## 六、容量预估

| 表 | 1 万 DAU | 10 万 DAU | 100 万 DAU |
|----|---------|-----------|-----------|
| users | 30 万行 | 300 万 | 3000 万 |
| swipes | 50 万/天 | 500 万/天 | 5000 万/天 |
| messages | 200 万/天 | 2000 万/天 | 2 亿/天 |
| matches | 5 千/天 | 5 万/天 | 50 万/天 |

建议：100 万 DAU 量级时 swipes/messages 按月分区（PG Declarative Partitioning）。
