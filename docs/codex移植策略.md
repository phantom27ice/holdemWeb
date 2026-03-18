# 德州扑克 Web 项目移植到 Cocos Creator 的新手教学文档

这份文档不是泛泛的 Cocos 入门，而是基于你当前仓库里的实际内容来写：

1. Web 牌桌结构来源于 `src/components/table/*.vue`
2. 状态编排来源于 `src/stores/tableStore.ts`
3. 规则和事件来源于 `src/game/types/index.ts`
4. 未来 Cocos 的数据合同来源于 `cocosDesign/types/**`

目标是让你作为 Cocos 新手，也能按照步骤先把一个能跑的牌桌场景搭起来，再逐步把功能接上去。

---

## 1. 先建立正确认知

把 Web 项目移植到 Cocos 时，你要分清楚 4 件事：

1. 场景节点
   这是你在 Cocos 编辑器里手工搭出来的节点树，比如 `Canvas`、`TableRoot`、`SeatLayer`、`ActionPanelAnchor`。
2. Prefab
   这是可复用、可动态创建的界面块，比如座位、操作面板、摊牌面板、飞牌特效。
3. 业务数据类型
   这是 TypeScript 接口，比如 `TableSnapshot`、`SeatState`、`SeatViewData`、`ActionPanelState`。它们不是编辑器里拖拽配置的东西，而是代码里的“数据合同”。
4. 编辑器绑定
   这是 `@property(Node)`、`@property(Label)`、`@property(Prefab)` 这种字段。你需要把场景节点、组件、Prefab 拖给脚本。

很多新手最容易混淆第 3 和第 4 点。

要记住一句话：

`TypeScript interface` 负责约束数据长什么样，`@property` 负责告诉脚本“场景里的哪个节点归你管”。

---

## 2. 当前 Web 项目到 Cocos 的映射关系

你现在的 Web 版核心结构已经很清楚了，可以直接映射：

| Web 文件 | 在 Cocos 里对应什么 |
| --- | --- |
| `src/components/table/TableScene.vue` | `TableScene.scene` + `TableSceneController.ts` |
| `src/components/table/TableShell.vue` | 场景里的固定桌面底图节点 |
| `src/components/table/SeatView.vue` | `SeatPrefab.prefab` + `SeatPresenter.ts` |
| `src/components/table/BoardCards.vue` | `BoardPresenter.ts` |
| `src/components/table/HoleCards.vue` | `HeroHandPresenter.ts` |
| `src/components/table/PotBar.vue` | `PotBarPrefab.prefab` 或场景固定节点 |
| `src/components/table/ActionPanel.vue` | `ActionPanelPrefab.prefab` + `ActionPanelPresenter.ts` |
| `src/components/table/ShowdownPanel.vue` | `ShowdownPanelPrefab.prefab` + `ShowdownPanelPresenter.ts` |
| `src/components/table/DealCardLayer.vue` | `AnimationDirector.ts` + `DealCardFxPrefab.prefab` |
| `src/components/table/ChipFlyLayer.vue` | `AnimationDirector.ts` + `ChipFlyFxPrefab.prefab` |
| `src/stores/tableStore.ts` | `TableStateStore.ts` + `TableSceneController.ts` |
| `src/game/mock/createMockTableState.ts` | `TableSnapshotAdapter.ts` + 调试用 mock 数据 |
| `cocosDesign/types/**` | `assets/scripts/types/**` 或 `assets/scripts/shared/**` |

结论很简单：

1. Web 里的“组件”大多会变成 Cocos 的 `Prefab + Presenter`
2. Web 里的“store”会变成 Cocos 的 `Store + Controller`
3. Web 里的“计算 view model”会变成 Cocos 的 `Adapter`

---

## 3. 推荐的 Cocos 项目目录

如果你准备新建一个 Cocos Creator 3.x 项目，建议一开始就这样组织：

