<p align="center">
  <img src="public/fox.png" width="100" alt="Fox" />
</p>

<h1 align="center">Fox</h1>

<p align="center">
  Markdown AI reading companion — read on the right, ask on the left, never lose your place.
</p>

<p align="center">
  <a href="README.md">简体中文</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="README_EN.md">English</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="LICENSE">MIT License</a>
</p>

<br>

<p align="center">
  <img src="public/screenshot.png" width="820" alt="Fox Interface" />
</p>

<br>

## Why Fox

Most AI reading tools either slice your document into chunks before feeding it to a model, or overlay conversations on top of the original text. Fox takes a quieter approach: **the full document stays in the right pane, the conversation lives in the left**, each scrolling independently. Select a passage and Fox surfaces five preset lenses — explain, analogy, deep dive, code review, append to question — sending your query without shifting or flashing the reading view.

Fox is not locked to any provider. It ships with one-click presets for DeepSeek, OpenAI, and local Ollama, but any OpenAI-compatible endpoint works. **API keys are stored locally. Requests go straight to the endpoint you specify — no proxy, no telemetry.**

<br>

## Core Features

### Reading

**Split workspace** — Zed-style dual-pane layout. Asking a question never disrupts the right-side scroll position. Pixel-level position memory persists across document switches and reloads, with each document maintaining an isolated AI thread.

**Multi-action selection** — Select text to surface a floating toolbar: `✨ Explain` · `💡 Analogy` · `🔍 Deep Dive` · `⚡ Code Review` · `➕ Append`. Unfamiliar terms inside AI replies can be selected again for recursive follow-up.

**Floating TOC & search** — Expandable multi-level outline drawer with live heading sync. `Cmd+F` in-document search with match counter, highlighting, and prev/next navigation.

**Reverse quote locator** — Click a quote card in the chat pane and the reader smoothly scrolls to the original passage with a pulse highlight for easy cross-reference.

### AI

**Multi-model management** — Save multiple provider configurations and switch freely. Each assistant bubble offers a "re-answer with another model" option for lightweight comparison.

**Transparent budget** — Live token progress bar plus multi-segment prompt preview (system directives / selection / history). Proactive warning when the budget is exceeded — no silent truncation.

**Domain privacy gate** — A confirmation modal appears the first time Fox connects to a new external domain, displaying the target host and payload summary.

### Rendering

**KaTeX math** — Full support for inline `$E=mc^2$` and display-mode `$$...$$` equations.

**Mermaid diagrams** — Dynamically loaded flowcharts, sequence diagrams, and architecture diagrams with a one-click diagram/source toggle.

**Syntax highlighting** — Prism.js multi-language dark theme with language badges and one-click copy.

**Dark mode** — System / Light / Zed-charcoal, three presets.

### Mascot

A full-vector SVG fox companion. Its tail rises from -6° to +12° as reading progress moves from 0% to 100%; ears reflect AI state (relaxed / perked / pulsing / focused / folded); an outer ring rotates with scroll depth. Fully honors `prefers-reduced-motion`.

<br>

## Tech Stack

- **Desktop** — Tauri 2 (Rust 2024)
- **Frontend** — React 18 · TypeScript · Tailwind CSS
- **State** — Zustand
- **Markdown** — react-markdown · remark-gfm · rehype-slug
- **Math** — KaTeX　　**Diagrams** — Mermaid (dynamic chunks)　　**Highlighting** — Prism.js
- **Networking** — Native SSE + Tauri HTTP plugin (CORS-free on desktop)
- **Storage** — IndexedDB + localStorage async adapter layer

<br>

## Quickstart

```bash
git clone https://github.com/yourwayai/fox.git
cd fox && npm install
```

**Web** — no Rust required, instant HMR:

```bash
npm run dev
```

**Desktop** — requires the Rust toolchain:

```bash
npm run tauri:dev      # development
npm run tauri:build    # production bundle
```

**Tests** — 7 automated cases covering TOC parsing, doc IDs, viewport extraction, and storage adapters:

```bash
npm test
```

<br>

## Design Principles

> **Read-only sandbox** — never alters source files; blocks unsafe HTML execution
>
> **Privacy first** — direct calls to user-specified endpoints, zero telemetry, zero proxy
>
> **What you see is what you send** — prompt preview reveals exactly what reaches the model

<br>

## Documentation

[Project Planning Document](docs/Fox_Markdown_AI_伴读工具项目规划书.md) — Full product design, security guidelines, and roadmap

<br>

## License

This project is licensed under the [MIT License](LICENSE).
