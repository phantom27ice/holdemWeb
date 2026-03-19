# Cocos 德州扑克复刻新手迁移手册

## 1. 文档目标

这份文档是给 Cocos 新手用的。

目标不是一次性把现有 Vue 德州扑克项目“全部重写成 Cocos”，而是把迁移过程拆成一条你能实际落地的路线：

1. 先把素材迁过去。
2. 先把项目结构搭好。
3. 先做最核心的牌桌场景。
4. 再逐步补操作区、动画、摊牌面板。
5. 最后再考虑大厅、联网、重连这些第二阶段内容。

如果你照着本文档做，第一阶段应该能完成一个“能显示 6 人桌、能显示手牌/公牌/底池、能点按钮推进演示流程”的 Cocos 版本基础骨架。

---

## 2. 这次迁移到底迁什么

基于当前仓库，真正要迁的核心内容是这几部分：

### 2.1 规则和类型

来源：

1. `src/game/engine/`
2. `src/game/types/index.ts`

这一层是德州扑克规则真值层，优先复用，不要急着重写。

### 2.2 牌桌表现

来源：

1. `src/components/table/TableScene.vue`
2. `src/components/table/SeatView.vue`
3. `src/components/table/BoardCards.vue`
4. `src/components/table/HoleCards.vue`
5. `src/components/table/PotBar.vue`
6. `src/components/table/ActionPanel.vue`
7. `src/components/table/ChipFlyLayer.vue`
8. `src/components/table/DealCardLayer.vue`
9. `src/components/table/ShowdownPanel.vue`

这一层要迁成 Cocos 的：

1. `scene`
2. `prefab`
3. `Component` 脚本

### 2.3 素材

来源：

1. `src/resources/pokers/**`
2. `src/resources/material/**`

这一层迁到 Cocos 的 `assets/resources/**`。

### 2.4 状态编排

来源：

1. `src/stores/tableStore.ts`
2. `src/game/mock/createMockTableState.ts`

注意：

1. 可以借鉴它的“状态推进思路”。
2. 不要把 Vue 的响应式写法原样搬进 Cocos。
3. Cocos 里要改成 `Controller + Presenter + ViewData` 的思路。

---

## 3. 新手先记住这 4 条原则

### 3.1 第一阶段不要做太多场景

只做两个场景就够了：

1. `Boot.scene`
2. `Table.scene`

`Lobby.scene` 放第二阶段。

### 3.2 第一阶段不要先做联网

先用本地 mock 数据把桌面跑起来，再做联机版。

原因：

1. 你现在是 Cocos 新手。
2. 如果 UI、节点、prefab 都还不熟，联网只会把问题放大。
3. 先做静态桌，再做动态桌，节奏更稳。

### 3.3 第一阶段不要过度拆脚本

不要一开始就搞十几层架构。第一版够用即可。

### 3.4 资源一旦导入 Cocos，就要尊重 `.meta`

这是 Cocos 非常重要的一点：

1. 资源导入后会生成 `.meta`。
2. 后续如果你随便在 Finder 里移动或改名，容易丢引用。
3. 已经导入的资源，尽量在 Cocos 编辑器里移动和改名。

---

## 4. 你应该创建什么样的 Cocos 项目

## 4.1 版本建议

建议使用 `Cocos Creator 3.x`。

如果你已经有现成的 Cocos 项目，先检查项目根目录的 `package.json` 里是否有：

```json
{
  "creator": {
    "version": "3.x.x"
  }
}
```

后续写脚本时，API 要和这个版本保持一致。

## 4.2 新建项目时怎么选

建议：

1. 新建 `2D` 项目。
2. 语言选 `TypeScript`。
3. 项目单独建一个新目录，不要直接在当前 Vue 工程里硬塞 Cocos 资源。

原因：

1. 你现在做的是牌桌 UI 和 2D 动画。
2. `TypeScript` 更适合后面迁移现有 `engine/types`。

---

## 5. 第一阶段的目标范围

第一阶段只要求做到下面这些：

1. 可以进入 `Boot.scene`。
2. 可以切到 `Table.scene`。
3. 可以看到 6 人桌布局。
4. 可以看到 6 个座位。
5. 可以显示 Hero 手牌。
6. 可以显示 5 张公牌槽位。
7. 可以显示底池。
8. 可以显示操作区按钮。
9. 可以用假数据或本地引擎数据刷新桌面。

