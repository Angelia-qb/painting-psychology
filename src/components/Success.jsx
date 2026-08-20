import React, { useState } from 'react';
import { CheckCircle2, Clipboard, ClipboardCheck, FileText, RefreshCw, Sparkles } from 'lucide-react';

export default function Success({ sessionId, onRestart, onViewReport }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card animate-fade-in text-center">
      <div className="card-header text-center-header">
        <div className="icon-badge-success">
          <CheckCircle2 size={36} className="icon-green" />
        </div>
        <h2 className="gradient-text-success">上传成功！</h2>
        <p className="subtitle">分析已经开始，通常需要 20~60 秒</p>
      </div>

      <div className="card-body">
        <div className="session-info-box">
          <p className="session-label">你的会话 ID</p>
          <div className="session-value-container">
            <code className="session-value">{sessionId}</code>
          </div>
          <p className="session-path-note">
            数据保存在本地：<code>data/sessions/{sessionId}/</code>
          </p>
        </div>

        <div className="next-steps-container">
          <h3>
            <Sparkles size={16} /> 接下来会发生什么
          </h3>
          <ol className="steps-ordered-list">
            <li>系统正在结合你的画作与问卷内容生成分析报告。</li>
            <li>点击下方「查看我的报告」，页面会自动等待并显示结果。</li>
            <li>
              想以后再看？把上面的会话 ID 记下来，任何时候在「查看报告」页输入它即可。
            </li>
          </ol>
        </div>
      </div>

      <div className="card-footer-stacked">
        <button className="btn btn-primary btn-full" onClick={onViewReport}>
          <FileText size={18} />
          查看我的报告
        </button>
        <button className="btn btn-success btn-full margin-top-sm" onClick={handleCopy}>
          {copied ? (
            <>
              <ClipboardCheck size={18} />
              已复制会话 ID
            </>
          ) : (
            <>
              <Clipboard size={18} />
              复制会话 ID
            </>
          )}
        </button>
        <button className="btn btn-text btn-full margin-top-sm" onClick={onRestart}>
          <RefreshCw size={14} /> 上传另一张画作
        </button>
      </div>
    </div>
  );
}
