import fs from 'fs';
import path from 'path';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';

/**
 * 分析引擎
 *
 * 支持三种 provider，通过环境变量 AI_PROVIDER 切换：
 *   - openai  (默认)  兼容 OpenAI / Azure OpenAI / 任何 OpenAI 兼容网关（如通义、DeepSeek、Kimi）
 *   - anthropic       Claude
 *   - mock            不调用任何 API，返回占位报告，用于本地开发调试
 */

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

function readImageAsBase64(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext] || 'image/png';
  const base64 = fs.readFileSync(imagePath).toString('base64');
  return { base64, mimeType };
}

/**
 * 修复字符串字面量内部的裸换行。
 * 模型生成长中文段落时，偶尔会直接输出真实换行而不是 \n 转义，
 * 这会让 JSON.parse 在数组/对象元素处报 "Expected ',' or ']'"。
 */
function escapeRawNewlinesInStrings(src) {
  let out = '';
  let inString = false;
  let escaped = false;

  for (const ch of src) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString && (ch === '\n' || ch === '\r')) {
      out += ch === '\n' ? '\\n' : '';
      continue;
    }
    if (inString && ch === '\t') {
      out += '\\t';
      continue;
    }
    out += ch;
  }

  return out;
}

/**
 * 从模型输出里稳健地抽出 JSON。
 * 模型偶尔会包 ```json 代码块、加前后缀说明，或产生尾随逗号、
 * 字符串内裸换行等小瑕疵，这里都兜住。
 */
function extractJson(text) {
  if (!text) throw new Error('模型返回为空');

  let cleaned = text.trim();

  // 去掉 markdown 代码块围栏
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) cleaned = fenced[1].trim();

  // 截取最外层的 { ... }，丢掉模型可能附加的说明文字
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  const noTrailingComma = (s) => s.replace(/,(\s*[}\]])/g, '$1');

  const attempts = [
    cleaned,
    noTrailingComma(cleaned),
    escapeRawNewlinesInStrings(cleaned),
    noTrailingComma(escapeRawNewlinesInStrings(cleaned))
  ];

  let lastErr;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (err) {
      lastErr = err;
    }
  }

  throw new Error(`无法从模型返回中解析出 JSON：${lastErr.message}`);
}

/**
 * 校验并规范化报告结构，避免前端因字段缺失而崩溃
 */
function normalizeReport(raw) {
  const asArray = (v) =>
    Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : [];

  const dimensions = Array.isArray(raw.dimensions)
    ? raw.dimensions
        .filter((d) => d && typeof d === 'object')
        .map((d) => ({
          title: String(d.title || '').trim() || '一个观察',
          content: String(d.content || '').trim()
        }))
        .filter((d) => d.content)
    : [];

  if (!raw.summary || !dimensions.length) {
    throw new Error('模型返回的报告缺少必要字段（summary / dimensions）');
  }

  return {
    summary: String(raw.summary).trim(),
    dimensions,
    advices: asArray(raw.advices),
    questions: asArray(raw.questions),
    safetyFlag: Boolean(raw.safetyFlag)
  };
}

/* ---------------------------------- providers --------------------------------- */

/**
 * 把 HTTP 错误包装成带元信息的 Error，供重试逻辑判断。
 * - retryAfterMs：服务端要求的等待时长
 * - fatal：额度耗尽/鉴权失败等，重试没有意义
 */
function makeApiError(label, response, detail) {
  const status = response.status;
  const err = new Error(`${label} 接口错误 ${status}: ${detail.slice(0, 300)}`);
  err.status = status;

  if (status === 429) {
    const headerWait = Number(response.headers.get('retry-after'));
    const bodyWait = Number(/retry in ([\d.]+)s/i.exec(detail)?.[1]);
    const seconds = headerWait || bodyWait || 0;

    err.retryAfterMs = Math.min(seconds * 1000, 60_000);

    // 免费额度用尽属于配额问题，等几十秒也无济于事
    if (/quota|billing|RESOURCE_EXHAUSTED/i.test(detail) && !seconds) {
      err.fatal = true;
    }
    err.friendly = seconds
      ? `模型调用频率超限，请约 ${Math.ceil(seconds)} 秒后重试`
      : '模型调用额度已用尽，请检查 API Key 的配额或计费设置';
  }

  if (status === 401 || status === 403) {
    err.fatal = true;
    err.friendly = 'API Key 无效或无权限，请检查配置';
  }

  return err;
}