第一阶段先不强求：

1. 大厅。
2. 联网。
3. 断线重连。
4. 完整对象池。
5. 复杂特效。

---

## 6. 推荐目录结构

建议你把 Cocos 项目控制在下面这个复杂度：

```text
assets/
├─ scenes/
│  ├─ Boot.scene
│  ├─ Table.scene
│  └─ Lobby.scene                  # 第二阶段再做
├─ prefabs/
│  ├─ table/
│  │  ├─ Seat.prefab
│  │  ├─ Card.prefab
│  │  ├─ PotBar.prefab
│  │  ├─ ActionPanel.prefab
│  │  └─ ShowdownPanel.prefab
│  ├─ effect/
│  │  ├─ DealCard.prefab
│  │  ├─ ChipFly.prefab
│  │  └─ Toast.prefab
│  └─ common/
├─ resources/
│  ├─ poker/
│  │  ├─ cards/
│  │  └─ back/
│  ├─ avatar/
│  ├─ chip/
│  └─ ui/
│     ├─ table/
│     ├─ seat-marker/
│     ├─ button/
│     └─ common/
└─ scripts/
   ├─ game/
   │  ├─ engine/
   │  └─ types/
   ├─ core/
   │  ├─ AssetCatalog.ts
   │  └─ constants.ts
   └─ table/
      ├─ TableSceneController.ts
      ├─ TableViewMapper.ts
      ├─ presenters/
      │  ├─ SeatPresenter.ts
      │  ├─ BoardPresenter.ts
      │  ├─ HeroHandPresenter.ts
      │  ├─ PotPresenter.ts
      │  ├─ ActionPanelPresenter.ts
      │  └─ ShowdownPresenter.ts
      └─ effects/
         └─ EffectDirector.ts
```

这个结构够你完成第一版，而且不算重。

---

## 7. 素材怎么迁移

这一节最重要，因为你现在最容易在资源导入阶段踩坑。

## 7.1 先明确素材来源

当前 Vue 项目里可复用的素材主要在：

```text
src/resources/pokers/
src/resources/material/
```

其中：

1. `pokers/` 是牌面和牌背。
2. `material/avatar/` 是头像。
3. `material/seat/` 是庄位标记。
4. `material/chip/` 和 `chipIcon.png` 是筹码相关。
5. `bg.png`、`bg_.png`、`border.png` 可以作为桌面 UI 参考素材。

## 7.2 推荐迁移映射

建议按下面方式放到 Cocos：

| Vue 目录 | Cocos 目录 |
| --- | --- |
| `src/resources/pokers/**` | `assets/resources/poker/cards/**` |
| `src/resources/pokers/back.png` | `assets/resources/poker/back/back.png` |
| `src/resources/material/avatar/**` | `assets/resources/avatar/**` |
| `src/resources/material/chip/**` | `assets/resources/chip/**` |
| `src/resources/material/seat/**` | `assets/resources/ui/seat-marker/**` |
| `src/resources/material/chipIcon.png` | `assets/resources/ui/common/chipIcon.png` |
| `src/resources/material/button.png` | `assets/resources/ui/button/button.png` |
| `src/resources/material/bg.png` | `assets/resources/ui/table/bg.png` |
| `src/resources/material/bg_.png` | `assets/resources/ui/table/bg_alt.png` |
| `src/resources/material/border.png` | `assets/resources/ui/table/border.png` |

## 7.3 新手操作步骤

### 第 1 步：先在 Cocos 项目里建空目录

在 `assets/` 下先建好这些文件夹：

```text
assets/resources/poker/cards
assets/resources/poker/back
assets/resources/avatar
assets/resources/chip
assets/resources/ui/seat-marker
assets/resources/ui/button
assets/resources/ui/common
assets/resources/ui/table
```

### 第 2 步：把图片拖进 Cocos 编辑器

建议操作：

1. 打开 Cocos Creator。
2. 在资源管理器里选中目标文件夹。
3. 把对应图片拖进去。

不建议：

1. 大量先在 Finder 里挪来挪去。
2. 导入后再频繁在系统文件夹中手改目录结构。

