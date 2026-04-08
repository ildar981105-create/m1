# Tideo 项目交接文档

> **给 CodeBuddy 的指引**：这是一个完整的前端项目，请先通读此文件理解项目结构、技术栈和开发规范，然后再进行任何修改。项目无需构建工具，纯 HTML/CSS/JS 直接运行。

---

## 一、项目概述

**Tideo** 是一个 AI 驱动的媒体处理平台，提供三大核心功能：
1. **视频译制** — 自动擦除原字幕、翻译、重新配音
2. **视频制作** — AI 根据脚本分镜生成视频
3. **直播剪辑** — 实时监控直播流，自动剪辑精彩片段

### 技术栈
- **纯前端**：HTML + CSS + 原生 JavaScript（无框架、无构建工具）
- **部署**：GitHub Pages 静态托管
- **仓库**：`git@github.com:ildar981105-create/f1.git`（`main` 分支）
- **线上地址**：`https://ildar981105-create.github.io/f1/`
- **主入口**：`app/create.html`

---

## 二、文件结构与职责

```
f1/
├── index.html                    # 根路由重定向 → app/create.html
├── CODEBUDDY.md                  # 项目架构规则（translate-v7 的详细行号索引）
├── HANDOFF.md                    # 👈 本文件（项目交接说明）
│
├── app/                          # ★ 主应用目录 ★
│   ├── create.html               # 统一入口页（首页 + 技能选择 + 智能输入框）
│   ├── translate-v8.html + .js   # ★ 视频译制最新版（v8：精调面板卡片化重构）
│   ├── translate-v7.html         # 视频译制 v7（16,026行，保留参考）
│   ├── translate-v6-a2.html      # 视频译制 v6-a2（保留对比，不要修改）
│   ├── generate.html             # AI 视频生成页
│   ├── livestream.html           # 直播剪辑页
│   ├── editor-v2.html + .css     # 编辑器
│   ├── login.html                # 登录页
│   ├── media.html                # 素材管理
│   ├── result.html               # 任务记录/作品管理
│   ├── api.html                  # API 设置页
│   ├── experience-framework.html # 体验框架说明页
│   │
│   ├── app.js                    # 全局路由 + 侧边栏 + 意图检测
│   ├── style.css                 # 全局共享样式（侧边栏、通用组件）
│   ├── task-panel.js + .css      # 任务面板 + 智能输入框组件
│   │
│   └── assets/
│       ├── characters/           # 角色头像 PNG（4主角 + 团队合照）
│       ├── videos/               # Loading 视频（translate-loading.mp4, voice-loading.mp4）
│       ├── card-*.png            # 技能卡片背景图
│       ├── scene-*.png           # 场景插图
│       └── bg-studio.png         # 工作室背景
│
└── landing/                      # 独立 Landing Page（产品官网）
    ├── index.html
    ├── script.js
    └── style.css
```

---

## 三、版本策略（重要！）

| 功能 | 最新版本 | 状态 | 旧版本（不要动） |
|------|---------|------|-----------------|
| 视频译制 | `translate-v8.html` + `translate-v8.js` | ✅ 当前开发版 | v7, v6-a2（保留对比） |
| 编辑器 | `editor-v2.html` + `editor-v2.css` | ✅ | — |
| 入口页 | `create.html` | ✅ | — |

**规则**：所有新功能只在最新版本上开发，旧版本仅保留参考，不要修改。

---

## 四、核心页面详解

### 4.1 create.html — 统一入口页

**结构**：首页视图 + 智能输入框 + 技能系统

**技能系统**（JS 对象 `skills`）：
- `translate` — 视频译制（跳转 translate-v8.html）
- `generate` — 视频制作（跳转 generate.html）
- `livestream` — 直播剪辑（跳转 livestream.html）
- `erase` / `subtitle` / `voiceover` — 独立子功能（跳转 translate-v8.html?mode=xxx）

**配置栏**（`configBar`）：
- 每个技能有 `config[]` 数组定义配置项
- 支持 3 种类型：`dual`（双列语言选择）、`grouped`（分组下拉）、普通（单列下拉）
- 配置项以胶囊（`cfg-capsule`）形式显示在输入框 toolbar 中
- 下拉选项带对勾选中状态

**交互流程**：
1. 用户点击技能卡片或输入关键词 → 自动检测技能 → 显示配置胶囊
2. 视频译制/擦除/字幕/配音 → 要求上传视频文件
3. 直播剪辑 → 要求输入直播链接（带粘贴按钮）
4. 点击发送 → 跳转到对应功能页

### 4.2 translate-v8.html + translate-v8.js — 视频译制

