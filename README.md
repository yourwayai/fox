<p align="center">
  <img src="public/fox.png" width="120" alt="Fox Logo" />
</p>

<h1 align="center">Fox 🦊</h1>

<p align="center">
  <strong>陪你读懂每一段</strong><br>
  <sub>自定义 AI 服务 · Markdown 阅读与问答 · 桌面 & Web 双形态</sub>
</p>

<p align="center">
  <a href="README.md">简体中文</a> · <a href="README_EN.md">English</a>
</p>

<p align="center">
  <img src="public/screenshot.png" width="860" alt="Fox 界面截图" />
</p>

---

## ✨ 特色一览

**阅读体验**

| 功能 | 说明 |
|---|---|
| 分栏伴读 | Zed 风格左 AI 右阅读布局，提问不打断滚动位置 |
| 选区多维预设 | 划词即弹 `解释` / `类比` / `深度推导` / `代码评审` / `加入提问` |
| 递进追问 | AI 回答中的术语可再次划词追问，层层递进 |
| 浮动大纲 | 多层级 TOC 抽屉，实时高亮当前章节，支持搜索跳转 |
| 文档内搜索 | `Cmd+F` 高亮匹配项，前后遍历与计数 |
| 引用反向定位 | 点击聊天引用卡片 → 右侧平滑滚入原文脉冲高亮 |
| 阅读位置记忆 | 像素级 `scrollTop` 恢复，多文档各自独立 AI 会话 |

**AI 能力**

| 功能 | 说明 |
|---|---|
| 兼容 OpenAI 协议 | 内置 DeepSeek / OpenAI / Ollama (免 Key) 一键预设，多配置管理 |
| 换模型重答 | 每条回答气泡底部可选其他模型重新生成，轻量对比 |
| 透明预算 | Token 实时进度条 + Prompt 多段预览 + 超额预警 |
| 域名隐私确认 | 首次连接新外部域名时弹窗确认目标与载荷摘要 |

**渲染与主题**

| 功能 | 说明 |
|---|---|
| KaTeX 公式 | 行内 `$...$` 与独立块 `$$...$$` |
| Mermaid 图表 | 按需动态加载，支持图表/源码切换 |
| 代码高亮 | Prism.js 多语言 + 语言徽章 + 一键复制 |
| 深色模式 | 系统跟随 / 浅色 / Zed 质感深灰三档 |

**吉祥物 · Fox Vector Mascot**

全矢量 SVG 渲染 · 尾巴随阅读进度 0%→100% 从 -6° 收拢到 +12° 舒展 · 耳朵映射 AI 状态 · 阅读光环 · 支持 `prefers-reduced-motion`

---

## 🛠 技术栈

| 层次 | 选型 | 说明 |
|---|---|---|
| 桌面底座 | **Tauri 2** (Rust) | 原生沙箱 · 文件关联 · 资产协议 |
| 前端 | **React 18** + TypeScript | 强类型组件化 |
| 样式 | **Tailwind CSS** | 原子化设计 |
| Markdown | react-markdown + remark-gfm | GFM 标准扩展 |
| 公式 / 图表 | KaTeX + Mermaid | 行内公式 · 按需加载图表 |
| 状态 | **Zustand** | 极简响应式 |
| 通信 | Native SSE + Tauri HTTP | 绕过 CORS · 流式 · 可中断 |
| 存储 | IndexedDB + localStorage | 异步适配 · 多会话隔离 |

---

## 🚀 快速开始

```bash
git clone https://github.com/yourwayai/fox.git && cd fox
npm install

# Web（免 Rust 依赖，秒级热更新）
npm run dev

# 桌面端
npm run tauri:dev      # 开发
npm run tauri:build    # 打包
```

---

## 🧪 测试

```bash
npm test   # 7 项自动化用例：TOC 解析 · 文档 ID · 视口截取 · 存储适配
```

---

## 📄 协议与规范

详见 [项目规划书](docs/Fox_Markdown_AI_伴读工具项目规划书.md)

- **只读沙箱** — 不修改原文档，禁用危险 HTML 执行
- **隐私优先** — 直连用户指定端点，零遥测
