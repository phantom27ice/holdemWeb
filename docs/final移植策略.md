# 德州扑克项目移植到 Cocos Creator 完整指南

本文档整合了 codex移植策略.md 和 minimax移植策略.md 两份移植指南，结合 cocos-master 工作流最佳实践，为你提供一份完整、可靠的移植教学文档。

---

## 第一章：移植概述与核心概念

### 1.1 为什么需要移植到 Cocos Creator

你的 Vue 项目已经实现了完整的德州扑克游戏逻辑，包括：

- 核心引擎：`holdemEngine.ts`（状态机编排）
- 手牌评估：`handEvaluator.ts`（牌型算法）
- UI 组件：`SeatView.vue`、`ActionPanel.vue`、`ShowdownPanel.vue`
- 状态管理：`tableStore.ts`（Pinia Store）

将这些逻辑移植到 Cocos Creator 可以获得：

1. **原生游戏体验**：更流畅的动画、更低的延迟
2. **多平台发布**：Web、iOS、Android、微信小游戏
3. **性能优化**：GPU 加速的渲染管线

### 1.2 移植的核心挑战

从 Web 移植到 Cocos 需要理解 4 个核心概念：

| 概念 | 说明 |
|------|------|
| **场景节点** | 编辑器里手工搭的节点树，如 `Canvas`、`TableRoot`、`SeatLayer` |
| **Prefab** | 可复用、可动态创建的界面块，类似 Vue 组件 |
| **业务数据类型** | TypeScript 接口，如 `TableSnapshot`、`SeatState`，不是拖拽配置 |
| **编辑器绑定** | `@property(Node)`、`@property(Label)` 等，关联场景节点到脚本 |

**关键认知**：`TypeScript interface` 负责约束数据，`@property` 负责绑定场景节点。

### 1.3 你的 Web 项目到 Cocos 的映射关系

| Web 文件 | Cocos 对应 |
|----------|------------|
| `src/components/table/TableScene.vue` | `TableScene.scene` + `TableSceneController.ts` |
| `src/components/table/SeatView.vue` | `SeatPrefab.prefab` + `SeatPresenter.ts` |
| `src/components/table/BoardCards.vue` | `BoardPresenter.ts` |
| `src/components/table/HoleCards.vue` | `HeroHandPresenter.ts` |
| `src/components/table/ActionPanel.vue` | `ActionPanelPrefab.prefab` + `ActionPanelPresenter.ts` |
| `src/components/table/ShowdownPanel.vue` | `ShowdownPanelPrefab.prefab` + `ShowdownPanelPresenter.ts` |
| `src/stores/tableStore.ts` | `TableStateStore.ts` + `TableSceneController.ts` |
| `src/game/mock/createMockTableState.ts` | `TableSnapshotAdapter.ts` + Mock JSON |
| `cocosDesign/types/**` | `assets/scripts/types/**` |

---

## 第二章：环境准备

### 2.1 Cocos Creator 版本选择

**推荐版本：Cocos Creator 3.x（最新稳定版 3.8.x）**

- Mac 用户：`Cocos Creator 3.8.x`
- Windows 用户：`Cocos Creator 3.8.x`

选择 3.x 的原因：

- 更好的 TypeScript 支持
- 更现代的渲染管线
- 与 Vue 项目开发体验更接近

### 2.2 安装步骤

#### macOS 安装

```bash
# 1. 前往 https://www.cocos.com/download Creator 下载
# 2. 解压后移动到应用程序
mv CocosCreator-3.8.x.dmg /Applications/
# 3. 打开应用
open /Applications/CocosCreator.app
```

#### Windows 安装

```powershell
# 1. 前往 https://www.cocos.com/download Creator 下载
# 2. 运行安装程序（默认路径: C:\Program Files\Cocos\CocosCreator3.8.x）
# 3. 打开 Cocos Creator
```

### 2.3 创建项目

1. 打开 Cocos Creator
2. 点击 **New Project**
3. 选择 **Empty Project**
4. 填写项目名称：`HoldemCocos`
5. 选择存储路径（建议与 `holdemWeb` 同级目录）

```
holdem/
├── holdemWeb/        # Vue 项目（已有）
└── holdemCocos/     # Cocos 项目（新建）
```

---

## 第三章：项目结构设计

### 3.1 推荐目录结构