**v8 与 v7 的核心差异**：
- HTML + JS 分离（v7 是 16,000 行单文件，v8 拆分为 HTML + JS）
- 精调面板改为右侧卡片式布局（grid 双栏：左=视频+时间线，右=精调卡片）
- "完成精调"按钮在每个面板（擦除/字幕/配音）内部底部
- 保留四角色系统、聊天面板、工作室场景

**四角色系统**：

| 角色 | key | 真名 | 颜色 | 职责 |
|------|-----|------|------|------|
| 导演 | `director` | 林雨晨 | 蓝 #3b82f6 | 统筹协调 |
| 后期 | `postprod` | 陈默 | 绿 #10b981 | 擦除处理 |
| 翻译 | `translator` | 李明远 | 紫 #a855f7 | 字幕翻译 |
| 配音 | `voice` | 苏雅 | 黄 #f59e0b | 配音合成 |

**状态机**：
```
upload → config → processing（erase → subtitle → voice）→ done
```

**精调模式**：
- 进入：`enterFinetune(step)` — 左侧视频 + 右侧精调卡片
- 退出：`exitFinetune()` — 每个面板底部的"完成精调"按钮触发
- 三个标签页：擦除区域列表 / 字幕列表 / 配音列表
- 每条支持内联编辑（时间、文本、区域）

**数据模型**：
- `subtitleItems[]` — 7 条字幕（id, orig, trans, startSec, endSec）
- `voiceItems[]` — 7 条配音
- `eraseRegions[]` — 8 个擦除区域（x, y, w, h 百分比值）
- `stepSubTasks{}` — 每个步骤的子任务队列

### 4.3 其他页面

- **generate.html** — AI 视频生成（分镜编辑 + 逐段生成）
- **livestream.html** — 直播剪辑（监控 + 高光检测）
- **editor-v2.html** — 通用视频编辑器
- **login.html** — 登录页（账号密码 / 手机号 / 微信扫码）
- **media.html** — 素材库管理
- **result.html** — 任务记录与作品管理

---

## 五、导航结构

```
create.html（主入口）
├── 侧边栏导航：创作(create) → 素材(media) → 作品(result)
├── 技能卡片 / 输入框 → translate-v8.html（视频译制）
├── 技能卡片 / 输入框 → generate.html（视频制作）
├── 技能卡片 / 输入框 → livestream.html（直播剪辑）
└── 子功能入口 → translate-v8.html?mode=erase|subtitle|voice
```

---

## 六、CSS 命名约定

| 前缀 | 用途 | 文件 |
|------|------|------|
| `v8-` | translate-v8 所有组件 | translate-v8.html |
| `tv2-` | translate-v7 基础布局 | translate-v7.html |
| `pv-` | 处理覆盖层 | translate-v7.html |
| `ft-` | 精调面板 | translate-v7/v8 |
| `cfg-` | 配置胶囊/下拉 | create.html |
| `ev2-` | editor-v2 | editor-v2.html/css |
| 无前缀 | 全局共享 | style.css |

---

## 七、开发规范

### 7.1 产品名称
- 用户可见文案：**Tideo**
- CSS 类名 / JS 变量中的 `framex` 保持不变（历史原因）

### 7.2 文件修改原则
- **只改最新版本**（v8, editor-v2, create.html）
- **不动旧版本**（v7, v6-a2）
- **不动备份仓库**（Tideo / framex-studio / framex-app / av-saas）

### 7.3 配色体系
- 暗色主题为默认，浅色主题通过 `[data-theme="light"]` 覆盖
- 主色调：靛蓝 `#6366f1` / 翠绿 `#10b981`
- 视频译制：绿色系 `#10b981`
- 视频制作：紫色系 `#a855f7`
- 直播剪辑：橙色系 `#f97316`

### 7.4 发布流程
```bash
git add <改动文件>
git commit -m "feat/fix: 简洁中文描述"
git push origin main
# GitHub Pages 自动部署到 https://ildar981105-create.github.io/f1/
```

---

## 八、当前已知待办

- translate-v8 的处理动画（loading 覆盖层）尚未从 v7 完整迁移
- 直播剪辑页面功能较初级
- generate.html 分镜编辑交互待完善
- 移动端适配尚未开始

---

## 九、快速开始

1. 用浏览器打开 `app/create.html` 即可运行（无需安装任何依赖）
2. 主要开发工作集中在 `app/create.html` 和 `app/translate-v8.html` + `app/translate-v8.js`
3. 修改后直接刷新浏览器查看效果
4. 推送到 GitHub 自动部署
