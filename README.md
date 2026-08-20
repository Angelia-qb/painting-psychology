# MindArt Studio · 自由表达绘画心理分析

一个基于**表达性艺术治疗（Expressive Arts Therapy）**与**现象学探究**的绘画心理探索工具。

上传一幅你自己的画，回答几个引导式问题，系统会结合画面与你的叙述生成一份陪伴式的反思报告。

> ⚠️ **本工具不具备任何临床诊断或医学评估效力**，不能替代专业心理咨询或治疗。它的目标是帮助你更清楚地看见自己已经表达出来的东西。

---

## 它和市面上的"绘画测试"有什么不同

大部分绘画心理测试是**符号词典式**的：房子朝左代表什么、红色代表愤怒、线条粗代表攻击性 —— 这类一一对应的解读缺乏实证支持。

本项目刻意避开了这条路：

- **意义由创作者赋予，而不是系统"解码"**。画面观察只是辅助，你自己的叙述才是主体。
- **重视身体感受**。问卷会问"画的时候手腕在用力吗""胸口是什么感觉"，这来自表达性艺术治疗对身体经验的重视。
- **试探而非断言**。报告使用"我注意到……""这似乎……"的语气，每个观察都留出让你确认或推翻的空间。
- **不贴标签**。系统提示词中明确禁止使用任何精神障碍名称、人格类型或量表分数。

---

## 功能

- 五步引导流程：介绍 → 绘画准备 → 上传作品 → 表达性探索问卷 → 生成报告
- **8 位查询码**（如 `K7F2-Q9WM`）代替冗长 ID，方便记录和口头转述
- **我的报告**：本机自动记录历史报告，无需手动保存查询码
- 多模态 AI 分析，同时读取画作图像与问卷文本
- 报告包含：整体回应、3~4 个观察维度、具体可执行的建议、开放式自我觉察问题
- 危机内容自动识别，触发时优先展示心理援助资源而非做深度解读
- 数据全部保存在本地 `data/` 目录，不上传到任何第三方服务器（除调用 AI 模型时发送画作与问卷）

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 AI Provider

```bash
cp .env.example .env
```

编辑 `.env`：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxx
AI_MODEL=gpt-4o
```

**支持三种 provider：**

| Provider | 说明 | 必填变量 |
|---|---|---|
| `openai` | OpenAI 官方，或任何 OpenAI 兼容网关 | `OPENAI_API_KEY`，可选 `OPENAI_BASE_URL` |
| `anthropic` | Claude | `ANTHROPIC_API_KEY` |
| `mock` | 不调用真实模型，返回占位报告 | 无（用于开发调试） |

**模型必须支持视觉（多模态）**，如 `gpt-4o`、`claude-sonnet-4`、`qwen-vl-max`。

<details>
<summary>使用 Azure OpenAI / 国内模型网关</summary>

```env
# Azure OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=<你的 Azure Key>
OPENAI_BASE_URL=https://<资源名>.openai.azure.com/openai/deployments/<部署名>
AI_MODEL=<部署名>

# 阿里通义千问（OpenAI 兼容模式）
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-vl-max
```
</details>

### 3. 启动

```bash
npm run dev
```

前端 http://localhost:5173 ，后端 http://localhost:3001 。

生产部署：

```bash
npm run build
node server.js     # 单端口同时提供前端与 API
```

### 数据持久化

画作、问卷与报告默认写在项目下的 `data/`。若项目位于 `/tmp` 等临时目录，
或部署在容器中，**务必**用 `DATA_DIR` 指向持久化位置，否则重启后数据全部丢失：

```env
DATA_DIR=/var/lib/mindart-data
```

服务启动时会打印实际数据目录；若检测到位于 `/tmp` 下会输出警告。

---

## 工作流程

```
用户提交
   ↓
