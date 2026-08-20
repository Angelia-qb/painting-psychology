/**
 * 我的报告：本地记录
 *
 * 存在浏览器 localStorage 里，不上传服务器。
 * 换设备或清空浏览器数据会丢失，所以短码仍然需要让用户自己保存。
 */

const KEY = 'mindart.myReports';
const MAX = 50;

export function loadMyReports() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveMyReport({ shortCode, sessionId, title, timestamp }) {
  if (!shortCode && !sessionId) return loadMyReports();

  const list = loadMyReports().filter((r) => r.sessionId !== sessionId);

  list.unshift({
    shortCode: shortCode || '',
    sessionId: sessionId || '',
    title: title || '未命名',
    timestamp: timestamp || new Date().toISOString()
  });

  const trimmed = list.slice(0, MAX);

  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage 不可用（隐私模式等），静默降级
  }

  return trimmed;
}

export function removeMyReport(sessionId) {
  const list = loadMyReports().filter((r) => r.sessionId !== sessionId);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 忽略 */
  }
  return list;
}
