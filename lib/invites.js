import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * 邀请码
 *
 * 设计取舍：
 * - 一个码可被多人使用（不是一次性），这样你可以把码发到群里让大家自助注册
 * - 支持设置有效期与最大使用次数，需要收紧时新建一个码即可
 * - 记录每次使用者，出问题能追溯是哪个码放进来的
 *
 * 见 DATA_PROTECTION.md：码只停用（revoked），不删除。
 */

// 去掉易混字符，方便口头转述
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTWXYZ';

function randomCode() {
  const bytes = crypto.randomBytes(6);
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

export function normalizeInvite(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toUpperCase().replace(/[\s-]/g, '');
  if (s.length !== 6) return null;
  if (![...s].every((c) => ALPHABET.includes(c))) return null;
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

export function createInviteStore(dataDir) {
  const FILE = path.join(dataDir, 'invites.json');

  const readAll = () => {
    if (!fs.existsSync(FILE)) return {};
    try {
      return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      return {};
    }
  };

  const writeAll = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf-8');

  return {
    list() {
      return Object.values(readAll()).sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt))
      );
    },

    /**
     * @param {object} opts
     * @param {string} opts.note      备注，方便记住这个码发给谁了
     * @param {number} opts.maxUses   最大使用次数，0 表示不限
     * @param {number} opts.expiresInDays 有效天数，0 表示永久
     */
    create({ note = '', maxUses = 0, expiresInDays = 0, createdBy = '' } = {}) {
      const all = readAll();
      let code;
      do {
        code = randomCode();
      } while (all[code]);

      all[code] = {
        code,
        note,
        maxUses: Number(maxUses) || 0,
        usedCount: 0,
        usedBy: [],
        expiresAt:
          Number(expiresInDays) > 0
            ? new Date(Date.now() + expiresInDays * 86400_000).toISOString()
            : null,
        revokedAt: null,
        createdBy,
        createdAt: new Date().toISOString()
      };

      writeAll(all);
      return all[code];
    },

    /** 校验但不消耗。返回 { ok, reason } */
    check(input) {
      const code = normalizeInvite(input);
      if (!code) return { ok: false, reason: '邀请码格式不正确' };

      const inv = readAll()[code];
      if (!inv) return { ok: false, reason: '邀请码不存在' };
      if (inv.revokedAt) return { ok: false, reason: '该邀请码已停用' };
      if (inv.expiresAt && Date.now() > Date.parse(inv.expiresAt)) {
        return { ok: false, reason: '该邀请码已过期' };
      }
      if (inv.maxUses > 0 && inv.usedCount >= inv.maxUses) {
        return { ok: false, reason: '该邀请码使用次数已满' };
      }
      return { ok: true, code };
    },

    /** 消耗一次。注册成功后才调用 */
    consume(code, { userId, username }) {
      const all = readAll();
      const inv = all[code];
      if (!inv) return false;

      inv.usedCount += 1;
      inv.usedBy.push({ userId, username, at: new Date().toISOString() });
      writeAll(all);
      return true;
    },

    /** 停用（不删除） */
    revoke(code) {
      const all = readAll();
      const c = normalizeInvite(code);
      if (!c || !all[c]) return false;
      all[c].revokedAt = new Date().toISOString();
      writeAll(all);
      return true;
    },

    restore(code) {
      const all = readAll();
      const c = normalizeInvite(code);
      if (!c || !all[c]) return false;
      all[c].revokedAt = null;
      writeAll(all);
      return true;
    }
  };
}
