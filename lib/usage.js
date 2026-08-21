import fs from 'fs';
import path from 'path';

/**
 * 用量配额
 *
 * 目的不是限制用户，而是止损：
 * 每次分析都要调用大模型，没有上限的话，一个脚本挂一晚上就能把额度烧穿。
 *
 * 配额按"自然日"计算，用用户本地时区不现实，统一用 Asia/Shanghai，
 * 因为用户都在国内。
 */

const TZ_OFFSET_MS = 8 * 3600 * 1000; // UTC+8

/** 返回 Asia/Shanghai 的 YYYY-MM-DD */
export function todayKey(now = Date.now()) {
  return new Date(now + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

/** 距离下一个自然日还有多久（毫秒），用于提示用户何时恢复 */
export function msUntilReset(now = Date.now()) {
  const shifted = now + TZ_OFFSET_MS;
  const nextDay = Math.floor(shifted / 86400_000 + 1) * 86400_000;
  return nextDay - shifted;
}

export function createUsageStore(dataDir, limits = {}) {
  const FILE = path.join(dataDir, 'usage.json');

  const DAILY_ANALYSES = limits.dailyAnalyses ?? 10;
  const MAX_STORAGE_BYTES = limits.maxStorageBytes ?? 100 * 1024 * 1024; // 100MB

  const readAll = () => {
    if (!fs.existsSync(FILE)) return {};
    try {
      return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      return {};
    }
  };

  const writeAll = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf-8');

  const blank = () => ({ daily: {}, totalAnalyses: 0, storageBytes: 0 });

  return {
    limits: { dailyAnalyses: DAILY_ANALYSES, maxStorageBytes: MAX_STORAGE_BYTES },

    get(userId) {
      const u = readAll()[userId] || blank();
      const day = todayKey();
      return {
        usedToday: u.daily[day] || 0,
        remainingToday: Math.max(0, DAILY_ANALYSES - (u.daily[day] || 0)),
        dailyLimit: DAILY_ANALYSES,
        totalAnalyses: u.totalAnalyses || 0,
        storageBytes: u.storageBytes || 0,
        storageLimit: MAX_STORAGE_BYTES,
        resetInMs: msUntilReset()
      };
    },

    /**
     * 检查是否还能再分析一次。
     * 管理员不受配额限制（否则自己测试都不方便）。
     */
    canAnalyze(userId, { isAdmin = false, incomingBytes = 0 } = {}) {
      if (isAdmin) return { ok: true };

      const s = this.get(userId);

      if (s.remainingToday <= 0) {
        const hours = Math.ceil(s.resetInMs / 3600_000);
        return {
          ok: false,
          code: 'DAILY_LIMIT',
          message: `今天的分析次数已用完（每天 ${DAILY_ANALYSES} 次），约 ${hours} 小时后重置。`
        };
      }

      if (s.storageBytes + incomingBytes > MAX_STORAGE_BYTES) {
        return {
          ok: false,
          code: 'STORAGE_LIMIT',
          message: `存储空间已达上限（${Math.round(MAX_STORAGE_BYTES / 1024 / 1024)}MB），请联系管理员。`
        };
      }

      return { ok: true };
    },

    /** 记一次分析。在提交成功后调用 */
    record(userId, bytes = 0) {
      const all = readAll();
      const u = all[userId] || blank();
      const day = todayKey();

      u.daily[day] = (u.daily[day] || 0) + 1;
      u.totalAnalyses = (u.totalAnalyses || 0) + 1;
      u.storageBytes = (u.storageBytes || 0) + bytes;
      u.lastAt = new Date().toISOString();

      // 只保留最近 60 天，避免文件无限膨胀
      const cutoff = todayKey(Date.now() - 60 * 86400_000);
      for (const k of Object.keys(u.daily)) {
        if (k < cutoff) delete u.daily[k];
      }

      all[userId] = u;
      writeAll(all);
      return this.get(userId);
    },

    /** 管理员视图：所有用户用量 */
    all() {
      const all = readAll();
      const day = todayKey();
      return Object.entries(all).map(([userId, u]) => ({
        userId,
        usedToday: u.daily?.[day] || 0,
        totalAnalyses: u.totalAnalyses || 0,
        storageBytes: u.storageBytes || 0,
        lastAt: u.lastAt || null
      }));
    }
  };
}
