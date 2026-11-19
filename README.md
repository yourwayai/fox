<p align="center">
  <img src="public/fox.png" width="100" alt="Fox" />
</p>

<h1 align="center">Fox</h1>

<p align="center">
  Markdown AI 伴读工具 — 右侧读原文，左侧问 AI，彼此不干扰。
</p>

<p align="center">
  <a href="README.md">简体中文</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="README_EN.md">English</a>
</p>

<br>

<p align="center">
  <img src="public/screenshot.png" width="820" alt="Fox 界面截图" />
</p>

<br>

## 为什么是 Fox

大多数 AI 阅读工具要么把原文裁碎喂给模型，要么把对话覆盖在正文之上。Fox 选择一条更安静的路：**原文完整留在右栏，对话独立在左栏**，两侧各自滚动、互不打断。你划选一段文字，Fox 立刻弹出五种预设维度（解释、类比、推导、代码评审、追加提问），一键发送后右栏不跳、不闪、不丢位。

Fox 不绑定任何服务商。内置 DeepSeek、OpenAI 和本地 Ollama 三套一键预设，也可以自行填入任何 OpenAI 兼容端点。**API Key 只在本地存储，请求直达你指定的服务端点，零中间代理、零遥测。**

<br>

## 核心功能

### 阅读

**分栏伴读** — Zed 风格双栏布局。提问时右侧阅读位置纹丝不动，支持像素级滚动位置记忆与跨文档恢复。每份文档绑定独立 AI 会话，互不串扰。

**划词多维预设** — 选中文字后弹出浮动工具条：`✨ 解释` · `💡 类比` · `🔍 推导` · `⚡ 代码评审` · `➕ 加入提问`。AI 回答中的陌生术语也可再次划词追问，层层递进。

**浮动大纲 & 搜索** — 右侧可展开多层级 TOC 抽屉，实时高亮当前章节。`Cmd+F` 文档内搜索支持计数、高亮与前后遍历。

**引用反向定位** — 点击左栏聊天中的引用卡片，右侧文档平滑滚入原文位置并脉冲高亮，方便比对验证。

### AI

**多模型配置** — 保存多套模型配置并随时切换。每条 AI 回答气泡底部可选择其他已保存模型重新生成（`换模型重答`），轻量横向对比。

**透明预算** — Token 实时进度条 + Prompt 多段拆解预览（系统指令 / 选区 / 历史）。超出预算主动预警，杜绝静默截断。

**域名隐私确认** — 首次向新外部域名发请求时弹出确认弹窗，显示目标主机与载荷摘要，支持一键信任。

### 渲染

**KaTeX 数学公式** — 行内 `$E=mc^2$` 与独立块 `$$...$$` 完整支持。

**Mermaid 图表** — 动态按需加载流程图、时序图、架构图，支持一键切换图表与源码视图。

**代码高亮** — Prism.js 多语言深色主题 + 语言徽章 + 一键复制。

**深色模式** — 系统跟随 / 浅色 / Zed 质感深灰，三档切换。

### 吉祥物

全矢量 SVG 狐狸伴读形象。尾巴随阅读进度 0 → 100% 从 -6° 收拢到 +12° 舒展，耳朵映射 AI 状态（放松 / 竖耳 / 微动 / 专注 / 低垂），外圈光环跟随阅读百分比旋转。完整支持 `prefers-reduced-motion`。

<br>

## 技术栈

```
桌面底座   Tauri 2 · Rust 2024 edition
前端       React 18 · TypeScript · Tailwind CSS
Markdown   react-markdown · remark-gfm · rehype-slug
公式/图表  KaTeX · Mermaid（动态分块加载）
代码高亮   Prism.js
状态管理   Zustand
网络通信   原生 SSE + Tauri HTTP 插件（桌面端绕过 CORS）
存储       IndexedDB + localStorage 异步适配层
```

<br>

## 快速开始

```bash
git clone https://github.com/yourwayai/fox.git
cd fox && npm install

npm run dev          # Web 开发服务器（免 Rust 依赖）
npm run tauri:dev    # 桌面端开发
npm run tauri:build  # 桌面端打包

npm test             # 自动化测试（TOC · 文档 ID · 视口截取 · 存储适配）
```

<br>

## 设计原则

| 原则 | 实践 |
|---|---|
| **只读沙箱** | 不修改原文档，禁用危险 HTML 执行 |
| **隐私优先** | 直连用户端点，零遥测、零中间代理 |
| **所见即所发** | Prompt 预览透视实际发送内容，拒绝黑盒 |

<br>

## 文档

- [项目规划书](docs/Fox_Markdown_AI_伴读工具项目规划书.md) — 完整产品设计、安全红线与路线图