```
assets/
├── scenes/                    # 场景文件
│   ├── Loading.scene         # 加载场景
│   ├── Lobby.scene          # 大厅场景
│   └── Table.scene          # 牌桌场景
│
├── scripts/                 # 业务脚本
│   ├── types/              # 类型定义（复用 cocosDesign/types/）
│   │   ├── model/          # 业务模型
│   │   │   ├── card.ts
│   │   │   ├── table.ts
│   │   │   └── action.ts
│   │   ├── protocol/       # 网络协议
│   │   │   ├── http.ts
│   │   │   └── ws.ts
│   │   ├── ui-model/       # 视图模型
│   │   │   ├── seat-view.ts
│   │   │   └── action-panel.ts
│   │   └── config/         # 配置
│   │       ├── seat-layout.ts
│   │       └── table-config.ts
│   │
│   ├── core/               # 核心逻辑（从 Vue 抽取）
│   │   ├── engine/         # 游戏引擎
│   │   │   ├── handEvaluator.ts
│   │   │   └── holdemEngine.ts
│   │   └── utils/          # 工具函数
│   │
│   ├── network/           # 网络层
│   │   ├── TableGateway.ts
│   │   └── NetworkManager.ts
│   │
│   ├── table/             # 牌桌模块
│   │   ├── state/         # 状态管理
│   │   │   └── TableStateStore.ts
│   │   ├── controllers/   # 控制器
│   │   │   └── TableSceneController.ts
│   │   ├── presenters/    # 表现层
│   │   │   ├── SeatPresenter.ts
│   │   │   ├── BoardPresenter.ts
│   │   │   ├── HeroHandPresenter.ts
│   │   │   ├── ActionPanelPresenter.ts
│   │   │   └── ShowdownPanelPresenter.ts
│   │   └── adapters/      # 数据适配器
│   │       ├── TableSnapshotAdapter.ts
│   │       └── LegalActionAdapter.ts
│   │
│   ├── animation/         # 动画系统
│   │   └── AnimationDirector.ts
│   │
│   ├── common/            # 公共组件
│   │   ├── CardSpriteResolver.ts
│   │   ├── NumberFormatter.ts
│   │   └── EventBus.ts
│   │
│   └── debug/             # 调试模块
│       └── MockTableSnapshot.ts
│
├── prefabs/               # 预制体
│   ├── table/            # 牌桌组件
│   │   ├── SeatPrefab.prefab
│   │   ├── ActionPanelPrefab.prefab
│   │   ├── ShowdownPanelPrefab.prefab
│   │   └── PotItemPrefab.prefab
│   ├── card/             # 卡牌
│   │   └── CardSlotPrefab.prefab
│   └── effect/           # 特效
│       ├── DealCardFxPrefab.prefab
│       └── ChipFlyFxPrefab.prefab
│
├── resources/            # 动态加载资源
│   ├── pokers/          # 扑克牌图片
│   ├── avatar/          # 头像
│   ├── chip/            # 筹码
│   ├── effect/          # 特效资源
│   └── mock/            # 调试数据
│       └── table-snapshot.json
│
├── textures/             # 编辑器直接引用
├── animations/          # 动画片段
├── materials/            # 材质
└── fonts/                # 字体
```

### 3.2 目录职责说明

| 目录 | 职责 |
|------|------|
| `scripts/types/` | 业务数据类型定义，复用 `cocosDesign/types/` |
| `scripts/core/` | 游戏引擎逻辑，可直接从 Vue 项目迁移 |
| `scripts/table/` | 牌桌 UI 逻辑，使用 Presenter 模式 |
| `scripts/network/` | 网络通信，与服务端对接 |
| `prefabs/` | 可复用的 UI 组件 |
| `resources/` | 运行时动态加载的资源 |

---

## 第四章：核心类型定义

### 4.1 类型文件复用策略

你仓库里的 `cocosDesign/types/**` 已经是完整的类型设计，建议直接迁移到 Cocos 项目的 `assets/scripts/types/**`。

类型分类：

| 分类 | 文件 | 用途 |
|------|------|------|
| **model** | `card.ts`, `table.ts`, `action.ts` | 业务真值领域对象 |
| **protocol** | `http.ts`, `ws.ts` | HTTP/WebSocket 封包结构 |
| **ui-model** | `seat-view.ts`, `action-panel.ts` | Presenter 消费的展示数据 |
| **config** | `seat-layout.ts`, `table-config.ts` | 代码常量和布局算法 |

