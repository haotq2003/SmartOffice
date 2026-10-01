const redis = require('../config/redis');

/**
 * Cố gắng chiếm giữ khóa phân tán (Distributed Lock) trên Redis
 * @param {string} lockKey - Tên khóa định danh tài nguyên (vd: lock:resource:65f... )
 * @param {number} ttlSeconds - Thời gian khóa tự hủy phòng khi server crash (mặc định 5 giây)
 * @returns {Promise<string|null>} Trả về token khóa nếu chiếm thành công, null nếu thất bại (đang có người giữ)
 */
const acquireLock = async (lockKey, ttlSeconds = 5) => {
  if (!redis) {
    return 'fallback-bypass-token';
  }

  const lockToken = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  // Lệnh nguyên tử của Redis: Chỉ SET nếu key Chưa Tồn Tại (NX), tự hủy sau số giây (EX)
  const result = await redis.set(lockKey, lockToken, 'EX', ttlSeconds, 'NX');
  return result === 'OK' ? lockToken : null;
};

/**
 * Giải phóng khóa an toàn bằng Lua Script (chỉ xóa khóa nếu đúng token mình tạo ra)
 * @param {string} lockKey 
 * @param {string} lockToken 
 */
const releaseLock = async (lockKey, lockToken) => {
  if (!redis || lockToken === 'fallback-bypass-token') {
    return;
  }

  // Lua script đảm bảo tính nguyên tử: Kiểm tra giá trị trước khi xóa
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    await redis.eval(luaScript, 1, lockKey, lockToken);
  } catch (error) {
    console.error('⚠️ [Redis Lock] Lỗi khi giải phóng khóa:', error.message);
  }
};

module.exports = {
  acquireLock,
  releaseLock,
};
