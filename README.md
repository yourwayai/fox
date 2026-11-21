<p align="center">
  <img src="public/fox.png" width="100" alt="Fox" />
</p>

<h1 align="center">Fox</h1>

<p align="center">
  Markdown AI 伴读工具 — 右侧读原文，左侧问 AI，彼此不干扰。
</p>

<p align="center">
  <a href="README.md">简体中文</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="README_EN.md">English</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="LICENSE">MIT License</a>
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

**划词多维预设** — 选中文字后弹出浮动工具条：内置 `✨ 解释` · `💡 类比` · `🔍 推导` · `⚡ 代码评审` · `➕ 加入提问`，并支持在设置中自定义任意 Prompt 扩展指令（如翻译、要点提炼、润色优化）。AI 回答中的陌生术语也可再次划词追问，层层递进。

**浮动大纲 & 搜索** — 右侧可展开多层级 TOC 抽屉，实时高亮当前章节。`Cmd+F` 文档内搜索支持计数、高亮与前后遍历。

**伴读快捷键** — 专为桌面伴读设计的快捷操作流：
- `Cmd/Ctrl + O`：快速打开本地 Markdown 文件（桌面原生对话框 / Web 自动适配）
- `Cmd/Ctrl + B` 或 `Cmd/Ctrl + T`：展开 / 收起大纲抽屉 (TOC)
- `Cmd/Ctrl + ,`：呼出偏好设置
- `Cmd/Ctrl + L`：无缝聚焦左栏提问输入框
- `Enter` / `Cmd+Enter`：快捷发送提问；`Esc` 多层级防抖后退与失焦

**引用反向定位** — 点击左栏聊天中的引用卡片，右侧文档平滑滚入原文位置并脉冲高亮，方便比对验证。

### AI

**多模型配置** — 保存多套模型配置并随时切换。每条 AI 回答气泡底部可选择其他已保存模型重新生成（`换模型重答`），轻量横向对比。

**密钥脱敏与安全托管** — 已保存 API Key 自动掩码呈现（`sk-••••••••1234`），需主动确认“更换密钥”方可编辑；桌面模式接入操作系统原生钥匙串（macOS Keychain / OS Vault）硬件级安全托管，彻底脱离网页明文存储层；所有网络请求直连模型服务商，绝不上报云端。

**透明预算** — Token 实时进度条 + Prompt 多段拆解预览（系统指令 / 选区 / 历史）。超出预算主动预警，杜绝静默截断。

**域名隐私确认** — 首次向新外部域名发请求时弹出确认弹窗，显示目标主机与载荷摘要，支持一键信任。

**外链图片防信标闸门** — 防范外部文档通过图片信标（Image Beacon）隐式探测 IP 与阅读行为。未信任域名的远程图片默认拦截并展示防护占位条，支持单次放行、信任域名与设置中心集中解绑。

### 渲染

**KaTeX 数学公式** — 行内 `$E=mc^2$` 与独立块 `$$...$$` 完整支持。

**Mermaid 图表** — 动态按需加载流程图、时序图、架构图，支持一键切换图表与源码视图。

**代码高亮** — Prism.js 多语言深色主题 + 语言徽章 + 一键复制。

**深色模式** — 系统跟随 / 浅色 / Zed 质感深灰，三档切换。

### 吉祥物

全矢量 SVG 狐狸伴读形象。尾巴随阅读进度 0 → 100% 从 -6° 收拢到 +12° 舒展，耳朵映射 AI 状态（放松 / 竖耳 / 微动 / 专注 / 低垂），外圈光环跟随阅读百分比旋转。完整支持 `prefers-reduced-motion`。

<br>

## 技术栈

- **桌面** — Tauri 2 (Rust 2024)
- **前端** — React 18 · TypeScript · Tailwind CSS
- **状态** — Zustand
- **Markdown** — react-markdown · remark-gfm · rehype-slug
- **公式** — KaTeX　　**图表** — Mermaid (动态分块)　　**高亮** — Prism.js
- **网络** — 原生 SSE + Tauri HTTP 插件 (桌面端绕过 CORS)
- **存储** — IndexedDB + localStorage 异步适配层

<br>

## 快速开始

```bash
git clone https://github.com/yourwayai/fox.git
cd fox && npm install
```

**Web** — 免 Rust 依赖，秒级热更新：

```bash
npm run dev
```

**桌面端** — 需要 Rust 工具链：

```bash
npm run tauri:dev      # 开发调试
npm run tauri:build    # 生产打包
npm run bundle:dmg     # 生产打包并一键封装 macOS .dmg 磁盘镜像
```

**测试** — 10 项自动化用例覆盖 TOC 解析、文档 ID、视口截取、存储适配、全局快捷键、图片防信标与自定义伴读指令：

```bash
npm test
```

<br>

## 设计原则

> **只读沙箱** — 不修改原文档，禁用危险 HTML 执行
>
> **隐私优先** — 直连用户端点，零遥测、零中间代理
>
> **所见即所发** — Prompt 预览透视实际发送内容，拒绝黑盒

<br>

## 文档

- [项目规划书](docs/Fox_Markdown_AI_伴读工具项目规划书.md) — 完整产品设计、安全红线与路线图
- [任务清单与演进规划](docs/TODO.md) — 阶段里程碑与详细待办清单 (Todo List)

<br>

## 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
