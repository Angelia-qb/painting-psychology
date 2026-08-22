import React, { useState, useRef } from 'react';
import { Share2, Download, Loader2, X } from 'lucide-react';

/**
 * 分享卡片
 *
 * 隐私红线（不可放宽）：
 * - 只放报告中的一句金句，绝不放问卷原文
 *   （问卷里是"手腕很用力""加完班很空虚"这类极私密的自述）
 * - 画作由用户自己选择是否包含，默认不含
 * - 不显示查询码，避免他人凭码查看
 *
 * 全部在浏览器 canvas 里绘制，图片不经服务器。
 */

const W = 800;
const H = 1200;

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(line);
      line = '';
      continue;
    }
    if (ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function ShareCard({ report, drawingUrl, siteUrl, onClose }) {
  const [includeDrawing, setIncludeDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dataUrl, setDataUrl] = useState('');
  const canvasRef = useRef(null);

  // 从报告里挑一句最有分量的：优先第一个维度的首句，其次 summary
  const pickQuote = () => {
    const candidates = [];
    if (report?.dimensions?.[0]?.content) {
      const first = report.dimensions[0].content.split(/[。？！]/).filter((s) => s.trim().length > 12);
      if (first[0]) candidates.push(first[0].trim() + '。');
    }
    if (report?.summary) {
      const s = report.summary.split(/[。？！]/).filter((x) => x.trim().length > 12);
      if (s[0]) candidates.push(s[0].trim() + '。');
    }
    return candidates[0] || report?.summary?.slice(0, 60) || '';
  };

  const quote = pickQuote();
  const question = report?.questions?.[0] || '';

  const render = async () => {
    setBusy(true);
    try {
      const cv = canvasRef.current;
      const ctx = cv.getContext('2d');

      // 背景
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#141824');
      g.addColorStop(1, '#1d2334');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // 装饰光晕
      const glow = ctx.createRadialGradient(W * 0.8, 120, 0, W * 0.8, 120, 340);
      glow.addColorStop(0, 'rgba(212,160,23,0.18)');
      glow.addColorStop(1, 'rgba(212,160,23,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, 500);

      let y = 96;

      ctx.fillStyle = '#d4a017';
      ctx.font = '600 30px system-ui, -apple-system, "PingFang SC", sans-serif';
      ctx.fillText('🎨 MindArt Studio', 64, y);

      y += 46;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '400 22px system-ui, "PingFang SC", sans-serif';
      ctx.fillText('自由表达绘画心理探索', 64, y);

      y += 70;

      // 可选：画作
      if (includeDrawing && drawingUrl) {
        try {
          const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.crossOrigin = 'anonymous';
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = drawingUrl;
          });
          const boxW = W - 128;
          const boxH = 300;
          const scale = Math.min(boxW / img.width, boxH / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          ctx.save();
          ctx.globalAlpha = 0.95;
          ctx.drawImage(img, 64 + (boxW - dw) / 2, y, dw, dh);
          ctx.restore();
          y += boxH + 50;
        } catch {
          /* 图片加载失败就跳过 */
        }
      }

      // 金句
      ctx.fillStyle = 'rgba(212,160,23,0.85)';
      ctx.font = '700 64px Georgia, serif';
      ctx.fillText('"', 64, y + 20);

      y += 40;
      ctx.fillStyle = '#f2f4f8';
      ctx.font = '400 34px system-ui, "PingFang SC", sans-serif';
      const lines = wrapText(ctx, quote, W - 160).slice(0, 6);
      for (const l of lines) {
        ctx.fillText(l, 80, y);
        y += 54;
      }

      // 思考题
      if (question) {
        y += 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(64, y);
        ctx.lineTo(W - 64, y);
        ctx.stroke();

        y += 48;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '400 22px system-ui, "PingFang SC", sans-serif';
        ctx.fillText('它问了我一个问题', 64, y);

        y += 44;
        ctx.fillStyle = '#c8cfdd';
        ctx.font = '400 27px system-ui, "PingFang SC", sans-serif';
        for (const l of wrapText(ctx, question, W - 160).slice(0, 3)) {
          ctx.fillText(l, 64, y);
          y += 42;
        }
      }

      // 底部
      const footY = H - 130;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(64, footY - 40);
      ctx.lineTo(W - 64, footY - 40);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '500 26px system-ui, "PingFang SC", sans-serif';
      ctx.fillText('画一张画，听听它想对你说什么', 64, footY);

      ctx.fillStyle = 'rgba(212,160,23,0.9)';
      ctx.font = '400 23px system-ui, sans-serif';
      ctx.fillText(siteUrl.replace(/^https?:\/\//, ''), 64, footY + 42);

      setDataUrl(cv.toDataURL('image/png'));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `mindart-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="share-close" onClick={onClose}>
          <X size={18} />
        </button>

        <h3>生成分享卡片</h3>
        <p className="share-privacy">
          只包含报告中的一句话与一个问题，<strong>不会包含你的问卷回答</strong>。
        </p>

        <label className="share-opt">
          <input
            type="checkbox"
            checked={includeDrawing}
            onChange={(e) => {
              setIncludeDrawing(e.target.checked);
              setDataUrl('');
            }}
          />
          <span>包含我的画作（默认不含）</span>
        </label>

        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'none' }} />

        {dataUrl ? (
          <>
            <img src={dataUrl} alt="分享卡片" className="share-preview" />
            <div className="share-actions">
              <button className="btn btn-primary btn-full" onClick={download}>
                <Download size={16} /> 保存图片
              </button>
              <p className="share-tip">保存后即可分享到朋友圈或发给朋友</p>
            </div>
          </>
        ) : (
          <button className="btn btn-primary btn-full" onClick={render} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Share2 size={16} />}
            生成卡片
          </button>
        )}
      </div>
    </div>
  );
}
