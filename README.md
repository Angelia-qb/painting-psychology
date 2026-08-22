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

## 实证基础与立场

本项目对"绘画心理分析"采取**证据分层**的立场：

| 用途 | 证据状况 | 本系统 |
|---|---|---|
| 表达与情绪调节的**干预** | 有支持（效应量小到中等，研究质量偏低） | ✅ 采用 |
| 诊断、人格评估、心理测量 | 已被证伪（缺乏效度与增量效度） | ❌ 拒绝 |
| 预测、运势、卜卦 | 无任何实证支持 | ❌ 拒绝 |

关键文献见 `lib/knowledgeBase.js` 与应用内「科学附录」页，均附 PMID/DOI 可核查。

**知识库的作用是约束模型，不是提供"解读词典"。** 它明确不收录"符号→含义"
对照表（如"红色=愤怒""房=家庭"），因为 Lilienfeld et al. (2000)、
Motta et al. (1993) 等研究已证实这类解读无效；提供给模型只会让它更自信地胡说。

知识库同时要求模型防范**巴纳姆效应**——报告"读起来很准"不能作为有效性证据。

## 账号与权限

- **邀请制注册**：除首个管理员账号外，注册需要邀请码
- **每日配额**：每人每天 3 次免费分析（管理员不受限）
- **次数包**：免费次数用完后消耗次数包，6 元/次
- **邀请奖励**：每人每天可领 3 个邀请码，每成功邀请 1 人 +5 次
- **存储上限**：每人 100MB
- 必须注册/登录才能提交画作或查看报告
- **每个用户只能看到自己的报告**，用别人的查询码查询会返回"不存在"
- **首个注册的账号自动成为管理员**，可查看全部用户的报告
- 会话使用 HMAC 签名的 httpOnly Cookie，有效期 30 天

> 部署后请**第一时间自己注册**，以取得管理员账号。

管理员在「查看报告」页可切换「查看全部」，查看他人报告时页面顶部会明确标识。

## 功能

- 五步引导流程：介绍 → 绘画准备 → 上传作品 → 表达性探索问卷 → 生成报告
- **8 位查询码**（如 `K7F2-Q9WM`）代替冗长 ID，方便记录和口头转述
- **我的报告**：与账号绑定，换设备登录后依然可见
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
# 使用 Claude（推荐）
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
AI_MODEL=claude-sonnet-4-20250514
# 自建或中转的 Anthropic 兼容网关可覆盖地址：
# ANTHROPIC_BASE_URL=http://127.0.0.1:18790

