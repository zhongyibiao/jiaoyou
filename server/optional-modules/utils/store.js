/**
 * 简易数据访问层
 * 生产环境替换为 PostgreSQL / MySQL 驱动
 * 这里只暴露接口约定，避免在业务代码里写死 DB 类型
 */

// 内存表（仅供示例/单测使用）
const memory = {
  privacy: new Map(),
  blocks: new Map(),
  reports: new Map(),
};

let autoId = 1;
function nextId() { return autoId++; }

async function insert(table, record) {
  const id = record.id || nextId();
  const full = { ...record, id };
  memory[table].set(id, full);
  return id;
}

async function findOne(table, filter) {
  for (const r of memory[table].values()) {
    if (match(r, filter)) return r;
  }
  return null;
}

async function find(table, filter, { page = 1, page_size = 20, sort } = {}) {
  let list = [];
  for (const r of memory[table].values()) {
    if (match(r, filter)) list.push(r);
  }
  if (sort) {
    const [k, dir] = Object.entries(sort)[0];
    list.sort((a, b) => (a[k] > b[k] ? dir : -dir));
  }
  const start = (page - 1) * page_size;
  return { list: list.slice(start, start + page_size), total: list.length, page, page_size };
}

async function update(table, filter, patch) {
  for (const r of memory[table].values()) {
    if (match(r, filter)) {
      Object.assign(r, patch);
      return r;
    }
  }
  return null;
}

async function upsert(table, filter, patch) {
  const existing = await findOne(table, filter);
  if (existing) {
    Object.assign(existing, patch);
    return existing;
  }
  return insert(table, { ...filter, ...patch });
}

async function deleteRow(table, filter) {
  for (const [id, r] of memory[table].entries()) {
    if (match(r, filter)) {
      memory[table].delete(id);
      return 1;
    }
  }
  return 0;
}

function match(record, filter) {
  for (const [k, v] of Object.entries(filter)) {
    if (v && typeof v === 'object' && '$gte' in v) {
      if (record[k] < v.$gte) return false;
    } else if (record[k] !== v) {
      return false;
    }
  }
  return true;
}

module.exports = { insert, findOne, find, update, upsert, delete: deleteRow };