```text
assets/
├─ scenes/
│  └─ TableScene.scene
├─ prefabs/
│  ├─ table/
│  │  ├─ SeatPrefab.prefab
│  │  ├─ ActionPanelPrefab.prefab
│  │  ├─ ShowdownPanelPrefab.prefab
│  │  └─ PotItemPrefab.prefab
│  ├─ card/
│  │  └─ CardSlotPrefab.prefab
│  └─ effect/
│     ├─ DealCardFxPrefab.prefab
│     └─ ChipFlyFxPrefab.prefab
├─ resources/
│  ├─ pokers/
│  ├─ material/
│  ├─ avatar/
│  └─ mock/
│     └─ table-snapshot.json
└─ scripts/
   ├─ types/
   │  ├─ model/
   │  ├─ protocol/
   │  ├─ ui-model/
   │  ├─ config/
   │  └─ index.ts
   ├─ common/
   │  ├─ CardSpriteResolver.ts
   │  └─ NumberFormatter.ts
   ├─ table/
   │  ├─ state/
   │  │  └─ TableStateStore.ts
   │  ├─ adapters/
   │  │  ├─ TableSnapshotAdapter.ts
   │  │  └─ LegalActionAdapter.ts
   │  ├─ presenters/
   │  │  ├─ SeatPresenter.ts
   │  │  ├─ BoardPresenter.ts
   │  │  ├─ HeroHandPresenter.ts
   │  │  ├─ ActionPanelPresenter.ts
   │  │  ├─ ShowdownPanelPresenter.ts
   │  │  └─ PotPresenter.ts
   │  ├─ animation/
   │  │  └─ AnimationDirector.ts
   │  ├─ network/
   │  │  └─ TableGateway.ts
   │  └─ controllers/
   │     └─ TableSceneController.ts
   └─ debug/
      └─ MockTableSnapshot.ts
```

你仓库里的 `cocosDesign/types/**`，建议直接迁到未来 Cocos 工程的 `assets/scripts/types/**`。

原因很直接：

1. 这些类型已经比 `src/game/types/index.ts` 更适合联网版
2. 它们已经拆成了 `model/protocol/ui-model/config`
3. 以后 `store`、`network`、`adapter`、`presenter` 都会依赖它们

---

## 4. 一个新手最容易成功的开发顺序

不要一上来就接 WebSocket。

正确顺序是：

1. 先用 Cocos 编辑器把静态场景搭出来
2. 再把 `SeatPrefab`、`ActionPanelPrefab` 这些能看见的东西做出来
3. 再用本地 mock `TableSnapshot` 驱动画面
4. 再接按钮动作出口 `sendAction(actionType, amountTo?)`
5. 最后再接网络和动画事件

如果你跳过前 3 步，直接接网络，最后你会同时卡在：

1. 场景没搭好
2. 节点没绑好
3. 数据没适配好
4. 协议也没测明白

---

## 5. `TableScene` 场景应该有哪些节点

下面是我建议你第一版直接照着搭的节点树。

```text
Canvas
├─ SafeArea
│  ├─ Background
│  ├─ TableRoot
│  │  ├─ TableShell
│  │  │  ├─ Felt
│  │  │  │  ├─ CenterLayer
│  │  │  │  │  ├─ PotAnchor
│  │  │  │  │  ├─ BoardAnchor
│  │  │  │  │  └─ TurnPromptLabel
│  │  │  │  ├─ SeatLayer
│  │  │  │  ├─ HeroLayer
│  │  │  │  │  ├─ HeroSeatAnchor
│  │  │  │  │  └─ HeroHandAnchor
│  │  │  │  ├─ EffectLayer
│  │  │  │  │  ├─ DealFxLayer
│  │  │  │  │  └─ ChipFxLayer
│  │  │  │  └─ OverlayLayer
│  │  │  │     ├─ ShowdownAnchor
│  │  │  │     └─ ToastAnchor
│  └─ HUD
│     ├─ ActionPanelAnchor
│     └─ ErrorTipLabel
```

### 5.1 这些节点为什么放在场景里

这些节点建议保留在场景里，而不是做成 Prefab：

1. `Canvas`
2. `SafeArea`
3. `Background`
4. `TableRoot`
5. `TableShell`
6. `Felt`
7. `SeatLayer`
8. `HeroLayer`
9. `EffectLayer`
10. `OverlayLayer`
11. `HUD`

原因是这些东西：

1. 每个桌面场景只会有一份
2. 布局和层级是固定的
3. 它们更多是“容器”而不是“可复用部件”

### 5.2 这些节点更适合做成 Prefab

第一版建议做成 Prefab 的有：

1. `SeatPrefab`
2. `ActionPanelPrefab`
3. `ShowdownPanelPrefab`
4. `DealCardFxPrefab`
5. `ChipFlyFxPrefab`

可以选做成 Prefab 的有：

1. `CardSlotPrefab`
2. `PotItemPrefab`
3. `ToastPrefab`

如果你是新手，我建议优先把下面 5 个做出来：

1. `SeatPrefab`
2. `ActionPanelPrefab`
3. `ShowdownPanelPrefab`
4. `DealCardFxPrefab`
5. `ChipFlyFxPrefab`

这 5 个是最有复用价值的。

---

## 6. 每个 Prefab 该怎么搭

## 6.1 `SeatPrefab`

这是最关键的 Prefab，因为它会被多次实例化。

建议节点树：

