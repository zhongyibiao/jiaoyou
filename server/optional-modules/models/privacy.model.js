/**
 * 隐私设置模型
 * 资料可见范围、距离隐藏、谁可以看我
 */

const fields = {
  user_id: 0,
  profile_visibility: 'public',  // public | registered | matched
  show_distance: true,
  show_online: true,
  show_age: true,
  allow_stranger_msg: false,
  allow_search_by_phone: false,
  show_in_recommend: true,
  read_receipt: true,
  updated_at: 0,
};

const Visibility = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  MATCHED: 'matched',
};

function defaultsFor(userId) {
  return { ...fields, user_id: userId, updated_at: Date.now() };
}

module.exports = { fields, defaultsFor, Visibility };