### 4.2 核心模型类型

#### Card（扑克牌）

```typescript
// assets/scripts/types/model/card.ts
export type Suit = 'Spade' | 'Heart' | 'Diamond' | 'Club'
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export interface Card {
  suit: Suit
  rank: Rank
  code: string  // 如 "SA", "HK"
}
```

#### SeatState（座位状态）

```typescript
// assets/scripts/types/model/table.ts
export type SeatRole = 'BTN' | 'SB' | 'BB' | 'UTG' | 'MP' | 'CO'
export type SeatStatus = 'EMPTY' | 'SEATED' | 'ACTING' | 'WAITING' | 'ALL_IN' | 'FOLDED'

export interface SeatState {
  seatNo: number
  userId: string
  nickname: string
  avatarUrl: string
  stack: number
  currentBet: number
  totalBet: number
  isSeated: boolean
  isInHand: boolean
  hasFolded: boolean
  isAllIn: boolean
  role: SeatRole
  status: SeatStatus
}
```

#### TableSnapshot（牌桌快照）

```typescript
export interface TableSnapshot {
  tableId: string
  handId: number
  phase: GamePhase
  street: Street
  dealerSeat: number
  sbSeat: number
  bbSeat: number
  toActSeat: number
  potTotal: number
  board: Card[]
  pots: Pot[]
  seats: SeatState[]
  version: number
  self?: SelfState
  actionDeadlineAt?: number
}
```

### 4.3 UI 模型类型

#### SeatViewData（座位视图数据）

```typescript
// assets/scripts/types/ui-model/seat-view.ts
export interface SeatViewData {
  seatNo: number
  displaySeatIndex: number
  nickname: string
  avatarUrl: string
  stackText: string
  currentBetText?: string
  role: SeatRole
  status: SeatStatus
  isOccupied: boolean
  isHero: boolean
  isActive: boolean
  isFolded: boolean
  isAllIn: boolean
  countdownSeconds: number | null
  badge?: { text: string; type: 'action' | 'role' }
  cards: CardViewData[]
}
```

#### ActionPanelState（操作面板状态）

```typescript
// assets/scripts/types/ui-model/action-panel.ts
export interface ActionPanelState {
  isVisible: boolean
  isLocked: boolean
  foldButton: ButtonState
  callOrCheckButton: ButtonState
  raiseButton: ButtonState
  allInButton: ButtonState
  raiseSlider?: RaiseSliderState
}
```

---

## 第五章：场景搭建

### 5.1 牌桌场景节点树

按照 cocos-master 工作流，先建立清晰的场景结构：

```
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

### 5.2 场景节点 vs Prefab 选择

**保留在场景里的节点**（每个桌面只有一份）：

- `Canvas`、`SafeArea`、`Background`
- `TableRoot`、`TableShell`、`Felt`
- `SeatLayer`、`HeroLayer`、`EffectLayer`、`OverlayLayer`
- `HUD`

**建议做成 Prefab**（可复用）：

- `SeatPrefab` - 座位
- `ActionPanelPrefab` - 操作面板
- `ShowdownPanelPrefab` - 摊牌面板
- `DealCardFxPrefab` - 发牌特效
- `ChipFlyFxPrefab` - 筹码飞行特效
- `PotItemPrefab` - 底池条目

### 5.3 静态桌子搭建步骤

按照最小运行链路搭建：

**第一步：搭建桌子背景**

1. 创建 `Canvas` → 添加 `SafeArea`
2. 添加 `Background`（桌子底图）
3. 添加 `TableShell` → `Felt`
4. 在 `Felt` 下创建 `BoardAnchor`、`PotAnchor`、`ActionPanelAnchor`

**第二步：放置座位锚点**

在 `SeatLayer` 下创建 6 个空节点：

- `SeatAnchor_0` ~ `SeatAnchor_5`

暂时手动摆放位置，后面再用 `seat-layout.ts` 动态计算。

**第三步：实例化 SeatPrefab**

1. 创建 `SeatPrefab`
2. 在 `TableSceneController` 中动态实例化
3. 挂载到对应 `SeatAnchor`

**第四步：实现 Hero 手牌区**

在 `HeroHandAnchor` 下放置两张卡牌节点。

**第五步：实现 ActionPanel**

创建 `ActionPanelPrefab`，挂载到 `ActionPanelAnchor`。

---

## 第六章：Prefab 开发

### 6.1 SeatPrefab 结构

```
SeatPrefab
├─ ActionBadge          # 行为提示（如 "加注"）
├─ TurnTimer            # 倒计时
├─ AvatarFrame          # 头像框
│  ├─ AvatarSprite     # 头像
│  └─ RoleIcon         # 角色图标（BTN/SB/BB）
├─ MetaPanel            # 信息面板
│  ├─ NameLabel        # 昵称
│  ├─ StackLabel       # 筹码
│  └─ BetLabel         # 当前下注
└─ CardsAnchor          # 手牌锚点
   ├─ Card_0
   └─ Card_1
