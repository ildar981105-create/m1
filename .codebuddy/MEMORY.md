# Tideo（原 FrameX）— 项目完整上下文

> 此文档是项目交接的核心参考，CodeBuddy 新会话时应首先阅读。
> 最后更新：2026-03-12

---

## 一、产品概述

**Tideo** 是一个 **AI 视频译制 + 创作工作台**（纯前端 Demo / 原型），面向短视频出海场景。核心能力：

1. **视频译制**：AI 自动擦除原有硬字幕 → 语音识别翻译 → 原声克隆配音，支持 120+ 语言
2. **直播剪辑**：实时监控直播流，AI 自动检测高光片段，支持手动标记和导出
3. **AI 视频生成**：文本描述生成视频（文生视频）
4. **素材管理**：视频、音频、字幕等素材的统一管理
5. **任务记录**：所有处理任务的历史和状态追踪

### 产品定位
- 目标用户：短视频出海创作者、本地化团队、影视工作室
- 当前阶段：**前端 Demo / 交互原型**（无后端 API，所有数据为模拟数据）
- 技术栈：纯 HTML + CSS + Vanilla JS，无框架依赖

### 产品改名历史
`av-saas` → `FrameX` → **`Tideo`**（2026-03-12）

---

## 二、仓库策略

| 仓库 | 用途 | 可否修改 |
|------|------|---------|
| **`Tideo`**（origin） | **主开发仓库**，所有改动在这里进行 | ✅ |
| `framex-studio`（studio-backup 远程） | 备份归档，不主动修改 | ❌ |
| `framex-app`（framex 远程） | 备份归档，不主动修改 | ❌ |
| `av-saas` | 已冻结归档，不做任何修改 | ❌ |

### Git 远程配置
```
origin        → https://github.com/ildar981105-create/Tideo.git
studio-backup → https://github.com/ildar981105-create/framex-studio.git
framex        → https://github.com/ildar981105-create/framex-app.git
```

### 推送规则
1. 改完代码后只执行 `git push origin main`（推送到 Tideo）
2. **不要主动**推送到 `studio-backup` 或 `framex`，除非用户明确要求同步
3. commit message 使用中文，格式如 `feat: 新增xxx`、`fix: 修复xxx`

### GitHub Pages
- **Tideo（主站）**：`https://ildar981105-create.github.io/Tideo/`
- studio（备份）：`https://ildar981105-create.github.io/framex-studio/`
- app（备份）：`https://ildar981105-create.github.io/framex-app/`
- 主入口：`app/create.html`

---

## 三、页面架构

### 导航结构（侧边栏 3 项）
创作(`create.html`) → 素材(`media.html`) → 作品(`result.html`)

### 完整页面清单

| 页面 | 文件 | 说明 |
|------|------|------|
| **创作（主入口）** | `app/create.html` | 首页视图，3 张卡片入口（视频译制 / 直播剪辑 / AI 生成），通过 iframe 加载子功能 |
| **登录** | `app/login.html` | 独立登录页，三种方式（账号密码 / 手机号 / 微信扫码） |
| **视频译制** | `app/translate-v6.html` | 最新版，Landing 页 + 左右分栏编辑器 |
| **直播剪辑** | `app/livestream.html` | 实时监控 + 双轨道时间轴（自动/手动剪辑） |
| **AI 生成** | `app/generate.html` | 文生视频，Landing + 分栏工作区 |
| **素材管理** | `app/media.html` | 媒体库管理页面 |
| **任务记录** | `app/result.html` | 历史任务列表 + 详情面板 |
| **精调编辑器** | `app/editor-v2.html` | 独立编辑器页面（最新版） |

### 版本策略（只维护最新版）

| 模块 | 最新版 | 废弃的旧版本（不要改） |
|------|--------|---------------------|
| 视频译制 | `translate-v6.html` | translate.html, v2, v3, v4, v5 |
| 编辑器 | `editor-v2.html` | editor.html |

### 共享资源
- `app/style.css` — 全局样式（设计令牌、侧边栏、通用组件）
- `app/app.js` — 全局脚本
- `app/editor-v2.css` — 编辑器专用样式

---

## 四、设计系统

### 设计风格
- **暗色 OLED 优化**：纯黑底（`#08080d`）+ 玻璃态（glassmorphism）
- **渐变主色**：紫 → 靛 → 蓝 → 青（`#a855f7 → #6366f1 → #3b82f6 → #06b6d4`）
- **字体**：Inter（正文）、Space Grotesk（品牌/标题）、DM Sans（辅助）、JetBrains Mono（代码/数据）

### 核心 CSS 变量（`:root` 在 style.css）

```css
/* 调色板 */
--purple: #a855f7; --indigo: #6366f1; --blue: #3b82f6; --cyan: #06b6d4;
/* 表面色 */
--bg-base: #08080d; --bg-elevated: #0f0f1a; --bg-surface: #141422; --bg-card: #16162a;
/* 渐变 */
--grad-main: linear-gradient(135deg, #a855f7, #6366f1, #3b82f6, #06b6d4);
--grad-text: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%);
/* 玻璃态 */
--glass-bg: rgba(255,255,255,0.035); --glass-border: rgba(255,255,255,0.08);
/* 文字色阶 */
--text-primary: #f1f5f9; --text-secondary: #94a3b8; --text-muted: #64748b; --text-faint: #475569;
/* 圆角 */
--radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
```

