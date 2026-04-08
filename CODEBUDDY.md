# Tideo 项目架构规则（Code Map）

> **用途**：每次对话开头优先读取此文件，避免重复读取 16,026 行的 `translate-v7.html`。
> **最后更新**：2026-03-26
> **维护策略**：每次对 translate-v7.html 做重大改动后同步更新本文件的行号和结构描述。
> **导航注释**：文件内已添加 44+ 个 `[SECTION: ...]` 标记，可通过搜索 `[SECTION:` 快速跳转到任意区段。

---

## 一、项目全局结构

### 1.1 文件清单与版本策略

| 文件 | 行数 | 说明 | 状态 |
|------|------|------|------|
| `app/translate-v7.html` | 16,026 | 视频译制核心页（v7：视频Loading替代游戏界面） | ✅ 唯一最新版 |
| `app/translate-v6-a2.html` | 15,845 | 视频译制（v6-a2：工作室游戏界面版） | 🔒 保留对比 |
| `app/editor-v2.html` + `app/editor-v2.css` | — | 编辑器 | ✅ 唯一最新版 |
| `app/create.html` | ~2,602 | 统一入口页（首页视图 + 导航） | ✅ |
| `app/generate.html` | ~2,356 | AI 视频生成页 | ✅ |
| `app/livestream.html` | — | 直播剪辑页 | ✅ |
| `app/login.html` | — | 登录页 | ✅ |
| `app/media.html` | — | 素材管理 | ✅ |
| `app/result.html` | — | 任务记录 | ✅ |
| `app/app.js` | ~533 | 全局路由 + 侧边栏 + 意图检测 | ✅ |
| `app/task-panel.js` | ~871 | 任务面板 + 智能输入框组件 | ✅ |
| `app/task-panel.css` | ~476 | 任务面板 + 输入框样式 | ✅ |
| `app/assets/characters/` | 4 PNG | 四角色像素头像（1.3-1.6MB each） | ✅ |
| `app/assets/videos/translate-loading.mp4` | 9.2MB | 译制/擦除/字幕步骤 loading 视频 | ✅ |
| `app/assets/videos/voice-loading.mp4` | 3.9MB | 配音步骤 loading 视频 | ✅ |

**已删除的旧版本**（不要触碰）：
`translate.html`, `translate-v2~v5.html`, `translate-v6.html`, `translate-v6-a1.html`, `editor.html`, `editor.css`

### 1.2 页面导航架构

```
create.html（主入口）
  ├── 技能卡片点击 / 智能输入 → translate-v7.html（视频译制）
  ├── 技能卡片点击 / 智能输入 → livestream.html（直播剪辑）
  ├── 技能卡片点击 / 智能输入 → generate.html（AI 生成）
  └── 导入任务卡片 → translate-v7.html?path=import
侧边栏导航：创作(create.html) → 素材(media.html) → 作品(result.html)
```

### 1.3 仓库策略

- **唯一活跃仓库**：`model`（origin）→ `https://github.com/ildar981105-create/model.git`
- **分支**：`main`
- **GitHub Pages**：`https://ildar981105-create.github.io/model/`
- **主入口**：`app/create.html`
- 备份仓库 Tideo / framex-studio / framex-app / av-saas 全部冻结，不主动推送

---

## 二、translate-v7.html 宏观结构（16,026 行）

> **v7 与 v6-a2 的核心差异**：
> - 处理阶段（擦除/字幕/配音）左侧改用**视频 Loading 覆盖层**替代像素工作室游戏界面
> - 擦除/字幕步骤 → 循环播放 `translate-loading.mp4`
> - 配音步骤 → 循环播放 `voice-loading.mp4`  
> - 底部信息栏显示角色头像、任务名称、台词轮播、进度条
> - 子任务进行中气泡 + 导演点评 → 改为聊天面板展示（而非像素角色头顶气泡）
> - 步骤间视频 loading 不消失（`pauseProcessingRole` 只停台词），切换步骤时无缝过渡
> - 精调/结果模式仍然完全保留原有效果（关灯聚光 + 对比模式）
> - studio-mode 框架保留（IIFE 仍然初始化），但视频 loading 覆盖在最上层（z-index:12）

