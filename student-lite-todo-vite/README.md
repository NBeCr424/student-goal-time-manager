# 学生极简目标时间管理 ToDo App（Vite）

纯工具属性学习效率 App，聚焦 3 件事：目标拆解、待办执行、专注计时。

## 技术栈
- React 18
- TypeScript
- Tailwind CSS v3
- Vite
- 原生 IndexedDB + Service Worker

## 目录结构
```text
student-lite-todo-vite/
├─ public/
│  └─ sw.js
├─ src/
│  ├─ components/
│  │  ├─ ErrorBoundary.tsx
│  │  ├─ GoalCard.tsx
│  │  ├─ Layout.tsx
│  │  ├─ PrimaryActionBar.tsx
│  │  ├─ ToastProvider.tsx
│  │  └─ TodoItem.tsx
│  ├─ lib/
│  │  ├─ breakdown.ts
│  │  ├─ date.ts
│  │  ├─ export.ts
│  │  ├─ id.ts
│  │  └─ idb.ts
│  ├─ pages/
│  │  ├─ FocusPage.tsx
│  │  ├─ GoalsPage.tsx
│  │  ├─ HomePage.tsx
│  │  ├─ SettingsPage.tsx
│  │  └─ TodosPage.tsx
│  ├─ store/
│  │  └─ useAppData.tsx
│  ├─ App.tsx
│  ├─ index.css
│  ├─ main.tsx
│  └─ types.ts
├─ index.html
├─ package.json
├─ postcss.config.cjs
├─ tailwind.config.cjs
├─ tsconfig.json
├─ vercel.json
└─ vite.config.ts
```

## 启动与部署（仅 3 步）
1. 安装依赖  
   `npm install`
2. 本地启动  
   `npm run dev`
3. Vercel 部署  
   `npx vercel --prod`

说明：`vercel.json` 已包含 SPA 路由重写与静态资源缓存配置，可直接部署。