```text
SeatPrefab
├─ ActionBadge
├─ TurnTimer
├─ AvatarFrame
│  ├─ AvatarSprite
│  └─ RoleIcon
├─ MetaPanel
│  ├─ NameLabel
│  ├─ StackLabel
│  └─ BetLabel
└─ CardsAnchor
   ├─ Card_0
   └─ Card_1
```

对应你现在的 Web `SeatView.vue`：

1. `ActionBadge` 对应顶部行为提示
2. `TurnTimer` 对应倒计时
3. `AvatarSprite` 对应头像
4. `RoleIcon` 对应 `BTN/SB/BB`
5. `MetaPanel` 对应昵称、筹码、下注额
6. `CardsAnchor` 对应旁边的两张牌

### 什么时候更新 `SeatPrefab`

`SeatPresenter.render(data: SeatViewData)` 被调用时更新：

1. 昵称
2. 筹码
3. 当前下注
4. 是否高亮行动位
5. 是否弃牌
6. 是否全下
7. 倒计时
8. 徽标文字
9. 两张牌的朝向和牌面

## 6.2 `ActionPanelPrefab`

建议节点树：

```text
ActionPanelPrefab
├─ FoldButton
├─ CallCheckButton
├─ RaiseButton
├─ AllInButton
├─ RaiseSlider
├─ RaiseValueLabel
└─ QuickRaiseRow
   ├─ QuickRaiseBtn_0
   ├─ QuickRaiseBtn_1
   ├─ QuickRaiseBtn_2
   └─ QuickRaiseBtn_3
```

它直接消费 `ActionPanelState`，不要自己判断规则合法性。

它只做 3 件事：

1. 显示按钮状态
2. 显示滑条范围
3. 把用户点击汇总成统一回调

## 6.3 `ShowdownPanelPrefab`

建议节点树：

```text
ShowdownPanelPrefab
├─ TitleLabel
├─ WinnerSummaryLabel
├─ RevealList
└─ PotList
```

它类似 Web 版 `ShowdownPanel.vue`，是一个覆盖层 UI，不要把它塞进座位节点里。

## 6.4 特效 Prefab

### `DealCardFxPrefab`

建议包含：

1. 一张卡背 Sprite
2. 一张正面 Sprite
3. 可选翻牌节点

### `ChipFlyFxPrefab`

建议包含：

1. 筹码图标 Sprite
2. 金额 Label

这两个 Prefab 都应该由 `AnimationDirector` 动态生成和回收，最好后面加对象池。

---

## 7. 先做“静态桌子”，再做“动态桌子”

你第一次进入 Cocos 编辑器时，不要想着一口气实现全部逻辑。

正确步骤如下。

### 第一步：把桌子背景搭出来

先把这些做好：

1. `Canvas`
2. `Background`
3. `TableShell`
4. `BoardAnchor`
5. `PotAnchor`
6. `ActionPanelAnchor`

只要画面上能看到桌子轮廓和操作区，说明场景框架已经通了。

### 第二步：手工摆 6 个座位锚点

在 `SeatLayer` 下先临时放 6 个空节点：

1. `SeatAnchor_0`
2. `SeatAnchor_1`
3. `SeatAnchor_2`
4. `SeatAnchor_3`
5. `SeatAnchor_4`
6. `SeatAnchor_5`

然后把它们摆到桌边。

等你后面接入 `seat-layout.ts` 后，再改成代码动态定位。

### 第三步：实例化 `SeatPrefab`

现在不要先做复杂逻辑，只要做到：

1. `SeatPrefab` 能被实例化
2. 能挂到 `SeatAnchor_x`
3. 能显示昵称、头像、筹码

### 第四步：做 Hero 手牌区

在 `HeroLayer/HeroHandAnchor` 下先放两张卡牌节点。

先不用飞牌动画，只要能显示 Hero 两张手牌就行。

### 第五步：做 ActionPanel

先让按钮显示出来，并能打印日志：

1. Fold
2. Check/Call
3. Raise
4. All-in

此时先不要连服务端，也不要做合法动作校验。

---

## 8. 哪些功能应该拆成脚本，哪些不要混在一起

这一段非常关键。

未来 Cocos 项目里，不要让一个脚本同时负责：

1. 管网络
2. 管规则
3. 管场景节点
4. 管动画

推荐拆成下面几类脚本。

## 8.1 `TableStateStore.ts`

职责：

1. 保存最新的 `TableSnapshot`
2. 保存事件队列
3. 保存连接状态
4. 保存最后一个错误
5. 提供订阅接口

它不该做：

1. 不直接改 Label
2. 不直接实例化节点
3. 不直接发动画

## 8.2 `TableSnapshotAdapter.ts`

职责：

