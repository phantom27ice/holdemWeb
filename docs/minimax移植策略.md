# Cocos Creator 德州扑克项目移植教学文档

## 第一部分：环境准备

### 1.1 Cocos Creator 版本选择

**推荐版本：Cocos Creator 3.x (最新稳定版)**

- 如果你使用的是 **Mac**，推荐 `Cocos Creator 3.8.x`
- 如果你使用的是 **Windows**，推荐 `Cocos Creator 3.8.x`

为什么选择 3.x：
- 更好的 TypeScript 支持
- 更现代的渲染管线
- 与 Vue 项目开发体验更接近

### 1.2 安装步骤

#### macOS 安装

```bash
# 1. 前往官网下载
# https://www.cocos.com/download Creator

# 2. 解压后移动到应用程序
mv CocosCreator-3.8.x.dmg /Applications/

# 3. 打开应用，首次运行会下载编辑器资源
open /Applications/CocosCreator.app
```

#### Windows 安装

```powershell
# 1. 前往官网下载安装包
# https://www.cocos.com/download Creator

# 2. 运行安装程序
# 默认路径: C:\Program Files\Cocos\CocosCreator3.8.x

# 3. 打开 Cocos Creator
```

### 1.3 创建第一个项目

1. 打开 Cocos Creator
2. 点击 **New Project**
3. 选择 **Empty Project** (不是 Hello World)
4. 填写项目名称：`HoldemCocos`
5. 选择存储路径（建议放在和 `holdemWeb` 同级目录）
6. 点击 **Create**

```
holdem/
├── holdemWeb/        # Vue 项目（已有）
└── holdemCocos/     # Cocos 项目（新建）
```

---

## 第二部分：项目结构设计

### 2.1 完整目录结构

在 Cocos Creator 中，项目的资源都放在 `assets` 目录下。建议创建以下结构：

```
assets/
├── scenes/                    # 场景文件
│   ├── Loading.scene         # 加载场景
│   ├── Lobby.scene          # 大厅场景
│   └── Table.scene          # 牌桌场景
│
├── scripts/                 # 业务脚本
│   ├── core/                # 核心共享（从 Vue 项目抽取）
│   │   ├── types/          # 类型定义
│   │   │   ├── index.ts    # 统一导出
│   │   │   ├── card.ts     # Card 类型
│   │   │   ├── table.ts    # TableSnapshot 等
│   │   │   ├── action.ts   # Action, LegalAction
│   │   │   └── event.ts    # GameEvent
│   │   ├── engine/         # 游戏引擎
│   │   │   ├── handEvaluator.ts
│   │   │   └── holdemEngine.ts
│   │   └── utils/          # 工具函数
│   │       └── pokerFormatter.ts
│   │
│   ├── network/             # 网络层
│   │   ├── TableGateway.ts  # WebSocket 网关
│   │   ├── NetworkManager.ts # 网络管理器
│   │   └── protocol/        # 协议类型
│   │       └── ws.ts
│   │
│   ├── table/               # 牌桌相关
│   │   ├── state/           # 状态管理
│   │   │   └── TableStateStore.ts
│   │   ├── controllers/     # 控制器
│   │   │   └── ActionController.ts
│   │   ├── presenters/      # 表现层（UI 逻辑）
│   │   │   ├── TablePresenter.ts
│   │   │   ├── SeatPresenter.ts
│   │   │   ├── BoardPresenter.ts
│   │   │   ├── HeroHandPresenter.ts
│   │   │   ├── PotPresenter.ts
│   │   │   ├── ActionPanelPresenter.ts
│   │   │   └── ShowdownPresenter.ts
│   │   └── adapters/        # 数据适配器
│   │       ├── SnapshotAdapter.ts
│   │       └── EventAdapter.ts
│   │
│   ├── lobby/               # 大厅相关
│   │   ├── LobbyPresenter.ts
│   │   └── SeatSelector.ts
│   │
│   └── common/              # 公共组件
│       ├── AudioManager.ts
│       └── EventBus.ts
│
├── prefabs/                 # 预制体
│   ├── seat/                # 座位
│   │   └── Seat.prefab
│   ├── board/               # 公共牌
│   │   └── Board.prefab
│   ├── hand/                # 手牌
│   │   └── HeroHand.prefab
│   ├── pot/                 # 底池
│   │   └── PotBar.prefab
│   ├── action/              # 操作面板
│   │   └── ActionPanel.prefab
│   ├── effect/              # 特效
│   │   ├── DealFly.prefab
│   │   ├── ChipFly.preab
│   │   └── FlipCard.prefab
│   └── ui/                  # 通用 UI
│       ├── Toast.prefab
│       └── Button.prefab
│
├── resources/               # 资源目录（动态加载）
│   ├── poker/              # 扑克牌图片
│   │   ├── back.png
│   │   ├── Spade/
│   │   ├── Heart/
│   │   ├── Diamond/
│   │   └── Club/
│   ├── avatar/             # 头像
│   ├── chip/               # 筹码
│   ├── effect/              # 特效资源
│   └── audio/               # 音效
│
├── textures/                # 纹理（编辑器直接使用）
├── animations/              # 动画片段
├── materials/               # 材质
├── fonts/                   # 字体
└── settings/                # 项目设置
```

### 2.2 目录用途说明

| 目录 | 用途 |
|------|------|
| `scenes/` | 游戏场景，一个场景一个 `.scene` 文件 |
| `scripts/` | TypeScript 业务代码 |
| `prefab/` | 可复用的预制体（类似 Vue 组件） |
| `resources/` | 需要代码动态加载的资源 |
| `textures/` | 编辑器直接引用的纹理 |
| `animations/` | 动画片段 |
| `materials/` | 渲染材质 |
| `fonts/` | 字体文件 |

### 2.3 Cocos 特有概念

**与 Vue 对比：**

| Vue 概念 | Cocos 概念 | 说明 |
|----------|------------|------|
| 组件 (.vue) | Prefab (预制体) | 可复用的 UI 单元 |
| 页面 (.vue) | Scene (场景) | 完整的游戏画面 |
| Props | @property | 组件属性 |
| Emit | 事件/回调 | 组件间通信 |
| Vuex/Pinia | 自定义 Store | 状态管理 |
| Router | Scene 切换 | 页面跳转 |
| computed | getter | 计算属性 |
| watch | 事件监听 | 响应式监听 |

---

## 第三部分：核心类型定义

### 3.1 在 Cocos 中创建类型文件

在 Cocos 的 `assets/scripts/core/types/` 目录下创建类型文件。

#### 3.1.1 基础类型 (card.ts)

```typescript
// assets/scripts/core/types/card.ts

/**
 * 牌面花色
 */
export type Suit = 'Spade' | 'Heart' | 'Diamond' | 'Club'

/**
 * 牌面点数，A=14
 */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

/**
 * 单张扑克牌
 */
export interface Card {
  suit: Suit
  rank: Rank
  code?: string  // 如 "SA", "H10"
}

/**
 * 创建扑克牌
 */
export function createCard(suit: Suit, rank: Rank): Card {
  return { suit, rank, code: `${suit[0]}${rank}` }
}

/**
 * 牌面转字符串（用于资源路径）
 */
export function cardToString(card: Card): string {
  return `${card.suit}_${card.rank}`
}
```

#### 3.1.2 牌桌状态 (table.ts)

