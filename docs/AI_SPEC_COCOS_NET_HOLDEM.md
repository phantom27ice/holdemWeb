# AI 编程 Spec：在现有 Cocos 项目中复刻联网德州扑克牌桌

## 1. 任务定义

基于现有 Vue 德州扑克项目的业务结构，在**已有 Cocos Creator 项目**中实现一个联网牌桌版本。目标不是复刻 Vue 技术栈，而是复刻：

1. 规则表现
2. 状态结构
3. 交互流程
4. 动画节奏
5. 前后端协议

## 2. 目标结果

AI 完成后，Cocos 项目应具备：

1. 6 人桌牌桌场景。
2. 座位、公共牌、Hero 手牌、底池、操作面板、摊牌面板。
3. 基于服务端快照刷新 UI。
4. 基于服务端事件播放发牌/下注/派奖动画。
5. 通过 WebSocket 完成真实对局。
6. 支持断线重连与快照纠偏。

## 3. 绝对约束

### 3.1 规则真值必须在服务端

AI 不得把下注合法性、牌局推进、边池结算写在 Cocos UI 里。客户端只能：

1. 展示服务端下发状态。
2. 发送动作请求。
3. 处理动作失败与重连。

### 3.2 不得直接照搬 Vue 响应式写法

不要把 Pinia/Vue 的写法原样翻译到 Cocos。必须改成：

1. `Store/State`
2. `Presenter`
3. `Controller`
4. `AnimationDirector`

### 3.3 UI 脚本不能兼任网络层和规则层

例如：

1. `SeatPresenter` 只管座位显示。
2. `ActionPanelPresenter` 只管按钮与滑条。
3. `TableGateway` 只管收发消息。
4. `TableStateStore` 只管保存最新快照和版本号。

### 3.4 所有输入行为必须走统一 action 出口

所有按钮点击最后都必须汇聚到：

1. `sendAction(actionType, amountTo?)`

不要在多个按钮回调里各自拼协议、各自校验。

## 4. 来源映射

AI 必须参考当前 Vue 项目中的以下来源关系：

### 4.1 规则和类型来源

1. `src/game/engine/`
2. `src/game/types/index.ts`
3. `src/game/ui/showdownFormatter.ts`

### 4.2 牌桌结构来源

1. `src/components/table/TableScene.vue`
2. `src/components/table/SeatView.vue`
3. `src/components/table/BoardCards.vue`
4. `src/components/table/HoleCards.vue`
5. `src/components/table/PotBar.vue`
6. `src/components/table/ActionPanel.vue`
7. `src/components/table/ChipFlyLayer.vue`
8. `src/components/table/DealCardLayer.vue`
9. `src/components/table/ShowdownPanel.vue`

### 4.3 本地单机流程来源

1. `src/stores/tableStore.ts`

注意：

1. 只能借鉴它的状态编排结构。
2. 不能保留它的“本地真值 + 本地 AI + 本地超时推进”。

## 5. 建议的目标目录

AI 在已有 Cocos 项目中应优先组织成类似结构：

```text
assets/
├─ scenes/
│  └─ TableScene.scene
├─ prefabs/
│  ├─ table/
│  ├─ effect/
│  └─ common/
├─ resources/
│  ├─ poker/
│  ├─ avatar/
│  ├─ chip/
│  └─ ui/
└─ scripts/
   ├─ core/
   ├─ protocol/
   ├─ network/
   ├─ table/
   │  ├─ controllers/
   │  ├─ presenters/
   │  ├─ state/
   │  ├─ animation/
   │  └─ adapters/
   └─ common/
```

如果现有项目已有规范目录，应优先适配现有目录，而不是强行重建。

## 6. 必须产出的核心模块

### 6.1 共享协议与状态

AI 必须先落以下类型：

1. `TableSnapshot`
2. `PlayerPublicState`
3. `SelfPrivateState`
4. `PotView`
5. `LegalAction`
6. `TurnTimerState`
7. `ActionRequest`
8. `ServerEventEnvelope`
9. `ActionRejected`