1. 把 `TableSnapshot` 转成 `TableViewData`
2. 把 `SeatState` 转成 `SeatViewData`
3. 把 `self.legalActions` 转成 `ActionPanelState`

它非常像当前 Web 项目里的 `createMockTableState.ts`。

## 8.3 `TableSceneController.ts`

职责：

1. 拿到场景节点引用
2. 监听 `TableStateStore`
3. 调用 Adapter
4. 把结果分发给各个 Presenter
5. 把按钮动作统一发给 `sendAction`

它相当于 Cocos 里的总编排器。

## 8.4 `SeatPresenter.ts`

职责：

1. 只更新一个座位 Prefab 的显示
2. 不碰网络
3. 不判断规则

## 8.5 `AnimationDirector.ts`

职责：

1. 消费 `TableEvent`
2. 顺序播放飞牌、翻牌、飞筹码、派奖
3. 动画期间锁输入

它不应该直接保存业务真值。

## 8.6 `TableGateway.ts`

职责：

1. 连接 WebSocket
2. 收发协议
3. 把 `table.snapshot`、`table.event` 推给 Store

它不应该直接改 UI。

---

## 9. 你设计好的数据类型，到底应该怎么“配置”

这里最容易被误解，所以单独讲。

## 9.1 类型文件本身不是拖拽配置

像这些：

1. `TableSnapshot`
2. `SeatState`
3. `TableEvent`
4. `SeatViewData`
5. `ActionPanelState`

它们都只是 TypeScript 类型定义。

你不能在 Cocos Inspector 里直接“配置一个 TableSnapshot 接口”。

它们真正的用法是：

1. 限制网络数据结构
2. 限制本地 mock 数据结构
3. 限制 Adapter 输出结构
4. 帮你减少字段写错

## 9.2 真正需要“配置”的有 3 类东西

### A. 常量配置

比如：

1. `table-config.ts`
2. `seat-layout.ts`

这是代码配置，直接写在 TS 文件里。

### B. 调试数据

比如：

1. `table-snapshot.json`
2. `mock-events.json`

这是资源配置，建议放在 `assets/resources/mock/`

### C. 编辑器节点引用

比如：

1. `seatPrefab`
2. `actionPanelPrefab`
3. `seatLayer`
4. `heroHandAnchor`
5. `showdownAnchor`

这是 Inspector 里拖拽配置。

所以“类型如何配置”的正确答案是：

1. 类型本身放代码目录
2. 具体数据放 JSON 或网络消息
3. 具体节点引用用 `@property` 拖拽

---

## 10. 建议你直接复用的类型目录

你现在仓库里已经有：

```text
cocosDesign/types/
├─ model/
├─ protocol/
├─ ui-model/
└─ config/
```

这套结构本身就适合未来 Cocos 项目。

建议迁移后保持：

```text
assets/scripts/types/
├─ model/
├─ protocol/
├─ ui-model/
└─ config/
```

其中每层职责如下。

### `model`

放业务真值和协议共享领域对象：

1. `Card`
2. `TableInfo`
3. `SeatState`
4. `SelfState`
5. `TableSnapshot`
6. `LegalAction`
7. `TableEvent`

### `protocol`

放 HTTP/WebSocket 的封包结构：

1. `GuestLoginRequest`
2. `GetTablesResponse`
3. `ServerWsMessage`
4. `ClientWsMessage`

### `ui-model`

放 Presenter 直接消费的展示数据：

1. `SeatViewData`
2. `TableViewData`
3. `ActionPanelState`

### `config`

放代码常量和布局算法：

1. `seat-layout.ts`
2. `table-config.ts`

---

## 11. 一个最适合新手的最小运行链路

先不要联网，先把下面这条链跑通：

`JsonAsset -> TableSnapshot -> TableStateStore -> TableSnapshotAdapter -> Presenter -> 屏幕`

只要这条链通了，后面把 `JsonAsset` 换成 WebSocket 消息就行。

---

## 12. 用 `JsonAsset` 喂给场景的做法

建议你在 Cocos 项目里新建：

`assets/resources/mock/table-snapshot.json`

内容可以先类似这样：

