# Fox 伴读工具 · 后续任务与演进清单 (Todo List)

> 基于《项目深度体检报告（Codebase Health Check）》与《[Fox_Markdown_AI_伴读工具项目规划书.md](Fox_Markdown_AI_伴读工具项目规划书.md)》系统梳理。

---

## 阶段一：生产可用与交付闭环（Phase A · 高优先级）

聚焦于首发版本交付、基本操作流体验与安全红线守底。

- [x] **1. 生成并验证 macOS `.dmg` 生产级安装镜像**
  - **目标**：执行打包生成完整的 macOS 磁盘镜像（`.dmg`）与应用程序包（`.app`）。
  - **结果**：已通过 `hdiutil` 免权限脚本完成压制，生成标准 UDZO 镜像（10.85 MB），内置 `Applications` 拖拽软链，校验并通过挂载测试。产物位于 `/Users/milong/.cache/fox-target/release/bundle/dmg/Fox_0.1.0_aarch64.dmg`。
  - **涉及文件**：`scripts/make-dmg.mjs` · `package.json` (`npm run bundle:dmg`)

- [x] **2. 已保存 API Key 掩码呈现与脱敏（规划书 7.2 安全红线）**
  - **目标**：已保存的密钥不再在界面明文或完整展示，默认以 `sk-...****` 掩码方式占位呈现。
  - **结果**：实现已保存凭据自动掩码脱敏（`sk-••••••••1234`）与状态徽章（已就绪），仅点击“更换密钥”时解锁编辑，支持“取消更换”回退；新增隐私合规与未加密提示说明。
  - **涉及文件**：`src/components/SettingsModal.tsx`

- [ ] **3. 伴读高频全局快捷键体系**
  - **目标**：建立桌面伴读常用的全键盘盲操支持。
  - **清单**：
    - `Cmd / Ctrl + O`：调起文件选择窗口打开本地 Markdown；
    - `Cmd / Ctrl + B` 或 `Cmd + T`：快速切换/折叠大纲（TOC）侧边抽屉；
    - `Cmd / Ctrl + Enter`：在输入框任意位置直接提交问题；
    - `Esc`：全局层级后退（依次关闭搜索栏 → 关闭大纲抽屉 → 关闭设置弹窗）。
  - **涉及文件**：`src/App.tsx` · `src/components/ChatPanel.tsx`

- [ ] **4. 完善 GitHub Actions CI 自动化流水线**
  - **目标**：在云端自动化校验代码质量。
  - **验收**：在 `.github/workflows/build.yml` 中加入 `npm test` 步骤，PR 和 Push 时自动执行 7 项核心用例断言。

---

## 阶段二：安全加固与伴读体验升级（Phase B · 中优先级）

对应规划书 V0.2 阶段规划与隐私防探针增强。

- [ ] **5. 远程外链图片懒加载确认闸门（规划书 4.2 / 7.2）**
  - **目标**：防范外部文档通过 Markdown 图片信标（Image Beacon）隐式探测用户 IP 与阅读行为。
  - **表现**：对非本地（`https://`）图片默认展示轻量占位条（“点击加载远程图片”），用户单次点击或勾选信任后才发起网络请求。
  - **涉及文件**：`src/components/MarkdownReader.tsx`

- [ ] **6. 自定义划选伴读指令预设（Custom Prompt Actions）**
  - **目标**：允许用户在设置中自定义划词工具条的动作。
  - **表现**：除内置的 `[解释]`、`[类比]`、`[推导]`、`[代码评审]` 之外，支持用户添加自定义指令（例如 `[翻译为英文]`、`[提炼要点]` 等）。
  - **涉及文件**：`src/types/index.ts` · `src/components/SettingsModal.tsx` · `src/store/useAppStore.ts`

- [ ] **7. 桌面端系统原生 Keychain / 凭据库密钥托管**
  - **目标**：Tauri 原生底座接入系统级安全凭据库（macOS Keychain / Windows Credential Manager）。
  - **验收**：API Key 真正脱离网页存储层，在桌面环境下写入 OS 系统凭据保险库，断网或重置浏览器存储不丢 Key。
  - **涉及文件**：`src-tauri/Cargo.toml` · `src/utils/tauriBridge.ts`

- [ ] **8. GitHub Actions 多平台自动发版（Release Workflow）**
  - **目标**：在打 Git Tag（如 `v0.1.0`）时，通过 GitHub Actions 自动交叉编译生成 macOS (`.dmg`) 与 Windows (`.msi` / `.exe`) 安装包并发布到 GitHub Releases。
  - **涉及文件**：`.github/workflows/release.yml`

---

## 阶段三：空间化组织与进阶演进（Phase C · 候选演进）

对应规划书 V0.3 / V1.0 远期规划。

- [ ] **9. 本地文件夹 / 知识库工作区浏览（Workspace Folder）**
  - **目标**：支持“打开文件夹”，在左侧侧边栏或大纲抽屉以树形结构列出目录内所有 Markdown 文件，支持一键切换。
- [ ] **10. 双向轻量编辑与 AI 修改建议采纳**
  - **目标**：在坚持默认“只读沙箱”的前提下，提供可选的编辑开关；AI 提供改进意见时支持可视化差异（Diff）并一键 Patch 回源文件。
- [ ] **11. 苹果开发者签名与公证（Apple Developer Notarization）**
  - **目标**：配置正式的 Apple 开发者证书与 `notarytool` 自动化公证，消除 macOS 第三方软件安全拦截。

---

## 📊 当前已完成里程碑速查

- [x] **P0 缺陷根治**：选区 `[解释]` 流式直发、`react-markdown` v9 行内代码修复、模式 B 视口章节提取
- [x] **P1 性能加固**：rAF 滚动节流、250ms 防抖持久化、哈希文档唯一 ID、流式消息 docId 隔离
- [x] **V0.2 伴读功能**：TOC 抽屉大纲、`Cmd+F` 文档搜索、KaTeX 公式、Mermaid 架构图、深色模式
- [x] **交互与安全**：单条 `[换模型重答]`、首次外部域名确认弹窗、导出 Markdown 笔记
- [x] **Fox 矢量吉祥物**：原生 SVG 渲染、尾巴旋转映射阅读进度、耳朵状态映射、减弱动画模式
- [x] **桌面化底座**：Tauri 2 配置、CORS-free 原生网络、本地相对图片解析、文件关联与 Finder 参数
- [x] **质量与规范**：`npm test` 自动化测试网（7/7）、MIT 开源协议、双语 README 精简重构