### 6.2 客户端 Store

AI 必须有一个统一的桌面状态入口，例如：

1. `TableStateStore`

它至少应保存：

1. `snapshot`
2. `version`
3. `connectionState`
4. `pendingEvents`
5. `animationLock`
6. `lastError`

### 6.3 协议适配器

AI 必须实现：

1. `TableSnapshotAdapter`
2. `EventToAnimationAdapter`
3. `LegalActionAdapter`

职责分别是：

1. 把协议快照变成 UI ViewModel。
2. 把事件批次变成动画命令。
3. 把合法动作变成操作面板状态。

### 6.4 网络网关

AI 必须实现：

1. `TableGateway`

要求：

1. 负责连接、鉴权、订阅、断线重连。
2. 负责消息序号与版本处理。
3. 负责心跳与超时。

### 6.5 动画导演

AI 必须实现：

1. `AnimationDirector`

职责：

1. 顺序执行 `deal -> board -> chip -> showdown -> payout`。
2. 在动画期间设置输入锁。
3. 动画完成后发出回调。

### 6.6 预制体 presenter

至少需要：

1. `SeatPresenter`
2. `BoardPresenter`
3. `HeroHandPresenter`
4. `PotPresenter`
5. `ActionPanelPresenter`
6. `ShowdownPanelPresenter`
7. `ToastPresenter`

## 7. 预制体实施规则

### 7.1 SeatPrefab

必须支持：

1. 头像
2. 昵称
3. 记分牌/筹码
4. 当前下注额
5. 庄位标记
6. 行动高亮
7. 弃牌/全下状态
8. 行为提示
9. 倒计时
10. 发牌与筹码动画锚点

### 7.2 ActionPanelPrefab

必须支持：

1. Fold
2. Check / Call
3. Raise
4. All-in
5. Raise 滑条
6. 快捷加注按钮

必须遵守：

1. 不计算合法性。
2. 只消费 `ActionPanelState`。
3. 对输入值做客户端夹取，但最终以服务端为准。

### 7.3 Effect Prefab

必须支持：

1. 发牌飞行动画
2. 烧牌动画
3. 翻牌动画
4. 飞筹码动画
5. 派奖动画

建议：

1. 使用对象池。
2. 动画节点与业务节点分层。

## 8. 前后端协议 Spec

## 8.1 HTTP

AI 若负责前端接入，至少要预留以下调用：

1. `POST /api/auth/guest-login`
2. `GET /api/lobby/rooms`
3. `POST /api/lobby/rooms`
4. `POST /api/lobby/rooms/{roomId}/join`
5. `GET /api/tables/{tableId}/snapshot`

## 8.2 WebSocket Client -> Server

AI 必须支持发送：

1. `session.resume`
2. `table.subscribe`
3. `table.seat-sit`
4. `table.seat-stand`
5. `table.ready`
6. `table.action`
7. `table.auto-action`
8. `ping`

`table.action` 示例：

```json
{
  "type": "table.action",
  "requestId": "req_1001",
  "tableId": "table_01",
  "handId": 25,
  "payload": {
    "action": "RAISE",
    "amountTo": 600,
    "expectedVersion": 108
  }
}
```

## 8.3 WebSocket Server -> Client

AI 必须支持接收：

1. `table.snapshot`
2. `table.event-batch`
3. `table.turn`
4. `table.action-rejected`
5. `table.player-joined`
6. `table.player-left`
7. `table.reconnect-required`
8. `pong`

## 8.4 错误处理

必须标准化处理以下错误码：

1. `NOT_YOUR_TURN`
2. `INVALID_AMOUNT`
3. `ACTION_NOT_ALLOWED`
4. `VERSION_EXPIRED`
5. `TABLE_NOT_FOUND`
6. `ROOM_FULL`
7. `RECONNECT_EXPIRED`

收到错误后必须：

1. 给用户 toast。
2. 必要时强制拉最新快照。

