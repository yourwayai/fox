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

<p align="center">
  <img src="public/screenshot.png" width="920" alt="Fox Interface Screenshot" />
</p>

---

## 🌟 Core Highlights & Features

- 📖 **Zed-Inspired Split Workspace**: Read Markdown on the right; explore and converse with AI on the left without losing your reading scroll position.
- ✨ **Multi-Perspective Selection Actions**: Select any passage to immediately trigger presets: `[✨ Explain]`, `[💡 Plain Analogy]`, `[🔍 Deep Dive]`, `[⚡ Code Review]`, and `[➕ Add to Question]`.
- 🔁 **Secondary AI Clarification (Recursive Clarification)**: Select any confusing technical term or jargon within the AI assistant's responses in the left panel to trigger `[Ask about this]` or `[Quote]`, enabling progressive, recursive understanding.
- 📑 **Floating Table of Contents (TOC) & Real-Time Heading Sync**: Open the outline drawer on the right with multi-level headings, live active section highlighting as you scroll, and instant search filter.
- 🔍 **In-Document Quick Search (Cmd+F / Ctrl+F)**: Lightweight in-doc search bar with real-time match counter (`x/y`), previous/next navigation, and Enter key jump.
- 📐 **KaTeX Math & Dynamic Mermaid Diagrams**:
  - Full support for inline `$E=mc^2$` and block `$$...$$` mathematical equations via KaTeX.
  - Dynamically imported Mermaid architecture and sequence diagrams with instant diagram/code toggle.
- 🌙 **Dark Mode (Zed / Obsidian Charcoal Aesthetic)**: Seamlessly toggle between System preference, Light, and a distraction-free dark charcoal theme.
- 🧭 **Heading Hierarchy & Paragraph Context Extraction**: Automatically traces the heading breadcrumb (e.g. `# Chapter 1 > ## 1.2 Architecture`) and extracts adjacent surrounding paragraphs for grounded, accurate AI answers.
- 👁️ **Transparent Context Budget & Over-Budget Warning**:
  - Real-time token usage progress bar against your custom token budget.
  - Multi-segment "Prompt Preview" breakdown (System Directives / Selection / History).
  - Explicit warning when exceeding budget with one-click mitigation (Clear history / Send viewport section). No silent truncations claiming full document comprehension.
- 🎯 **Reverse Quote Locator & Pulse Highlight**: Click any quote preview card in the chat history to smoothly scroll the Markdown reader directly to the original passage with a gentle pulsing highlight.
- 💾 **Precise Pixel-Level Position Memory & Multi-Document Isolation**:
  - Remembers exact `scrollTop` pixel coordinates across document switches and reloads.
  - Dropdown switcher for recently opened documents; each document maintains an isolated, private AI discussion thread.
- 📥 **Export Q&A Notes as Markdown**: One-click download of the current Q&A session formatted into a clean Markdown note complete with timestamps, models, selection quotes, and heading metadata.
- 🔄 **Single-Message Model Regeneration (`[Switch Model]` & Re-answer)**: Easily select any alternative configured model directly beneath each assistant message bubble to regenerate and compare insights without cluttered side-by-side arenas.
- 🛡️ **Outbound Domain Privacy Confirmation**: In strict accordance with security guidelines (Planning Sec 7.2), Fox prompts a one-time trust confirmation modal displaying the target hostname and payload summary before any outbound request to a new remote domain.
- 🔌 **Universal OpenAI-Compatible API Support**: Preset one-click configurations for **DeepSeek**, **OpenAI**, and local **Ollama** (Key-less). Multi-config profile management and direct client-to-endpoint network calls with zero telemetry.
- 🦊 **Full-Vector Mascot Companion (`FoxVectorMascot`)**:
  - **Dynamic Tail Posing**: Tail posture smoothly elevates from curled (-6°) to alert and proud (+12°) as your reading progress advances from 0% to 100%.
  - **Ear State Mapping**: Unconfigured (Relaxed), Ready (Perked), Thinking (Subtle pulse), Generating (Focused), Error (Folded).
  - **Circular Reading Aura & Zero Pixel Distortion**: Crisp SVG vector rendering; concentric circular ring gracefully animates with scroll depth.
  - **Reduce Motion Mode**: Fully honors system preferences (`prefers-reduced-motion`) or user toggle for low distraction and optimal energy efficiency.
- 💻 **Syntax Highlighting for Code Blocks**: Powered by Prism.js with language badges and one-click copy feedback.
- 🧪 **Automated Quality Verification**: Comprehensive `npm test` test suite covering TOC parsing, heading-preserving document IDs, viewport section extraction, and storage adapter contracts.

---

## 🛠 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Desktop Runtime** | Tauri 2 (Rust 2024 edition) | Ultra-lightweight native sandbox, secure protocol & cross-platform desktop integration |
| **Frontend Framework** | React 18 + TypeScript | Strict typing & modular components |
| **Styling** | Tailwind CSS | Clean, atomic, and modern aesthetic |
| **Markdown Rendering** | react-markdown + remark-gfm | Standard GFM, tables, and typography |
| **Math & Diagrams** | KaTeX + Mermaid | Inline & block mathematical formulas, dynamically loaded architecture diagrams |
| **Syntax Highlighting** | Prism.js | Multi-language syntax themes with copy utility |
| **State Management** | Zustand | Lightweight, reactive state store |
| **Streaming Protocol** | Native SSE + Tauri HTTP Plugin | Real-time token streaming bypassing CORS in desktop mode, with abort cancellation |
| **Storage Architecture** | StorageService (IndexedDB + localStorage) | Asynchronous storage adapter hierarchy supporting long documents & session isolation |

---

## 🚀 Quickstart

```bash
# 1. Clone repository
git clone https://github.com/yourwayai/fox.git
cd fox

# 2. Install dependencies
npm install

# 3. Start local Web development server (Instant HMR, no Rust/Xcode required)
npm run dev

# 4. Start native desktop app (Tauri 2 macOS / Windows / Linux)
npm run tauri:dev

# 5. Build native desktop installer bundle
npm run tauri:build
```

---

## 🧭 Roadmap & Architecture

For in-depth product specification and design rationale, see: [Fox Project Planning Document (Chinese)](docs/Fox_Markdown_AI_伴读工具项目规划书.md).

- **Read-Only Sandbox**: Never alters local source files; blocks unsafe inline raw scripts.
- **Privacy First**: Direct network requests to user-specified endpoints; no telemetry or data harvesting.