### 第 3 步：让 Cocos 自动生成 `.meta`

导入之后，Cocos 会自动生成 `.meta` 文件。

这一步不要删。

### 第 4 步：删掉无用文件

如果你看到 `.DS_Store`，可以删掉，不要导入到 Cocos 工程。

### 第 5 步：保持牌面文件名不要乱改

你当前牌面命名已经很适合映射：

```text
Spade_14.png
Heart_10.png
Club_2.png
```

这个命名后续非常方便做资源路径映射，所以不要改成中文名或别的格式。

---

## 8. 先迁哪些代码

不要一上来先写复杂 Cocos UI 脚本。先迁最稳定的代码。

## 8.1 第一批直接迁移

优先迁这些：

1. `src/game/engine/` -> `assets/scripts/game/engine/`
2. `src/game/types/index.ts` -> `assets/scripts/game/types/index.ts`

原因：

1. 规则层已经存在。
2. 这些代码和 Vue 组件耦合不深。
3. 它们是后续桌面表现的基础。

## 8.2 第二批重新整理，不要硬搬

这些文件不要原封不动照搬：

1. `src/stores/tableStore.ts`
2. `src/components/table/*.vue`

它们要被重组为：

1. `TableSceneController.ts`
2. `TableViewMapper.ts`
3. 各种 `Presenter.ts`

## 8.3 资源解析改成 Cocos 版

Vue 版的：

```ts
src/game/assets/resourceResolver.ts
```

在 Cocos 里建议变成一个简单的资源路径目录脚本，例如：

```ts
export const PokerAssetPath = {
  back: 'poker/back/back',
  card: (suit: string, rank: number) => `poker/cards/${suit}/${suit}_${rank}`,
}
```

注意：

1. `resources.load()` 的路径不要带文件扩展名。
2. 运行时动态加载的资源必须放在 `assets/resources/**` 下。

---

## 9. 场景应该先做哪些

结论很明确：

1. 先做 `Boot.scene`
2. 再做 `Table.scene`
3. 最后才做 `Lobby.scene`

## 9.1 Boot.scene

作用很简单：

1. 显示加载中。
2. 预加载常用资源。
3. 进入 `Table.scene`。

### 节点建议

```text
Canvas
└─ SafeArea
   ├─ Bg
   ├─ Logo
   ├─ ProgressBar
   └─ LoadingLabel
```

### 新手操作步骤

1. 新建场景：`Boot.scene`
2. 创建 `Canvas`
3. 在 `Canvas` 下创建 `SafeArea`
4. 再创建背景、标题、进度条、文案节点
5. 挂一个 `BootController.ts`
6. 在 `start()` 里做预加载，完成后切换到 `Table.scene`

Boot 场景不要放牌桌业务逻辑。

## 9.2 Table.scene

这是第一阶段最核心的场景。

你的大部分精力都应该花在这里。

### 目标

它要能承载：

1. 桌布
2. 6 个座位
3. 公牌区
4. Hero 手牌区
5. 底池区
6. 操作区
7. 特效层
8. 弹窗层

### 节点结构建议

```text
Canvas
└─ SafeArea
   ├─ Bg
   ├─ TableRoot
   │  ├─ TableShell
   │  ├─ PotLayer
   │  │  └─ PotBar
   │  ├─ BoardLayer
   │  │  └─ BoardSlots
   │  ├─ SeatLayer
   │  │  ├─ SeatAnchor_0
   │  │  ├─ SeatAnchor_1
   │  │  ├─ SeatAnchor_2
   │  │  ├─ SeatAnchor_3
   │  │  ├─ SeatAnchor_4
   │  │  └─ SeatAnchor_5
   │  ├─ HeroHandLayer
   │  ├─ PromptLayer
   │  │  ├─ TurnPrompt
   │  │  └─ ErrorTip
   │  ├─ EffectLayer
   │  │  ├─ DealEffectRoot
   │  │  ├─ ChipEffectRoot
   │  │  └─ ToastRoot
   │  └─ PopupLayer
   │     └─ ShowdownPanel
   └─ BottomUI
      └─ ActionPanel
```

### 为什么这样分层

因为这个分层和你现在 Vue 版结构基本对应：