```typescript
// assets/scripts/core/types/table.ts

import type { Card } from './card'
import type { ActionType, LegalAction } from './action'

/**
 * 街道（公共牌阶段）
 */
export type Street = 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN'

/**
 * 对局阶段
 */
export type Phase =
  | 'WAITING_FOR_PLAYERS'
  | 'POST_FORCED_BETS'
  | 'DEAL_HOLE_CARDS'
  | 'BETTING_PRE_FLOP'
  | 'DEAL_FLOP'
  | 'BETTING_FLOP'
  | 'DEAL_TURN'
  | 'BETTING_TURN'
  | 'DEAL_RIVER'
  | 'BETTING_RIVER'
  | 'SHOWDOWN'
  | 'PAYOUT'
  | 'HAND_FINISHED'

/**
 * 座位角色（庄位）
 */
export type Role = 'BTN' | 'SB' | 'BB' | null

/**
 * 座位状态
 */
export type SeatStatus = 'IDLE' | 'WAITING' | 'ACTING' | 'OFFLINE'

/**
 * 单个座位状态（公共信息）
 */
export interface SeatState {
  seatNo: number           // 座位号 0-maxPlayers-1
  userId?: string          // 玩家 ID
  nickname?: string        // 昵称
  avatarUrl?: string      // 头像 URL
  stack: number            // 剩余筹码
  currentBet: number      // 当前街下注
  totalBet: number        // 当前手累计下注
  isSeated: boolean      // 是否有人坐下
  isInHand: boolean      // 是否参与本手
  hasFolded: boolean     // 是否已弃牌
  isAllIn: boolean       // 是否全下
  isReady?: boolean      // 是否准备
  role: Role             // 庄位标记
  status: SeatStatus     // 座位状态
  exposedCards?: Card[]   // 摊牌后公开的牌
}

/**
 * 底池信息
 */
export interface PotInfo {
  potId: string    // 'main', 'side-1', 'side-2'...
  amount: number   // 池子金额
}

/**
 * 当前玩家私有状态（只有自己能收到）
 */
export interface SelfState {
  seatNo: number              // 自己座位号
  holeCards: Card[]         // 自己的底牌
  legalActions: LegalAction[] // 当前合法动作
}

/**
 * 牌桌快照（最核心的数据结构）
 */
export interface TableSnapshot {
  tableId: string       // 牌桌 ID
  handId: number       // 当前手牌 ID
  phase: Phase         // 当前阶段
  street: Street       // 当前街道
  dealerSeat: number   // 庄位
  sbSeat: number      // 小盲位
  bbSeat: number      // 大盲位
  toActSeat: number   // 当前行动位
  potTotal: number    // 总池金额
  board: Card[]       // 公共牌
  pots: PotInfo[]    // 主池和边池
  seats: SeatState[]  // 所有座位（动态数组，支持 2-10 人）
  actionDeadlineAt?: number   // 行动截止时间戳
  version: number     // 快照版本号（用于冲突检测）
  self?: SelfState    // 只有自己能看到
}
```

#### 3.1.3 动作类型 (action.ts)

```typescript
// assets/scripts/core/types/action.ts

/**
 * 客户端可执行的动作类型
 */
export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN'

/**
 * 服务端下发的合法动作
 */
export interface LegalAction {
  type: ActionType
  toCall?: number       // 跟注金额
  minAmountTo?: number // 最小加注到
  maxAmountTo?: number // 最大加注到
}

/**
 * 客户端动作请求
 */
export interface ActionRequest {
  requestId: string           // 请求唯一 ID
  tableId: string            // 牌桌 ID
  handId: number            // 当前手 ID
  expectedVersion: number    // 客户端当前版本
  action: ActionType         // 动作类型
  amountTo?: number         // 加注金额（仅 BET/RAISE 需要）
}

/**
 * 动作被拒绝的错误码
 */
export type ActionRejectedCode =
  | 'NOT_YOUR_TURN'           // 还没轮到你
  | 'INVALID_AMOUNT'          // 金额非法
  | 'ACTION_NOT_ALLOWED'      // 动作不允许
  | 'VERSION_EXPIRED'         // 版本过期
  | 'HAND_ALREADY_FINISHED'   // 手牌已结束
  | 'TABLE_NOT_FOUND'         // 牌桌不存在

/**
 * 动作被拒绝的响应
 */
export interface ActionRejected {
  requestId: string
  tableId: string
  handId: number
  code: ActionRejectedCode
  message: string
  latestVersion?: number   // 最新版本号
}
```

#### 3.1.4 事件类型 (event.ts)

```typescript
// assets/scripts/core/types/event.ts

import type { Card } from './card'
import type { ActionType, Street } from './table'

/**
 * 事件类型
 */
export type TableEventType =
  | 'HAND_STARTED'        // 新手开始
  | 'CARDS_DEALT'         // 发底牌
  | 'BOARD_DEALT'         // 发公共牌
  | 'ACTION_APPLIED'      // 玩家动作确认
  | 'TURN_TIMEOUT'        // 超时自动动作
  | 'SHOWDOWN_REVEAL'     // 摊牌亮牌
  | 'POT_AWARDED'        // 池子派奖
  | 'HAND_FINISHED'      // 一手结束

/**
 * 超时后的兜底动作
 */
export type TimeoutFallback = 'CHECK' | 'FOLD'

/**
 * 事件基类
 */
export interface BaseEvent {
  type: TableEventType
  tableId: string
  handId: number
  version: number     // 事件后的版本号
  ts: number         // 时间戳
}

/**
 * 新手开始事件
 */
export interface HandStartedEvent extends BaseEvent {
  type: 'HAND_STARTED'
}

/**
 * 发底牌事件
 */
export interface CardsDealtEvent extends BaseEvent {
  type: 'CARDS_DEALT'
  seatNo: number
  count: number
}

/**
 * 发公共牌事件
 */
export interface BoardDealtEvent extends BaseEvent {
  type: 'BOARD_DEALT'
  street: Street
  cards: Card[]
}

/**
 * 玩家动作确认事件
 */
export interface ActionAppliedEvent extends BaseEvent {
  type: 'ACTION_APPLIED'
  seatNo: number
  action: ActionType
  amount: number       // 实际投入金额
  amountTo?: number   // 下注到的金额
}

/**
 * 超时自动动作事件
 */
export interface TurnTimeoutEvent extends BaseEvent {
  type: 'TURN_TIMEOUT'
  seatNo: number
  fallback: TimeoutFallback
}

/**
 * 摊牌亮牌事件
 */
export interface ShowdownRevealEvent extends BaseEvent {
  type: 'SHOWDOWN_REVEAL'
  seatNo: number
  cards: Card[]
}

/**
 * 池子派奖事件
 */
export interface PotAwardedEvent extends BaseEvent {
  type: 'POT_AWARDED'
  potId: string
  winners: number[]   // 赢家座位号数组
  amount: number      // 派奖金额
}

/**
 * 一手结束事件
 */
export interface HandFinishedEvent extends BaseEvent {
  type: 'HAND_FINISHED'
}

/**
 * 所有事件类型的联合类型
 */
export type TableEvent =
  | HandStartedEvent
  | CardsDealtEvent
  | BoardDealtEvent
  | ActionAppliedEvent
  | TurnTimeoutEvent
  | ShowdownRevealEvent
  | PotAwardedEvent
  | HandFinishedEvent
```

#### 3.1.5 类型导出入口 (index.ts)

```typescript
// assets/scripts/core/types/index.ts

// 基础类型
export * from './card'

// 牌桌相关
export * from './table'

// 动作相关
export * from './action'

// 事件相关
export * from './event'

// 玩家
export interface UserProfile {
  userId: string
  nickname: string
  avatarUrl: string
  balance?: number
  status?: 'ONLINE' | 'OFFLINE' | 'IN_GAME'
}
```

### 3.2 Cocos 脚本类型声明

在 Cocos 中，你需要使用装饰器来声明属性：

```typescript
// assets/scripts/core/types/cocos-types.ts

import { _decorator, Component, Sprite, Label, Node } from 'cc'

// 装饰器注册
const { property } = _decorator

/**
 * Cocos 组件基类的类型声明示例
 */
export class SeatComponent extends Component {
  // 引用 Sprite 组件
  @property(Sprite)
  avatarSprite!: Sprite

  // 引用 Label 组件
  @property(Label)
  nameLabel!: Label

  @property(Label)
  stackLabel!: Label

  @property(Label)
  betLabel!: Label

  // 引用子节点
  @property(Node)
  cardsNode!: Node

  @property(Node)
  roleMarker!: Node

  // 数字属性
  @property
  seatNo: number = 0

  // 布尔属性
  @property
  isHero: boolean = false
}
```

---

## 第四部分：场景搭建（6 人桌）

### 4.1 TableScene 牌桌主场景

#### 4.1.1 创建场景

1. 在 Cocos Creator 中，点击 **File → New Scene**
2. 保存为 `Table`
3. 在 **Hierarchy** 面板中创建以下节点结构：

