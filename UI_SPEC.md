# UI_SPEC.md

> 项目：Holdem Web  
> 目标：将设计图转为可实现的 Vue 组件规范、资源映射和动画交互规范。  
> 约束：UI 只负责表现，不承担规则判定。

## 1. 设计目标

1. 还原你提供的 6 人德州桌面视觉结构。
2. 首版优先“观感正确 + 动画自然 + 状态明确”，像素级微差可后续微调。
3. 所有牌局真值来自 Engine，UI 禁止本地推断赢家与合法动作。

## 2. 屏幕布局结构

1. `TableScene`
   1. 全屏背景层（暗色纹理）。
   2. 牌桌主体层（椭圆桌面 + 木质边框）。
   3. 顶部信息层（底池金额）。
   4. 座位层（6 个玩家位）。
   5. 公共牌层（5 张槽位）。
   6. 英雄手牌层（底部中间）。
   7. 操作区层（FOLD/CALL/RAISE）。

2. 层级（z-index）建议
   1. 背景：0
   2. 牌桌：10
   3. 座位与公共牌：20
   4. 筹码动画：30
   5. 操作按钮：40
   6. toast / 浮层：50+

## 3. 资源映射

## 3.1 背景与桌面

1. 背景图：`src/resources/material/bg.png`。
2. 备用背景：`src/resources/material/bg_.png`。
3. 牌桌椭圆与木框：建议 CSS 绘制（资源中无完整桌框图可直接适配响应式）。

## 3.2 玩家位

1. 头像：`src/resources/material/avatar/avatar_1..8.png`。
2. 盲注/庄位标记：
   1. `src/resources/material/seat/BTN.png`
   2. `src/resources/material/seat/SB.png`
   3. `src/resources/material/seat/BB.png`
3. 玩家信息底：
   1. 可用 `src/resources/material/goldCard.png`（大）
   2. 或 `src/resources/material/miniBlackCard.png`（小）

## 3.3 牌与牌槽

1. 牌背：`src/resources/pokers/back.png`。
2. 牌面：`src/resources/pokers/{Suit}/{Suit}_{Rank}.png`。
3. 空槽：优先 CSS 细边框，或 `src/resources/material/border.png`。

## 3.4 按钮与图标

1. 主操作按钮底图：`src/resources/material/button.png`。
2. 底池图标：`src/resources/material/chipIcon.png`。
3. 若需要加减按钮：`src/resources/material/add.png`、`sub.png`。
4. 关闭/确认可用于弹窗：`close.png`、`confirm.png`。

## 4. 组件拆分

1. `TableScene.vue`
   1. 场景容器与布局。
   2. 订阅 `tableStore` 状态。
2. `TableShell.vue`
   1. 绘制桌面形状与中心区域定位锚点。
3. `SeatView.vue`
   1. 头像、昵称、筹码、当前下注、弃牌态、动作高亮。
4. `DealerMarker.vue`
   1. 显示 BTN/SB/BB。
5. `BoardCards.vue`
   1. 5 张公共牌槽位与翻牌动画。
6. `HoleCards.vue`
   1. 英雄手牌、摊牌时对手手牌展示。
7. `ActionPanel.vue`
   1. FOLD / CHECK-CALL / BET-RAISE / ALL-IN 按钮。
8. `PotBar.vue`
   1. 主池与边池金额展示。
9. `ChipFlyLayer.vue`
   1. 筹码移动动画（下注入池、分池派奖）。
10. `GameToast.vue`
   1. 行为反馈（“加注到 300”“全下”等）。

## 5. 座位坐标与响应式

1. 采用“桌面归一化坐标”而非固定 px。
2. `seatAnchor`（以桌面中心为原点，范围 `-1..1`）建议：
   1. seat0（英雄，底中）：`(0.00, 0.78)`
   2. seat1（左下）：`(-0.92, 0.45)`
   3. seat2（左上）：`(-0.92, -0.40)`
   4. seat3（顶中）：`(0.00, -0.78)`
   5. seat4（右上）：`(0.92, -0.40)`
   6. seat5（右下）：`(0.92, 0.45)`