1. `PotLayer` 对应 `PotBar.vue`
2. `BoardLayer` 对应 `BoardCards.vue`
3. `SeatLayer` 对应 `SeatView.vue`
4. `HeroHandLayer` 对应 `HoleCards.vue`
5. `EffectLayer` 对应 `DealCardLayer.vue` 和 `ChipFlyLayer.vue`
6. `PopupLayer` 对应 `ShowdownPanel.vue`
7. `BottomUI` 对应 `ActionPanel.vue`

## 9.3 Lobby.scene

这个场景放第二阶段。

第一阶段你可以完全不做。

如果以后要做，建议它只负责：

1. 看桌子列表
2. 选座进入桌子

不要把牌桌逻辑塞进大厅。

---

## 10. Table.scene 的具体制作顺序

这一节是最适合小白照着做的。

## 10.1 第一步：先摆静态桌面

先不要写逻辑。

先在 `Table.scene` 里做这些节点：

1. 背景
2. 桌布
3. 6 个座位锚点
4. 公牌区域
5. Hero 手牌区域
6. 底池区域
7. 操作区区域

此时验收标准只有一个：

“画面位置对了”

## 10.2 第二步：做 6 个座位锚点

在 `SeatLayer` 下放 6 个空节点：

1. `SeatAnchor_0`
2. `SeatAnchor_1`
3. `SeatAnchor_2`
4. `SeatAnchor_3`
5. `SeatAnchor_4`
6. `SeatAnchor_5`

这些空节点的作用是：

1. 决定座位布局位置
2. 给后面的 `Seat.prefab` 提供挂载点
3. 给筹码飞行、发牌动画提供目标点

新手建议：

1. 先手动摆位置。
2. 不要急着做自动布局算法。

## 10.3 第三步：先做公牌槽位

在 `BoardLayer` 下先放 5 个牌槽节点。

建议命名：

1. `BoardSlot_0`
2. `BoardSlot_1`
3. `BoardSlot_2`
4. `BoardSlot_3`
5. `BoardSlot_4`

先做空槽位背景，不着急上动画。

## 10.4 第四步：先做 Hero 手牌区

Hero 区域只要先支持：

1. 左手牌
2. 右手牌

后续再做发牌飞到这里。

## 10.5 第五步：做操作区

先做四个主按钮：

1. `Fold`
2. `Check/Call`
3. `Raise`
4. `All-in`

滑条和快捷加注按钮可以晚一点再补。

## 10.6 第六步：做弹窗层

先留一个 `ShowdownPanel` 的位置即可。

第一版先静态显示也没问题。

## 10.7 第七步：最后再做特效层

特效层包括：

1. 发牌飞行
2. 飞筹码
3. toast

这些都应该在牌桌内容上层，但不要挡住按钮交互。

---

## 11. 哪些内容适合封装成 Prefab

结论：重复出现、会复用、自己带逻辑的东西，才值得封成 Prefab。

## 11.1 必须做成 Prefab 的

### `Seat.prefab`

这是最重要的 prefab。

建议内部节点：

```text
Seat
├─ Badge
├─ Timer
├─ AvatarFrame
│  ├─ AvatarSprite
│  └─ RoleMarker
├─ NameLabel
├─ StackLabel
├─ BetLabel
└─ CardAnchor
```

它至少要支持：

1. 头像
2. 昵称
3. 筹码
4. 当前下注
5. `BTN/SB/BB` 标记
6. 当前行动高亮
7. 弃牌置灰
8. 全下状态
9. 行为提示
10. 倒计时

### `Card.prefab`

内部只需要：

```text
Card
└─ CardSprite
```

用途：

1. Hero 手牌
2. 公牌
3. 发牌飞行中的临时牌节点

### `ActionPanel.prefab`

建议内部节点：

```text
ActionPanel
├─ FoldButton
├─ CallButton
├─ RaiseButton
├─ AllInButton
├─ RaiseSlider
├─ RaiseInputLabel
└─ QuickRaiseGroup
```

### `PotBar.prefab`

建议内部节点：

```text
PotBar
├─ ChipIcon
└─ AmountLabel
```

### `ShowdownPanel.prefab`

建议内部节点：

```text
ShowdownPanel
├─ Title
├─ WinnerSummary
├─ RevealList
└─ PotList
```