```json
{
  "tableId": "debug-table-1",
  "handId": 1,
  "phase": "BETTING_PRE_FLOP",
  "street": "PRE_FLOP",
  "dealerSeat": 0,
  "sbSeat": 1,
  "bbSeat": 2,
  "toActSeat": 0,
  "potTotal": 150,
  "board": [],
  "pots": [
    { "potId": "main", "amount": 150 }
  ],
  "seats": [
    {
      "seatNo": 0,
      "userId": "u0",
      "nickname": "You",
      "avatarUrl": "",
      "stack": 1900,
      "currentBet": 0,
      "totalBet": 100,
      "isSeated": true,
      "isInHand": true,
      "hasFolded": false,
      "isAllIn": false,
      "role": "BTN",
      "status": "ACTING"
    },
    {
      "seatNo": 1,
      "userId": "u1",
      "nickname": "AI 1",
      "avatarUrl": "",
      "stack": 1950,
      "currentBet": 50,
      "totalBet": 50,
      "isSeated": true,
      "isInHand": true,
      "hasFolded": false,
      "isAllIn": false,
      "role": "SB",
      "status": "WAITING"
    },
    {
      "seatNo": 2,
      "userId": "u2",
      "nickname": "AI 2",
      "avatarUrl": "",
      "stack": 1900,
      "currentBet": 100,
      "totalBet": 100,
      "isSeated": true,
      "isInHand": true,
      "hasFolded": false,
      "isAllIn": false,
      "role": "BB",
      "status": "WAITING"
    }
  ],
  "version": 1,
  "self": {
    "seatNo": 0,
    "holeCards": [
      { "suit": "Spade", "rank": 14, "code": "SA" },
      { "suit": "Heart", "rank": 13, "code": "HK" }
    ],
    "legalActions": [
      { "type": "FOLD" },
      { "type": "CALL", "toCall": 100 },
      { "type": "RAISE", "minAmountTo": 300, "maxAmountTo": 1900 },
      { "type": "ALL_IN", "maxAmountTo": 1900 }
    ]
  }
}
```

这份 JSON 的意义不是“最终协议”，而是让你先把画面跑起来。

---

## 13. `TableStateStore.ts` 最小骨架

```ts
import type { TableEvent, TableSnapshot } from '../../types'

type Listener = () => void

export class TableStateStore {
  private snapshot: TableSnapshot | null = null
  private pendingEvents: TableEvent[] = []
  private listeners = new Set<Listener>()

  public getSnapshot(): TableSnapshot | null {
    return this.snapshot
  }

  public getPendingEvents(): TableEvent[] {
    return [...this.pendingEvents]
  }

  public setSnapshot(snapshot: TableSnapshot): void {
    this.snapshot = snapshot
    this.emit()
  }

  public pushEvent(event: TableEvent): void {
    this.pendingEvents.push(event)
    this.emit()
  }

  public consumeEvents(): TableEvent[] {
    const batch = [...this.pendingEvents]
    this.pendingEvents.length = 0
    return batch
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}
```

这个类对应 Web 版 `tableStore.ts` 的简化版。

区别是：

1. Web 版现在自己推进牌局
2. Cocos 联网版未来只保存服务端快照和事件

---

## 14. `TableSnapshotAdapter.ts` 最小骨架

这个文件非常重要，它相当于 Web 版的 `createMockTableState.ts`。