POST /api/submit
   ├─ 校验文件类型（PNG/JPG/WEBP/GIF，≤10MB）与必填字段
   ├─ 生成随机 sessionId，保存 answers.json + 画作
   └─ 立即返回 sessionId（不阻塞用户）
        ↓
   后台异步调用 AI（20~60 秒）
        ├─ 成功 → 写入 report.json，status = done
        └─ 失败 → status = failed，前端可一键重试
             ↓
前端轮询 GET /api/report/:sessionId（每 3 秒）
   → 出报告后自动渲染
```

---

## API

| 方法 | 路径 | 说明 | 限流 |
|---|---|---|---|
| `POST` | `/api/submit` | 提交画作与问卷，返回 `sessionId` 与 `shortCode` | 10 次 / 10 分钟 |
| `GET` | `/api/report/:code` | 获取报告，含 `status`（`analyzing`/`done`/`failed`） | 60 次 / 分钟 |
| `POST` | `/api/report/:code/regenerate` | 分析失败时重新生成 | 60 次 / 分钟 |

`:code` 同时接受 8 位查询码与完整 `sessionId`。查询码不区分大小写，
连字符可省略（`K7F2-Q9WM` / `k7f2q9wm` / `K7F2 Q9WM` 均可）。

### report.json 结构

```json
{
  "summary": "整体回应",
  "dimensions": [{ "title": "维度标题", "content": "展开内容" }],
  "advices": ["具体可执行的建议"],
  "questions": ["开放式自我觉察问题"],
  "safetyFlag": false,
  "generatedAt": "2026-08-20T11:34:00.000Z",
  "provider": "openai",
  "model": "gpt-4o"
}
```

---

## 项目结构

```
├── server.js                    Express 服务：上传、分析调度、报告查询
├── lib/
│   ├── analyzer.js              分析引擎，多 provider 适配 + 输出校验
│   ├── prompt.js                系统提示词（表达性艺术治疗原则）
│   ├── shortcode.js             8 位查询码生成与规范化
│   └── rateLimit.js             内存限流，防止查询码被枚举
├── src/
│   ├── App.jsx                  主流程与状态管理
│   └── components/
│       ├── Introduction.jsx     介绍与免责声明
│       ├── DrawingGuide.jsx     绘画准备指引
│       ├── ImageUploader.jsx    作品上传
│       ├── GuidedInquiry.jsx    五问表达性探索问卷
│       ├── Success.jsx          提交成功
│       ├── ReportViewer.jsx     报告查询与轮询展示
│       ├── MyReports.jsx        本机报告列表
│       └── Appendix.jsx         科学附录
│   └── lib/myReports.js         localStorage 报告记录
└── data/
    ├── codes.json               查询码 → sessionId 映射
    └── sessions/<sessionId>/    本地数据（已 gitignore）
    ├── drawing.png
    ├── answers.json
    ├── report.json
    └── status.json
```

---

## 隐私与安全

- `data/` 与 `.env` 均已加入 `.gitignore`，不会被提交
- `sessionId` 使用 `crypto.randomBytes` 生成，无法被枚举猜测
- 查询码为 8 位随机码（字母表已排除 `0/O`、`1/I/L` 等易混字符），约 5×10¹¹ 种组合，
  并配合接口限流防止暴力枚举
- 「我的报告」列表仅存于浏览器 localStorage，不上传服务器
- 报告查询接口对 sessionId 做格式白名单校验，防止路径穿越
- 上传限制：仅图片格式，单文件 ≤10MB
- 静态目录只暴露 `data/sessions/` 下的图片文件；
  `codes.json`（全部查询码映射）与 `answers.json` / `report.json` 均无法直接下载

**注意：** 当前版本没有用户鉴权，任何人拿到查询码都可以查看对应报告。如需部署到公网供多人使用，请自行增加访问控制。

---

## 心理危机资源

如果你或身边的人正处于困境中，请寻求真实的人的帮助：

- **希望24热线**：400-161-9995
- **北京心理危机研究与干预中心**：010-82951332
- **紧急情况请拨打 120**

---

## License

MIT