## 11.2 建议做成 Prefab 的

1. `DealCard.prefab`
2. `ChipFly.prefab`
3. `Toast.prefab`
4. `BoardSlot.prefab`

## 11.3 第一阶段不建议做成 Prefab 的

1. 整个桌布背景
2. 整个 `Table.scene`
3. 单次使用的纯装饰节点

---

## 12. 脚本怎么安排，才不会太复杂

第一版你只需要理解 3 种脚本角色。

## 12.1 Controller

比如：

1. `TableSceneController.ts`

职责：

1. 拿到当前整桌数据
2. 调度各个 presenter 刷新 UI
3. 处理按钮点击后的统一出口
4. 决定什么时候播放动画

## 12.2 Presenter

比如：

1. `SeatPresenter.ts`
2. `BoardPresenter.ts`
3. `ActionPanelPresenter.ts`

职责：

1. 只更新某一块 UI
2. 不负责规则判定
3. 不负责整桌状态推进

## 12.3 Mapper

比如：

1. `TableViewMapper.ts`

职责：

1. 把 `HandState` 转成界面要显示的数据
2. 把规则层数据和表现层隔开

这个脚本在迁移时非常重要，因为它相当于 Vue 版 `createMockTableState.ts` 的 Cocos 版。

---

## 13. 推荐的开发顺序

这是最实际的一段。你照这个顺序做，最不容易乱。

## 13.1 里程碑 1：项目空壳搭起来

要做的事：

1. 新建 Cocos 项目
2. 创建目录
3. 导入资源
4. 创建 `Boot.scene`
5. 创建 `Table.scene`

验收标准：

1. 项目能打开
2. 资源能看到
3. 场景能切换

## 13.2 里程碑 2：桌面静态版

要做的事：

1. 摆好桌布
2. 摆好 6 个座位锚点
3. 摆好公牌槽位
4. 摆好 Hero 手牌区
5. 摆好底池和操作区

验收标准：

1. 桌面排版稳定
2. 手机和桌面比例不至于严重错位

## 13.3 里程碑 3：数据驱动版

要做的事：

1. 迁移 `engine`
2. 迁移 `types`
3. 写 `TableViewMapper.ts`
4. 用假数据刷新座位、公牌、底池、Hero 手牌

验收标准：

1. 数据变化时界面能正确变化
2. 不依赖手动改节点图片

## 13.4 里程碑 4：操作区可点击

要做的事：

1. 接按钮点击
2. 汇聚到统一动作出口
3. 刷新 UI 状态

验收标准：

1. 按钮能点
2. 合法动作状态能变化
3. 没有多个按钮各自乱改数据的问题

## 13.5 里程碑 5：再补动画

要做的事：

1. 发牌动画
2. 公牌翻开
3. 飞筹码
4. 摊牌弹窗

验收标准：

1. 桌面流程看起来连贯
2. 动画结束后 UI 状态正确

---

## 14. 给新手的详细操作步骤

这里按“真的开始做”的顺序写。

## 14.1 第 0 步：先准备一个单独的 Cocos 项目目录

建议不要直接把 Cocos 代码塞进当前 Vue 项目。

推荐做法：

1. 保留当前仓库作为“规则和 UI 参考来源”
2. 新建一个单独的 Cocos 工程
3. 迁移时按模块复制

## 14.2 第 1 步：创建基础目录

在 Cocos 项目里先建好：

1. `assets/scenes`
2. `assets/prefabs`
3. `assets/resources`
4. `assets/scripts`

这一步做完后，再开始导入东西。

## 14.3 第 2 步：迁素材

顺序建议：

1. 先迁牌面
2. 再迁头像
3. 再迁 seat marker
4. 最后迁桌布和按钮素材

原因：

1. 牌面和头像最早就会用到
2. 桌布和按钮可以后补

## 14.4 第 3 步：做 Boot.scene

只做加载页。

这一步的目标不是好看，而是保证项目启动流程稳定。

## 14.5 第 4 步：做 Table.scene 静态版

你先只摆空节点和底图，不写逻辑。

此时不要焦虑“为什么还不能玩”，因为你现在是在搭骨架。

## 14.6 第 5 步：做 Seat.prefab

