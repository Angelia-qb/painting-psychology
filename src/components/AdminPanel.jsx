import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Loader2, Copy, Check, Ban, RotateCcw, Users, BarChart3 } from 'lucide-react';

export default function AdminPanel({ apiBase }) {
  const [tab, setTab] = useState('invites');
  const [invites, setInvites] = useState([]);
  const [usersData, setUsersData] = useState({ users: [], limits: {} });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState('');

  const [note, setNote] = useState('');
  const [maxUses, setMaxUses] = useState(0);
  const [expiresInDays, setExpiresInDays] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, u] = await Promise.all([
        fetch(`${apiBase}/api/admin/invites`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${apiBase}/api/admin/usage`, { credentials: 'include' }).then((r) => r.json())
      ]);
      setInvites(i.invites || []);
      setUsersData(u);
    } catch {
      /* 忽略 */
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const createInvite = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch(`${apiBase}/api/admin/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note, maxUses, expiresInDays })
      });
      setNote('');
      await load();
    } finally {
      setCreating(false);
    }
  };

  const toggleRevoke = async (code, revoked) => {
    await fetch(`${apiBase}/api/admin/invites/${code}/${revoked ? 'restore' : 'revoke'}`, {
      method: 'POST',
      credentials: 'include'
    });
    load();
  };

  const copy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const mb = (b) => (b / 1024 / 1024).toFixed(1);

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <Ticket className="icon-gold" size={28} />
        </div>
        <h2>管理后台</h2>
        <p className="subtitle">邀请码与用量管理</p>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'invites' ? 'active' : ''} onClick={() => setTab('invites')}>
          <Ticket size={14} /> 邀请码
        </button>
        <button className={tab === 'usage' ? 'active' : ''} onClick={() => setTab('usage')}>
          <BarChart3 size={14} /> 用量
        </button>
      </div>

      <div className="card-body scrollable-body">
        {loading ? (
          <div className="my-reports-empty">
            <Loader2 className="animate-spin" size={18} />
            <span>加载中…</span>
          </div>
        ) : tab === 'invites' ? (
          <>
            <form onSubmit={createInvite} className="invite-create">
              <div className="invite-create-row">
                <input
                  className="form-input"
                  placeholder="备注，例如「测试群」"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={creating}
                />
                <select
                  className="form-input"
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  disabled={creating}
                >
                  <option value={0}>不限次数</option>
                  <option value={1}>限 1 人</option>
                  <option value={5}>限 5 人</option>
                  <option value={20}>限 20 人</option>
                </select>
                <select
                  className="form-input"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  disabled={creating}
                >
                  <option value={0}>永久有效</option>
                  <option value={1}>1 天</option>
                  <option value={7}>7 天</option>
                  <option value={30}>30 天</option>
                </select>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  生成
                </button>
              </div>
            </form>

            {!invites.length ? (
              <div className="my-reports-empty">
                <Ticket size={20} />
                <span>还没有邀请码，先生成一个</span>
              </div>
            ) : (
              <ul className="invite-list">
                {invites.map((inv) => {
                  const expired = inv.expiresAt && Date.now() > Date.parse(inv.expiresAt);
                  const full = inv.maxUses > 0 && inv.usedCount >= inv.maxUses;
                  const dead = inv.revokedAt || expired || full;
                  return (
                    <li key={inv.code} className={`invite-item ${dead ? 'dead' : ''}`}>
                      <div className="invite-main">
                        <code className="invite-code">{inv.code}</code>
                        <span className="invite-note">{inv.note || '（无备注）'}</span>
                        <span className="invite-meta">
                          已用 {inv.usedCount}
                          {inv.maxUses > 0 ? ` / ${inv.maxUses}` : ''}
                          {inv.expiresAt && ` · ${expired ? '已过期' : `${new Date(inv.expiresAt).toLocaleDateString()} 到期`}`}
                          {inv.revokedAt && ' · 已停用'}
                          {full && !inv.revokedAt && ' · 已用满'}
                        </span>
                      </div>
                      <div className="invite-actions">
                        <button onClick={() => copy(inv.code)} title="复制">
                          {copied === inv.code ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => toggleRevoke(inv.code, Boolean(inv.revokedAt))}
                          title={inv.revokedAt ? '恢复' : '停用'}
                        >
                          {inv.revokedAt ? <RotateCcw size={14} /> : <Ban size={14} />}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="my-reports-note">
              邀请码只会停用，不会删除，使用记录始终保留可追溯。
            </p>
          </>
        ) : (
          <>
            <div className="usage-limits">
              <Users size={14} />
              每人每天 <strong>{usersData.limits?.dailyAnalyses}</strong> 次分析 ·
              存储上限 <strong>{mb(usersData.limits?.maxStorageBytes || 0)}MB</strong>
              <span className="usage-note">（管理员不受限制）</span>
            </div>

            <ul className="usage-list">
              {usersData.users?.map((u) => (
                <li key={u.id} className="usage-item">
                  <div className="usage-main">
                    <span className="usage-name">
                      {u.role === 'admin' && <span className="admin-badge">管理员</span>}
                      {u.username}
                      {u.disabledAt && <span className="pending-tag">已停用</span>}
                    </span>
                    <span className="usage-meta">
                      今日 {u.usage.usedToday}/{usersData.limits?.dailyAnalyses} ·
                      累计 {u.usage.totalAnalyses} 次 ·
                      {mb(u.usage.storageBytes)}MB
                    </span>
                  </div>
                  <span className="usage-last">
                    {u.usage.lastAt ? new Date(u.usage.lastAt).toLocaleDateString() : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