### CSS 类命名规范
- 各页面有独立的命名空间前缀：
  - 视频译制：`tv2-*`（原为"translate v2"简写，一直沿用）
  - 直播剪辑：`ls-*`
  - 编辑器：`ev2-*`
  - 全局侧边栏：`icon-nav-*`、`icon-sidebar-*`
  - 首页卡片：`create-*`

---

## 五、视频译制（translate-v6.html）详细架构

这是最复杂的页面，结构说明：

### 两大视图
1. **Landing 视图**（`#tv2Landing`）：初始状态，用户选择操作路径
2. **编辑器视图**（`#tv2Topbar` + `#tv2Main`）：上传/导入后进入，左右分栏

### Landing 页结构（全屏分页滚动）
采用 `scroll-snap-type: y mandatory` 实现官网式分页：

- **首屏** `div.tv2-first-screen`（`min-height: 100vh; scroll-snap-align: start`）
  - Hero：标题 + 副标题
  - 路径 Tab：「从零开始 [推荐]」/「导入已有任务 [精调]」
  - Tab A 面板：模式选择（一键译制/擦除字幕/添加字幕/克隆配音）+ 上传区 + 配置面板
  - Tab B 面板：三段式导入（任务 ID 导入 / 上传已处理文件 / Tideo 历史任务）

- **第二屏** `div.tv2-second-screen`（`min-height: 100vh; scroll-snap-align: start`）
  - 三步流程卡片：擦除字幕 → 语音识别翻译 → 原声克隆配音
  - 效果对比：处理前 vs 处理后
  - 能力条：120+ 语言 · 声音克隆 · 字幕擦除 · 全自动流程 · 精调可控

### 两条主线（同等重要）

| 主线 A：从零译制 | 主线 B：导入优化 |
|:---:|:---:|
| 上传新视频 → AI 自动处理 | 导入已有处理结果 → 人工精调 |
| AI 主导，全自动 | 人主导，AI 辅助 |
| 新手/首次使用 | 专业用户/回头客 |

**产品初衷**：主线 B（导入精调）和主线 A 一样重要，不是附属功能。

### 编辑器视图
- 左侧：视频预览 + 时间轴 + 字幕叠加
- 右侧：AI 对话面板（Tideo AI 助手）+ 逐步处理流程
- 支持：字幕擦除区域标记、逐行字幕编辑、配音参数调整

---

## 六、登录系统

### 登录页（login.html）
- 三种方式 Tab 切换：账号密码 / 手机号验证码 / 微信扫码
- 视觉：暗色玻璃态卡片 + 3 个浮动渐变光球背景
- 微信扫码：模拟 21×21 QR 点阵 + 中心微信 Logo，点击模拟扫码成功

### 登录状态管理
- 使用 `localStorage('tideo_user')` 存储用户信息：`{ name, avatar, loginTime }`
- create.html 侧边栏头像（`.icon-nav-avatar`）点击弹出右侧下拉菜单
- 已登录：显示用户名 + 退出登录
- 未登录：显示登录入口跳转 login.html
- 支持跨标签页 `storage` 事件同步

### ⚠️ 注意
当前为 **纯前端模拟**，无真实后端验证。登录逻辑只做表单校验和 localStorage 写入。

---

## 七、直播剪辑（livestream.html）

- 模拟实时直播监控界面
- 时间轴有双轨道：
  - **自动剪辑轨道**（青色）：AI 自动检测的高光片段
  - **手动剪辑轨道**（紫色）：用户手动标记的入点/出点片段
- 开始监控后每 15 秒自动新增一个 AI 检测片段

---

## 八、开发约定

1. **纯前端**：不引入 npm/打包工具，所有页面独立可运行
2. **内联样式为主**：各页面的专属样式写在 `<style>` 标签内，公共样式在 `style.css`
3. **自动提交推送**：每次完成修改后自动 `git add → commit → push origin main`
4. **commit message**：中文，格式 `feat:/fix:/refactor: 简洁描述`
5. **不要改旧版本文件**：translate-v5 及以下、editor.html 等废弃文件不要动
6. **所有用户可见文案中的产品名用 `Tideo`**，CSS 类名和 JS 变量名中的 `framex` 保持不变

---

## 九、待办 / 未来方向（供参考）

- [ ] 登录页只有前端模拟，后续可能需要对接真实后端
- [x] ~~其他页面（media、result、generate、livestream、translate-v6）的侧边栏头像区已添加用户菜单（2026-03-19）~~
- [ ] translate-v6 的第二屏内容可以继续丰富（客户案例、定价等）
- [ ] 移动端适配还不完善
- [ ] 国际化（i18n）暂未开始