# 或使用 OpenAI
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-xxxxx
# AI_MODEL=gpt-4o
```

**支持三种 provider：**

| Provider | 说明 | 必填变量 |
|---|---|---|
| `openai` | OpenAI 官方，或任何 OpenAI 兼容网关 | `OPENAI_API_KEY`，可选 `OPENAI_BASE_URL` |
| `anthropic` | Claude（推荐，中文表达细腻） | `ANTHROPIC_API_KEY`，可选 `ANTHROPIC_BASE_URL` |
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

### 固定域名（Cloudflare 具名隧道）

本项目部署在无公网 IP 的机器上，通过 Cloudflare Tunnel 出站连接暴露服务。

```bash
./cloudflared tunnel login                      # 浏览器授权（注意：勿频繁重试，会触发 429 限流）
./cloudflared tunnel create mindart             # 创建隧道
./cloudflared tunnel route dns mindart <域名>    # 绑定 DNS
```

然后按 `cloudflared-config.yml.example` 写 `~/.cloudflared/config.yml`，
用 `mindart-tunnel.service.example` 安装 systemd 服务。

优点：无需公网 IP、无需开放防火墙端口、自动 HTTPS、地址固定。

### 常驻运行（systemd 用户服务）

```bash
./install-service.sh          # 安装并启动
systemctl --user status mindart mindart-tunnel
systemctl --user restart mindart
tail -f server.log tunnel.log
```

服务配置了 `Restart=always`，进程崩溃会自动拉起；配合 `loginctl enable-linger`
后，退出登录或机器重启也能继续运行。

公网地址在 `tunnel.log` 中：

```bash
grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" tunnel.log | tail -1
```

> ⚠️ trycloudflare 快速隧道**每次重启都会换地址**，且无可用性保证。
> 长期使用应改为具名隧道或部署到云服务器。

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

| 方法 | 路径 | 权限 | 说明 | 限流 |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | 公开 | 注册（首个账号为管理员） | 20 次 / 10 分钟 |
| `POST` | `/api/auth/login` | 公开 | 登录 | 20 次 / 10 分钟 |
| `POST` | `/api/auth/logout` | 公开 | 退出 | — |
| `GET` | `/api/auth/me` | 公开 | 当前登录状态 | — |
| `POST` | `/api/submit` | 登录 | 提交画作，返回 `shortCode` | 10 次 / 10 分钟 |
| `GET` | `/api/report/:code` | 本人/管理员 | 获取报告 | 60 次 / 分钟 |
| `POST` | `/api/report/:code/regenerate` | 本人/管理员 | 重新生成 | 60 次 / 分钟 |
| `GET` | `/api/my-reports` | 登录 | 我的报告列表；管理员加 `?all=1` 看全部 | 60 次 / 分钟 |
| `GET` | `/api/admin/users` | 管理员 | 用户列表与报告数 | — |
| `GET` | `/api/admin/invites` | 管理员 | 邀请码列表 | — |
| `POST` | `/api/admin/invites` | 管理员 | 生成邀请码 | — |
| `POST` | `/api/admin/invites/:code/revoke` | 管理员 | 停用邀请码 | — |
| `GET` | `/api/admin/usage` | 管理员 | 各用户用量统计 | — |
| `GET` | `/api/me/account` | 登录 | 余额、流水、邀请码、邀请战绩 | — |
| `POST` | `/api/orders` | 登录 | 下单购买次数 | — |
| `POST` | `/api/admin/orders/:id/confirm` | 管理员 | 确认订单并发放次数 | — |
| `POST` | `/api/admin/grant` | 管理员 | 直接赠送次数 | — |

> ⚠️ **支付网关尚未接入。** 微信支付/支付宝需要企业主体、商户号与备案域名，
> 须由运营方自行申请。当前 `PAYMENT_PROVIDER=mock`，订单需管理员手动确认。
> 拿到商户号后填入 `.env` 即可切换。
| `GET` | `/data/sessions/:id/drawing.png` | 本人/管理员 | 画作图片 | — |

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
│   ├── knowledgeBase.js         实证文献库与证据摘要（注入提示词）
│   ├── shortcode.js             8 位查询码生成与规范化
│   ├── rateLimit.js             内存限流，防止查询码被枚举
│   ├── users.js                 用户存储（scrypt 密码哈希）
│   ├── invites.js               邀请码生成与校验
│   ├── usage.js                 每日配额与存储用量
│   ├── credits.js               次数包（全流水记账）
│   ├── orders.js                订单与支付（网关可插拔）
│   └── auth.js                  HMAC 签名会话令牌与权限中间件
├── src/
│   ├── App.jsx                  主流程与状态管理
│   └── components/
│       ├── Introduction.jsx     介绍与免责声明
│       ├── DrawingGuide.jsx     绘画准备指引
│       ├── ImageUploader.jsx    作品上传
│       ├── GuidedInquiry.jsx    五问表达性探索问卷
│       ├── Success.jsx          提交成功
│       ├── ReportViewer.jsx     报告查询与轮询展示
│       ├── Login.jsx            登录与注册（含邀请码）
│       ├── AdminPanel.jsx       管理后台：邀请码与用量
│       ├── MyAccount.jsx        我的账户：次数、邀请、购买
│       ├── ShareCard.jsx        分享卡片（canvas 生成，不含隐私）
│       ├── MyReports.jsx        报告列表（含管理员视图）
│       └── Appendix.jsx         科学附录
└── data/
    ├── users.json               账号与密码哈希
    ├── .session-secret          会话签名密钥（自动生成，权限 600）
    ├── codes.json               查询码 → sessionId 映射
    └── sessions/<sessionId>/    本地数据（已 gitignore）
    ├── drawing.png
    ├── answers.json
    ├── report.json
    └── status.json
```

---

## ⚠️ 数据保护

**本项目禁止删除任何报告数据。** 详见 [DATA_PROTECTION.md](./DATA_PROTECTION.md)。

- 需要隐藏数据时，改代码逻辑加过滤标记，不要动磁盘上的文件
- 用户停用走 `disable()` 软标记，不提供物理删除接口
- 服务启动时会比对上次的数据规模，**一旦会话减少立即在控制台告警**
- `backup.sh` 每小时快照一次（只增不减），备份存放在
  `data/painting-psychology-backups/`

测试时请用独立数据目录，不要在生产目录里造数据再清理：

```bash
DATA_DIR=/tmp/pp-test npm run dev
```

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

- 密码使用 scrypt + 每用户独立 salt 哈希存储，校验用 `timingSafeEqual` 防时序攻击
- 登录失败时不区分"用户不存在"与"密码错误"，避免用户名枚举
- 越权访问返回 404 而非 403，避免泄露"该查询码确实存在"
- 画作图片经接口鉴权后下发，不走静态目录

**生产部署建议：** 设置固定的 `SESSION_SECRET` 环境变量（否则首次启动会自动生成并存入
`data/.session-secret`）。多实例部署时必须显式设置，否则各实例签名不一致。

---

## 心理危机资源

如果你或身边的人正处于困境中，请寻求真实的人的帮助：

- **希望24热线**：400-161-9995
- **北京心理危机研究与干预中心**：010-82951332
- **紧急情况请拨打 120**

---

## License

MIT