```
Table (Node)                    # 场景根节点
├── Background (Node)           # 背景层
│   └── BackgroundSprite        # 背景图片
│
├── TableShell (Node)           # 牌桌主体
│   ├── TableSurface           # 牌桌绿色台面
│   ├── TableBorder            # 牌桌边框
│   └── CenterMarker           # 中心标记
│
├── BoardArea (Node)            # 公共牌区域
│   ├── BoardCard1             # 第1张公牌
│   ├── BoardCard2             # 第2张公牌
│   ├── BoardCard3             # 第3张公牌
│   ├── BoardCard4             # 第4张公牌
│   └── BoardCard5             # 第5张公牌
│
├── PotArea (Node)             # 底池区域
│   ├── MainPotLabel           # 主池金额
│   └── SidePotLabels         # 边池金额
│
├── Seats (Node)               # 座位容器
│   ├── Seat0                  # 座位0 (Hero)
│   ├── Seat1                  # 座位1
│   ├── Seat2                  # 座位2
│   ├── Seat3                  # 座位3
│   ├── Seat4                  # 座位4
│   └── Seat5                  # 座位5
│
├── HeroHand (Node)            # Hero手牌区域
│   ├── HoleCard1              # 第1张手牌
│   └── HoleCard2              # 第2张手牌
│
├── ActionPanel (Node)         # 操作面板
│   ├── FoldButton              # 弃牌按钮
│   ├── CheckButton             # 过牌按钮
│   ├── CallButton              # 跟注按钮
│   ├── RaiseButton             # 加注按钮
│   ├── AllInButton            # 全下按钮
│   ├── RaiseSlider             # 加注滑条
│   └── QuickRaiseButtons       # 快捷加注按钮组
│
├── EffectLayer (Node)         # 特效层（最上层）
│   ├── DealFlyLayer           # 发牌飞行动画
│   ├── ChipFlyLayer           # 筹码飞行动画
│   └── ToastContainer          # Toast 提示容器
│
└── Camera (Node)             # 摄像机
```

#### 4.1.2 节点配置详情

**Table (根节点)**
- Position: (0, 0, 0)
- Scale: (1, 1, 1)

