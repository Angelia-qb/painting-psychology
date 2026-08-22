import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, FileText, Calendar, Image, ShieldAlert, Award, HelpCircle, RefreshCw, LifeBuoy, Share2 } from 'lucide-react';
import MyReports from './MyReports';
import ShareCard from './ShareCard';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'http://localhost:3001'
  : '';

export default function ReportViewer({ initialSessionId, user }) {
  const [searchId, setSearchId] = useState(initialSessionId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const pollTimer = useRef(null);

  const fetchReport = useCallback(async (sid, { silent = false } = {}) => {
    if (!sid.trim()) return;
    if (!silent) {
      setLoading(true);
      setError('');
      setData(null);
    }

    try {
      const response = await fetch(`${API_BASE}/api/report/${sid.trim()}`, { credentials: 'include' });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '获取报告失败');
      }
      const resData = await response.json();
      setData(resData);

    } catch (err) {
      console.error(err);
      if (!silent) setError(err.message || '网络连接失败，请确保本地服务器已启动。');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSessionId) {
      setSearchId(initialSessionId);
      fetchReport(initialSessionId);
    }
  }, [initialSessionId, fetchReport]);

  // 分析进行中时每 3 秒轮询一次，直到出报告或失败
  useEffect(() => {
    clearTimeout(pollTimer.current);
    if (data && data.status === 'analyzing') {
      pollTimer.current = setTimeout(() => {
        fetchReport(data.sessionId, { silent: true });
      }, 3000);
    }
    return () => clearTimeout(pollTimer.current);
  }, [data, fetchReport]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport(searchId);
  };

  const handleRegenerate = async () => {
    if (!data?.sessionId) return;
    setRetrying(true);
    try {
      await fetch(`${API_BASE}/api/report/${data.sessionId}/regenerate`, { method: 'POST', credentials: 'include' });
      await fetchReport(data.sessionId, { silent: true });
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="icon-badge">
          <FileText className="icon-blue" size={28} />
        </div>
        <h2>查看您的心理分析报告</h2>
        <p className="subtitle">输入查询码即可找回你的分析报告</p>
      </div>

      <div className="card-body">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="输入 8 位查询码，例如 K7F2-Q9WM"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary btn-search" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              查询报告
            </button>
          </div>
        </form>

        <MyReports
          apiBase={API_BASE}
          user={user}
          onOpen={(code) => {
            setSearchId(code);
            fetchReport(code);
          }}
        />

        {error && (
          <div className="error-banner margin-top-sm">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <div className="report-container margin-top-sm animate-fade-in">
            {data.viewingAsAdmin && (
              <div className="alert alert-warning">
                <ShieldAlert size={20} className="alert-icon" />
                <div className="alert-content">
                  <h4>管理员视图</h4>
                  <p>
                    你正在查看 <strong>{data.answers.ownerName || '其他用户'}</strong> 的报告。
                    这是很私密的内容，请谨慎处理。
                  </p>
                </div>
              </div>
            )}

            {/* Session Metadata */}
            <div className="report-meta-box">
              <div className="meta-item">
                <Calendar size={14} />
                <span>提交时间：{new Date(data.answers.timestamp).toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <FileText size={14} />
                <span>作品名称：《{data.answers.drawingTitle || '未命名'}》</span>
              </div>
              {data.shortCode && (
                <div className="meta-item">
                  <FileText size={14} />
                  <span>查询码：<code>{data.shortCode}</code></span>
                </div>
              )}
            </div>

            {/* Drawing Preview & Original Questionnaire Answers */}
            <div className="report-split-grid">
              <div className="report-image-panel">
                <h4 className="panel-title"><Image size={16} /> 上传的画作</h4>
                <div className="report-image-wrapper">
                  <img
                    src={`${API_BASE}/${data.answers.relativeImagePath}`}
                    alt="Submitted art"
                    className="report-img"
                  />
                </div>
              </div>

              <div className="report-answers-panel">
                <h4 className="panel-title"><HelpCircle size={16} /> 我的探索问答</h4>
                <div className="answers-scroll-box">
                  <div className="qa-item">
                    <h5>Q1. 画面主要描述了什么？</h5>
                    <p>{data.answers.description}</p>
                  </div>
                  <div className="qa-item">
                    <h5>Q2. 情绪与身体感受是什么？</h5>
                    <p>{data.answers.emotions}</p>
                  </div>
                  {data.answers.dialogue && (
                    <div className="qa-item">
                      <h5>Q3. 如果画中元素会说话，它会说什么？</h5>
                      <p>{data.answers.dialogue}</p>
                    </div>
                  )}
                  {data.answers.backgroundContext && (
                    <div className="qa-item">
                      <h5>Q4. 创作契机与背景是什么？</h5>
                      <p>{data.answers.backgroundContext}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis report section */}
            <div className="analysis-report-section">
              {!data.hasReport ? (
                data.status === 'failed' ? (
                  <div className="pending-report-banner">
                    <ShieldAlert className="text-primary" size={28} />
                    <div>
                      <h4>分析未能完成</h4>
                      <p>
                        {data.statusMessage || '生成报告时出现问题。'}
                        <br />
                        你的画作和问卷都已安全保存，可以点击下方按钮重试。
                      </p>
                      <button
                        className="btn btn-primary margin-top-sm"
                        onClick={handleRegenerate}
                        disabled={retrying}
                      >
                        {retrying ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        重新生成报告
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pending-report-banner">
                    <Loader2 className="animate-spin text-primary" size={28} />
                    <div>
                      <h4>正在阅读你的画……</h4>
                      <p>
                        分析通常需要 20~60 秒，页面会自动刷新，不用手动操作。
                        <br />
                        如果你想先离开，记下查询码 <code>{data.shortCode || data.sessionId}</code>，随时回来查看。
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="report-content-box animate-fade-in">
                  <div className="report-header-badge">
                    <Award size={20} />
                    <span>AI 心理分析报告已生成</span>
                  </div>

                  {data.report.safetyFlag && (
                    <div className="alert alert-warning margin-top-sm">
                      <LifeBuoy size={20} className="alert-icon" />
                      <div className="alert-content">
                        <h4>请照顾好自己</h4>
                        <p>
                          你在问卷中提到的一些内容让我们有些担心。如果此刻你正处在难受的状态里，
                          请让真实的人陪着你 —— 可以联系信任的朋友或家人，也可以拨打心理援助热线：
                          <br />
                          <strong>希望24热线 400-161-9995</strong>
                          <br />
                          <strong>北京心理危机干预中心 010-82951332</strong>
                          <br />
                          本系统不能替代专业帮助。
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="report-summary-quote">
                    <p>“ {data.report.summary} ”</p>
                  </div>

                  <div className="dimensions-list">
                    {data.report.dimensions?.map((dim, idx) => (
                      <div key={idx} className="dimension-card">
                        <h4>{dim.title}</h4>
                        <p>{dim.content}</p>
                      </div>
                    ))}
                  </div>

                  {data.report.advices && data.report.advices.length > 0 && (
                    <div className="report-advice-box">
                      <h4>💡 心理恢复与探索建议</h4>
                      <ul>
                        {data.report.advices.map((adv, idx) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.report.questions && data.report.questions.length > 0 && (
                    <div className="report-questions-box">
                      <h4>🤔 进一步自我觉察思考题</h4>
                      <ul>
                        {data.report.questions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className="btn btn-primary btn-full share-btn" onClick={() => setSharing(true)}>
                    <Share2 size={16} /> 生成分享卡片
                  </button>

                  <div className="report-scientific-footer">
                    <p>本报告基于表达性艺术治疗原理生成。关于科学局限性及理论基础，可查看“科学附录”页面。</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {sharing && data?.report && (
        <ShareCard
          report={data.report}
          drawingUrl={`${API_BASE}/${data.answers.relativeImagePath}`}
          siteUrl={window.location.origin}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