async function callOpenAI({ userPrompt, base64, mimeType, temperature = 0.8 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('缺少环境变量 OPENAI_API_KEY');

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // Azure OpenAI 用 api-key 头，这里一并带上，非 Azure 会忽略
      'api-key': apiKey
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw makeApiError('OpenAI', response, detail);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

async function callAnthropic({ userPrompt, base64, mimeType, temperature = 0.8 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('缺少环境变量 ANTHROPIC_API_KEY');

  const model = process.env.AI_MODEL || 'claude-sonnet-4-20250514';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      temperature,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: userPrompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw makeApiError('Anthropic', response, detail);
  }

  const data = await response.json();
  return data.content?.find((c) => c.type === 'text')?.text;
}

function mockReport(answers) {
  return {
    summary: `这是一份开发模式下的占位报告。《${answers.drawingTitle || '未命名'}》已经收到，问卷也读过了。要看到真正的分析，请在 .env 里配置 AI_PROVIDER 和对应的 API Key。`,
    dimensions: [
      {
        title: '开发模式',
        content:
          '当前 AI_PROVIDER=mock，系统没有调用任何大模型，因此这里的内容是固定文本。把 AI_PROVIDER 改成 openai 或 anthropic，并填入 API Key，重启服务后重新提交即可看到真实生成的报告。'
      }
    ],
    advices: ['复制 .env.example 为 .env', '填入 API Key', '重启 npm run dev'],
    questions: ['配置文档在 README 里，读过了吗？'],
    safetyFlag: false
  };
}

/* ----------------------------------- 主入口 ----------------------------------- */

/**
 * 生成分析报告
 * @param {object} answers  answers.json 的内容
 * @param {string} imagePath 画作的绝对路径
 * @returns {Promise<object>} 规范化后的 report 对象
 */
export async function generateReport(answers, imagePath) {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (provider === 'mock') {
    return { ...mockReport(answers), generatedAt: new Date().toISOString(), provider, model: 'mock' };
  }

  const { base64, mimeType } = readImageAsBase64(imagePath);
  const userPrompt = buildUserPrompt(answers);

  const call = async (temperature) => {
    if (provider === 'anthropic') {
      return callAnthropic({ userPrompt, base64, mimeType, temperature });
    }
    if (provider === 'openai') {
      return callOpenAI({ userPrompt, base64, mimeType, temperature });
    }
    throw new Error(`未知的 AI_PROVIDER: ${provider}（可选 openai / anthropic / mock）`);
  };

  // 模型偶发返回不合法 JSON，重试时降低 temperature 提高结构稳定性
  const MAX_ATTEMPTS = 3;
  let lastErr;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const rawText = await call(attempt === 1 ? 0.8 : 0.4);
      const report = normalizeReport(extractJson(rawText));

      return {
        ...report,
        generatedAt: new Date().toISOString(),
        provider,
        model: process.env.AI_MODEL || (provider === 'anthropic' ? 'claude-sonnet-4' : 'gpt-4o')
      };
    } catch (err) {
      lastErr = err;
      console.warn(`[Analyzer] 第 ${attempt}/${MAX_ATTEMPTS} 次尝试失败: ${err.message}`);

      // 额度耗尽、鉴权失败等，重试无意义，直接抛出
      if (err.fatal) break;

      if (attempt < MAX_ATTEMPTS) {
        // 被限流时尊重服务端要求的等待时长，否则用退避
        const wait = err.retryAfterMs || 1000 * attempt;
        if (wait > 0) {
          console.warn(`[Analyzer] 等待 ${Math.round(wait / 1000)} 秒后重试…`);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
    }
  }

  // 对外抛出可读性更好的提示
  if (lastErr?.friendly) {
    const e = new Error(lastErr.friendly);
    e.cause = lastErr;
    throw e;
  }
  throw lastErr;
}
