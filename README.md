# 学生目标驱动时间管理 App (MVP)

一个面向学生的轻量时间管理 Web App，核心链路是：

**目标 -> 周计划 -> 每日三件事 -> 执行 -> 复盘 -> 调整**

本项目重点不是普通待办，而是“目标驱动日历”：你能看到每个时间块在推进哪个目标。

## 项目简介

- 首页：今日三件事、天气和穿衣建议、今日时间安排、紧急目标提醒、收件箱提醒、晚间复盘入口
- 计划：长期目标（SMART + 时间规划字段）、周计划 PDCA、今日任务、目标驱动日历（月/周）、外部任务 mock 导入
- 知识库：树状课程知识地图（学科 -> 课程 -> 章节/专题/总结 -> 内容），支持分类管理、知识 CRUD、速记、PDF mock 分析与任务联动
- 想法：脑内收件箱，支持转任务、转知识库、归档
- 我的：今日完成数、本周完成数、连续复盘天数，预留黄金时段分析等能力

## 技术栈

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Context + 本地状态
- localStorage 持久化
- Mock 数据
- 响应式布局（移动端优先）
- PWA 预留（manifest + 图标 + sw 占位）

## 本地启动方法

> 需要先安装 Node.js 18+

```bash
npm install
npm run dev
```

默认打开：`http://localhost:3000`

## 打包方法

```bash
npm run build
npm run start
```

## 目录结构说明

```text
.
├─ public/
│  ├─ icons/                     # PWA 图标占位
│  ├─ manifest.webmanifest       # PWA manifest
│  └─ sw.js                      # Service Worker 占位（MVP）
├─ src/
│  ├─ app/
│  │  ├─ goals/[goalId]/         # 目标详情页（含时间安排区）
│  │  ├─ ideas/                  # 想法页路由
│  │  ├─ knowledge/              # 知识库页路由
│  │  ├─ plan/                   # 计划页路由
│  │  ├─ profile/                # 我的页路由
│  │  ├─ globals.css             # 全局样式
│  │  ├─ layout.tsx              # 根布局（含导航和 Provider）
│  │  └─ page.tsx                # 首页路由
│  ├─ components/
│  │  ├─ home/                   # Dashboard 组件
│  │  ├─ ideas/                  # 想法模块组件
│  │  ├─ knowledge/              # 知识库组件
│  │  ├─ layout/                 # 顶部导航/底部导航壳组件
│  │  ├─ plan/                   # 计划模块子组件（目标、周计划、日历等）
│  │  └─ profile/                # 我的模块组件
│  ├─ lib/
│  │  ├─ date.ts                 # 日期工具
│  │  ├─ id.ts                   # ID 工具
│  │  ├─ mock-data.ts            # 初始 mock 数据
│  │  ├─ scheduler.ts            # GoalSession 生成逻辑（可替换）
│  │  ├─ storage.ts              # localStorage 持久化
│  │  └─ types.ts                # 核心类型定义
│  └─ store/
│     └─ app-store.tsx           # 全局状态管理与业务 action
├─ .env.example
├─ .gitignore
├─ package.json
└─ README.md
```

## 核心数据模型

已实现并建立关联：

- `User`
- `Goal`
- `GoalSession`
- `WeeklyPlan`
- `Task`
- `KnowledgeCategory`
- `KnowledgeSubject`
- `KnowledgeCourse`
- `KnowledgeNode`
- `KnowledgeItem`
- `QuickNote`
- `PdfKnowledgeDocument`
- `Idea`
- `WeatherInfo`
- `ReviewEntry`
- `CalendarDaySummary`
- `CalendarViewMode`

关联关系：

- 一个 `Goal` 可关联多个 `Task`
- 一个 `Goal` 可关联多个 `GoalSession`
- 一个 `Task` 可关联多个 `KnowledgeItem`
- 一个 `Subject` 可包含多个 `Course`
- 一个 `Course` 可包含多个 `KnowledgeNode`（章节/专题/总结）
- 一个 `KnowledgeNode` 可挂载多个 `KnowledgeItem` / `QuickNote` / `PdfKnowledgeDocument`
- 一个 `Idea` 可转为 `Task` 或 `KnowledgeItem`

## 时间安排逻辑（MVP）

在 `src/lib/scheduler.ts` 中实现了基础规则：

1. 根据 `estimatedTotalHours` 和 `suggestedSessionMinutes` 拆分 session
2. 尽量在截止日期前均匀分布
3. 优先使用 `preferredTimeOfDay` 对应时段
4. 默认偏好时段为 `evening`

> 代码中已注释为可替换智能排程算法。

## GitHub 上传建议

1. 初始化仓库并提交：

```bash
git init
git add .
git commit -m "feat: student goal-driven time management app mvp"
```

2. 创建远程仓库后推送：

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## 推荐部署方式

### 1) Vercel（推荐）

- Next.js 原生支持最好
- 自动 CI/CD + 预览环境
- 几乎零配置

### 2) Netlify（可用）

- 也支持 Next.js
- 需要确认构建与运行环境配置

### 3) GitHub Pages（不推荐本项目）

- 本项目是 Next.js App Router，纯静态导出适配成本较高
- 如一定要用 Pages，需要额外调整为静态导出策略

## PWA 补齐建议（后续）

当前已预留：

- `manifest.webmanifest`
- 基础图标
- `public/sw.js` 占位

后续建议：

1. 接入 `next-pwa` 或 Workbox
2. 增加运行时缓存与离线页面
3. 增加安装引导（Add to Home Screen 提示）
4. 处理 Service Worker 更新策略（skip waiting / prompt update）

## 后续扩展建议

1. 接入真实天气 API（替换 mock）
2. 接入真实网页任务解析服务
3. 增加拖拽改期和冲突处理
4. 增加目标进度自动计算
5. 接入账号体系和云端同步
6. 增加通知提醒、番茄钟和专注统计

---

如果你要继续迭代，我建议下一步先做：
**“目标排程冲突检测 + 日历拖拽改期 + 自动重排”**。