## 9. 实施顺序

AI 必须按以下顺序执行，不允许跳阶段硬写大一统功能。

### Step 1：抽离共享核心

交付：

1. 复制或抽取德州规则类型与引擎。
2. 让它脱离 Vue/Vite 依赖。
3. 补齐运行示例与测试。

完成标准：

1. Node 可直接调用。
2. Cocos 工程可只读引用类型。

### Step 2：定义协议

交付：

1. `TableSnapshot`
2. `ActionRequest`
3. `ServerEventEnvelope`
4. `ActionRejected`

完成标准：

1. 客户端和服务端都引用同一套定义。

### Step 3：搭建 Cocos 牌桌骨架

交付：

1. `TableScene`
2. `SeatPrefab`
3. `BoardAreaPrefab`
4. `HeroHandPrefab`
5. `PotBarPrefab`
6. `ActionPanelPrefab`

完成标准：

1. 使用本地 mock snapshot 可以完整展示牌桌。

### Step 4：快照驱动渲染

交付：

1. `TableStateStore`
2. `TableSnapshotAdapter`
3. 各 presenter 的 `render(viewData)` 入口

完成标准：

1. 替换任意快照后，界面刷新正确。

### Step 5：动作发送闭环

交付：

1. ActionPanel 按钮接入 `sendAction`
2. `table.action` 协议发送
3. `table.action-rejected` 提示

完成标准：

1. Hero 可以完成 Fold/Check/Call/Raise/All-in。

### Step 6：事件动画闭环

交付：

1. `EventToAnimationAdapter`
2. `AnimationDirector`
3. 发牌、翻牌、飞筹码、派奖、摊牌表现

完成标准：

1. `event-batch` 能按顺序驱动所有关键动画。

### Step 7：重连与纠偏

交付：

1. `session.resume`
2. 版本追帧
3. 全量快照恢复
4. 重连遮罩

完成标准：

1. 模拟断网后可恢复到正确局面。

## 10. AI 编码时的硬性实现细则

### 10.1 状态更新规则

1. 收到 `table.snapshot`：直接替换当前真值快照。
2. 收到 `table.event-batch`：先排入事件队列，再播放动画，再落最终版本。
3. 收到 `table.turn`：刷新倒计时和 Hero `legalActions`。
4. 收到 `table.action-rejected`：toast + 根据错误码决定是否重新拉快照。

### 10.2 输入锁规则

以下场景必须锁输入：

1. 非 Hero 行动。
2. 动画进行中。
3. 网络未连接。
4. 正在重连。
5. 服务端未下发合法动作。

### 10.3 资源规则

1. 牌面、头像、筹码统一通过 `AssetCatalog` 映射。
2. 不允许在业务脚本里散写资源路径。
3. 所有运行时加载资源放在 `resources` 可加载目录。

### 10.4 性能规则

1. 发牌、飞筹码、toast 使用对象池。
2. 避免每帧全量刷新所有座位。
3. Presenter 仅在数据变化时刷新对应节点。

### 10.5 容错规则

1. 服务端字段缺失时不能直接崩溃。
2. 未知消息类型必须打印警告并忽略。
3. `version` 回退时必须拒收并请求快照。

## 11. Definition of Done

只有满足以下条件，任务才算完成：

1. 两个以上客户端可加入同一房间。
2. 房间内可完成一整手牌的真实联机流程。
3. Hero 行动按钮始终与服务端 `legalActions` 一致。
4. 发牌、翻牌、下注、派奖、摊牌动画完整。
5. 断线重连可恢复。
6. 非法动作会收到明确错误提示。
7. 客户端不持有规则真值。

## 12. 最后提醒

AI 最容易犯的错有三个：

1. 把本地 store 写成规则引擎。
2. 把 prefab 脚本写成巨型 God Object。
3. 先做 UI 再补协议，最后导致整套返工。

正确顺序永远是：

1. 共享核心
2. 协议
3. 快照渲染
4. 事件动画
5. 重连与稳定化