```

### 6.2 SeatPresenter 最小骨架

```typescript
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

### 6.3 ActionPanelPrefab 结构

```
ActionPanelPrefab
├─ FoldButton           # 弃牌
├─ CallCheckButton      # 跟注/过牌
├─ RaiseButton          # 加注
├─ AllInButton          # 全下
├─ RaiseSlider          # 加注滑条
├─ RaiseValueLabel      # 加注金额显示
└─ QuickRaiseRow        # 快速加注按钮
   ├─ QuickRaiseBtn_0
   ├─ QuickRaiseBtn_1
   ├─ QuickRaiseBtn_2
   └─ QuickRaiseBtn_3
```

### 6.4 统一动作出口

所有按钮动作必须统一成一个出口：

```typescript
sendAction(actionType: ActionType, amountTo?: number): void
```

- Fold 按钮：`sendAction('FOLD')`
- Check 按钮：`sendAction('CHECK')`
- Call 按钮：`sendAction('CALL')`
- Raise 按钮：`sendAction('RAISE', raiseTo)`
- All-in 按钮：`sendAction('ALL_IN')`

---

## 第七章：状态管理与数据流

### 7.1 TableStateStore 职责

```typescript
// assets/scripts/table/state/TableStateStore.ts
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

### 7.2 TableSnapshotAdapter 职责

把服务端 `TableSnapshot` 转换为 Presenter 需要的视图数据：

```typescript
// assets/scripts/table/adapters/TableSnapshotAdapter.ts
import type {
  ActionPanelState,
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
      seats: snapshot.seats.map((seat, index) => this.toSeatView(snapshot, seat, index)),
      heroSeatNo: snapshot.self?.seatNo,
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
    }
  }

  private toSeatView(snapshot: TableSnapshot, seat: any, index: number): SeatViewData {
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
      cards: [],
    }
  }

  private toBoardView(snapshot: TableSnapshot): any[] {
    const board = snapshot.board.map((card) => ({
      card,
      isFaceUp: true,
      isPlaceholder: false,
    }))
    while (board.length < 5) {
      board.push({ isFaceUp: false, isPlaceholder: true })
    }
    return board
  }
}
```

### 7.3 TableSceneController 编排

```typescript
// assets/scripts/table/controllers/TableSceneController.ts
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
    if (!snapshot) return

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
    if (!this.seatPrefab || !this.seatLayer) return null

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

---

## 第八章：Mock 数据与调试

### 8.1 创建 Mock JSON

在 `assets/resources/mock/` 下创建 `table-snapshot.json`：

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
  "pots": [{ "potId": "main", "amount": 150 }],
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

### 8.2 最小运行链路

先跑通这条链路：

```
JsonAsset → TableStateStore → TableSnapshotAdapter → Presenter → 屏幕
```

通后再接 WebSocket。

---

## 第九章：动画系统

### 9.1 AnimationDirector 职责

消费 `TableEvent`，顺序播放动画：

