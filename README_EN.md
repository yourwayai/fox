<p align="center">
  <img src="public/fox.png" width="120" alt="Fox Logo" />
</p>

<h1 align="center">Fox 🦊</h1>

<p align="center">
  <strong>Companions you through every paragraph</strong><br>
  <sub>Customizable AI endpoints · Markdown reading & Q&A · Desktop & Web</sub>
</p>

<p align="center">
  <a href="README.md">简体中文</a> · <a href="README_EN.md">English</a>
</p>

<p align="center">
  <img src="public/screenshot.png" width="860" alt="Fox Interface Screenshot" />
</p>

---

## ✨ Feature Highlights

**Reading Experience**

| Feature | Description |
|---|---|
| Split workspace | Zed-inspired layout — AI on the left, Markdown on the right; asking never disrupts scroll position |
| Multi-action selection | Select text to trigger `Explain` / `Analogy` / `Deep Dive` / `Code Review` / `Add to Question` |
| Recursive clarification | Select jargon within AI replies to ask follow-ups, layer by layer |
| Floating TOC | Multi-level outline drawer with live heading sync and instant filter |
| In-doc search | `Cmd+F` with real-time match highlighting, `x/y` counter, prev/next navigation |
| Reverse quote locator | Click a chat quote card → smooth scroll & pulse highlight on the original passage |
| Position memory | Pixel-level `scrollTop` restore; each document keeps an isolated AI thread |

**AI Capabilities**

| Feature | Description |
|---|---|
| OpenAI-compatible | Built-in presets for DeepSeek / OpenAI / Ollama (key-less), multi-config management |
| Model switch & re-answer | Pick another model beneath any assistant bubble to regenerate |
| Transparent budget | Live token progress bar + multi-segment prompt preview + over-budget warning |
| Domain privacy gate | First-time confirmation modal for each new outbound domain |

**Rendering & Theming**

| Feature | Description |
|---|---|
| KaTeX math | Inline `$...$` and block `$$...$$` |
| Mermaid diagrams | Dynamically loaded with diagram/source toggle |
| Syntax highlighting | Prism.js multi-language + language badges + one-click copy |
| Dark mode | System / Light / Zed-charcoal — three presets |

**Mascot · Fox Vector Mascot**

Crisp SVG rendering · Tail rises from -6° to +12° with reading progress 0%→100% · Ears map AI state · Reading aura ring · Honors `prefers-reduced-motion`

---

## 🛠 Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Desktop | **Tauri 2** (Rust) | Native sandbox · file associations · asset protocol |
| Frontend | **React 18** + TypeScript | Strict-typed components |
| Styling | **Tailwind CSS** | Atomic design |
| Markdown | react-markdown + remark-gfm | Standard GFM extensions |
| Math / Diagrams | KaTeX + Mermaid | Inline formulas · lazy-loaded diagrams |
| State | **Zustand** | Minimal reactive store |
| Networking | Native SSE + Tauri HTTP | CORS-free · streaming · abortable |
| Storage | IndexedDB + localStorage | Async adapters · multi-session isolation |

---

## 🚀 Quickstart

```bash
git clone https://github.com/yourwayai/fox.git && cd fox
npm install

# Web (no Rust needed, instant HMR)
npm run dev

# Desktop
npm run tauri:dev      # development
npm run tauri:build    # production bundle
```

---

## 🧪 Tests

```bash
npm test   # 7 automated cases: TOC parsing · doc IDs · viewport extraction · storage adapters
```

---

## 📄 Governance

See the [Project Planning Document](docs/Fox_Markdown_AI_伴读工具项目规划书.md) for full specification.

- **Read-only sandbox** — never alters source files; blocks unsafe HTML execution
- **Privacy first** — direct calls to user-specified endpoints, zero telemetry
