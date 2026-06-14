-- ============================================================
-- jiaoyou 性能优化索引
-- 适配 MySQL 8.0+ / utf8mb4
-- 此文件可重复执行（CREATE INDEX 加 IF NOT EXISTS，MySQL 8 支持）
-- ============================================================

USE `jiaoyou`;

-- ---------- users ----------
-- （phone 唯一索引通常在 init.sql 中已建）

-- ---------- swipes（高频写入 + 高频查询） ----------
-- 某用户滑过的人（用于排除）
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_created
  ON swipes (swiper_id, created_at DESC);

-- 谁滑过我（用于"谁喜欢我"）
CREATE INDEX IF NOT EXISTS idx_swipes_swiped
  ON swipes (swiped_id);

-- 滑卡去重（应用层 UNIQUE 兜底，DB 层也建）
CREATE UNIQUE INDEX IF NOT EXISTS uniq_swipes_pair
  ON swipes (swiper_id, swiped_id);

-- ---------- matches ----------
-- 两个方向的用户匹配查询
CREATE INDEX IF NOT EXISTS idx_matches_user_a
  ON matches (user_a_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user_b
  ON matches (user_b_id, created_at DESC);

-- ---------- messages ----------
-- 按 match 查时间倒序（最热查询）
CREATE INDEX IF NOT EXISTS idx_messages_match_created
  ON messages (match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages (sender_id, created_at DESC);
-- 未读消息（MySQL 8 不支持部分索引，用普通索引 + 业务层过滤）
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (match_id, read_at);

-- ---------- photos ----------
CREATE INDEX IF NOT EXISTS idx_photos_user_sort
  ON photos (user_id, sort_order);

-- ---------- moments ----------
CREATE INDEX IF NOT EXISTS idx_moments_user_created
  ON moments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_created
  ON moments (created_at DESC);

-- ---------- blocks ----------
CREATE INDEX IF NOT EXISTS idx_blocks_user
  ON blocks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked
  ON blocks (blocked_id);

-- ---------- reports ----------
CREATE INDEX IF NOT EXISTS idx_reports_target
  ON reports (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON reports (status, created_at DESC);

-- ============================================================
-- 性能优化：Redis 缓存策略（建议接入，当前实现未强依赖）
-- ============================================================
-- 1. 滑卡候选池：swipe:candidate:{userId}    TTL 30 min   ZSET
-- 2. 用户资料：   profile:{userId}            TTL 10 min   STRING(JSON)
-- 3. 匹配列表：   match:list:{userId}         TTL 5 min    ZSET
-- 4. 在线状态：   online:user:{userId}        TTL 5 min    STRING
-- 5. 验证码：     sms:code:{phone}            TTL 5 min    STRING
-- 6. 限流：       rl:{key}:{userId}           TTL 60 s     ZSET
-- 7. 会话：       session:{userId}            TTL 7 d      HASH
--
-- 接入建议：
--   1) 引入 ioredis 客户端
--   2) 写 hook：user.updated / profile.updated → DEL profile:{userId} + invalidate
--   3) 读 hook：match.list → 走 Redis 缓存 → cache miss 时回源 DB
--   4) 滑动/匹配使用 Lua 脚本保证原子性
-- ============================================================