3. 移动端（<= 768）
   1. 缩小头像、牌宽、按钮高度。
   2. 操作区固定底部，避免遮挡英雄手牌。

## 6. 动画规范（首版）

1. 发底牌
   1. 从牌堆点位飞到目标座位。
   2. 单张时长 `220ms`，同一轮相邻座位延迟 `40ms`。
2. 翻 Flop/Turn/River
   1. 先显示背面，执行 `Y 轴翻转` 到正面。
   2. 单张 `180ms`。
3. 下注入池
   1. 从座位下注点飞向桌面中心。
   2. 时长 `200ms`，使用 `ease-out`。
4. 分池派奖
   1. 从底池向赢家座位飞筹码。
   2. 多赢家并行飞行动画。
5. 动画技术
   1. V1 用 CSS Transition + Transform 即可。
   2. 若后续要求更丝滑，再引入 `gsap`。

## 7. 交互规范

1. 按钮文案
   1. 左：`FOLD`
   2. 中：`CHECK` 或 `CALL {toCall}`
   3. 右：`BET {min}` 或 `RAISE {minRaiseTo}`
   4. 额外：`ALL-IN`
2. 禁用规则
   1. 非 `toActSeat` 时所有操作禁用。
   2. 非法动作按钮不显示或禁用（优先禁用并显示原因）。
3. 行为回显
   1. 座位上方短暂显示 `Fold / Call 100 / Raise 300 / All-in`。
4. 摊牌
   1. 非英雄玩家在有资格争池且进入 showdown 时翻开手牌。

## 8. 视觉状态规范

1. 玩家态
   1. `active`：外发光边框。
   2. `folded`：头像灰度 + 透明度降低。
   3. `allin`：红/金色边框强调。
2. 公共牌槽
   1. 未发：空槽。
   2. 已发：牌面图。
3. 操作区
   1. 可点：亮色。
   2. 不可点：40% 透明 + `cursor: not-allowed`。

## 9. UI 与 Engine 对接契约

1. UI 输入（只读）
   1. `state.hand`, `state.players`, `state.board`, `state.pots`, `state.toActSeat`。
   2. `legalActions[heroSeat]`。
   3. `eventQueue`。
2. UI 输出（动作）
   1. `dispatch({type:'FOLD'|'CHECK'|'CALL'|'BET'|'RAISE'|'ALL_IN', ...})`。
3. UI 禁止行为
   1. 禁止直接改 `state`。
   2. 禁止本地自行计算池分配与赢家。

## 10. 资源缺口与替代策略

1. 缺“完整木框椭圆桌图”
   1. 采用 CSS 渐变 + 阴影绘制。
2. 缺“D/B/S圆形徽章”同款
   1. 用 `BTN/SB/BB` 图片或 CSS 徽章替代。
3. 缺“高级筹码堆动画素材”
   1. V1 使用 `chipIcon.png` + transform。

## 11. 验收标准（UI）

1. 视觉
   1. 6 个座位、5 张公共牌槽、2 张英雄手牌、操作区布局正确。
2. 交互
   1. 非当前行动玩家不可操作。
   2. 按钮文案与最小金额实时正确。
3. 动画
   1. 发牌、翻牌、下注、派奖四类动画可见且不突兀。
4. 稳定性
   1. 连续 50 手无 UI 崩溃、无状态错位。

## 12. 实施顺序

1. `S1` 静态桌面
   1. 完成布局、资源映射、座位定位。
2. `S2` 假数据联动
   1. 用 mock 状态驱动组件，验证视觉完整性。
3. `S3` 接真实 Engine
   1. 接入事件流和合法动作。
4. `S4` 动画完善
   1. 优化节奏、性能、移动端适配。

## 13. 目录建议

```text
src/
  game/
    engine/
    types/
  stores/
    tableStore.ts
  components/table/
    TableScene.vue
    TableShell.vue
    SeatView.vue
    BoardCards.vue
    HoleCards.vue
    PotBar.vue
    ActionPanel.vue
    ChipFlyLayer.vue
```