```typescript
// assets/scripts/animation/AnimationDirector.ts
import { _decorator, Component, Node, tween } from 'cc'
import type { TableEvent } from '../../types'

const { ccclass, property } = _decorator

@ccclass('AnimationDirector')
export class AnimationDirector extends Component {
  @property(Node)
  public dealFxLayer: Node | null = null

  @property(Node)
  public chipFxLayer: Node | null = null

  private isAnimating = false

  public playEvents(events: TableEvent[]): void {
    if (this.isAnimating || events.length === 0) return
    this.isAnimating = true
    this.playNext(events, 0)
  }

  private playNext(events: TableEvent[], index: number): void {
    if (index >= events.length) {
      this.isAnimating = false
      return
    }

    const event = events[index]
    switch (event.type) {
      case 'CARDS_DEALT':
        this.playDealCards(event, () => this.playNext(events, index + 1))
        break
      case 'ACTION_APPLIED':
        this.playChipFly(event, () => this.playNext(events, index + 1))
        break
      case 'SHOWDOWN_REVEAL':
        this.playShowdown(event, () => this.playNext(events, index + 1))
        break
      default:
        this.playNext(events, index + 1)
    }
  }

  private playDealCards(event: any, done: () => void): void {
    // 实现发牌动画
    done()
  }

  private playChipFly(event: any, done: () => void): void {
    // 实现筹码飞行动画
    done()
  }

  private playShowdown(event: any, done: () => void): void {
    // 实现摊牌动画
    done()
  }
}
```

### 9.2 动画类型

| 事件 | 动画 |
|------|------|
| `CARDS_DEALT` | 发牌飞行动画 |
| `BOARD_DEALT` | 公共牌翻开动画 |
| `ACTION_APPLIED` | 筹码飞行动画 |
| `POT_AWARDED` | 派奖动画 |
| `SHOWDOWN_REVEAL` | 摊牌面板动画 |

---

## 第十章：网络层

### 10.1 TableGateway 职责

```typescript
// assets/scripts/network/TableGateway.ts
import { WebSocket } from 'cc'
import type { TableSnapshot, TableEvent } from '../types'
import type { ServerWsMessage } from '../types/protocol/ws'

export class TableGateway {
  private ws: WebSocket | null = null
  private snapshotListener: ((snapshot: TableSnapshot) => void) | null = null
  private eventListener: ((event: TableEvent) => void) | null = null

  public connect(wsUrl: string): void {
    this.ws = new WebSocket(wsUrl)
    this.ws.onOpen = this.onOpen.bind(this)
    this.ws.onMessage = this.onMessage.bind(this)
    this.ws.onClose = this.onClose.bind(this)
    this.ws.onError = this.onError.bind(this)
  }

  public subscribe(tableId: string): void {
    this.send({
      type: 'table.subscribe',
      payload: { tableId },
    })
  }

  public sendAction(action: any): void {
    this.send({
      type: 'table.action',
      payload: action,
    })
  }

  public onSnapshot(listener: (snapshot: TableSnapshot) => void): void {
    this.snapshotListener = listener
  }

  public onEvent(listener: (event: TableEvent) => void): void {
    this.eventListener = listener
  }

  private onOpen(): void {
    console.log('[TableGateway] Connected')
  }

  private onMessage(data: string): void {
    const msg = JSON.parse(data) as ServerWsMessage
    switch (msg.type) {
      case 'table.snapshot':
        this.snapshotListener?.(msg.payload)
        break
      case 'table.event':
        this.eventListener?.(msg.payload)
        break
    }
  }

  private onClose(): void {
    console.log('[TableGateway] Disconnected')
  }

  private onError(err: any): void {
    console.error('[TableGateway] Error:', err)
  }

  private send(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }
}
```

### 10.2 协议类型复用

直接复用 `cocosDesign/types/protocol/` 下的类型：

- `cocosDesign/types/protocol/http.ts` → HTTP 登录、入桌
- `cocosDesign/types/protocol/ws.ts` → WebSocket 消息

---

## 第十一章：开发阶段规划

### 11.1 三阶段开发计划

#### 第一阶段：本地静态版

目标：

- 场景节点全部搭好
- `SeatPrefab`、`ActionPanelPrefab`、`ShowdownPanelPrefab` 都能显示
- `JsonAsset` 驱动 UI

#### 第二阶段：本地动态版

目标：

- 接 `TableStateStore`
- 接 `TableSnapshotAdapter`
- 接 `AnimationDirector`
- 按事件播放飞牌和飞筹码

#### 第三阶段：联网版

目标：

- 接 HTTP 登录和入桌
- 接 WebSocket 订阅
- 收到 `table.snapshot` 刷新画面
- 收到 `table.event` 播动画
- 点击按钮发送 `table.action`

### 11.2 第一阶段先不要做的事情

为避免项目失控，第一阶段先不做：