**TableShell (牌桌主体)**
- 尺寸：宽度 1200，高度 600
- 锚点：(0.5, 0.5）
- 背景色：深绿色 (#0D3B2E)

**BoardArea (公共牌区域)**
- Position: (0, 50, 0)
- 5 张牌横向排列，每张牌间距 15px

**Seats (座位容器)**
- 6 人桌座位位置分布（相对于牌桌中心）：

| 座位 | X 偏移 | Y 偏移 |
|------|--------|--------|
| 0 (Hero) | 0 | -200 |
| 1 | -350 | -100 |
| 2 | -350 | 100 |
| 3 | 0 | 200 |
| 4 | 350 | 100 |
| 5 | 350 | -100 |

**ActionPanel (操作面板)**
- Position: (0, -320, 0)
- 按钮排列：弃牌 | 跟注/过注 | 加注 | 全下

### 4.2 Seat 座位 Prefab

#### 4.2.1 创建 Seat Prefab

1. 在 Hierarchy 中右键 → **Create Empty**，命名为 `Seat`
2. 添加子节点：

```
Seat (Node)
├── Avatar (Node)
│   └── AvatarSprite (Sprite)
├── RoleMarker (Node)
│   └── RoleSprite (Sprite)
├── NameLabel (Label)
├── StackLabel (Label)
├── BetLabel (Label)
├── Cards (Node)
│   ├── Card1 (Sprite)
│   └── Card2 (Sprite)
├── ActionBadge (Node)
│   └── BadgeLabel (Label)
└── TurnTimer (Node)
    └── TimerLabel (Label)
```

#### 4.2.2 节点属性

**Avatar (头像)**
- 尺寸：74 × 111
- 锚点：(0.5, 0.5)
- 圆角：8px
- 边框：2px 金色

**NameLabel (昵称)**
- 字体大小：24
- 颜色：白色
- 对齐：居中

**StackLabel (筹码)**
- 字体大小：28
- 颜色：金色 (#FFD700)
- 格式：千分位，如 2,000

**BetLabel (下注)**
- 字体大小：20
- 颜色：红色 (#FF4444)
- 格式："下注 {金额}"

**Cards (手牌)**
- 隐藏（非 Hero 时）
- 2 张牌横向排列

**ActionBadge (行为提示)**
- 位置：头像上方
- 背景：半透明黑色
- 文字：金色
- 显示内容：弃牌/跟注/加注/全下

**TurnTimer (倒计时)**
- 位置：头像右上角
- 格式：倒计时秒数
- 颜色：绿色 → 黄色 → 红色（随时间变化）

#### 4.2.3 Seat 脚本

```typescript
// assets/scripts/table/presenters/SeatPresenter.ts

import { _decorator, Component, Sprite, Label, Node, SpriteFrame, resources } from 'cc'
import { SeatState, Card, Role } from '../../core/types'

const { property } = _decorator

/**
 * 座位表现器组件
 * 负责根据 SeatState 渲染座位 UI
 */
export class SeatPresenter extends Component {
  // ========== 节点引用 ==========
  @property(Sprite)
  avatarSprite!: Sprite

  @property(Sprite)
  roleSprite!: Sprite

  @property(Label)
  nameLabel!: Label

  @property(Label)
  stackLabel!: Label

  @property(Label)
  betLabel!: Label

  @property(Node)
  cardsNode!: Node

  @property(Node)
  actionBadge!: Node

  @property(Label)
  badgeLabel!: Label

  @property(Node)
  turnTimer!: Node

  @property(Label)
  timerLabel!: Label

  // ========== 资源 ==========
  private roleTextures: Map<Role, SpriteFrame> = new Map()
  private cardTextures: Map<string, SpriteFrame> = new Map()

  // ========== 状态 ==========
  private _seatNo: number = -1

  onLoad() {
    // 预加载角色标记纹理
    this.loadRoleTextures()
  }

  /**
   * 初始化座位
   */
  init(seatNo: number) {
    this._seatNo = seatNo
    this.node.name = `Seat_${seatNo}`
  }

  /**
   * 根据座位状态更新 UI
   */
  render(state: SeatState, isHero: boolean = false) {
    // 昵称
    this.nameLabel.string = state.nickname || `玩家 ${state.seatNo}`

    // 筹码
    this.stackLabel.string = this.formatNumber(state.stack)

    // 下注
    if (state.currentBet > 0) {
      this.betLabel.string = `下注 ${this.formatNumber(state.currentBet)}`
      this.betLabel.node.active = true
    } else {
      this.betLabel.node.active = false
    }

    // 角色标记（庄位）
    if (state.role) {
      this.roleSprite.node.active = true
      // 设置对应纹理
    } else {
      this.roleSprite.node.active = false
    }

    // 弃牌状态
    if (state.hasFolded) {
      this.setFolded(true)
    } else {
      this.setFolded(false)
    }

    // 全下状态
    if (state.isAllIn) {
      this.setAllIn(true)
    } else {
      this.setAllIn(false)
    }

    // 行动高亮
    if (state.status === 'ACTING') {
      this.setActive(true)
    } else {
      this.setActive(false)
    }

    // 手牌显示（非 Hero 隐藏）
    if (isHero) {
      this.renderHeroCards(state.exposedCards || [])
    } else {
      this.hideCards()
    }
  }

  /**
   * 显示行为提示（如"跟注 100"）
   */
  showActionBadge(text: string) {
    this.badgeLabel.string = text
    this.actionBadge.active = true

    // 1.5秒后自动隐藏
    setTimeout(() => {
      this.actionBadge.active = false
    }, 1500)
  }

  /**
   * 显示倒计时
   */
  showTurnTimer(remainingSeconds: number) {
    this.timerLabel.string = String(Math.ceil(remainingSeconds))
    this.turnTimer.active = true

    // 颜色变化
    if (remainingSeconds <= 3) {
      this.timerLabel.color = new Color(1, 0, 0)  // 红色
    } else if (remainingSeconds <= 5) {
      this.timerLabel.color = new Color(1, 1, 0)  // 黄色
    } else {
      this.timerLabel.color = new Color(0, 1, 0)  // 绿色
    }
  }

  /**
   * 隐藏倒计时
   */
  hideTurnTimer() {
    this.turnTimer.active = false
  }

  // ========== 私有方法 ==========

  private loadRoleTextures() {
    // 预加载庄位标记纹理
    // resources.load('materials/seat/BTN', SpriteFrame, ...)
  }

  private setFolded(folded: boolean) {
    this.node.active = !folded
    // 或者使用透明度表示弃牌
    // this.node.opacity = folded ? 100 : 255
  }

  private setAllIn(allIn: boolean) {
    // 可以添加发光效果
  }

  private setActive(active: boolean) {
    // 可以添加边框高亮
  }

  private renderHeroCards(cards: Card[]) {
    this.cardsNode.active = true
    // 渲染手牌图片
  }

  private hideCards() {
    this.cardsNode.active = false
  }

  private formatNumber(num: number): string {
    return num.toLocaleString()
  }
}
```

### 4.3 Board 公共牌 Prefab

#### 4.3.1 创建 Board Prefab

```
Board (Node)
├── Card1 (Sprite)
├── Card2 (Sprite)
├── Card3 (Sprite)
├── Card4 (Sprite)
└── Card5 (Sprite)
```

#### 4.3.2 Board 脚本

```typescript
// assets/scripts/table/presenters/BoardPresenter.ts

import { _decorator, Component, Sprite, SpriteFrame, resources } from 'cc'
import { Card } from '../../core/types'

const { property } = _decorator

/**
 * 公共牌表现器
 */
export class BoardPresenter extends Component {
  @property([Sprite])
  cardSlots!: Sprite[]  // 5 张牌的插槽

  // 预加载的牌面纹理
  private cardTextures: Map<string, SpriteFrame> = new Map()
  private backTexture?: SpriteFrame

  onLoad() {
    // 预加载所有牌面
    this.preloadTextures()
  }

  /**
   * 更新公共牌
   */
  render(cards: Card[]) {
    // 清空所有槽位
    for (const slot of this.cardSlots) {
      slot.spriteFrame = null
      slot.node.active = false
    }

    // 显示已有的牌
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      const slot = this.cardSlots[i]

      slot.node.active = true
      slot.spriteFrame = this.getCardTexture(card)
    }
  }

  /**
   * 发一张牌（带动画）
   */
  async dealCard(card: Card, delayMs: number = 0): Promise<void> {
    const slotIndex = this.cardSlots.findIndex(s => !s.node.active)
    if (slotIndex === -1) return

    const slot = this.cardSlots[slotIndex]

    // 延迟显示
    await this.sleep(delayMs)

    // 设置背面朝上
    slot.spriteFrame = this.backTexture
    slot.node.active = true

    // 翻牌动画（延迟后显示正面）
    await this.sleep(500)
    slot.spriteFrame = this.getCardTexture(card)
  }

  /**
   * 批量发公共牌
   */
  async dealFlop(cards: Card[]): Promise<void> {
    // 发3张牌，每张间隔 100ms
    await this.dealCard(cards[0], 0)
    await this.dealCard(cards[1], 100)
    await this.dealCard(cards[2], 200)
  }

  async dealTurn(card: Card): Promise<void> {
    await this.dealCard(card, 0)
  }

  async dealRiver(card: Card): Promise<void> {
    await this.dealCard(card, 0)
  }

  // ========== 私有方法 ==========

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async preloadTextures() {
    // 加载背面
    resources.load('pokers/back', SpriteFrame, (err, frame) => {
      if (!err) this.backTexture = frame
    })

    // 加载所有牌面（可以优化为按需加载）
    const suits = ['Spade', 'Heart', 'Diamond', 'Club']
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

    for (const suit of suits) {
      for (const rank of ranks) {
        const key = `${suit}_${rank}`
        const path = `pokers/${suit}/${key}`
        resources.load(path, SpriteFrame, (err, frame) => {
          if (!err) this.cardTextures.set(key, frame)
        })
      }
    }
  }

  private getCardTexture(card: Card): SpriteFrame | null {
    const key = `${card.suit}_${card.rank}`
    return this.cardTextures.get(key) || null
  }
}
```

### 4.4 HeroHand 手牌 Prefab

#### 4.4.1 节点结构

```
HeroHand (Node)
├── HoleCard1 (Sprite)        # 第1张手牌
└── HoleCard2 (Sprite)        # 第2张手牌
```

#### 4.4.2 HeroHand 脚本

```typescript
// assets/scripts/table/presenters/HeroHandPresenter.ts

import { _decorator, Component, Sprite, SpriteFrame, tween, Vec3 } from 'cc'
import { Card } from '../../core/types'

const { property } = _decorator

export class HeroHandPresenter extends Component {
  @property(Sprite)
  holeCard1!: Sprite

  @property(Sprite)
  holeCard2!: Sprite

  private cardTextures: Map<string, SpriteFrame> = new Map()
  private backTexture?: SpriteFrame

  onLoad() {
    this.preloadTextures()
    // 初始隐藏
    this.node.active = false
  }

  /**
   * 显示手牌（背面）
   */
  showBack() {
    this.node.active = true
    this.holeCard1.spriteFrame = this.backTexture!
    this.holeCard2.spriteFrame = this.backTexture!
  }

  /**
   * 显示手牌（正面）
   */
  showFront(cards: Card[]) {
    if (cards.length < 2) {
      this.showBack()
      return
    }

    this.node.active = true
    this.holeCard1.spriteFrame = this.getCardTexture(cards[0])
    this.holeCard2.spriteFrame = this.getCardTexture(cards[1])
  }

  /**
   * 发牌动画（从牌堆飞向 Hero 位置）
   */
  async dealFrom(deckPosition: Vec3): Promise<void> {
    // 飞牌动画
    tween(this.node)
      .to(0.3, { position: deckPosition }, {
        onUpdate: (target, ratio) => {
          // 可以添加贝塞尔曲线
        }
      })
      .start()

    await this.sleep(300)
  }

  /**
   * 翻牌动画
   */
  async flipCards(): Promise<void> {
    // 翻第一张
    await this.flipCard(this.holeCard1)
    // 翻第二张
    await this.flipCard(this.holeCard2)
  }

  private async flipCard(cardSprite: Sprite): Promise<void> {
    return new Promise(resolve => {
      // 翻转动画
      tween(this.node)
        .to(0.15, { scale: new Vec3(0, 1, 1) })  // 缩放到0
        .call(() => {
          // 切换纹理
          // cardSprite.spriteFrame = frontTexture
        })
        .to(0.15, { scale: new Vec3(1, 1, 1) })   // 恢复
        .call(resolve)
        .start()
    })
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async preloadTextures() {
    // 加载纹理...
  }

  private getCardTexture(card: Card): SpriteFrame | null {
    const key = `${card.suit}_${card.rank}`
    return this.cardTextures.get(key) || null
  }
}
```

### 4.5 ActionPanel 操作面板 Prefab

#### 4.5.1 节点结构

```
ActionPanel (Node)
├── FoldButton (Button)
│   └── Label (Label)
├── CheckCallButton (Button)    # 动态显示"过牌"或"跟注 XXX"
│   └── Label (Label)
├── RaiseButton (Button)
│   └── Label (Label)
├── AllInButton (Button)
│   └── Label (Label)
├── RaiseControls (Node)       # 加注控制（可折叠）
│   ├── RaiseSlider (Slider)
│   ├── RaiseInput (InputField)
│   └── QuickRaiseButtons (Node)
│       ├── MinButton
│       ├── HalfPotButton
│       ├── TwoThirdPotButton
│       ├── PotButton
│       └── AllInButton
└── DisabledOverlay (Node)      # 禁用遮罩
```

#### 4.5.2 ActionPanel 脚本

```typescript
// assets/scripts/table/presenters/ActionPanelPresenter.ts

import { _decorator, Component, Button, Label, Slider, input, EditBox, Node } from 'cc'
import { ActionType, LegalAction } from '../../core/types'

const { property } = _decorator

/**
 * 操作面板状态
 */
export interface ActionPanelState {
  canFold: boolean
  canCheck: boolean
  canCall: boolean
  callAmount: number      // 跟注金额
  canRaise: boolean
  minRaiseTo: number      // 最小加注到
  maxRaiseTo: number      // 最大加注到
  canAllIn: boolean
  allInTo: number         // 全下金额
  potAmount: number       // 当前底池
  heroStreetCommit: number // Hero 当前街已下注
  isLocked: boolean       // 是否锁定（动画中）
}

/**
 * 操作面板表现器
 */
export class ActionPanelPresenter extends Component {
  // ========== 按钮 ==========
  @property(Button)
  foldButton!: Button

  @property(Button)
  checkCallButton!: Button

  @property(Button)
  raiseButton!: Button

  @property(Button)
  allInButton!: Button

  // ========== 标签 ==========
  @property(Label)
  checkCallLabel!: Label

  @property(Label)
  raiseLabel!: Label

  @property(Label)
  allInLabel!: Label

  // ========== 加注控制 ==========
  @property(Node)
  raiseControls!: Node

  @property(Slider)
  raiseSlider!: Slider

  @property(EditBox)
  raiseInput!: EditBox

  // ========== 快捷按钮 ==========
  @property(Button)
  minButton!: Button

  @property(Button)
  halfPotButton!: Button

  @property(Button)
  potButton!: Button

  // ========== 禁用遮罩 ==========
  @property(Node)
  disabledOverlay!: Node

  // ========== 回调 ==========
  public onFold?: () => void
  public onCallCheck?: () => void
  public onRaise?: (amountTo: number) => void
  public onAllIn?: () => void

  // ========== 内部状态 ==========
  private _state: ActionPanelState = {
    canFold: false,
    canCheck: false,
    canCall: false,
    callAmount: 0,
    canRaise: false,
    minRaiseTo: 0,
    maxRaiseTo: 0,
    canAllIn: false,
    allInTo: 0,
    potAmount: 0,
    heroStreetCommit: 0,
    isLocked: false
  }

  private _currentRaiseTo: number = 0

  onLoad() {
    this.setupButtonEvents()
    this.raiseControls.active = false
    this.disabledOverlay.active = false
  }

  /**
   * 根据状态渲染操作面板
   */
  render(state: ActionPanelState) {
    this._state = state

    // 锁定状态
    this.disabledOverlay.active = state.isLocked
    this.setButtonsEnabled(!state.isLocked)

    // 弃牌
    this.foldButton.node.active = state.canFold
    this.foldButton.interactable = state.canFold && !state.isLocked

    // 过牌/跟注
    if (state.canCheck) {
      this.checkCallLabel.string = '过牌'
    } else if (state.canCall) {
      this.checkCallLabel.string = `跟注 ${state.callAmount}`
    }
    this.checkCallButton.interactable = (state.canCheck || state.canCall) && !state.isLocked

    // 加注
    if (state.canRaise && state.minRaiseTo > 0) {
      this.raiseLabel.string = `加注到 ${this._currentRaiseTo}`
      this.raiseButton.interactable = !state.isLocked
      this.raiseControls.active = true

      // 更新滑条范围
      this.raiseSlider.min = state.minRaiseTo
      this.raiseSlider.max = state.maxRaiseTo
      this.raiseSlider.progress = (this._currentRaiseTo - state.minRaiseTo) /
                                    (state.maxRaiseTo - state.minRaiseTo)
    } else {
      this.raiseButton.interactable = false
      this.raiseControls.active = false
    }

    // 全下
    if (state.canAllIn) {
      this.allInLabel.string = `全下 ${state.allInTo}`
      this.allInButton.interactable = !state.isLocked
    } else {
      this.allInButton.interactable = false
    }
  }

  /**
   * 显示操作面板
   */
  show() {
    this.node.active = true
  }

  /**
   * 隐藏操作面板
   */
  hide() {
    this.node.active = false
  }

  // ========== 按钮事件 ==========

  private setupButtonEvents() {
    this.foldButton.node.on('click', this.onFoldClick, this)
    this.checkCallButton.node.on('click', this.onCallCheckClick, this)
    this.raiseButton.node.on('click', this.onRaiseClick, this)
    this.allInButton.node.on('click', this.onAllInClick, this)

    // 滑条
    this.raiseSlider.node.on('slide', this.onSliderChange, this)

    // 输入框
    this.raiseInput.node.on('editing-return', this.onInputChange, this)

    // 快捷按钮
    this.minButton.node.on('click', () => this.quickRaise('min'), this)
    this.halfPotButton.node.on('click', () => this.quickRaise('halfPot'), this)
    this.potButton.node.on('click', () => this.quickRaise('pot'), this)
  }

  private onFoldClick() {
    this.onFold?.()
  }

  private onCallCheckClick() {
    this.onCallCheck?.()
  }

  private onRaiseClick() {
    this.onRaise?.(this._currentRaiseTo)
  }

  private onAllInClick() {
    this.onAllIn?.()
  }

  private onSliderChange() {
    const state = this._state
    this._currentRaiseTo = Math.round(
      state.minRaiseTo + this.raiseSlider.progress * (state.maxRaiseTo - state.minRaiseTo)
    )
    this.raiseLabel.string = `加注到 ${this._currentRaiseTo}`
    this.raiseInput.string = String(this._currentRaiseTo)
  }

  private onInputChange() {
    const value = parseInt(this.raiseInput.string)
    if (!isNaN(value)) {
      this._currentRaiseTo = this.clampRaise(value)
      this.raiseSlider.progress = (this._currentRaiseTo - this._state.minRaiseTo) /
                                    (this._state.maxRaiseTo - this._state.minRaiseTo)
    }
  }

  private quickRaise(type: 'min' | 'halfPot' | 'pot') {
    const state = this._state
    const pot = state.potAmount
    const toCall = state.callAmount

    let amountTo: number
    switch (type) {
      case 'min':
        amountTo = state.minRaiseTo
        break
      case 'halfPot':
        amountTo = toCall + Math.floor(pot * 0.5)
        break
      case 'pot':
        amountTo = toCall + pot
        break
    }

    this._currentRaiseTo = this.clampRaise(amountTo)
    this.raiseLabel.string = `加注到 ${this._currentRaiseTo}`
    this.raiseInput.string = String(this._currentRaiseTo)
  }

  private clampRaise(value: number): number {
    const state = this._state
    return Math.max(state.minRaiseTo, Math.min(state.maxRaiseTo, value))
  }

  private setButtonsEnabled(enabled: boolean) {
    this.foldButton.interactable = enabled && this._state.canFold
    this.checkCallButton.interactable = enabled && (this._state.canCheck || this._state.canCall)
    this.raiseButton.interactable = enabled && this._state.canRaise
    this.allInButton.interactable = enabled && this._state.canAllIn
  }
}
```

---

## 第五部分：状态管理与数据流

### 5.1 TableStateStore 全局状态存储

```typescript
// assets/scripts/table/state/TableStateStore.ts

import { TableSnapshot, TableEvent, ActionRequest, ActionRejected } from '../../core/types'

/**
 * 牌桌状态存储
 * 这是整个牌桌的唯一数据来源
 */
export class TableStateStore {
  // ========== 状态 ==========
  private _snapshot: TableSnapshot | null = null
  private _version: number = 0
  private _connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected'
  private _pendingEvents: TableEvent[] = []
  private _animationLock: boolean = false
  private _lastError: string | null = null

  // ========== 回调 ==========
  public onSnapshotUpdate?: (snapshot: TableSnapshot) => void
  public onEvent?: (event: TableEvent) => void
  public onConnectionChange?: (state: string) => void
  public onError?: (error: string) => void
  public onAnimationLockChange?: (locked: boolean) => void

  // ========== Getter ==========

  get snapshot(): TableSnapshot | null {
    return this._snapshot
  }

  get version(): number {
    return this._version
  }

  get connectionState(): string {
    return this._connectionState
  }

  get isConnected(): boolean {
    return this._connectionState === 'connected'
  }

  get animationLock(): boolean {
    return this._animationLock
  }

  get lastError(): string | null {
    return this._lastError
  }

  /**
   * 获取 Hero 的座位号
   */
  get heroSeatNo(): number | null {
    return this._snapshot?.self?.seatNo ?? null
  }

  /**
   * 获取 Hero 的合法动作
   */
  get legalActions() {
    return this._snapshot?.self?.legalActions || []
  }

  /**
   * 是否轮到自己行动
   */
  get isMyTurn(): boolean {
    return this._snapshot?.toActSeat === this._snapshot?.self?.seatNo
  }

  // ========== Setter ==========

  /**
   * 更新快照（全量替换）
   */
  setSnapshot(snapshot: TableSnapshot) {
    const oldVersion = this._version
    this._snapshot = snapshot
    this._version = snapshot.version
    this._lastError = null

    // 版本回退检测
    if (snapshot.version < oldVersion) {
      console.warn(`Version rolled back: ${oldVersion} -> ${snapshot.version}`)
    }

    this.onSnapshotUpdate?.(snapshot)
  }

  /**
   * 添加事件到队列
   */
  addEvent(event: TableEvent) {
    this._pendingEvents.push(event)
    this._version = event.version
    this.onEvent?.(event)
  }

  /**
   * 获取并清空事件队列
   */
  consumeEvents(): TableEvent[] {
    const events = [...this._pendingEvents]
    this._pendingEvents = []
    return events
  }

  /**
   * 设置连接状态
   */
  setConnectionState(state: 'disconnected' | 'connecting' | 'connected') {
    this._connectionState = state
    this.onConnectionChange?.(state)
  }

  /**
   * 设置动画锁
   */
  setAnimationLock(locked: boolean) {
    this._animationLock = locked
    this.onAnimationLockChange?.(locked)
  }

  /**
   * 设置错误
   */
  setError(error: string) {
    this._lastError = error
    this.onError?.(error)
  }

  /**
   * 清空错误
   */
  clearError() {
    this._lastError = null
  }

  /**
   * 重置状态
   */
  reset() {
    this._snapshot = null
    this._version = 0
    this._pendingEvents = []
    this._animationLock = false
    this._lastError = null
    this._connectionState = 'disconnected'
  }
}

// 单例
export const tableStateStore = new TableStateStore()
```

### 5.2 TablePresenter 主场景控制器

```typescript
// assets/scripts/table/presenters/TablePresenter.ts

import { _decorator, Component, Node, resources } from 'cc'
import { TableStateStore, tableStateStore } from '../state/TableStateStore'
import { TableSnapshot, TableEvent, ActionRequest } from '../../core/types'
import { SeatPresenter } from './SeatPresenter'
import { BoardPresenter } from './BoardPresenter'
import { HeroHandPresenter } from './HeroHandPresenter'
import { ActionPanelPresenter, ActionPanelState } from './ActionPanelPresenter'

const { property } = _decorator

/**
 * 牌桌主控制器
 * 负责协调各个子 Presenters
 */
export class TablePresenter extends Component {
  // ========== 子 Presenters ==========
  @property([SeatPresenter])
  seatPresenters!: SeatPresenter[]

  @property(BoardPresenter)
  boardPresenter!: BoardPresenter

  @property(HeroHandPresenter)
  heroHandPresenter!: HeroHandPresenter

  @property(ActionPanelPresenter)
  actionPanelPresenter!: ActionPanelPresenter

  // ========== 状态 ==========
  private store: TableStateStore = tableStateStore

  onLoad() {
    this.setupStoreCallbacks()
    this.initializeSeats()
  }

  start() {
    // 模拟连接（开发阶段）
    this.simulateSnapshot()
  }

  /**
   * 设置 Store 回调
   */
  private setupStoreCallbacks() {
    this.store.onSnapshotUpdate = this.onSnapshotUpdate.bind(this)
    this.store.onEvent = this.onEvent.bind(this)
    this.store.onAnimationLockChange = this.onAnimationLockChange.bind(this)
    this.store.onError = this.onError.bind(this)
  }

  /**
   * 初始化座位
   */
  private initializeSeats() {
    for (const seat of this.seatPresenters) {
      seat.init(seat.seatNo)
    }
  }

  /**
   * 快照更新回调
   */
  private onSnapshotUpdate(snapshot: TableSnapshot) {
    // 1. 更新座位
    for (const seatState of snapshot.seats) {
      const presenter = this.seatPresenters[seatState.seatNo]
      if (presenter) {
        const isHero = seatState.seatNo === snapshot.self?.seatNo
        presenter.render(seatState, isHero)
      }
    }

    // 2. 更新公共牌
    this.boardPresenter.render(snapshot.board)

    // 3. 更新 Hero 手牌
    if (snapshot.self?.holeCards) {
      this.heroHandPresenter.showFront(snapshot.self.holeCards)
    }

    // 4. 更新操作面板
    if (snapshot.self && snapshot.toActSeat === snapshot.self.seatNo) {
      this.renderActionPanel(snapshot)
      this.actionPanelPresenter.show()
    } else {
      this.actionPanelPresenter.hide()
    }
  }

  /**
   * 事件回调
   */
  private async onEvent(event: TableEvent) {
    // 设置动画锁
    this.store.setAnimationLock(true)

    try {
      switch (event.type) {
        case 'HAND_STARTED':
          await this.onHandStarted(event)
          break
        case 'CARDS_DEALT':
          await this.onCardsDealt(event)
          break
        case 'BOARD_DEALT':
          await this.onBoardDealt(event)
          break
        case 'ACTION_APPLIED':
          await this.onActionApplied(event)
          break
        case 'SHOWDOWN_REVEAL':
          await this.onShowdownReveal(event)
          break
        case 'POT_AWARDED':
          await this.onPotAwarded(event)
          break
        case 'HAND_FINISHED':
          await this.onHandFinished(event)
          break
      }
    } finally {
      // 释放动画锁
      this.store.setAnimationLock(false)
    }
  }

  /**
   * 渲染操作面板
   */
  private renderActionPanel(snapshot: TableSnapshot): void {
    const self = snapshot.self!
    const legalActions = self.legalActions

    const state: ActionPanelState = {
      canFold: legalActions.some(a => a.type === 'FOLD'),
      canCheck: legalActions.some(a => a.type === 'CHECK'),
      canCall: legalActions.some(a => a.type === 'CALL'),
      callAmount: legalActions.find(a => a.type === 'CALL')?.toCall || 0,
      canRaise: legalActions.some(a => a.type === 'RAISE' || a.type === 'BET'),
      minRaiseTo: Math.max(
        legalActions.find(a => a.type === 'RAISE')?.minAmountTo || 0,
        legalActions.find(a => a.type === 'BET')?.minAmountTo || 0
      ),
      maxRaiseTo: Math.max(
        legalActions.find(a => a.type === 'RAISE')?.maxAmountTo || 0,
        legalActions.find(a => a.type === 'BET')?.maxAmountTo || 0
      ),
      canAllIn: legalActions.some(a => a.type === 'ALL_IN'),
      allInTo: legalActions.find(a => a.type === 'ALL_IN')?.maxAmountTo || 0,
      potAmount: snapshot.potTotal,
      heroStreetCommit: snapshot.seats[self.seatNo]?.streetCommit || 0,
      isLocked: this.store.animationLock
    }

    this.actionPanelPresenter.render(state)

    // 设置按钮回调
    this.actionPanelPresenter.onFold = () => this.sendAction('FOLD')
    this.actionPanelPresenter.onCallCheck = () => this.sendAction('CALL')
    this.actionPanelPresenter.onRaise = (amount) => this.sendAction('RAISE', amount)
    this.actionPanelPresenter.onAllIn = () => this.sendAction('ALL_IN')
  }

  /**
   * 发送动作
   */
  private sendAction(actionType: string, amountTo?: number) {
    const snapshot = this.store.snapshot
    if (!snapshot || !snapshot.self) return

    const request: ActionRequest = {
      requestId: `req_${Date.now()}`,
      tableId: snapshot.tableId,
      handId: snapshot.handId,
      expectedVersion: snapshot.version,
      action: actionType as any,
      amountTo
    }

    // TODO: 发送到网络层
    console.log('Send action:', request)
  }

  // ========== 事件处理 ==========

  private async onHandStarted(event: any) {
    // 清空公共牌
    this.boardPresenter.render([])

    // 清空所有座位状态
    for (const seat of this.seatPresenters) {
      // 重置状态
    }
  }

  private async onCardsDealt(event: any) {
    // 发牌动画由 CARDS_DEALT 事件触发
  }

  private async onBoardDealt(event: any) {
    const { street, cards } = event

    if (street === 'FLOP') {
      await this.boardPresenter.dealFlop(cards)
    } else if (street === 'TURN') {
      await this.boardPresenter.dealTurn(cards[0])
    } else if (street === 'RIVER') {
      await this.boardPresenter.dealRiver(cards[0])
    }
  }

  private async onActionApplied(event: any) {
    // 显示动作提示
    const seat = this.seatPresenters[event.seatNo]
    const actionText = this.formatActionText(event.action, event.amount)
    seat?.showActionBadge(actionText)

    // 筹码飞行动画
    // await this.playChipFlyAnimation(event.seat)
  }

  private async onShowdownReveal(event: any) {
    // 摊牌动画
  }

  private async onPotAwarded(event: any) {
    // 派奖动画
  }

  private async onHandFinished(event: any) {
    // 显示摊牌面板
  }

  private onAnimationLockChange(locked: boolean) {
    // 可以显示/隐藏加载动画
  }

  private onError(error: string) {
    // 显示错误 Toast
    console.error('Table error:', error)
  }

  // ========== 开发辅助 ==========

  private simulateSnapshot() {
    // 模拟一个快照（开发阶段使用）
    const snapshot: TableSnapshot = {
      tableId: 'table_1',
      handId: 1,
      phase: 'BETTING_PRE_FLOP',
      street: 'PRE_FLOP',
      dealerSeat: 0,
      sbSeat: 1,
      bbSeat: 2,
      toActSeat: 3,
      potTotal: 150,
      board: [],
      pots: [{ potId: 'main', amount: 150 }],
      seats: [
        { seatNo: 0, nickname: 'Hero', stack: 1900, currentBet: 100, totalBet: 100, isSeated: true, isInHand: true, hasFolded: false, isAllIn: false, role: 'BTN', status: 'WAITING' },
        { seatNo: 1, nickname: 'AI 1', stack: 1900, currentBet: 50, totalBet: 50, isSeated: true, isInHand: true, hasFolded: false, isAllIn: false, role: 'SB', status: 'WAITING' },
        { seatNo: 2, nickname: 'AI 2', stack: 1900, currentBet: 100, totalBet: 100, isSeated: true, isInHand: true, hasFolded: false, isAllIn: false, role: 'BB', status: 'WAITING' },
        { seatNo: 3, nickname: 'AI 3', stack: 2000, currentBet: 0, totalBet: 0, isSeated: true, isInHand: true, hasFolded: false, isAllIn: false, role: null, status: 'ACTING' },
        { seatNo: 4, nickname: 'AI 4', stack: 2000, currentBet: 0, totalBet: 0, isSeated: true, isInHand: true, hasFolded: false, isAllIn: false, role: null, status: 'IDLE' },
        { seatNo: 5, nickname: 'AI 5', stack: 2000, currentBet: 0, totalBet: 0, isSeated: true, isInHand: false, hasFolded: true, isAllIn: false, role: null, status: 'IDLE' }
      ],
      version: 1,
      self: {
        seatNo: 0,
        holeCards: [
          { suit: 'Spade', rank: 14 },
          { suit: 'Heart', rank: 13 }
        ],
        legalActions: [
          { type: 'FOLD' },
          { type: 'CALL', toCall: 100 },
          { type: 'RAISE', minAmountTo: 200, maxAmountTo: 1900 }
        ]
      }
    }

    this.store.setSnapshot(snapshot)
  }

  private formatActionText(action: string, amount: number): string {
    const map: Record<string, string> = {
      'FOLD': '弃牌',
      'CHECK': '过牌',
      'CALL': `跟注 ${amount}`,
      'BET': `下注 ${amount}`,
      'RAISE': `加注 ${amount}`,
      'ALL_IN': `全下 ${amount}`
    }
    return map[action] || action
  }
}
```

---

## 第六部分：资源管理

### 6.1 资源目录结构

```
assets/
└── resources/
    ├── poker/
    │   ├── back.png                    # 牌背
    │   ├── Spade/
    │   │   ├── Spade_2.png ... Spade_14.png
    │   ├── Heart/
    │   │   ├── Heart_2.png ... Heart_14.png
    │   ├── Diamond/
    │   │   ├── Diamond_2.png ... Diamond_14.png
    │   └── Club/
    │       ├── Club_2.png ... Club_14.png
    │
    ├── avatar/
    │   ├── avatar_1.png ... avatar_8.png
    │   └── default.png
    │
    ├── chip/
    │   ├── chip_50.png
    │   ├── chip_100.png
    │   ├── chip_500.png
    │   └── chip_1000.png
    │
    ├── material/
    │   ├── seat/
    │   │   ├── BTN.png
    │   │   ├── SB.png
    │   │   └── BB.png
    │   ├── table/
    │   │   └── table_green.png
    │   └── button/
    │       ├── btn_normal.png
    │       ├── btn_pressed.png
    │       └── btn_disabled.png
    │
    └── audio/
        ├── card_place.mp3
        ├── chip_stack.mp3
        └── button_click.mp3
```

### 6.2 资源加载方式

```typescript
// assets/scripts/common/ResourceManager.ts

import { resources, SpriteFrame, AudioClip, _decorator, Component } from 'cc'

const { property } = _decorator

/**
 * 资源管理器
 * 统一管理所有资源的加载
 */
export class ResourceManager extends Component {
  // 单例
  static instance: ResourceManager

  // 缓存
  private spriteFrameCache: Map<string, SpriteFrame> = new Map()
  private audioCache: Map<string, AudioClip> = new Map()

  onLoad() {
    ResourceManager.instance = this
  }

  /**
   * 加载单张扑克牌
   */
  loadCard(suit: string, rank: number): Promise<SpriteFrame> {
    const key = `${suit}_${rank}`
    return this.loadSpriteFrame(`pokers/${suit}/${key}`)
  }

  /**
   * 加载牌背
   */
  loadCardBack(): Promise<SpriteFrame> {
    return this.loadSpriteFrame('pokers/back')
  }

  /**
   * 加载头像
   */
  loadAvatar(index: number): Promise<SpriteFrame> {
    return this.loadSpriteFrame(`avatar/avatar_${index}`)
  }

  /**
   * 加载筹码
   */
  loadChip(value: number): Promise<SpriteFrame> {
    return this.loadSpriteFrame(`chip/chip_${value}`)
  }

  /**
   * 加载座位标记
   */
  loadSeatMarker(role: 'BTN' | 'SB' | 'BB'): Promise<SpriteFrame> {
    return this.loadSpriteFrame(`material/seat/${role}`)
  }

  /**
   * 通用 SpriteFrame 加载
   */
  loadSpriteFrame(path: string): Promise<SpriteFrame> {
    // 缓存命中
    if (this.spriteFrameCache.has(path)) {
      return Promise.resolve(this.spriteFrameCache.get(path)!)
    }

    return new Promise((resolve, reject) => {
      resources.load(path, SpriteFrame, (err, frame) => {
        if (err) {
          console.error(`Failed to load sprite: ${path}`, err)
          reject(err)
          return
        }

        this.spriteFrameCache.set(path, frame!)
        resolve(frame!)
      })
    })
  }

  /**
   * 通用 AudioClip 加载
   */
  loadAudio(path: string): Promise<AudioClip> {
    if (this.audioCache.has(path)) {
      return Promise.resolve(this.audioCache.get(path)!)
    }

    return new Promise((resolve, reject) => {
      resources.load(path, AudioClip, (err, clip) => {
        if (err) {
          console.error(`Failed to load audio: ${path}`, err)
          reject(err)
          return
        }

        this.audioCache.set(path, clip!)
        resolve(clip!)
      })
    })
  }

  /**
   * 批量预加载
   */
  preloadBatch(paths: string[]): Promise<void[]> {
    return Promise.all(paths.map(p => this.loadSpriteFrame(p)))
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.spriteFrameCache.clear()
    this.audioCache.clear()
  }
}
```

---

## 第七部分：动画系统

### 7.1 使用 Cocos 的 tween 动画

```typescript
import { tween, Vec3, Tween } from 'cc'

/**
 * 发牌飞行动画
 */
async function dealCardFly(
  cardNode: Node,
  from: Vec3,
  to: Vec3,
  duration: number = 0.3
): Promise<void> {
  return new Promise(resolve => {
    cardNode.position = from.clone()
    cardNode.active = true

    tween(cardNode)
      .to(duration, { position: to }, {
        easing: 'quartOut',
        onUpdate: (target, ratio) => {
          // 可以添加贝塞尔曲线偏移
          // target.position.y += Math.sin(ratio * Math.PI) * 50
        }
      })
      .call(resolve)
      .start()
  })
}

/**
 * 翻牌动画
 */
async function flipCard(cardNode: Node): Promise<void> {
  return new Promise(resolve => {
    const startScale = cardNode.scale.clone()

    tween(cardNode)
      .to(0.15, { scale: new Vec3(0, 1, 1) })
      .call(() => {
        // 切换牌面图片
        // cardNode.getComponent(Sprite).spriteFrame = newFrame
      })
      .to(0.15, { scale: new Vec3(1, 1, 1) })
      .call(resolve)
      .start()
  })
}

/**
 * 筹码飞行动画
 */
async function chipFly(
  chipNode: Node,
  from: Vec3,
  to: Vec3,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise(resolve => {
    chipNode.position = from.clone()
    chipNode.active = true

    // 使用贝塞尔曲线的简单实现
    const controlPoint = new Vec3(
      (from.x + to.x) / 2,
      Math.max(from.y, to.y) + 100,
      0
    )

    tween({ t: 0 })
      .to(0.5, { t: 1 }, {
        easing: 'sineOut',
        onUpdate: (target) => {
          const t = target.t

          // 二次贝塞尔曲线
          const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * controlPoint.x + t * t * to.x
          const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * controlPoint.y + t * t * to.y

          chipNode.position = new Vec3(x, y, 0)

          onProgress?.(t)
        }
      })
      .call(() => {
        chipNode.active = false
        resolve()
      })
      .start()
  })
}

/**
 * 脉冲动画（用于高亮）
 */
function pulseHighlight(node: Node): void {
  const originalScale = node.scale.clone()

  tween(node)
    .to(0.15, { scale: originalScale.clone().multiplyScalar(1.1) })
    .to(0.15, { scale: originalScale })
    .union(2)
    .repeat(2)
    .start()
}
```

### 7.2 动画序列管理器

```typescript
// assets/scripts/table/animation/AnimationDirector.ts

import { Node, Vec3, tween } from 'cc'
import { TableEvent, Card } from '../../core/types'
import { ResourceManager } from '../../common/ResourceManager'

/**
 * 动画导演
 * 负责协调所有动画的播放顺序
 */
export class AnimationDirector {
  private resourceManager: ResourceManager

  constructor() {
    this.resourceManager = ResourceManager.instance
  }

  /**
   * 播放一手牌的完整动画序列
   */
  async playHandEvents(events: TableEvent[], context: AnimationContext): Promise<void> {
    for (const event of events) {
      await this.playEvent(event, context)
    }
  }

  /**
   * 播放单个事件
   */
  async playEvent(event: TableEvent, context: AnimationContext): Promise<void> {
    switch (event.type) {
      case 'CARDS_DEALT':
        await this.playDealHoleCards(event, context)
        break
      case 'BOARD_DEALT':
        await this.playDealBoard(event, context)
        break
      case 'ACTION_APPLIED':
        await this.playChipMove(event, context)
        break
      case 'SHOWDOWN_REVEAL':
        await this.playShowdownReveal(event, context)
        break
      case 'POT_AWARDED':
        await this.playPotAwarded(event, context)
        break
      default:
        // 其他事件直接略过
        break
    }
  }

  private async playDealHoleCards(event: any, context: AnimationContext): Promise<void> {
    // 每张牌间隔 80ms
    let delay = 0
    for (const seatNo of event.seats) {
      context.seatDealAnimation(seatNo, delay)
      delay += 80
    }
    await this.sleep(delay + 200)
  }

  private async playDealBoard(event: any, context: AnimationContext): Promise<void> {
    const { street, cards } = event

    if (street === 'FLOP') {
      await context.boardPresenter.dealFlop(cards)
    } else if (street === 'TURN') {
      await context.boardPresenter.dealTurn(cards[0])
    } else if (street === 'RIVER') {
      await context.boardPresenter.dealRiver(cards[0])
    }
  }

  private async playChipMove(event: any, context: AnimationContext): Promise<void> {
    const { seatNo, amount } = event
    if (amount > 0) {
      await context.chipFlyAnimation(seatNo, amount)
    }
  }

  private async playShowdownReveal(event: any, context: AnimationContext): Promise<void> {
    await context.showdownRevealAnimation(event.seatNo, event.cards)
  }

  private async playPotAwarded(event: any, context: AnimationContext): Promise<void> {
    await context.potAwardedAnimation(event.winners, event.amount)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 动画上下文
 * 提供动画需要的 UI 控制器
 */
export interface AnimationContext {
  seatDealAnimation(seatNo: number, delayMs: number): Promise<void>
  boardPresenter: any
  chipFlyAnimation(seatNo: number, amount: number): Promise<void>
  showdownRevealAnimation(seatNo: number, cards: Card[]): Promise<void>
  potAwardedAnimation(winners: number[], amount: number): Promise<void>
}
```

---

## 第八部分：网络层基础（占位）

### 8.1 WebSocket 网关

```typescript
// assets/scripts/network/TableGateway.ts

import { TableSnapshot, TableEvent, ActionRequest, ActionRejected } from '../../core/types'

/**
 * WebSocket 连接状态
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/**
 * 牌桌网关
 * 负责 WebSocket 通信
 */
export class TableGateway {
  private ws: WebSocket | null = null
  private url: string = ''
  private state: ConnectionState = 'disconnected'

  // 回调
  public onOpen?: () => void
  public onClose?: () => void
  public onError?: (error: Event) => void
  public onSnapshot?: (snapshot: TableSnapshot) => void
  public onEvent?: (event: TableEvent) => void
  public onActionRejected?: (rejected: ActionRejected) => void
  public onStateChange?: (state: ConnectionState) => void

  /**
   * 连接
   */
  connect(url: string): void {
    this.url = url
    this.state = 'connecting'
    this.onStateChange?.(this.state)

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.state = 'connected'
      this.onStateChange?.(this.state)
      this.onOpen?.()
    }

    this.ws.onclose = () => {
      this.state = 'disconnected'
      this.onStateChange?.(this.state)
      this.onClose?.()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.onError?.(error)
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data))
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.ws?.close()
    this.ws = null
    this.state = 'disconnected'
  }

  /**
   * 订阅牌桌
   */
  subscribe(tableId: string): void {
    this.send('table.subscribe', { tableId })
  }

  /**
   * 发送动作
   */
  sendAction(request: ActionRequest): void {
    this.send('table.action', request)
  }

  /**
   * 发送准备
   */
  ready(tableId: string): void {
    this.send('table.ready', { tableId })
  }

  /**
   * 发送消息
   */
  private send(type: string, payload: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected')
      return
    }

    this.ws.send(JSON.stringify({
      type,
      payload,
      requestId: `req_${Date.now()}`,
      ts: Date.now()
    }))
  }

  /**
   * 处理接收消息
   */
  private handleMessage(message: { type: string; payload: any }): void {
    switch (message.type) {
      case 'table.snapshot':
        this.onSnapshot?.(message.payload)
        break
      case 'table.event':
        this.onEvent?.(message.payload)
        break
      case 'table.actionRejected':
        this.onActionRejected?.(message.payload)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }
}
```

---

## 第九部分：项目配置

### 9.1 项目设置

在 Cocos Creator 中配置：

1. **项目 → 项目设置**
2. **模块设置**：
   - 启用 Physics（物理）
   - 启用 Audio（音频）
   - 启用 3D（如果需要）

3. **构建配置**：
   - 平台：Web（首选）、iOS、Android
   - 调试模式：开发时启用，发布时关闭

### 9.2 TypeScript 配置

确保 `tsconfig.json` 正确配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["assets/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 第十部分：测试与调试

### 10.1 运行项目

1. 点击 Cocos Creator 工具栏的 **Play** 按钮
2. 或者使用快捷键 **Ctrl + R** (Windows) / **Cmd + R** (Mac)

### 10.2 调试技巧

```typescript
// 在代码中添加调试日志
console.log('[TablePresenter] Snapshot:', snapshot)

// 查看节点结构
console.log('Node children:', this.node.children.map(n => n.name))

// 查看组件
console.log('Components:', this.node.getComponents(Component).map(c => c.constructor.name))
```

### 10.3 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `Cannot read property 'xxx' of null` | 节点未找到 | 检查 @property 绑定是否正确 |
| `resources load failed` | 资源路径错误 | 检查 resources/ 目录结构 |
| `WebSocket connection failed` | 网络未连接 | 检查 URL 和服务器状态 |
| `Type error: xxx is not assignable` | 类型不匹配 | 检查属性类型声明 |

---

## 总结：开发流程

### 快速开始步骤

1. **创建项目**
   ```
   Cocos Creator → New Project → Empty Project
   ```

2. **创建目录结构**
   ```
   assets/scripts/core/types/
   assets/scripts/table/presenters/
   assets/prefabs/
   ```

3. **复制类型定义**
   - 从 Vue 项目的 `src/game/types/` 复制到 `assets/scripts/core/types/`

4. **创建 Prefabs**
   - 按第四部分创建 Seat、Board、ActionPanel 等 Prefab

5. **编写脚本**
   - 为每个 Prefab 编写对应的 Presenter 脚本

6. **组装场景**
   - 在 Table 场景中组合所有 Prefab

7. **运行测试**
   - 点击 Play 按钮运行

8. **逐步完善**
   - 先让静态 UI 显示正确
   - 再添加动画
   - 最后接入网络

---

## 附录：Vue 项目与 Cocos 对照表

| Vue 项目概念 | Cocos Creator 对应 |
|-------------|-------------------|
| Component (.vue) | Prefab + Script |
| Props | @property |
| Emit | Event / Callback |
| computed | getter 方法 |
| watch | onLoad / 自定义监听 |
| Vuex / Pinia | 自定义 Store 类 |
| Router | Scene 切换 |
| slot | 节点嵌套 |
| v-if / v-show | node.active |
| v-for | for 循环创建节点 |
| style scoped | 每个 Prefab 独立样式 |
| 动态图片 :src | sprite.spriteFrame |
| 动画 transition | tween 动画 |
| 生命周期 mounted | onLoad / start |
| 生命周期 updated | update 方法 |

---

*本文档基于 Vue 德州扑克项目生成，旨在帮助 Cocos 小白快速上手移植工作。*
