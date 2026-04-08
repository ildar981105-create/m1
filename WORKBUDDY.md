# Tideo 项目交接文档（WorkBuddy 版）

> **AI 助手请先通读此文件**，理解项目全貌后再进行任何操作。本项目是纯前端静态站，无构建工具，浏览器直接打开即可运行。

---

## 一、项目是什么

**Tideo** 是一个 AI 媒体处理平台的前端原型，包含三大功能模块：

| 模块 | 入口 | 说明 |
|------|------|------|
| 视频译制 | `translate-v8.html` + `translate-v8.js` | 自动擦除原字幕→翻译→重新配音，含精调面板 |
| 视频制作 | `generate.html` | AI 根据脚本分镜生成视频 |
| 直播剪辑 | `livestream.html` | 实时监控直播流，自动剪辑精彩片段 |

**统一入口**：`app/create.html`（首页 + 技能选择 + 智能输入框）

---

## 二、技术栈

- **纯 HTML + CSS + 原生 JS**（无 React/Vue/框架，无 npm/webpack）
- 浏览器打开 `app/create.html` 即可运行
- GitHub Pages 静态部署
- 仓库：`git@github.com:ildar981105-create/f1.git`（`main` 分支）
- 线上：`https://ildar981105-create.github.io/f1/`

---

## 三、文件结构

```
f1/
├── index.html                     → 重定向到 app/create.html
├── CODEBUDDY.md                   → translate-v7 的详细架构索引（16,000行文件的行号地图）
├── HANDOFF.md                     → 项目交接文档（详细版）
├── WORKBUDDY.md                   → 本文件（精简版，给 WorkBuddy 用）
│
├── app/
│   ├── create.html                ★ 统一入口页（技能系统 + 智能输入框 + 配置栏）
│   ├── translate-v8.html          ★ 视频译制最新版（HTML 结构 + CSS）
│   ├── translate-v8.js            ★ 视频译制最新版（JS 逻辑）
│   ├── translate-v7.html          旧版保留参考（不要改）
│   ├── translate-v6-a2.html       旧版保留参考（不要改）
│   ├── generate.html              AI 视频生成页
│   ├── livestream.html            直播剪辑页
│   ├── editor-v2.html + .css      编辑器
│   ├── login.html                 登录页
│   ├── media.html                 素材管理
│   ├── result.html                作品管理
│   ├── api.html                   API 设置页
│   ├── app.js                     全局路由 + 侧边栏
│   ├── style.css                  全局共享样式
│   ├── task-panel.js + .css       任务面板 + 输入框组件
│   └── assets/
│       ├── characters/            角色头像 PNG
│       └── videos/                Loading 视频（translate-loading.mp4, voice-loading.mp4）
│
└── landing/                       产品官网 Landing Page
```

---

## 四、核心模块详解

### 4.1 create.html — 入口页

**技能系统**（JS 对象 `skills`）：
- 三大技能卡片：`translate`（视频译制）、`generate`（视频制作）、`livestream`（直播剪辑）
- 三个子功能：`erase`（字幕擦除）、`subtitle`（添加字幕）、`voiceover`（添加配音）
- 点击卡片或输入关键词 → 自动检测技能 → 显示配置胶囊

**配置栏**（toolbar 中的胶囊按钮）：
- 支持 3 种类型：
  - `dual` — 双列选择（如语言：源→目标）
  - `grouped` — 分组下拉（如字幕：压制/文件/其他三组）
  - 普通 — 单列下拉（如配音：克隆/女声/男声）
- 选中项带对勾 ✓

**附件区**（`attachBar`）：
- 视频译制类 → 显示"添加视频"引导
- 直播剪辑 → 显示链接输入框（带粘贴按钮 + 确定按钮）

### 4.2 translate-v8.html + translate-v8.js — 视频译制

**四角色系统**：

| 角色 | key | 名字 | 颜色 | 负责 |
|------|-----|------|------|------|
| 导演 | `director` | 林雨晨 | #3b82f6 蓝 | 统筹 |
| 后期 | `postprod` | 陈默 | #10b981 绿 | 擦除 |
| 翻译 | `translator` | 李明远 | #a855f7 紫 | 字幕 |
| 配音 | `voice` | 苏雅 | #f59e0b 黄 | 配音 |

**状态机流程**：
```
upload → config → processing（erase → subtitle → voice）→ done（关灯聚光）
```

**页面布局**：
- 默认：左侧背景+视频小窗 | 右侧聊天面板（角色对话+进度卡片）
- 精调模式（ft-mode）：grid 双栏
  - 左上：视频卡片（全尺寸）
  - 左下：时间线卡片（刻度在上、轨道在下、底部留白）
  - 右侧：精调面板卡片（标签页：擦除/字幕/配音，每个面板底部有"完成精调"按钮）
- 关灯模式（lights-off）：暗幕 + 视频居中聚光 + 底部操作按钮

**精调面板**：
- 擦除：区域列表（可拖拽调整位置/大小）
- 字幕：全局配置（语言/样式/压制）+ 字幕列表（内联编辑时间/文本）
- 配音：全局配置（音色/语速/情感）+ 配音列表（内联编辑）
- 时间线：刻度尺在轨道上方，三条轨道（擦除/字幕/配音），支持片段拖拽

**数据模型**：
- `subtitleItems[]` — 7 条字幕 `{ id, orig, trans, startSec, endSec }`
- `voiceItems[]` — 7 条配音（同结构）
- `eraseRegions[]` — 8 个擦除区域 `{ id, x, y, w, h, startSec, endSec, label }`
- `stepSubTasks{}` — 每步骤的子任务队列，驱动进度卡片

**关键 CSS 前缀**：
- `v8-` — translate-v8 所有组件
- `ft-` — 精调相关
- `v8-seg--erase/subtitle/voice` — 时间线片段颜色编码

---

## 五、开发规范

### 版本策略
- **只改最新版**：translate-v8、editor-v2、create.html
- **不动旧版**：v7、v6-a2（保留对比参考）

### 命名
- 用户可见文案用 **Tideo**
- CSS 类名/JS 变量中的 `framex` 保持不变（历史遗留）

### 配色
- 暗色主题默认，浅色通过 `[data-theme="light"]` 覆盖
- 视频译制=绿 `#10b981`，视频制作=紫 `#a855f7`，直播剪辑=橙 `#f97316`
- 主色=靛蓝 `#6366f1`

### 发布
```bash
cd /Users/ildar/Desktop/f1
git add <文件>
git commit -m "feat/fix: 中文描述"
git push origin main
# 自动部署到 https://ildar981105-create.github.io/f1/
```

---

## 六、当前待办 / 已知问题

- [ ] translate-v8 的处理动画（loading 覆盖层）尚未从 v7 完整迁移
- [ ] 直播剪辑页面功能较初级
- [ ] generate.html 分镜编辑交互待完善
- [ ] 移动端适配尚未开始
- [ ] 对比模式下原片视频位置可能需要微调

---

## 七、快速验证

1. 浏览器打开 `app/create.html`
2. 点击"视频译制"卡片 → 配置栏出现（语言/字幕/配音三个胶囊）
3. 上传任意视频 → 跳转 translate-v8.html → 聊天面板自动推进
4. 处理完成 → 关灯聚光效果 → 导出/对比/精调按钮
5. 点"再次精调" → 进入精调模式（grid 双栏 + 时间线）
