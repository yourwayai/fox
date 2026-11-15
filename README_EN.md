<p align="center">
  <img src="public/fox.png" width="160" alt="Fox Logo" />
</p>

# Fox 🦊

> **Fox, companions you through every paragraph.**  
> A desktop & web companion tool for Markdown reading and AI Q&A with customizable AI endpoints.

<p align="center">
  <a href="README.md">简体中文</a> •
  <a href="README_EN.md">English</a>
</p>

---

## 🌟 Core Highlights & Features

- 📖 **Zed-Inspired Split Workspace**: Read Markdown on the right; explore and converse with AI on the left without losing your reading scroll position.
- ✨ **Zero-Copy Selection Prompting**: Select any text to immediately trigger `[✨ Explain]` and `[➕ Add to Question]`. No more tedious copy-and-pasting across windows.
- 🧭 **Heading Hierarchy & Paragraph Context Extraction**: Automatically traces the heading breadcrumb (e.g. `# Chapter 1 > ## 1.2 Architecture`) and extracts adjacent surrounding paragraphs for accurate, grounded AI answers.
- 👁️ **Transparent Context Budget & Over-Budget Warning**:
  - Real-time token usage progress bar against your custom token budget.
  - Multi-segment "Prompt Preview" breakdown (System Directives / Selection / History).
  - Explicit warning when exceeding budget with one-click mitigation (Clear history / Remove quote). No silent truncations claiming full document comprehension.
- 🎯 **Reverse Quote Locator & Pulse Highlight**: Click any quote preview card in the chat history to smoothly scroll the Markdown reader directly to the original passage with a gentle pulsing highlight.
- 💾 **Precise Pixel-Level Position Memory & Multi-Document Isolation**:
  - Remembers exact `scrollTop` pixel coordinates across document switches and reloads.
  - Dropdown switcher for recently opened documents; each document maintains an isolated, private AI discussion thread.
- 📥 **Export Q&A Notes as Markdown**: One-click download of the current Q&A session formatted into a clean Markdown note complete with timestamps, models, selection quotes, and heading metadata.
- 🔌 **Universal OpenAI-Compatible API Support**: Preset one-click configurations for **DeepSeek**, **OpenAI**, and local **Ollama** (Key-less). Direct connection from your browser/device to target endpoints with zero intermediate servers.
- 🦊 **Non-Intrusive Mascot Companion**:
  - **State Feedback**: Unconfigured (Relaxed), Ready (Alert ears), Thinking (Subtle pulse), Generating (Focused).
  - **Reading Ring**: Circular SVG progress ring around the mascot mirroring reading percentage in real time.
  - **Reduce Motion Mode**: Fully adheres to system preferences (`prefers-reduced-motion`) or manual toggle for minimal distraction and energy efficiency.
- 💻 **Syntax Highlighting for Code Blocks**: Powered by Prism.js with language badges and one-click copy feedback.

---

## 🛠 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript | Strict typing & modular components |
| **Styling** | Tailwind CSS | Clean, atomic, and modern aesthetic |
| **Markdown Rendering** | react-markdown + remark-gfm | Standard GFM, tables, and typography |
| **Syntax Highlighting** | Prism.js | Multi-language syntax themes with copy utility |
| **State Management** | Zustand | Lightweight, reactive state store |
| **Streaming Protocol** | Native SSE (Server-Sent Events) | Real-time token streaming with `AbortController` cancellation |
| **Storage Architecture** | StorageService (localStorage adapter) | Decoupled adapter ready for native Tauri 2 SQLite / Keychain integration |

---

## 🚀 Quickstart

```bash
# 1. Clone repository
git clone https://github.com/yourwayai/fox.git
cd fox

# 2. Install dependencies
npm install

# 3. Start local development server (Instant HMR, no Rust/Xcode required)
npm run dev

# 4. Production build validation
npm run build
```

---

## 🧭 Roadmap & Architecture

For in-depth product specification and design rationale, see: [Fox Project Planning Document (Chinese)](docs/Fox_Markdown_AI_伴读工具项目规划书.md).

- **Read-Only Sandbox**: Never alters local source files; blocks unsafe inline raw scripts.
- **Privacy First**: Direct network requests to user-specified endpoints; no telemetry or data harvesting.