1. ❌ 本地规则引擎
2. ❌ 2-10 人桌全部布局
3. ❌ 断线重连
4. ❌ 对象池优化
5. ❌ 复杂 UI 动画
6. ❌ 网络层写进 Presenter

### 11.3 验收标准

第一版完成时必须满足：

1. ✅ `TableScene` 节点树清晰
2. ✅ `SeatPrefab` 和 `ActionPanelPrefab` 已拆出
3. ✅ `TableSnapshot` 未与 Cocos 节点类型混合
4. ✅ `TableSceneController` 负责总编排
5. ✅ `Presenter` 只更新 UI，不管网络
6. ✅ `JsonAsset → Store → Adapter → Presenter → UI` 链路跑通

---

## 第十二章：调试与诊断

### 12.1 运行诊断脚本

按照 cocos-master 工作流，定期运行诊断：

```bash
# 检查 meta 完整性
python3 ".claude/skills/scripts/check_meta_integrity.py" --project .

# 查找 UUID 使用
python3 ".claude/skills/scripts/find_uuid_usage.py" --project . --uuid <uuid>
```

### 12.2 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 节点未显示 | `@property` 未绑定 | 检查 Inspector 拖拽 |
| 数据不刷新 | Store 未订阅 | 检查 `subscribe()` 调用 |
| 动画卡顿 | 未使用 `tween` | 使用 Cocos tween API |
| 资源加载失败 | 路径错误 | 检查 `resources/` 目录 |
| 类型报错 | 缺少类型声明 | 检查 `types/` 导入 |

### 12.3 Cocos 安全编码模式

- 使用 `onLoad` 做一次性初始化
- 使用 `start` 做依赖其他组件的逻辑
- 使用 `update` 仅在需要帧循环时
- 在 `onDestroy` 中移除事件监听和定时器
- 所有 `@property` 使用可空类型并在使用前检查

---

## 第十三章：参考文件映射

| Cocos 模块 | Vue 来源 |
|------------|----------|
| `TableSceneController.ts` | `src/components/table/TableScene.vue` |
| `SeatPresenter.ts` | `src/components/table/SeatView.vue` |
| `ActionPanelPresenter.ts` | `src/components/table/ActionPanel.vue` |
| `ShowdownPanelPresenter.ts` | `src/components/table/ShowdownPanel.vue` |
| `TableSnapshotAdapter.ts` | `src/game/mock/createMockTableState.ts` |
| `TableStateStore.ts` | `src/stores/tableStore.ts` |
| `assets/scripts/types/model/table.ts` | `cocosDesign/types/model/table.ts` |
| `assets/scripts/types/ui-model/*` | `cocosDesign/types/ui-model/*` |
| `assets/scripts/types/config/seat-layout.ts` | `cocosDesign/types/config/seat-layout.ts` |

---

## 附录：Vue 与 Cocos 概念对照

| Vue 概念 | Cocos 概念 | 说明 |
|----------|------------|------|
| 组件 (.vue) | Prefab | 可复用 UI 单元 |
| 页面 (.vue) | Scene | 完整游戏画面 |
| Props | @property | 组件属性 |
| Emit | 事件/回调 | 组件通信 |
| Vuex/Pinia | 自定义 Store | 状态管理 |
| Router | Scene 切换 | 页面跳转 |
| computed | getter | 计算属性 |
| watch | 事件监听 | 响应式监听 |
| template | Node 树 | 界面结构 |
| style | Sprite/Label | 视觉表现 |

---

## 立即行动

按以下顺序开始移植：

1. ✅ 安装 Cocos Creator 3.8.x
2. ✅ 创建新项目 `HoldemCocos`
3. ✅ 搭建 `assets/scripts/types/` 目录结构
4. ✅ 迁移 `cocosDesign/types/**` 到 types 目录
5. ✅ 搭 `TableScene` 节点树
6. ✅ 创建 `SeatPrefab` 和 `SeatPresenter`
7. ✅ 创建 `ActionPanelPrefab` 和 `ActionPanelPresenter`
8. ✅ 创建 `table-snapshot.json` Mock 数据
9. ✅ 编写 `TableStateStore.ts`
10. ✅ 编写 `TableSnapshotAdapter.ts`
11. ✅ 编写 `TableSceneController.ts`
12. ✅ 运行项目验证静态桌子

完成上述步骤后，你的 Cocos 德州扑克项目就具备了坚实的基础，后续可以顺利接入动画系统和网络层。