```
┌─────────────────────────────────────────────┐
│  Lines 1-9      : DOCTYPE + <head>          │
│  Lines 10-8862  : <style> — 全部 CSS        │
│  Lines 8863     : </style>                  │
│  Lines 8863-10280: <body> — HTML 结构       │
│  Lines 10281-15845: <script> 块 ×10         │
└─────────────────────────────────────────────┘

> 💡 文件内含 44 个 `[SECTION: ...]` 导航标记，搜索 `[SECTION:` 可快速定位任何区段。
```

### 2.1 `[SECTION:]` 导航标记速查表

搜索关键词 `[SECTION: XXX]` 可直接跳转到对应区段：

**CSS 区段（25 个）：**
| 标记 | 行号 | 说明 |
|------|------|------|
| `CSS-START` | 12 | 全部样式开始 |
| `CSS-LAYOUT` | 16 | 基础布局 tv2- |
| `CSS-UPLOAD-OVERLAY` | 140 | 拖拽上传覆盖层 |
| `CSS-PROCESSING-OVERLAY` | 237 | 4角色处理覆盖层 pv- |
| `CSS-VIDEO-OVERLAYS` | 1081 | 视频字幕/配音/扫描 |
| `CSS-SCRUBBER` | 1416 | 视频进度条/滑块 |
| `CSS-TIMELINE` | 1502 | 时间线轨道/片段 |
| `CSS-MIDDLE-PANEL` | 1767 | 中间精调面板布局 |
| `CSS-CHAT-BUBBLES` | 1919 | 聊天气泡/角色变体 |
| `CSS-PROGRESS-CARDS` | 2090 | 角色进度卡片 rpc- |
| `CSS-RESULT-ACTIONS` | 2492 | 导出/精调/保存按钮 |
| `CSS-RESULT-SPOTLIGHT` | 2568 | 完成关灯聚光效果 |
| `CSS-RESULT-MODE` | 2746 | 最终结果展示模式+对比模式 |
| `CSS-STEP-COMPLETE-FLASH` | 2839 | 步骤完成闪光/刷新动画 |
| `CSS-PHASE-INDICATOR` | 2940 | 阶段状态徽章 |
| `CSS-PROGRESS-TABS` | 2987 | 进度标签页 |
| `CSS-FINETUNE-PANELS` | 3202 | 精调面板 ft- |
| `CSS-ERASE-OVERLAYS` | 3531 | 擦除区域框 |
| `CSS-LANDING` | 4399 | Landing 页面 |
| `CSS-IMPORT-PANEL` | 4485 | 导入面板 |
| `CSS-ACTIVE-TASKS-BAR` | 6887 | 最小化任务条 |
| `CSS-TOAST` | 7065 | Toast 通知 |
| `CSS-STUDIO-ROOM` | 7236 | 像素工作室房间场景 |
| `CSS-STUDIO-CHARACTERS` | 8226 | 像素角色精灵 |
| `CSS-CHAT-FLOAT-FAB` | 8521 | 浮动聊天窗口+FAB |

**HTML 区段（12 个）：**
| 标记 | 行号 | 说明 |
|------|------|------|
| `HTML-START` | 8863 | HTML 结构开始 |
| `HTML-SIDEBAR` | 8866 | 侧边栏 |
| `HTML-MAIN-CONTENT` | 8912 | 主内容区 |
| `HTML-TOPBAR` | 8914 | 顶部栏 |
| `HTML-LANDING` | 8931 | Landing 页面 |
| `HTML-MAIN-SPLIT` | 9390 | 主分栏布局 |
| `HTML-LEFT` | 9394 | 左侧面板(视频+时间线) |
| `HTML-MIDDLE` | 9851 | 中间面板(精调) |
| `HTML-RIGHT` | 10021 | 右侧面板(聊天) |
| `HTML-STUDIO-CHARACTERS` | 10063 | 像素角色层 |
| `HTML-CHAT-FLOAT` | 10100 | 浮动聊天窗口 |
| `HTML-VOD-PICKER` | 10147 | VOD选择器弹窗 |
| `HTML-TASK-IMPORT-MODAL` | 10188 | 任务导入弹窗 |

**JS 区段（10 个）：**
| 标记 | 行号 | 说明 |
|------|------|------|
| `JS-BLOCK1-VOD-PICKER` | 10288 | VOD选择器逻辑 |
| `JS-BLOCK2-IMPORT-REDIRECT` | 10366 | 任务导入重定向 |
| `JS-BLOCK3-STATE-MACHINE` | 10382 | ★核心状态机★ |
| `JS-BLOCK4-LANDING-EDITOR` | 13634 | Landing→Editor过渡 |
| `JS-BLOCK5-CONFIG-PANEL` | 14221 | 配置面板交互 |
| `JS-BLOCK6-MINIMIZE-RESTORE` | 14293 | 最小化/恢复任务 |
| `JS-BLOCK7-USER-MENU` | 14594 | 用户菜单 |
| `JS-BLOCK8-TASK-PANEL-INPUT` | 14663 | 任务面板+底部输入 |
| `JS-BLOCK9-STUDIO-SCENE` | 14920 | 工作室场景控制器 |
| `JS-BLOCK10-PIXEL-CANVAS` | 15392 | 像素画布渲染器 |

### 2.2 CSS 区段详细索引

| 行范围 | CSS 前缀/模块 | 说明 |
|--------|--------------|------|
| 15–100 | `tv2-` | 基础布局：body、topbar、main 三栏分割、左/右面板 |
| 137–210 | upload overlay | 拖拽上传覆盖层、pulse 动画 |
| 300–1080 | `pv-` (processing) | 4 角色工位桌面场景：后期(monitors/keyboard)、翻译(books/text)、配音(mic/soundwave)、导演(storyboard/command)；角色体动画(pvActPaint/pvActRead/pvActSpeak/pvActDirect)；道具动画；环境光 |
| 1086–1200 | video overlays | 字幕预览、配音指示器、扫描覆盖层(grid cells) |
| 1400–1510 | scrubber | 进度条 + 拖拽滑块 + 时间显示 + 精调徽章 |
| 1506–1700 | timeline | 3 轨道、色彩编码片段、拖拽手柄、精调模式增强、播放头 |
| 1800–2090 | chat bubbles | 角色变体(director/postprod/translator/voice)、加入消息、阶段分割 |
| 2091–2490 | `rpc-` (progress cards) | 状态点(pending/active/done)、子任务列表、详情链接 |
| 2492–2566 | result actions | 导出/精调/保存按钮 |
| 2568–2745 | result spotlight | 完成关灯聚光效果 + 对比模式(原片/成片上下排列 + 进出动画) |
| 2746–2838 | result-mode | 最终结果展示模式(纯视频全屏，无游戏装饰) |
| 2839–2939 | step-complete-flash | 步骤完成闪光/刷新动画 |
| 2940–2986 | phase indicator | 上下文徽章(finetune/processing/done) |
| 2987–3200 | progress tabs | 锁定/解锁/激活状态 + 解锁动画 |
| 3202–3530 | `ft-` (finetune panels) | 擦除区域卡片、字幕列表、配音列表、内联编辑面板(时间/文本输入) |
| 3531–3600 | erase overlays | 区域框 + 8 个调整手柄 + active/hover 状态 |
| 4399–5200 | landing page | 路径标签、模式标签、上传区、配置面板(full/erase/subtitle/voice) |
| 4485–5100 | import panel | ID 输入、文件上传行、历史列表、预览卡片 |
| 5900–6200 | task import modal | ID/Tideo 标签、搜索、任务卡片 |
| 6887–7060 | active tasks bar | 最小化任务条 |
| 7065–7230 | toast | 通知 toast |
| 7236–8220 | studio room scene | 像素房间：后墙、踢脚线、桌子(木纹)、显示器支架、壁灯、书架、海报、音箱、椅子、设备架、地毯、吊灯、线缆、地板 |
| 8226–8520 | studio characters | 像素精灵(行走/工作动画)、工位定位、名称标签、工作指示器、语音气泡 |
| 8521–8860 | chat float + FAB | 浮动聊天窗口(studio-mode → 固定侧边栏)、FAB 胶囊按钮(头像栈 + 未读徽章) |

### 2.3 HTML 结构索引

```
<body>
├── <aside class="icon-sidebar"> (8866-8910)
│   ├── Logo
│   ├── Nav: 创作 / 素材 / 作品
│   └── Bottom: API / 设置 / 用户头像+下拉菜单
│
├── <main class="main-content"> (8912-10055)
│   ├── <header class="topbar" id="mainTopbar"> (8914-8929)
│   │   ├── 返回按钮 / 页面标题 / 积分徽章
│   │
│   ├── <div class="tv2-landing" id="tv2Landing"> (8931-9370)
│   │   ├── 活跃任务条
│   │   ├── 第一屏：Hero + 路径标签(新任务/导入) + 模式标签 + 上传区 + 配置面板 + 导入面板
│   │   └── 第二屏：流程步骤 + 对比区 + 信任栏
│   │
│   ├── <header class="tv2-topbar" id="tv2Topbar"> (9371-9389)
│   │   └── 编辑器顶栏：文件名 + 最小化按钮
│   │
│   └── <div class="tv2-main" id="tv2Main"> (9390-10055)
│       ├── .tv2-left (9394-9848)  ← 视频播放器 + 时间线
│       │   ├── 视频容器（video元素 + 成片标签 + 烧录字幕 + 上传覆盖 + 处理覆盖 + 阶段指示器 + 精调提示 + 擦除覆盖 + 扫描覆盖 + 字幕/配音预览 + 原片对比容器）
│       │   ├── 聚光灯暗幕(result-dimmer)
│       │   ├── 像素工作室画布 <canvas>
│       │   ├── 工作室房间装饰元素
│       │   ├── 时间轴滑块(scrubber)
│       │   └── 时间线(3轨道 + 标尺)
│       │
│       ├── .tv2-middle (9851-10018) ← 精调面板（宽360px，滑入）
│       │   ├── 头部：标题 + 描述 + 模式标签
│       │   ├── 进度标签页(擦除/字幕/配音)
│       │   └── 精调区：3 个面板（擦除区域列表 / 字幕列表 / 配音列表）+ 完成按钮
│       │
│       └── .tv2-right (10021-10055) ← 聊天面板
│           ├── 聊天头部(工坊头像)
│           └── 聊天主体(初始加入消息 + 导演问候)
│
├── 工作室角色容器 (10063-10098) — 4个像素角色
├── 工作室欢迎气泡 (10100-10105)
├── 聊天浮窗 (10100-10145)
├── 聊天FAB按钮 (10147-10160)
├── Toast容器 (10165)
├── VOD选择器模态框 (10147-10186)
└── 任务导入模态框 (10188-10280)
```

### 2.4 JavaScript 脚本块索引

| 块 # | 行范围 | 功能模块 | 核心函数/对象 |
|-------|--------|---------|-------------|
| 1 | 10288–10365 | VOD 选择器逻辑 | Mock 视频列表、选择/确认 → `_tv2EnterEditor()` |
| 2 | 10366–10381 | 任务导入重定向 | 按钮点击 → `_tv2SwitchToImportTab()` |
| 3 | **10382–13633** | **主状态机（核心 IIFE）** | 见下方详细索引 |
| 4 | 13634–14220 | Landing → Editor 过渡 | 文件上传、`switchMode()`、路径切换、VOD确认、URL自动启动、导入面板 |
| 5 | 14221–14292 | 配置面板交互 | 折叠/展开、卡片选择、单选组、切换开关 |
| 6 | 14293–14593 | 最小化/恢复任务系统 | `minimizedTasks[]`、后台处理模拟、活跃任务条、toast通知 |
| 7 | 14594–14662 | 用户菜单 | 头像下拉、localStorage 登录/登出 |
| 8 | 14663–14919 | 任务面板 + 底部输入集成 | `TideoPageInput.init('translate')`、`tideo:pageinput` 事件路由 |
| 9 | 14920–15391 | **工作室场景控制器** | `initStudioScene()` IIFE，角色行走/召唤/气泡/工作状态 |
| 10 | 15392–15845 | **像素画布渲染器** | 480×360 像素画 — 地板、墙、桌、显示器、书架、猫、LED灯 |

---

## 三、核心状态机详解（Block 3: Lines 10382–13633）

### 3.1 状态变量

```javascript
// Line ~10384-10392
let phase = 'upload';        // 'upload' → 'config' → 'processing' → 'done'
let playing = false;
let videoTime = 0;
const videoDuration = 90;    // 固定 90 秒
let features = {};           // { erase: bool, subtitle: bool, voice: bool }
let uploadedFileName = '';
```

### 3.2 四角色系统 ROLES（Line ~10394–10467）

| 角色 | key | 真名 | 颜色 | CSS类 | 头像文件 |
|------|-----|------|------|-------|---------|
| 导演 | `director` | 林雨晨 | 蓝 #3b82f6 | `.role-director` | `linyuchen-director.png` |
| 后期 | `postprod` | 陈默 | 绿 #10b981 | `.role-postprod` | `chenmo-postprod.png` |
| 翻译 | `translator` | 李明远 | 紫 #a855f7 | `.role-translator` | `limingyuan-translator.png` |
| 配音 | `voice` | 苏雅 | 黄 #f59e0b | `.role-voice` | `suya-voice.png` |

每个角色有 `greetings[]` 数组（3句问候语）和 `ROLE_WORKING_LINES` 工作台词数组。

### 3.3 步骤流水线

```
activeSteps[] 由 features{} 决定：
  full mode → ['erase', 'subtitle', 'voice']
  单模式   → 仅包含对应步骤

advanceStep() 流程：
  currentStep++ → 
    还有步骤？→ showStepPreBubble(step) → runSubTasksSequentially(step, callback) → confirmStep(step) → advanceStep()
    没有了？  → showStartButton() → showResult()
```

### 3.4 关键函数索引

| 函数名 | 大约行号 | 说明 |
|--------|---------|------|
| `setProcessingRole(step)` | 10557 | 设置处理覆盖层角色（data-role + 头像 + 入场动画 + 台词轮播） |
| `stopProcessingRole()` | 10618 | 清除台词轮播定时器 |
| `handleFile(file)` | 10780 | 处理上传文件 → 隐藏覆盖层 → 进入沉浸模式 → 重置状态 → buildConfigChat |
| `handleImportedTask(taskInfo)` | 10844 | 导入任务流程 → 设置 features → 解锁标签 → 构建导入聊天 → 进入精调 |
| `readDefaultConfig()` | 10969 | 读取 landing 配置面板值到 `userConfig` |
| `runSubTasksSequentially(step, onAllDone)` | 11119 | **统一子任务引擎** — 遍历 stepSubTasks[step]，逐个执行 |
| `buildConfigChat()` | 11238 | 构建初始聊天流（加入消息 + 用户命令 + 导演问候 + 进度卡片 + 启动 advanceStep） |
| `advanceStep()` | 11395 | 步骤推进器：下一步或显示开始按钮 |
| `showStepPreBubble(step)` | 11522 | 角色接管气泡 → 启动子任务 |
| `startVoiceScriptAcquire()` | 11600 | 无先行脚本时的配音步骤 |
| `confirmStep(step, enabled)` | 11673 | 标记步骤完成 → 解锁标签 → 推进 |
| `confirmAndFinetune(step)` | 11729 | 确认 + 立即进入精调 |
| `unlockTab(step)` | 11751 | 解锁进度标签页 |
| `setActiveTab(step)` | 11764 | 设置活跃标签 |
| `enterFinetune(step)` | 11813 | **进入精调模式** — 打开中间面板 + 激活标签 + 显示时间线 + 渲染覆盖层 |
| `exitFinetune()` | 11930 | **退出精调模式** — 收起中间面板 + 隐藏时间线 + 清除覆盖层 |
| `appendBubble(type, html, delay, role)` | 12137 | 创建角色聊天气泡 |
| `startProcessing()` | 12174 | 最终渲染阶段（内联进度条） |
| `showResult()` | 12251 | 完成状态（导出/保存/精调/对比按钮） |
| `turnLightsOff()` | 12375 | 关灯效果（聚光灯暗幕 + 视频发光） |
| `turnLightsOn()` | 12417 | 开灯效果（退出聚光灯） |
| `enterCompare()` | 12453 | **进入对比模式** — 上下双视频、缩小等大、原片滑入动画 |
| `exitCompare()` | 12485 | **退出对比模式** — 原片滑出动画、恢复聚光灯 |
| `renderSubtitleList()` | 12554 | 渲染字幕编辑列表 |
| `renderVoiceList()` | 12626 | 渲染配音编辑列表 |
| `renderEraseRegionList()` | 12733 | 渲染擦除区域列表 |
| `renderEraseOverlays()` | 12778 | 渲染视频上的擦除覆盖框 |
| `syncTimelineSegments()` | 13153 | 从数据重建时间线片段 |

### 3.5 数据模型

#### subtitleItems（7条，Line ~10650）
```javascript
{ id, orig: "原文...", trans: "译文...", startSec, endSec }
// 时间范围覆盖 0-87 秒，可在精调面板内联编辑
```

#### voiceItems（7条，Line ~10660）
```javascript
{ id, orig: "原文...", trans: "译文...", startSec, endSec }
// 与 subtitleItems 对应但独立管理
```

#### eraseRegions（8条，Line ~12733）
```javascript
{ id, x, y, w, h, startSec, endSec, label }
// x/y/w/h 为百分比值，覆盖层通过 8 个 resize handle 可拖拽调整
```

#### stepSubTasks（Line ~11080）
```javascript
stepSubTasks = {
  erase:    [{ label, doneLabel, bubble, doneBubble, phase, duration, status }],
  subtitle: [...],
  voice:    [...]
}
// 每个步骤 2-4 个子任务，驱动进度卡片和处理覆盖层同步更新
```

#### ROLES（Line ~10394）
```javascript
ROLES = {
  director:   { name:'导演', realName:'林雨晨', color:'#3b82f6', avatar:'...', greetings:[] },
  postprod:   { name:'后期', realName:'陈默',   color:'#10b981', avatar:'...', greetings:[] },
  translator: { name:'翻译', realName:'李明远', color:'#a855f7', avatar:'...', greetings:[] },
  voice:      { name:'配音', realName:'苏雅',   color:'#f59e0b', avatar:'...', greetings:[] }
}
```

### 3.6 步骤 → 角色映射

| step | 角色 | 处理覆盖场景 |
|------|------|-------------|
| `erase` | postprod（陈默） | 桌面：双显示器 + 键盘 + 画笔道具 |
| `subtitle` | translator（李明远） | 桌面：书堆 + 飞行文字字符 |
| `voice` | voice（苏雅） | 桌面：麦克风 + 声波动画 |
| 统筹/结果 | director（林雨晨） | 桌面：分镜板 + 命令行 |

---

## 四、布局模式

### 4.1 默认三栏布局

```
┌──────────────────────────────────────────────────┐
│ icon-sidebar │        main-content               │
│ (60px固定)   │                                    │
│              │ ┌──────┬──────────┬──────────────┐ │
│  Logo        │ │ LEFT │ MIDDLE   │    RIGHT     │ │
│  创作        │ │      │ (0/360px)│              │ │
│  素材        │ │视频   │ 精调面板  │  聊天面板    │ │
│  作品        │ │播放器 │ (滑入)   │  (AI对话)   │ │
│              │ │+时间线│          │              │ │
│  ---         │ │      │          │              │ │
│  API         │ └──────┴──────────┴──────────────┘ │
│  设置        │                                    │
│  头像        │                                    │
└──────────────────────────────────────────────────┘
```

- **LEFT**：视频播放器 + 处理覆盖层 + scrubber + timeline
- **MIDDLE**：精调面板（默认隐藏，宽 360px，`enterFinetune()` 时滑入）
- **RIGHT**：聊天面板（角色对话 + 进度卡片）

### 4.2 Studio 模式

`tv2-main.studio-mode` class 激活时：
- 右侧聊天面板隐藏 → 变成浮动侧边栏（chat float）
- 像素角色出现在视频区域周围（4个工位）
- scrubber 移入视频容器内部
- 像素画布渲染（Stardew Valley 风格等距工作室）
- 通过 FAB 胶囊按钮访问聊天

### 4.3 Landing 页面（两种路径）

```
tv2-landing
├── 路径标签：新任务(new) | 导入(import)
├── 新任务路径：
│   ├── 模式标签：完整(full) | 字幕擦除(erase) | 翻译(subtitle) | 配音(voice)
│   ├── 上传区（拖拽/点击上传 + VOD选择器）
│   └── 配置面板（按模式动态显示）
└── 导入路径：
    ├── ID 查询
    ├── 文件上传（MPS/SRT/VTT/ASS）
    └── Tideo 历史列表
```

---

## 五、CSS 类名命名约定

| 前缀 | 用途 | 示例 |
|------|------|------|
| `tv2-` | 译制页基础布局 | `tv2-main`, `tv2-left`, `tv2-right`, `tv2-landing` |
| `pv-` | 处理覆盖层(processing video) | `pv-desk-scene`, `pv-role-avatar`, `pv-prop-*` |
| `ft-` | 精调面板(finetune) | `ft-section`, `ft-header`, `ft-region-card` |
| `chat-` | 聊天气泡 | `chat-bubble`, `chat-role-*`, `chat-join-msg` |
| `rpc-` | 进度卡片(role progress card) | `rpc-card`, `rpc-subtask`, `rpc-status-dot` |
| `erase-` | 擦除相关 | `erase-overlay`, `erase-region`, `erase-handle` |
| `cfg-` | 配置面板 | `cfg-section`, `cfg-card`, `cfg-fold` |
| `studio-` | 工作室场景 | `studio-char`, `studio-workstation`, `studio-bubble` |
| `tl-` | 时间线(timeline) | `tl-track`, `tl-segment`, `tl-ruler` |
| `pbi-` | 底部输入框(page bottom input) | `pbi-wrapper`, `pbi-box`, `pbi-submit` |

---

## 六、跨文件依赖关系

### 6.1 app.js → translate-v6-a2.html

```javascript
// app.js 中的路由映射
'translate' → 'translate-v6-a2.html'
// 拖拽上传 → translate-v6-a2.html?file=dropped
// 文件选择 → translate-v6-a2.html?file=selected
// 侧边栏子页面检测列表包含 'translate-v6-a2.html'
```

### 6.2 task-panel.js 事件系统

```javascript
// task-panel.js 提供的组件
TideoTaskPanel.init('translate')  // 初始化任务面板
TideoTaskPanel.markStep(taskId, status, detail)  // 标记步骤状态
TideoPageInput.init('translate')  // 初始化智能输入框

// translate-v6-a2.html 监听的自定义事件
'tideo:pageinput' → { intent, subIntent, text, file, link }
  subIntent 路由：'new-task' | 'finetune' | 'redo' | 'chat'
'tideo:stop' → 停止当前处理
```

### 6.3 create.html → translate-v6-a2.html

```javascript
// create.html 的 goToSkill() 函数构建 URL
translate-v6-a2.html?mode=full&targetLang=en&voiceStyle=natural&...
translate-v6-a2.html?path=import  // 导入任务入口
// 文件信息通过 sessionStorage 传递（key: 'pendingFile'）
```

### 6.4 工作室场景事件

```javascript
// translate-v6-a2.html 内部 Block 9 (initStudioScene)
// 监听的自定义事件：
'studio:roleChange' → { role } — 角色切换时移动像素角色到工位
'studio:newBubble'  → { role, text } — 新聊天消息时显示角色气泡

// 导出的全局 API：
window.StudioScene = {
  enterEditorStudio(),  // 进入工作室模式
  summonCharacter(role), walkCharTo(role, x, y),
  showCharBubble(role, text), setCharWorking(role, bool)
}
```

---

## 七、阶段状态机流程图

```
                    ┌─────────┐
                    │ upload  │  用户拖拽/选择文件 或 从 create.html 带参进入
                    └────┬────┘
                         │ handleFile() / URL params autostart
                         ▼
                    ┌─────────┐
                    │ config  │  buildConfigChat() 构建初始对话
                    └────┬────┘
                         │ advanceStep() 开始第一个步骤
                         ▼
                  ┌──────────────┐
                  │ processing   │  逐步执行 activeSteps[]
                  │              │  每步：showStepPreBubble → runSubTasksSequentially → confirmStep
                  │ ┌──────────┐ │
                  │ │ erase    │ │ → postprod(陈默) 处理
                  │ ├──────────┤ │
                  │ │ subtitle │ │ → translator(李明远) 处理
                  │ ├──────────┤ │
                  │ │ voice    │ │ → voice(苏雅) 处理
                  │ └──────────┘ │
                  └──────┬───────┘
                         │ showStartButton() → startProcessing()
                         ▼
                    ┌─────────┐
                    │  done   │  showResult() — 导出/保存/精调
                    └─────────┘

精调分支（任何 processing 步骤完成后或 done 阶段）：
  confirmAndFinetune(step) 或 点击已解锁标签
    → enterFinetune(step) — 打开中间面板
    → 用户编辑 — 数据双向同步到 timeline + video overlays
    → exitFinetune() — 收起面板，可选重新运行步骤

导入分支：
  handleImportedTask(taskInfo)
    → 跳过 config 阶段
    → 直接解锁所有相关标签
    → 进入精调模式
```

---

## 八、task-panel.js 详解

### 8.1 TASK_TEMPLATES

```javascript
translate: { steps: ['upload','config','erase','subtitle','voice','render'] }
livestream: { steps: ['import','analyze','clip','export'] }
generate: { steps: ['input','parse','style','storyboard','synth','export'] }
```

### 8.2 意图检测系统

```javascript
// 跨技能意图检测（SKILL_KEYWORDS）— 20+ 关键词/技能
translate: ['翻译','译制','配音','字幕','擦除','多语言',...]
livestream: ['直播','剪辑','切片','高光',...]
generate: ['生成','创作','AI视频','脚本',...]

// 同技能子意图检测（SUB_INTENT_KEYWORDS）
translate.subIntents:
  newLang: ['换一种语言','改成日语',...]
  voiceChange: ['换个声音','男声',...]
  styleAdj: ['字幕样式','字体',...]
  redo: ['重来','重新',...]
```

### 8.3 TideoPageInput 提交流程

```
用户输入 → _detectIntent()
  跨技能匹配？ → 显示切换标签 → 用户确认 → 跳转对应页面
  同技能？ → _detectSubIntent() → dispatch 'tideo:pageinput' 事件
    → 页面内部处理（translate-v6-a2.html Block 8 监听）
```

---

## 九、工作室场景系统（Block 9: Lines 14920–15391）

### 9.1 工位坐标系统

```javascript
WORKSTATIONS = {
  director:   { x: '15%', y: '60%' },
  postprod:   { x: '35%', y: '55%' },
  translator: { x: '60%', y: '58%' },
  voice:      { x: '82%', y: '52%' }
}
```

### 9.2 角色 API

| 方法 | 说明 |
|------|------|
| `walkCharTo(role, x, y)` | 角色行走到指定坐标（带步行动画） |
| `summonCharacter(role)` | 角色入场（从屏幕外走入工位） |
| `showCharBubble(role, text)` | 显示角色语音气泡（3秒后消失） |
| `setCharWorking(role, bool)` | 设置角色工作状态（播放工作动画） |

### 9.3 事件联动

- `studio:roleChange` → 当前处理角色移动到工位前方
- `studio:newBubble` → 角色显示最新聊天消息作为气泡
- 聊天内容同步：MutationObserver 监听 `.tv2-chat-body` 变更 → 同步到浮动聊天窗口

---

## 十、像素画布渲染器（Block 10: Lines 15392–15845）

480×360 像素的 Stardew Valley 风格等距工作室房间，包含：
- 地板瓷砖（棋盘格纹理）
- 墙壁 + 窗户（带外景）
- 桌子（木纹纹理 + 显示器组 + 键盘 + 马克杯）
- 书架（彩色书脊）
- 植物盆栽
- 软木板 + 海报
- 猫（带眨眼动画，setInterval 驱动）
- LED 灯串（带相位动画，requestAnimationFrame 驱动）
- 椅子

---

## 十一、快速定位参考

### 改动场景 → 应该看的行范围

| 我要改... | CSS 行范围 | HTML 行范围 | JS 行范围 |
|-----------|-----------|------------|----------|
| 视频播放器/覆盖层 | 1086-1200, 300-1080 | 9394-9600 | 10557-10760 |
| 聊天气泡样式 | 1800-2090 | 10021-10055 | 12137-12170 |
| 进度卡片 | 2091-2490 | (动态生成) | 11040-11118 |
| 精调面板 | 3202-3530 | 9851-10018 | 11813-12000 |
| 时间线 | 1506-1700 | (在 tv2-left 底部) | 13153-13630 |
| 擦除功能 | 3531-3600 | (动态覆盖层) | 12733-13150 |
| Landing 页面 | 4399-5200 | 8931-9370 | 13634-14220 |
| 处理覆盖层动画 | 300-1080 | 9500-9600 | 10557-10620 |
| 角色系统 | 8226-8520 | 10063-10098 | 10394-10550, 14920-15391 |
| 工作室场景 | 7236-8220 | (在 tv2-left 内) | 15392-15845 |
| 最小化/任务条 | 6887-7060 | 8931-8940 | 14293-14593 |
| 底部输入框 | (task-panel.css) | (动态注入) | 14663-14919 |
| 用户菜单/登录 | (在 icon-sidebar CSS 中) | 8895-8910 | 14594-14662 |
| VOD 选择器 | (模态框 CSS) | 10147-10186 | 10288-10365 |
| 导入功能 | 4485-5100, 5900-6200 | 9260-9370, 10188-10280 | 10844-10968, 13750-14220 |
| 对比模式 | 2568-2745 | 9395-9400, 9795-9830 | 12453-12520 |

---

## 十二、编码约定

1. **产品名称**：用户可见文案用 `Tideo`，CSS 类名/JS 变量保持 `framex`/`tv2` 前缀不变
2. **单文件架构**：`translate-v6-a2.html` 是纯单文件，所有 CSS/HTML/JS 内联，不引用外部 CSS/JS（除 `task-panel.js/css` 和 `app.js`）
3. **角色图片路径**：`assets/characters/{name}-{role}.png`
4. **事件驱动**：页面间通信用 CustomEvent（`tideo:pageinput`, `tideo:stop`, `studio:roleChange`, `studio:newBubble`）
5. **页面间数据**：sessionStorage（`pendingFile`）+ URL params（`mode`, `targetLang`, `path` 等）
6. **Mock 数据**：当前所有 API 调用都是模拟的（setTimeout + 随机延迟），数据硬编码在页面内
7. **行号会漂移**：每次修改后行号会变化，本文档的行号基于 2026-03-25 版本（15,845 行），大改后需同步更新
8. **导航标记**：文件内含 47 个 `[SECTION: ...]` 注释标记，搜索 `[SECTION:` 可快速跳转；新增区段时应添加对应标记
