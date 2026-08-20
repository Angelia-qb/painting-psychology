import React, { useState } from 'react';
import { CheckCircle2, Clipboard, ClipboardCheck, FileText, RefreshCw, Sparkles } from 'lucide-react';

export default function Success({ sessionId, shortCode, onRestart, onViewReport }) {
  const [copied, setCopied] = useState(false);
  const code = shortCode || sessionId;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
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
          <p className="session-label">你的查询码</p>
          <div className="session-value-container">
            <code className="short-code">{code}</code>
          </div>
          <p className="session-path-note">
            抄下这 8 位码，之后在「查看报告」页输入它就能找回这份报告。
            <br />
            不区分大小写，连字符也可以省略。
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
              这台设备已自动记住这份报告，在「查看报告」页顶部可以直接找到它。
              换设备时才需要用到上面的查询码。
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
              已复制查询码
            </>
          ) : (
            <>
              <Clipboard size={18} />
              复制查询码
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