```ts
import type {
  ActionPanelState,
  CardViewData,
  SeatViewData,
  TableSnapshot,
  TableViewData,
} from '../../types'

export class TableSnapshotAdapter {
  public toTableView(snapshot: TableSnapshot): TableViewData {
    return {
      tableId: snapshot.tableId,
      phase: snapshot.phase,
      street: snapshot.street,
      version: snapshot.version,
      totalPotText: `${snapshot.potTotal}`,
      board: this.toBoardView(snapshot),
      pots: snapshot.pots.map((pot, index) => ({
        potId: pot.potId,
        amountText: `${pot.amount}`,
        isMain: index === 0,
      })),
      seats: snapshot.seats.map((seat, index) => this.toSeatView(snapshot, seat, index)),
      heroSeatNo: snapshot.self?.seatNo,
      actionDeadlineAt: snapshot.actionDeadlineAt,
    }
  }

  public toActionPanelState(snapshot: TableSnapshot): ActionPanelState {
    const legal = snapshot.self?.legalActions ?? []
    const call = legal.find((item) => item.type === 'CALL')
    const check = legal.find((item) => item.type === 'CHECK')
    const raise = legal.find((item) => item.type === 'RAISE' || item.type === 'BET')
    const allIn = legal.find((item) => item.type === 'ALL_IN')

    return {
      isVisible: Boolean(snapshot.self),
      isLocked: snapshot.toActSeat !== snapshot.self?.seatNo,
      foldButton: {
        type: 'FOLD',
        label: '弃牌',
        disabled: !legal.some((item) => item.type === 'FOLD'),
      },
      callOrCheckButton: {
        type: check ? 'CHECK' : 'CALL',
        label: check ? '过牌' : `跟注 ${call?.toCall ?? 0}`,
        disabled: !check && !call,
      },
      raiseButton: {
        type: raise?.type ?? 'RAISE',
        label: raise ? `加注到 ${raise.minAmountTo ?? 0}` : '加注',
        disabled: !raise,
      },
      allInButton: {
        type: 'ALL_IN',
        label: `全下 ${allIn?.maxAmountTo ?? 0}`,
        disabled: !allIn,
      },
      raiseSlider: raise
        ? {
            minAmountTo: raise.minAmountTo ?? 0,
            maxAmountTo: raise.maxAmountTo ?? 0,
            selectedAmountTo: raise.minAmountTo ?? 0,
            quickOptions: [],
          }
        : undefined,
    }
  }

  private toBoardView(snapshot: TableSnapshot): CardViewData[] {
    const board = snapshot.board.map((card) => ({
      card,
      isFaceUp: true,
      isPlaceholder: false,
    }))

    while (board.length < 5) {
      board.push({
        isFaceUp: false,
        isPlaceholder: true,
      })
    }

    return board
  }

  private toSeatView(snapshot: TableSnapshot, seat: TableSnapshot['seats'][number], index: number): SeatViewData {
    const isHero = seat.seatNo === snapshot.self?.seatNo

    return {
      seatNo: seat.seatNo,
      displaySeatIndex: index,
      nickname: seat.nickname ?? `Seat ${seat.seatNo}`,
      avatarUrl: seat.avatarUrl,
      stackText: `${seat.stack}`,
      currentBetText: seat.currentBet > 0 ? `${seat.currentBet}` : undefined,
      role: seat.role,
      status: seat.status,
      isOccupied: seat.isSeated,
      isHero,
      isActive: snapshot.toActSeat === seat.seatNo,
      isFolded: seat.hasFolded,
      isAllIn: seat.isAllIn,
      countdownSeconds: null,
      cards: this.createSeatCards(snapshot, seat, isHero),
    }
  }

  private createSeatCards(snapshot: TableSnapshot, seat: TableSnapshot['seats'][number], isHero: boolean): CardViewData[] {
    if (isHero) {
      return (snapshot.self?.holeCards ?? []).map((card) => ({
        card,
        isFaceUp: true,
      }))
    }

    if (!seat.isInHand) {
      return []
    }

    return [
      { isFaceUp: false },
      { isFaceUp: false },
    ]
  }
}
```

你可以先不把它写得很完整，但一定要保留“适配层”这个概念。

---

## 15. `SeatPresenter.ts` 最小骨架

```ts
import { _decorator, Component, Label, Node, Sprite } from 'cc'
import type { SeatViewData } from '../../types'

const { ccclass, property } = _decorator

@ccclass('SeatPresenter')
export class SeatPresenter extends Component {
  @property(Label)
  public nameLabel: Label | null = null

  @property(Label)
  public stackLabel: Label | null = null

  @property(Label)
  public betLabel: Label | null = null

  @property(Label)
  public badgeLabel: Label | null = null

  @property(Label)
  public timerLabel: Label | null = null

  @property(Sprite)
  public avatarSprite: Sprite | null = null

  @property(Sprite)
  public roleSprite: Sprite | null = null

  @property([Sprite])
  public cardSprites: Sprite[] = []

  public render(data: SeatViewData): void {
    if (this.nameLabel) {
      this.nameLabel.string = data.nickname
    }

    if (this.stackLabel) {
      this.stackLabel.string = data.stackText
    }

    if (this.betLabel) {
      this.betLabel.string = data.currentBetText ?? ''
      this.betLabel.node.active = Boolean(data.currentBetText)
    }

    if (this.badgeLabel) {
      this.badgeLabel.string = data.badge?.text ?? ''
      this.badgeLabel.node.active = Boolean(data.badge?.text)
    }

    if (this.timerLabel) {
      this.timerLabel.string = data.countdownSeconds != null ? `${data.countdownSeconds}s` : ''
      this.timerLabel.node.active = data.countdownSeconds != null
    }

    this.node.opacity = data.isFolded ? 140 : 255
  }
}
```

第一版只要先把文字和显隐更新好，已经足够。

头像远程加载、角色图标切换、卡牌贴图切换，都可以后面再补。

---

## 16. `TableSceneController.ts` 最小骨架

这个脚本建议挂在 `Canvas` 或 `TableRoot` 上。