先做一个座位 prefab，然后在场景里复用 6 次。

不要复制 6 份独立节点来手改。

## 14.7 第 6 步：做 Card.prefab

因为公牌、手牌、飞牌都会用到它。

## 14.8 第 7 步：把 engine 和 types 迁过去

这一步完成后，你的 Cocos 项目就开始有“真实德州规则基础”了。

## 14.9 第 8 步：写 TableViewMapper

把规则层数据转换成 UI 数据。

这一层做好以后，后面很多逻辑都会轻松很多。

## 14.10 第 9 步：写 TableSceneController

它负责：

1. 拿数据
2. 刷新 UI
3. 响应按钮点击

## 14.11 第 10 步：最后再写动画

先别一开始就做动画。

因为动画是“放大器”：

1. 如果数据没理顺，动画只会让 bug 更难查。
2. 如果节点结构没定下来，动画节点会反复返工。

---

## 15. 新手最容易踩的坑

## 15.1 把 Vue 组件思想直接硬搬到 Cocos

错误做法：

1. 一个脚本同时管规则、网络、UI、动画
2. 到处直接改节点状态
3. 把整桌数据散落在多个组件里

更稳的做法：

1. `Controller` 统一调度
2. `Presenter` 负责局部 UI
3. `Mapper` 负责数据转换

## 15.2 到处用 `find()`

错误做法：

1. 每次更新 UI 都写长长的节点查找链

更稳的做法：

1. 用 `@property` 在编辑器里直接绑引用

## 15.3 导入资源后又去系统文件夹乱改名

这会很容易把 `.meta` 和引用搞乱。

## 15.4 动态加载资源时带扩展名

例如：

```ts
resources.load('poker/cards/Spade/Spade_14.png')
```

这在 Cocos 里是不对的。

应该写成：

```ts
resources.load('poker/cards/Spade/Spade_14')
```

## 15.5 太早做大厅和联网

你现在更需要先把桌面基本盘做稳。

---

## 16. 第一阶段最小可交付版本

如果你只想先做一个“我能看到成果”的版本，那就以这个为目标：

1. `Boot.scene` 能进入 `Table.scene`
2. `Table.scene` 能显示 6 人桌
3. 座位、底池、公牌槽、Hero 手牌、操作区都在
4. 通过本地假数据可以刷新界面
5. 四个主按钮能点

只要这 5 点完成，你的 Cocos 版就已经不是空壳了。

---

## 17. 第一阶段完成后的下一步

当你完成第一阶段后，再按这个顺序进入第二阶段：

1. 补 `RaiseSlider` 和快捷加注按钮
2. 补发牌动画
3. 补飞筹码动画
4. 补摊牌面板
5. 再做 `Lobby.scene`
6. 最后再接 WebSocket 联机

---

## 18. 自检清单

每做完一个阶段，你都用这张表检查一次。

### 18.1 资源

1. 图片都在 `assets/resources/**` 下吗
2. 导入后 `.meta` 正常吗
3. 有没有误导入 `.DS_Store`

### 18.2 场景

1. `Boot.scene` 能正常进入吗
2. `Table.scene` 是不是主战场景
3. 节点层级是不是清楚

### 18.3 脚本

1. 是否优先用 `@property` 绑定引用
2. 是否避免了到处 `find()`
3. 是否把规则、UI、动画职责分开了

### 18.4 展示

1. 6 个座位位置是否稳定
2. Hero 手牌和公牌区是否清楚
3. 操作区是否没有挡住牌桌

### 18.5 流程

1. 是不是先完成静态桌，再做动态桌
2. 是不是先完成桌面，再做联网
3. 是不是先完成基础版，再做动画

---

## 19. 最后给你的建议

如果你是 Cocos 小白，最重要的不是“第一天就把整个德州游戏做完”，而是严格控制顺序。

你当前最合理的起步顺序只有这一条：

1. 新建 Cocos 项目
2. 导素材
3. 做 `Boot.scene`
4. 做 `Table.scene` 静态布局
5. 做 `Seat.prefab`
6. 迁 `engine/types`
7. 做 `TableViewMapper`
8. 做 `TableSceneController`
9. 最后补动画

只要你不跳步骤，这个迁移是完全能落地的。

