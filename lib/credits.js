import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * 积分账户
 *
 * 每天有免费额度（默认 3 次），用完后消耗积分（1 积分 = 1 次分析）。
 * 积分来源：邀请奖励、购买。
 *
 * 设计要点：
 * - 全流水记账（ledger），每一笔增减都留痕，永不删除
 * - 余额由流水累加得出，不单独存"当前余额"，避免对不上账
 * - 见 DATA_PROTECTION.md：只追加，不修改历史记录
 */

export function createCreditStore(dataDir) {
  const FILE = path.join(dataDir, 'credits.json');

  const readAll = () => {
    if (!fs.existsSync(FILE)) return {};
    try {
      return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      return {};
    }
  };

  const writeAll = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf-8');

  const entriesOf = (userId) => readAll()[userId]?.ledger || [];

  return {
    /** 当前余额 = 流水累加 */
    balance(userId) {
      return entriesOf(userId).reduce((sum, e) => sum + e.amount, 0);
    },

    ledger(userId, limit = 50) {
      return entriesOf(userId).slice(-limit).reverse();
    },

    /**
     * 记一笔流水
     * @param {number} amount 正数为增加，负数为消耗
     * @param {string} reason invite_reward | purchase | analysis | admin_grant
     */
    add(userId, amount, reason, meta = {}) {
      const all = readAll();
      const acct = all[userId] || { ledger: [] };

      acct.ledger.push({
        id: `c_${crypto.randomBytes(6).toString('hex')}`,
        amount: Number(amount),
        reason,
        meta,
        at: new Date().toISOString()
      });

      all[userId] = acct;
      writeAll(all);
      return this.balance(userId);
    },

    /** 扣减一次分析所需积分。余额不足返回 false，不产生流水 */
    spendOne(userId, meta = {}) {
      if (this.balance(userId) < 1) return false;
      this.add(userId, -1, 'analysis', meta);
      return true;
    },

    /** 管理员视图 */
    all() {
      const all = readAll();
      return Object.fromEntries(
        Object.entries(all).map(([uid, a]) => [
          uid,
          {
            balance: a.ledger.reduce((s, e) => s + e.amount, 0),
            entries: a.ledger.length
          }
        ])
      );
    }
  };
}