```ts
import { _decorator, Component, instantiate, JsonAsset, Node, Prefab } from 'cc'
import type { TableSnapshot } from '../../types'
import { TableStateStore } from '../state/TableStateStore'
import { TableSnapshotAdapter } from '../adapters/TableSnapshotAdapter'
import { SeatPresenter } from '../presenters/SeatPresenter'

const { ccclass, property } = _decorator

@ccclass('TableSceneController')
export class TableSceneController extends Component {
  @property(Prefab)
  public seatPrefab: Prefab | null = null

  @property(Node)
  public seatLayer: Node | null = null

  @property(JsonAsset)
  public debugSnapshot: JsonAsset | null = null

  private readonly store = new TableStateStore()
  private readonly adapter = new TableSnapshotAdapter()
  private seatPresenters = new Map<number, SeatPresenter>()

  protected onLoad(): void {
    this.store.subscribe(() => this.render())
  }

  protected start(): void {
    const snapshot = this.debugSnapshot?.json as TableSnapshot | undefined
    if (snapshot) {
      this.store.setSnapshot(snapshot)
    }
  }

  private render(): void {
    const snapshot = this.store.getSnapshot()
    if (!snapshot) {
      return
    }

    const tableView = this.adapter.toTableView(snapshot)

    for (const seat of tableView.seats) {
      let presenter = this.seatPresenters.get(seat.seatNo)
      if (!presenter) {
        presenter = this.createSeat(seat.seatNo)
      }
      presenter?.render(seat)
    }
  }

  private createSeat(seatNo: number): SeatPresenter | null {
    if (!this.seatPrefab || !this.seatLayer) {
      return null
    }

    const seatNode = instantiate(this.seatPrefab)
    seatNode.name = `Seat_${seatNo}`
    this.seatLayer.addChild(seatNode)

    const presenter = seatNode.getComponent(SeatPresenter)
    if (presenter) {
      this.seatPresenters.set(seatNo, presenter)
    }
    return presenter
  }
}
```

这段代码最重要的价值，不是功能多，而是把主链路建立起来：

1. Inspector 拖拽配置
2. 加载 mock 数据
3. Store 保存数据
4. Adapter 转 ViewModel
5. Presenter 更新 UI

---

## 17. 资源怎么配，不要把资源路径塞进协议

这一点你现在的数据设计方向是对的。

`Card`、`SeatState`、`TableSnapshot` 这类协议数据里，不要放：

1. 本地图片路径
2. SpriteFrame UUID
3. Cocos 节点名

协议里只保留语义值，比如：

1. `card.suit`
2. `card.rank`
3. `role`
4. `avatarUrl`

然后在客户端做一层资源解析，比如：

```ts
export function getPokerCardPath(suit: string, rank: number): string {
  return `pokers/${suit}/${suit}_${rank}/spriteFrame`
}
```

这就对应你现在 Web 项目里的 `src/game/assets/resourceResolver.ts` 思路。

联网版也应该保留这个原则：

协议只描述牌是什么，不描述图片放在哪。

---

## 18. `seat-layout.ts` 应该怎么用

你现在的 `cocosDesign/types/config/seat-layout.ts` 很适合直接复用。

正确用法不是把 10 个座位写死在场景里，而是：

1. 场景里保留一个 `SeatLayer`
2. `TableSceneController` 根据当前桌子人数取 `TABLE_LAYOUT_BY_PLAYER_COUNT`
3. 动态给每个 `SeatPrefab` 计算位置

这样以后从 6 人桌扩到 9 人桌，不用重搭场景。

你可以这样理解：

1. `seatNo` 是逻辑座位号
2. `displaySeatIndex` 是屏幕显示顺序
3. `SeatLayoutConfig` 决定座位在桌面上的锚点

第一阶段先支持“逻辑 seatNo 和显示顺序一样”，已经够用。

等后面做 Hero 永远在下方时，再加座位重排逻辑。

---

## 19. Hero 手牌为什么建议单独做一层

当前 Web 项目里，Hero 区域是：

1. 一个 `SeatView`
2. 再额外挂一个 `HoleCards`

这个结构迁到 Cocos 也很合理。

不要把 Hero 手牌直接硬塞进 `SeatPrefab` 的主布局里，原因是：

1. Hero 手牌通常更大
2. Hero 手牌位置与其他玩家不同
3. 后续翻牌、亮牌、交互会更多

所以推荐：

1. 所有人共用 `SeatPrefab`
2. Hero 额外有 `HeroHandPresenter`

---

## 20. 操作按钮应该怎么写，才不会越写越乱

必须统一成一个出口：

```ts
sendAction(actionType: ActionType, amountTo?: number): void
```

也就是说：

1. Fold 按钮最后走 `sendAction('FOLD')`
2. Check 按钮最后走 `sendAction('CHECK')`
3. Call 按钮最后走 `sendAction('CALL')`
4. Raise 按钮最后走 `sendAction('RAISE', raiseTo)`
5. All-in 按钮最后走 `sendAction('ALL_IN')`

不要在每个按钮里各自拼协议。

否则后面你一旦改了请求结构，4 个按钮都要改。

---

## 21. 动画层怎么接，才不会和状态层打架

