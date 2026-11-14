<p align="center">
  <img src="public/fox.png" width="160" alt="Fox Logo" />
</p>

# Fox 🦊

> **Fox，陪你读懂每一段。**  
> 支持自定义 AI 服务的 Markdown 阅读与问答桌面工具。

---

## 🌟 核心价值与特色

- **分栏伴读（Zed 交互）**：右侧专注阅读 Markdown 原文，左侧与 AI 进行针对性探讨，绝不打乱当前阅读位置。
- **选区即问**：鼠标选中任意文字，直接浮现 `[✨ 解释]` 与 `[➕ 加入提问]`，告别反复复制粘贴。
- **自定义 AI 服务**：无缝支持 OpenAI-compatible 协议（如 DeepSeek、OpenAI、本地 Ollama / LM Studio 等）。
- **可控透明的上下文**：清晰可见每次提问携带的文档切片，杜绝隐式截断。
- **灵动的狐狸助手**：
  - **耳朵**：映射 AI 状态（就绪、思考、流式生成、异常）。
  - **大尾巴**：随文档滚动进度舒展与轻摆，不干扰阅读注意力。

---

## 🛠 技术架构

- **前端**：React 18 + TypeScript + Tailwind CSS + Lucide Icons
- **Markdown 引擎**：react-markdown + remark-gfm
- **状态管理**：Zustand
- **通信与流式处理**：原生 SSE 解析（Server-Sent Events）+ AbortController 支持手动停止
- **适配器设计模式**：Web 端开箱即用，后续无缝接入 Tauri 2 原生系统凭据库与本地 SQLite

---

## 🚀 本地极速运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（秒级启动，免 Rust/Xcode 依赖）
npm run dev

# 3. 生产构建验证
npm run build
```

---

## 🧭 项目规范与路线

详情参见规划文档：
- **版本规划**：MVP 聚焦只读伴读闭环，后续扩展文档目录、Mermaid 图表与公式解析。
- **安全准则**：本地存储，直连用户配置的服务端点，杜绝中间服务器。
