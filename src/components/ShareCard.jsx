import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2, X, RefreshCw } from 'lucide-react';

/**
 * 分享卡片
 *
 * 三个设计决定：
 *
 * 1. **不放画作**。用户的画本身可能很私密，默认放上去等于替他们做了决定。
 *    改为从画作提取主色生成抽象光晕背景 —— 每个人的卡片色调都不同，
 *    有个性化，但看不出画了什么。
 *
 * 2. **金句由模型针对这幅画现写**，不是从语录库里挑。
 *    通用语录正是巴纳姆效应的温床，与本项目立场冲突。
 *
 * 3. **绝不含问卷原文**。这条在服务端提示词里也强制约束了。
 */

const W = 1080;
const H = 1320;
const M = 88;

/** 从画作提取主色，跳过接近纸白与纯黑的颜色 */
function extractPalette(img) {
  const c = document.createElement('canvas');
  c.width = 80;
  c.height = 80;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, 80, 80);
  const { data } = ctx.getImageData(0, 0, 80, 80);

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const v = max / 255;
    const s = max === 0 ? 0 : (max - min) / max;
    if (v > 0.93 && s < 0.12) continue; // 纸白
    if (v < 0.12) continue; // 纯黑
    const key = `${r >> 5}_${g >> 5}_${b >> 5}`;
    const cur = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    cur.r += r;
    cur.g += g;
    cur.b += b;
    cur.n += 1;
    buckets.set(key, cur);
  }

  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 3);
  const cols = sorted.map((x) => {
    let r = x.r / x.n;
    let g = x.g / x.n;
    let b = x.b / x.n;
    // 压暗并提高饱和，作为深色背景上的光晕
    const mx = Math.max(r, g, b) || 1;
    const boost = Math.min(1.35, 190 / mx);
    r = Math.min(255, r * boost) * 0.55;
    g = Math.min(255, g * boost) * 0.55;
    b = Math.min(255, b * boost) * 0.55;
    return [Math.round(r), Math.round(g), Math.round(b)];
  });

  while (cols.length < 3) cols.push(cols[cols.length - 1] || [70, 60, 110]);
  return cols;
}

export default function ShareCard({ apiBase, sessionId, drawingUrl, siteUrl, onClose }) {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dataUrl, setDataUrl] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${apiBase}/api/report/${sessionId}/share`, {
          credentials: 'include'
        });
        const d = await r.json();
        if (!alive) return;
        if (!r.ok) throw new Error(d.error || '素材生成失败');
        setMaterial(d);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiBase, sessionId]);

  const render = async () => {
    if (!material) return;
    setBusy(true);
    try {
      const cv = canvasRef.current;
      const ctx = cv.getContext('2d');
      const F = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif';

      // 取配色（失败则用默认冷紫）
      let palette = [
        [72, 48, 96],
        [110, 72, 60],
        [48, 60, 100]
      ];
      if (drawingUrl) {
        try {
          const img = await new Promise((res, rej) => {
            const im = new Image();
            im.crossOrigin = 'use-credentials';
            im.onload = () => res(im);
            im.onerror = rej;
            im.src = drawingUrl;
          });
          palette = extractPalette(img);
        } catch {
          /* 用默认配色 */
        }
      }

      // 深色底
      const base = ctx.createLinearGradient(0, 0, 0, H);
      base.addColorStop(0, '#0b0d13');
      base.addColorStop(1, '#12151f');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      // 三团柔光
      const spots = [
        [W * 0.28, H * 0.18, 620],
        [W * 0.82, H * 0.42, 560],
        [W * 0.45, H * 0.82, 600]
      ];
      ctx.globalCompositeOperation = 'lighter';
      spots.forEach(([cx, cy, rad], i) => {
        const [r, g, b] = palette[i] || palette[0];
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        gr.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
        gr.addColorStop(0.55, `rgba(${r},${g},${b},0.28)`);
        gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);
      });
      ctx.globalCompositeOperation = 'source-over';

      // 顶底压暗，保证文字可读
      const top = ctx.createLinearGradient(0, 0, 0, 300);
      top.addColorStop(0, 'rgba(11,13,19,0.55)');
      top.addColorStop(1, 'rgba(11,13,19,0)');
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, W, 300);

      const bot = ctx.createLinearGradient(0, H - 420, 0, H);
      bot.addColorStop(0, 'rgba(11,13,19,0)');
      bot.addColorStop(1, 'rgba(11,13,19,0.72)');
      ctx.fillStyle = bot;
      ctx.fillRect(0, H - 420, W, 420);

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

      ctx.fillStyle = '#ceac64';
      ctx.font = `500 26px ${F}`;
      ctx.fillText('MINDART · 绘画心理探索', M, 88);

      let y = 300;
      if (material.drawingTitle) {
        ctx.fillStyle = '#faf8f4';
        ctx.font = `700 78px ${F}`;
        ctx.fillText(`《${material.drawingTitle}》`, M, y);
        y += 122;
      }

      ctx.fillStyle = '#d4a017';
      ctx.fillRect(M, y, 80, 5);
      y += 84;

      ctx.fillStyle = '#f5f3ef';
      ctx.font = `600 52px ${F}`;
      for (const l of wrap(material.quote, W - M * 2).slice(0, 4)) {
        ctx.fillText(l, M, y);
        y += 78;
      }

      if (material.question) {
        y += 110;
        const barTop = y - 30;

        ctx.fillStyle = '#969cac';
        ctx.font = `400 24px ${F}`;
        ctx.fillText('它反问了我一句', M + 32, y);
        y += 46;

        ctx.fillStyle = '#d0d6e4';
        ctx.font = `400 31px ${F}`;
        for (const l of wrap(material.question, W - M * 2 - 44).slice(0, 2)) {
          ctx.fillText(l, M + 32, y);
          y += 44;
        }

        ctx.fillStyle = '#d4a017';
        ctx.fillRect(M, barTop, 5, y - barTop - 18);
      }

      const foot = H - 150;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.moveTo(M, foot - 46);
      ctx.lineTo(W - M, foot - 46);
      ctx.stroke();

      ctx.fillStyle = '#f4f2ee';
      ctx.font = `500 34px ${F}`;
      ctx.fillText('画一张画，看看它会对你说什么', M, foot);

      ctx.fillStyle = '#d4a017';
      ctx.font = `400 26px ${F}`;
      ctx.fillText(siteUrl.replace(/^https?:\/\//, ''), M, foot + 52);

      setDataUrl(cv.toDataURL('image/png'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (material && !dataUrl) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

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

        <h3>分享卡片</h3>
        <p className="share-privacy">
          卡片<strong>不包含你的画作和问卷回答</strong>，背景只取用画中的色调。
        </p>

        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'none' }} />

        {loading ? (
          <div className="my-reports-empty">
            <Loader2 className="animate-spin" size={18} />
            <span>正在为这幅画写一句话…</span>
          </div>
        ) : error ? (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        ) : dataUrl ? (
          <>
            <img src={dataUrl} alt="分享卡片" className="share-preview" />
            <button className="btn btn-primary btn-full" onClick={download}>
              <Download size={16} /> 保存图片
            </button>
            <p className="share-tip">保存后即可分享到朋友圈</p>
          </>
        ) : (
          <button className="btn btn-primary btn-full" onClick={render} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            生成卡片
          </button>
        )}
      </div>
    </div>
  );
}