动画层要消费事件，不要消费“裸节点操作指令”。

推荐流程：

1. `TableGateway` 收到 `table.event`
2. `TableStateStore` 保存事件
3. `TableSceneController` 取出事件批次
4. `AnimationDirector` 依次播放

例如：

1. `CARDS_DEALT` -> 播底牌飞行动画
2. `BOARD_DEALT` -> 播公共牌动画
3. `ACTION_APPLIED` -> 播飞筹码动画
4. `POT_AWARDED` -> 播派奖动画
5. `SHOWDOWN_REVEAL` -> 打开摊牌面板

这和你当前 Web 项目 `TableScene.vue` 里根据 `GameEvent` 驱动反馈的思路是一致的，只是 Cocos 里要拆成单独类。

---

## 22. 第一阶段你不需要做的事情

为了避免新手把项目做炸，第一阶段先不要做这些：

1. 不要把本地规则引擎直接搬进 Cocos UI
2. 不要一开始就做 2-10 人桌全部布局
3. 不要一开始就做断线重连
4. 不要一开始就做对象池优化
5. 不要一开始就做复杂 UI 动画
6. 不要把网络层写进 Presenter

第一阶段只要做到：

1. 能进桌面场景
2. 能看到桌子、座位、公牌、Hero 手牌、操作区
3. 能用 mock 数据刷新画面
4. 能点击按钮并统一输出 action

这就已经是非常正确的里程碑了。

---

## 23. 建议你分三期完成

## 第一期：本地静态版

目标：

1. 场景节点全部搭好
2. `SeatPrefab`、`ActionPanelPrefab`、`ShowdownPanelPrefab` 都能显示
3. `JsonAsset` 驱动 UI

## 第二期：本地动态版

目标：

1. 接 `TableStateStore`
2. 接 `TableSnapshotAdapter`
3. 接 `AnimationDirector`
4. 按事件播放飞牌和飞筹码

## 第三期：联网版

目标：

1. 接 HTTP 登录和入桌
2. 接 WebSocket 订阅
3. 收到 `table.snapshot` 刷新画面
4. 收到 `table.event` 播动画
5. 点击按钮发送 `table.action`

---

## 24. 你现在最应该先做的落地动作

如果你马上开工，我建议按下面顺序。

1. 新建一个 Cocos Creator 3.x 项目
2. 建好 `assets/scenes`、`assets/prefabs`、`assets/resources`、`assets/scripts`
3. 把当前仓库的 `src/resources/**` 搬到未来 Cocos 项目的 `assets/resources/**`
4. 把 `cocosDesign/types/**` 搬到 `assets/scripts/types/**`
5. 搭 `TableScene.scene` 的节点树
6. 做 `SeatPrefab`
7. 做 `ActionPanelPrefab`
8. 新建 `table-snapshot.json`
9. 写 `TableStateStore.ts`
10. 写 `TableSnapshotAdapter.ts`
11. 写 `TableSceneController.ts`
12. 先让静态桌子跑起来

---

## 25. 这份文档对应你仓库里的重点参考文件

后续你每写一个 Cocos 模块，都可以回来看这些来源文件：

1. `src/components/table/TableScene.vue`
   这是整桌结构和交互节奏来源
2. `src/components/table/SeatView.vue`
   这是座位 Prefab 结构来源
3. `src/components/table/ActionPanel.vue`
   这是操作面板结构来源
4. `src/components/table/ShowdownPanel.vue`
   这是摊牌面板结构来源
5. `src/game/mock/createMockTableState.ts`
   这是 `Adapter` 设计来源
6. `src/stores/tableStore.ts`
   这是 `Store + Controller` 编排来源
7. `cocosDesign/types/model/table.ts`
   这是联网牌桌快照核心类型
8. `cocosDesign/types/ui-model/table-view.ts`
   这是 Presenter 层视图模型来源
9. `cocosDesign/types/ui-model/action-panel.ts`
   这是操作区状态来源
10. `cocosDesign/types/config/seat-layout.ts`
    这是座位布局配置来源

---

## 26. 最后的判断标准

如果你的 Cocos 第一版已经做到下面 6 件事，就说明方向对了：

1. `TableScene` 节点树是清晰的
2. `SeatPrefab` 和 `ActionPanelPrefab` 已经拆出来了
3. `TableSnapshot` 没有和 Cocos 节点类型混在一起
4. `TableSceneController` 负责总编排，而不是一个脚本包打天下
5. `Presenter` 只更新 UI，不管网络和规则
6. `JsonAsset -> Store -> Adapter -> Presenter -> UI` 这条链路已经跑通

做到这里，再接网络就是顺势而为，不会再是硬扛。
