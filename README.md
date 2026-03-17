# Holdem Web (德州扑克网页游戏)

一个基于 Vue 3 + Vite 的 6 人桌 No-Limit Texas Hold'em 单机网页游戏项目。  
规则权威文档：`TEXAS_HOLDEM_RULEBOOK.md`。

## 1. 技术栈

- Vue 3
- Vite 5
- Pinia
- Vue Router
- Vitest

## 2. 环境要求

- Node.js 18+（推荐 20+）
- npm 9+

检查版本：

```bash
node -v
npm -v
```

## 3. 5 分钟上手（从 0 到看到牌桌）

如果你是第一次接触这个项目，直接按下面做：

1. 打开终端进入项目目录：

```bash
cd <你的项目目录>/holdemWeb
```

2. 安装依赖：

```bash
npm install
```

3. 启动开发环境：

```bash
npm run dev
```

4. 浏览器打开终端显示的地址（默认 `http://localhost:5173`）。

5. 看到牌桌界面后，点击页面任意位置开始一手牌。

## 4. 如何运行项目（开发模式）

1. 安装依赖

```bash
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

3. 在浏览器打开终端输出的本地地址（默认类似 `http://localhost:5173`）。

## 5. 常用命令

```bash
# 开发
npm run dev

# 单元测试
npm test

# 回归测试（规则 + store 关键路径）
npm run test:regression

# 生产打包
npm run build

# 单文件内联打包（离线双击优先用这个）
npm run build:inline

# 本地预览生产包
npm run preview

# 本地预览内联包
npm run preview:inline
```

## 6. 如何打包

这个项目支持两种打包方式：

### 6.1 标准打包（部署服务器用）

执行：

```bash
npm run build
```

打包产物在：

```text
dist/
```

可用于部署到任意静态服务器（Nginx、OSS、Netlify、Vercel、GitHub Pages 等）。

### 6.2 单文件内联打包（离线双击用）

执行：

```bash
npm run build:inline
```

打包产物在：

```text
dist-inline/index.html
```

这个文件会把 JS/CSS 直接内联到一个 HTML 里，适合发给学习者离线双击运行。

## 7. 如何预览打包结果

预览标准包：

```bash
npm run preview
```

然后访问终端给出的地址（通常是 `http://localhost:4173`）。

预览单文件内联包：

```bash
npm run preview:inline
```

## 8. 离线打开（双击 index.html）

如果你的目标是“直接双击就能跑”，请使用内联打包：

```bash
npm run build:inline
```

然后直接打开：

```text
dist-inline/index.html
```

说明：

1. `npm run build` 生成的标准包主要用于 `http/https` 环境（服务器预览或正式部署）。
2. 部分浏览器对 `file://` + 外链模块会触发 CORS 限制，因此离线双击请优先使用 `build:inline`。

## 9. 常见问题（FAQ）

### Q1: 双击 `index.html` 白屏，控制台报 CORS（`file:///assets/...`）怎么办？

通常是你打开了标准构建产物（`dist/index.html`），浏览器限制了 `file://` 下的模块加载。  
按下面顺序处理：

1. 执行：`npm run build:inline`
2. 打开：`dist-inline/index.html`
3. 或者执行 `npm run preview` / `npm run preview:inline` 用 `http://` 访问（最稳定）

### Q2: 改了代码但浏览器看起来没更新？

1. 开发模式下使用 `npm run dev`
2. 强制刷新浏览器缓存（`Cmd/Ctrl + Shift + R`）
3. 关闭旧标签页后重新打开本地地址

### Q3: 部署后刷新页面 404？

当前是 `Hash` 路由（URL 带 `#`），静态托管下通常不会出现该问题。  
若你未来改回 `History` 路由，需要服务器配置回退到 `index.html`。

### Q4: 标准包和内联包怎么选？

1. 线上部署、性能优先：`npm run build`（`dist/`）。
2. 离线教学、直接双击：`npm run build:inline`（`dist-inline/index.html`）。

## 10. 推荐学习路径

1. 先读规则：`TEXAS_HOLDEM_RULEBOOK.md`
2. 再看总规格：`GAME_SPEC.md`
3. 查看阶段规格：`PHASE_*_SPEC.md`
4. 看引擎核心：`src/game/engine/`
5. 看状态管理：`src/stores/tableStore.ts`
6. 看牌桌 UI：`src/components/table/`

## 11. 开发协作（Spec 模式）

建议保持以下流程，减少返工：

1. 先更新/新增 spec 文档（明确范围与验收）
2. 再改代码
3. 执行门禁：

```bash
npm test
npm run test:regression
npm run build
```

4. 回填 `GAME_SPEC.md` 与 `日志.md`
