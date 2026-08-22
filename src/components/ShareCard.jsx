import React, { useState, useRef } from 'react';
import { Share2, Download, Loader2, X } from 'lucide-react';

/**
 * 分享卡片
 *
 * 设计目标：能在朋友圈信息流里被人停下来看。
 * - 画作铺满上半部分并渐隐融入背景，作为视觉主体（不是缩略图）
 * - 作品名做大标题，是最强的个人化钩子
 * - 金句大字排版，是视觉主角
 * - 底部留一个反问，制造好奇缺口，让人想点进来
 *
 * 隐私红线（不可放宽）：
 * - 报告大量引用用户问卷原文（这是它的优点），但那些句子绝不能上卡片。
 *   「手腕很用力，呼吸有点急促」这类自述属于极私密内容。
 *   因此排除所有含引号与"你提到/你说"的句子。
 * - 不显示查询码，避免他人凭码查看报告
 */

const W = 1080;
const H = 1320;
const ART_H = 700;
const M = 84;

export default function ShareCard({ report, drawingUrl, siteUrl, onClose }) {
  const [includeDrawing, setIncludeDrawing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dataUrl, setDataUrl] = useState('');
  const canvasRef = useRef(null);

  const pickQuote = () => {
    const QUOTE_CHARS = /[“”"「」『』]/;
    const SELF_REF = /(你提到|你说|你写|你描述|你在.{0,6}中(提到|写)|如你所说|你特别提到)/;

    const sentences = [];
    for (const d of report?.dimensions || []) {
      sentences.push(...String(d.content).split(/(?<=[。？！])/));
    }
    sentences.push(...String(report?.summary || '').split(/(?<=[。？！])/));

    const safe = sentences
      .map((s) => s.trim())
      .filter(
        (s) => s.length >= 12 && s.length <= 40 && !QUOTE_CHARS.test(s) && !SELF_REF.test(s)
      );

    const reflective = safe.find((s) =>
      /(也许|或许|似乎|可能|值得|不必|已经|仍然|其实)/.test(s)
    );
    return (reflective || safe[0] || '').replace(/[。？！]$/, '');
  };

  const quote = pickQuote();
  const question = report?.questions?.[0] || '';
  const title = report?.drawingTitle || '';

  const render = async () => {
    setBusy(true);
    try {
      const cv = canvasRef.current;
      const ctx = cv.getContext('2d');
      const F = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif';

      ctx.fillStyle = '#0c0e14';
      ctx.fillRect(0, 0, W, H);

      // 画作铺满上半部分，底部渐隐
      let artDrawn = false;
      if (includeDrawing && drawingUrl) {
        try {
          const img = await new Promise((res, rej) => {
            const im = new Image();
            im.crossOrigin = 'use-credentials';
            im.onload = () => res(im);
            im.onerror = rej;
            im.src = drawingUrl;
          });

          const sc = Math.max(W / img.width, ART_H / img.height);
          const dw = img.width * sc;
          const dh = img.height * sc;
          ctx.drawImage(img, (W - dw) / 2, 0, dw, dh);

          const fade = ctx.createLinearGradient(0, ART_H * 0.42, 0, ART_H);
          fade.addColorStop(0, 'rgba(12,14,20,0)');
          fade.addColorStop(1, 'rgba(12,14,20,1)');
          ctx.fillStyle = fade;
          ctx.fillRect(0, 0, W, ART_H);
          artDrawn = true;
        } catch {
          /* 加载失败则退化为纯色版式 */
        }
      }

      if (!artDrawn) {
        const g = ctx.createRadialGradient(W * 0.5, 260, 0, W * 0.5, 260, 620);
        g.addColorStop(0, 'rgba(196,132,40,0.28)');
        g.addColorStop(1, 'rgba(12,14,20,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, ART_H);
      }

      const bg = ctx.createLinearGradient(0, ART_H, 0, H);
      bg.addColorStop(0, '#0c0e14');
      bg.addColorStop(1, '#12151f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, ART_H, W, H - ART_H);

      const wrap = (text, maxW) => {
        const lines = [];
        let line = '';
        for (const ch of text) {
          if (ctx.measureText(line + ch).width > maxW) {
            lines.push(line);
            line = ch;
          } else line += ch;
        }
        if (line) lines.push(line);
        return lines;
      };

      ctx.fillStyle = '#d6b260';
      ctx.font = `500 26px ${F}`;
      ctx.fillText('MINDART · 绘画心理探索', M, 78);

      let y = 508;

      if (title) {
        ctx.fillStyle = '#faf8f4';
        ctx.font = `700 82px ${F}`;
        ctx.fillText(`《${title}》`, M, y);
        y += 126;
      } else {
        y = 560;
      }

      ctx.fillStyle = '#d4a017';
      ctx.fillRect(M, y, 84, 5);
      y += 62;

      ctx.fillStyle = '#f0eeea';
      ctx.font = `600 46px ${F}`;
      for (const l of wrap(quote, W - M * 2).slice(0, 3)) {
        ctx.fillText(l, M, y);
        y += 70;
      }

      if (question) {
        y += 44;
        const barTop = y - 32;

        ctx.fillStyle = '#9298a8';
        ctx.font = `400 25px ${F}`;
        ctx.fillText('它反问了我一句', M + 30, y);
        y += 46;

        ctx.fillStyle = '#d4dae6';
        ctx.font = `400 33px ${F}`;
        const qLines = wrap(question, W - M * 2 - 40).slice(0, 2);
        for (const l of qLines) {
          ctx.fillText(l, M + 30, y);
          y += 46;
        }

        ctx.fillStyle = '#d4a017';
        ctx.fillRect(M, barTop, 5, y - barTop - 14);
      }

      const foot = H - 128;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(M, foot - 44);
      ctx.lineTo(W - M, foot - 44);
      ctx.stroke();

      ctx.fillStyle = '#f4f2ee';
      ctx.font = `500 35px ${F}`;
      ctx.fillText('画一张画，看看它会对你说什么', M, foot);

      ctx.fillStyle = '#d4a017';
      ctx.font = `400 26px ${F}`;
      ctx.fillText(siteUrl.replace(/^https?:\/\//, ''), M, foot + 54);

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
          卡片只包含报告中的一句话与一个问题，
          <strong>不会包含你的问卷回答</strong>，也不会显示查询码。
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
          <span>包含我的画作（更好看，也更容易被朋友注意到）</span>
        </label>

        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'none' }} />

        {dataUrl ? (
          <>
            <img src={dataUrl} alt="分享卡片" className="share-preview" />
            <button className="btn btn-primary btn-full" onClick={download}>
              <Download size={16} /> 保存图片
            </button>
            <p className="share-tip">长按或保存后即可分享到朋友圈</p>
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
