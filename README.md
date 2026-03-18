# Holdem Web (德州扑克网页游戏)

一个基于 Vue 3 + Vite 的 6 人桌 No-Limit Texas Hold'em 单机网页游戏项目。  
规则权威文档：`TEXAS_HOLDEM_RULEBOOK.md`。

## 1. 技术栈与环境

技术栈：

- Vue 3
- Vite 5
- Pinia
- Vue Router
- Vitest

## 2. 常用命令

```bash
# 开发
npm run dev

# 单元测试
npm test

# 回归测试（规则 + store 关键路径）
npm run test:regression

# 标准生产打包
npm run build

# 单文件内联打包（离线双击优先用这个）
npm run build:inline

# 预览标准包
npm run preview

# 预览内联包
npm run preview:inline
```

## 3. 打包与预览

### 3.1 标准打包（部署服务器）

```bash
npm run build
```

产物目录：

```text
dist/
```

适合部署到 Nginx、OSS、Netlify、Vercel、GitHub Pages 等静态托管环境。

### 3.2 单文件内联打包（离线双击）

```bash
npm run build:inline
```

产物文件：

```text
dist-inline/index.html
```

这个版本会把 JS/CSS 内联到单个 HTML，适合离线教学、文件分发与演示。

### 3.3 预览打包结果

预览标准包：

```bash
npm run preview
```

预览内联包：

```bash
npm run preview:inline
```

## 4. 离线打开说明

如果你希望“直接双击就能跑”，请使用内联包：

```bash
npm run build:inline
```

然后打开：

```text
dist-inline/index.html
```

说明：

1. `npm run build` 生成的标准包主要用于 `http/https` 环境。
2. 某些浏览器对 `file://` + 外链模块会触发 CORS 限制，因此离线优先使用 `build:inline`。

## 5. 项目结构与模块职责

```text
holdemWeb/
├─ src/
│  ├─ game/
│  │  ├─ engine/              # 德州规则引擎（发牌、下注、街道推进、结算）
│  │  ├─ types/               # 引擎与事件的类型定义
│  │  ├─ assets/              # 资源解析（卡牌/头像/筹码 URL 映射）
│  │  ├─ mock/                # 演示桌状态与默认玩家配置
│  │  └─ ui/                  # 结算文案格式化等 UI 侧工具
│  ├─ stores/                 # Pinia 状态编排（UI <-> engine）
│  ├─ components/table/       # 牌桌组件（座位、公牌、操作区、动画层）
│  ├─ resources/              # 原始图片素材（牌面、背景、按钮等）
│  ├─ router/                 # 路由配置
│  ├─ views/                  # 页面级视图
│  ├─ App.vue                 # 应用根组件
│  ├─ main.js                 # 应用入口（挂载 Pinia / Router）
│  └─ style.css               # 全局样式
├─ TEXAS_HOLDEM_RULEBOOK.md   # 规则权威文档
├─ GAME_SPEC.md               # 总体规格与阶段里程碑
├─ PHASE_*_SPEC.md            # 分阶段规格文档
├─ 日志.md                    # 迭代日志
├─ vite.config.js             # 标准构建配置
├─ vite.config.inline.js      # 单文件内联构建配置
└─ package.json               # 脚本与依赖
```

核心模块职责：

1. `src/game/engine/holdemEngine.ts`：整手牌状态机与动作分发（盲注、合法动作、街道推进、摊牌、派奖）。
2. `src/game/engine/handEvaluator.ts`：7 张牌评估与牌力比较。
3. `src/stores/tableStore.ts`：UI 与引擎编排层（Hero 行动、AI 调度、计时器、事件流）。
4. `src/components/table/TableScene.vue`：牌桌主场景，负责渲染与动画联动。
5. `src/components/table/*`：座位、公牌、手牌、操作面板、发牌动画、飞筹码、摊牌面板等子组件。
6. `src/game/assets/resourceResolver.ts`：统一素材路径解析，避免业务层硬编码。
7. `src/game/mock/createMockTableState.ts`：演示桌初始配置与 UI 视图模型转换。
8. `src/game/types/index.ts`：Action/Event/HandState/LegalAction 等共享类型契约。
9. `src/game/ui/showdownFormatter.ts`：摊牌中文文案格式化（牌型、主池/边池）。
10. `src/game/engine/__tests__`、`src/stores/__tests__`：规则与状态编排回归测试。

## 6. 推荐学习路径

1. 先读规则：`TEXAS_HOLDEM_RULEBOOK.md`
2. 再看总规格：`GAME_SPEC.md`
3. 查看阶段规格：`PHASE_*_SPEC.md`
4. 看引擎核心：`src/game/engine/`
5. 看状态管理：`src/stores/tableStore.ts`
6. 看牌桌 UI：`src/components/table/`

## 7. 开发协作（Spec 模式）

建议保持以下流程，减少返工：

1. 先更新/新增 spec 文档（明确范围与验收）。
2. 再改代码。
3. 执行门禁：

```bash
npm test
npm run test:regression
npm run build
```

4. 回填 `GAME_SPEC.md` 与 `日志.md`。

## 8. 常见问题（FAQ）

### Q1: 双击 `index.html` 白屏，控制台报 CORS（`file:///assets/...`）怎么办？

通常是打开了标准构建产物（`dist/index.html`），浏览器限制了 `file://` 下模块加载。  
建议：

1. 执行 `npm run build:inline`。
2. 打开 `dist-inline/index.html`。
3. 或改用 `npm run preview` / `npm run preview:inline` 通过 `http://` 访问。

### Q2: 改了代码但浏览器看起来没更新？

1. 使用 `npm run dev` 开发模式。
2. 强制刷新浏览器缓存（`Cmd/Ctrl + Shift + R`）。
3. 关闭旧标签页后重新打开本地地址。

### Q3: 部署后刷新页面 404？

当前使用 `Hash` 路由（URL 带 `#`），静态托管通常不会出现该问题。  
若未来改回 `History` 路由，需要服务器配置回退到 `index.html`。

### Q4: 标准包和内联包怎么选？

1. 线上部署、性能优先：`npm run build`（`dist/`）。
2. 离线教学、直接双击：`npm run build:inline`（`dist-inline/index.html`）。
