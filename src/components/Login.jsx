import React, { useState } from 'react';
import { LogIn, UserPlus, Loader2, ShieldAlert, Crown, Ticket } from 'lucide-react';

export default function Login({ apiBase, needsSetup, requireInvite, onLoggedIn }) {
  const [mode, setMode] = useState(needsSetup ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 首个账号（部署者）不需要邀请码
  const needInviteField = mode === 'register' && requireInvite && !needsSetup;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const res = await fetch(`${apiBase}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, inviteCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '操作失败');

      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          {mode === 'register' ? <UserPlus size={28} className="icon-gold" /> : <LogIn size={28} className="icon-blue" />}
        </div>
        <h2>{mode === 'register' ? '创建账号' : '登录'}</h2>
        <p className="subtitle">
          {needsSetup
            ? '这是首个账号，将自动成为管理员'
            : mode === 'register' && requireInvite
              ? '目前为邀请制注册'
              : '你的画作与报告只有你自己能看到'}
        </p>
      </div>

      <form onSubmit={submit} className="form-container">
        <div className="card-body">
          {needsSetup && (
            <div className="alert alert-warning">
              <Crown size={20} className="alert-icon" />
              <div className="alert-content">
                <h4>首次部署</h4>
                <p>系统中还没有任何账号。你现在注册的账号将成为<strong>超级管理员</strong>，可以查看所有用户的报告。</p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="username">用户名</label>
            <input
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="2~20 位，支持中文、字母、数字"
              autoComplete="username"
              disabled={busy}
            />
          </div>

          {needInviteField && (
            <div className="form-group">
              <label className="form-label" htmlFor="invite">
                <Ticket size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                邀请码
              </label>
              <p className="field-desc">目前为邀请制，请向邀请你的人索取</p>
              <input
                id="invite"
                className="form-input invite-input"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="例如 K7F-Q9W"
                disabled={busy}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              disabled={busy}
            />
          </div>

          {error && (
            <div className="error-banner">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="card-footer-stacked">
          <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            {mode === 'register' ? '注册并进入' : '登录'}
          </button>

          {!needsSetup && (
            <button
              type="button"
              className="btn btn-text btn-full margin-top-sm"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              disabled={busy}
            >
              {mode === 'login' ? '还没有账号？去注册' : '已有账号？去登录'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
