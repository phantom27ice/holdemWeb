# 德州扑克（Texas Hold'em）规则手册

> 本文档是项目内德州扑克规则的唯一基线，面向 AI、策划与程序实现。  
> 默认游戏：**No-Limit Texas Hold'em（无限注德州）**。

## 0. 目标与规则优先级

1. 本手册目标：给出可直接编码的、歧义最小的规则定义，避免后续返工。
2. 规则优先级：
   1. 本手册（项目统一基线）。
   2. 房间配置（盲注、前注、是否 straddle 等参数化项）。
   3. 外部参考规则（用于解释争议，不直接覆盖本手册）。
3. 外部参考基线（用于校验一致性）：
   1. Poker TDA 2024（锦标赛通用规则，尤其是 raise / reopen / showdown / odd chip）。
   2. Robert's Rules of Poker（经典现金局与通用流程规则）。
   3. WSOP Live Action Rules 2025（实战房规参考）。

## 1. 游戏基础定义

1. 牌组：标准 52 张（四花色 `Spade/Heart/Diamond/Club`，点数 `2..14`），**不使用 Joker**。
2. 每位玩家手牌：2 张底牌（hole cards）。
3. 公共牌：5 张（Flop 3 + Turn 1 + River 1）。
4. 目标：
   1. 通过下注让所有对手弃牌直接获胜。
   2. 或在摊牌时以最佳五张牌获胜。
5. 五张牌取法：从 7 张（2 手牌 + 5 公共牌）中选最佳 5 张。

## 2. 座位、按钮与强制下注

### 2.1 座位与方向

1. 座位按顺时针编号。
2. Button 每手顺时针移动 1 位（空位自动跳过）。
3. 默认 6-max，可扩展到 2-9 人。

### 2.2 SB/BB 与前注

1. 小盲（SB）为 Button 左侧第一位在局玩家。
2. 大盲（BB）为 SB 左侧第一位在局玩家。
3. 前注（Ante）默认关闭；开启时所有在局玩家先下前注，再下盲注。
4. 即使盲位玩家筹码不足（short blind），本手最小下注/最小加注基准仍按桌面完整盲注（尤其 BB）计算。

### 2.3 单挑（Heads-up）特殊规则

1. Heads-up 时，Button 同时是 SB。
2. Preflop：Button(SB) 先行动。
3. Flop/Turn/River：BB 先行动。

## 3. 一手牌生命周期（状态机）

1. `WAITING_FOR_PLAYERS`
2. `POST_FORCED_BETS`（SB/BB/Ante）
3. `DEAL_HOLE_CARDS`
4. `BETTING_PRE_FLOP`
5. `DEAL_FLOP`
6. `BETTING_FLOP`
7. `DEAL_TURN`
8. `BETTING_TURN`
9. `DEAL_RIVER`
10. `BETTING_RIVER`
11. `SHOWDOWN`
12. `PAYOUT`
13. `HAND_FINISHED`

状态推进原则：

1. 任意时刻若仅剩 1 名未弃牌玩家，直接进入 `PAYOUT`。
2. 若所有未弃牌玩家都 All-in，立即发完剩余公共牌（无需后续下注轮）后进入 `SHOWDOWN`。

### 3.1 发牌与烧牌流程（标准）

1. Preflop 发完所有底牌后进入下注轮。
2. Flop 前烧 1 张，再发 3 张公共牌。
3. Turn 前烧 1 张，再发 1 张公共牌。
4. River 前烧 1 张，再发 1 张公共牌。
5. 线上实现可不展示 burn card，但发牌顺序应与标准流程一致。

## 4. 各阶段行动顺序

### 4.1 Preflop

1. 从 BB 左侧第一位存活玩家开始（UTG）。
2. 行动按顺时针推进。
3. 若无人加注且都跟到 BB，BB 保留 `check` 或 `raise` 选项。

### 4.2 Flop / Turn / River

1. 从 Button 左侧第一位未弃牌且未出局玩家开始。
2. 行动按顺时针推进。

## 5. 下注轮规则（No-Limit 核心）

### 5.1 基本动作

1. `fold`：弃牌。
2. `check`：无人领先下注时过牌。
3. `call`：补齐至当前最高下注。
4. `bet`：当前轮首次下注。
5. `raise`：在现有下注上再提高。
6. `all-in`：投入全部剩余筹码（可能是 call、合法 raise 或不足额 raise）。

### 5.2 关键金额定义

1. `toCall = currentBet - playerStreetCommit`（最小为 0）。
2. `lastFullRaiseSize`：当前街最近一次“完整合法加注增量”。
3. `minRaiseTo = currentBet + lastFullRaiseSize`。
4. `playerMaxTo = playerStreetCommit + playerStack`。

### 5.3 最小下注与最小加注

1. Preflop：
   1. 初始 `currentBet = BB`。
   2. 首次加注最小到 `2 * BB`。
2. Postflop：首次下注最小为 `BB`。
3. 任意街，合法加注必须满足：
   1. 加注后总额 `raiseTo >= minRaiseTo`，或
   2. 玩家因筹码不足全下（short all-in）。

### 5.4 短码全下与重开加注（Reopen）

1. 不足额全下（未达到完整加注增量）通常不重开已行动玩家的加注权限。
2. 已行动玩家在动作回到自己时，只有在“其当前面临的新增金额达到至少一个完整加注”时，才可再次 raise。
3. 多个 short all-in 的增量可累计；累计达到完整加注时，重新开放 raise。
4. 若 short all-in 未形成新的完整加注，`lastFullRaiseSize` 不变。

示例（BB=200）：

1. A 开到 500（相对 200，完整增量=300）。  
2. B 全下到 650（对 500 增量=150，非完整加注）。  
3. 若动作回到已行动过的玩家，只面对这 +150，**不重开**。  
4. 若之后又有玩家把总额推进到 900（相对 650 再增 250），累计新增 `150+250=400 >= 300`，则对先前玩家**重开加注**。

### 5.5 下注轮结束条件

当前街结束当且仅当：

1. 所有未弃牌玩家都已行动，且
2. 所有未全下玩家在本街投入相等（都已跟到 `currentBet`），且
3. 不存在待响应的主动下注/加注。

### 5.6 未跟注下注返还

1. 若最后进攻下注未被任何对手跟注，其“未被跟注部分”不计入可争夺底池，应返还下注者。
2. 再进入摊牌或直接结算。
3. 程序上可按“最高两名未弃牌玩家的有效投入差额”计算需返还的未跟注部分。

## 6. 底池与边池（Side Pot）

### 6.1 基本原则

1. 玩家最多赢回“自己在该层投入所覆盖的份额”。
2. 弃牌玩家投入仍留在池中，但其无任何池的获胜资格。
3. 每个边池独立比较、独立分配。

### 6.2 构建算法（实现基线）

输入：`handContrib[player]`（整手总投入），`isFolded[player]`。

步骤：

1. 取所有投入 `> 0` 的玩家，按投入额升序得到阈值层 `L1 < L2 < ... < Ln`。
2. 对每一层 `Li`：
   1. `layerAmount = (Li - L(i-1)) * count(contrib >= Li)`，其中 `L0 = 0`。
   2. `eligible = { p | !isFolded[p] && contrib[p] >= Li }`。
3. 将每层转为一个池对象 `{ amount, eligible }`。
4. 金额为 0 的层忽略。

注：即便 `eligible` 只剩 1 人，该池也可在结算时直接判给该玩家。

### 6.3 结算顺序

1. 先结算最后形成的边池（最高层），再向下到主池。
2. 每个池只在其 `eligible` 集合中比牌。
3. 完全平局时平均分池。

### 6.4 奇数筹码（Odd Chip）

1. 先拆分到当前桌最小筹码单位。
2. 仍有 1 枚奇数筹码时，给该池获胜者中“Button 左侧最近”的玩家。
3. 主池与各边池分别处理，不混算。

## 7. 摊牌规则与牌力比较

### 7.1 摊牌触发

1. River 后仍有至少两名未弃牌玩家。
2. 或某街全员 All-in 后公共牌发完。

### 7.2 摊牌顺序

1. 若最后一轮有 bet/raise：最后一位主动进攻者先亮牌。
2. 若最后一轮无人主动下注：按“该轮应先行动顺序”亮牌（Button 左侧第一位开始）。
3. 有边池时，参与边池的玩家应先亮牌，再到仅参与主池的 all-in 玩家。

### 7.3 亮牌要求（线上实现建议）

1. 全下且行动结束后，所有仍有资格争池的手牌应自动亮牌。
2. 非全下摊牌可允许自动 muck 败者牌（取决于房规参数）。

### 7.4 牌型大小（高到低）

1. 皇家同花顺（Royal Flush）
2. 同花顺（Straight Flush）
3. 四条（Four of a Kind）
4. 葫芦（Full House）
5. 同花（Flush）
6. 顺子（Straight）
7. 三条（Three of a Kind）
8. 两对（Two Pair）
9. 一对（One Pair）
10. 高牌（High Card）

### 7.5 比牌细则

1. 先比较牌型级别。
2. 同级按关键牌点数逐位比较（kicker 规则）。
3. 顺子比较最高张；`A-2-3-4-5` 为最小顺（5-high straight）。
4. 花色不参与同牌型胜负比较。
5. 若 5 张完全一致，判平分对应池。
6. 公共牌即最佳牌时（play the board），仍可多人平分。

## 8. 实现层数据结构建议（最小可用）

1. `table`: `buttonSeat`, `sbSeat`, `bbSeat`, `blindLevel`, `anteType`。
2. `hand`: `deck`, `burnCards`, `boardCards`, `street`, `currentBet`, `lastFullRaiseSize`。
3. `player`: `seat`, `stack`, `holeCards`, `hasFolded`, `isAllIn`, `streetCommit`, `handCommit`, `actedThisStreet`。
4. `pot`: `pots[] = { amount, eligibleSeats[] }`。
5. `turn`: `toActSeat`, `legalActions`。

## 9. 必须维护的不变量（防返工关键）

1. 所有筹码守恒：`sum(players.stack) + sum(all pots) + outstanding bets = 常量`。
2. `streetCommit` 仅在当前街累计，过街后清零并并入 `handCommit`。
3. `currentBet` 单调不减（同一街）。
4. `lastFullRaiseSize` 仅在完整加注出现时更新。
5. 弃牌玩家永不进入任何池的 `eligible`。
6. `legalActions` 必须由状态实时计算，不能硬编码按钮显隐。

## 10. 争议高发点（统一口径）

1. **Joker 不参与标准德州发牌**（即使项目素材目录存在 Joker 图片）。
2. Heads-up 行动顺序与多人局不同。
3. short all-in 不是自动 reopen。
4. 多个 short all-in 可以累计触发 reopen。
5. 7 选 5，不要求“两张手牌都必须使用”。
6. 未跟注金额返还，不进入可争夺池。
7. 边池必须分层独立结算，且按形成逆序结算。
8. 奇数筹码按位置规则分配，不按花色。

## 11. 可配置项（不要写死到规则引擎）

1. `smallBlind`, `bigBlind`
2. `anteMode`：`none | all-player ante | big-blind-ante`
3. `allowStraddle`：`off | UTG | button | both`
4. `runItTwice`：`on/off`
5. `autoMuckLosingHand`：`on/off`
6. `oddChipPolicy`：默认 `first-left-of-button`
7. `showdownPolicy`：`strict-all-in-open` 等

## 12. 验收测试矩阵（建议最少覆盖）

1. Preflop：所有人 limp 到 BB，BB 是否保留 raise 选项。
2. 最小加注：多次 re-raise 后最小合法加注是否基于“当前街最大完整增量”。
3. short all-in：
   1. 单次不足额是否不 reopen。
   2. 多次累计是否 reopen。
4. 2 层、3 层边池拆分金额是否正确。
5. 主池平分 + 边池独赢的复合场景。
6. 未跟注返还后的底池金额一致性。
7. A2345 顺子与 TJQKA 顺子比较。
8. 公共牌成牌（play board）多人平分。
9. 奇数筹码分配方向是否正确。
10. 全员 all-in 后直接补齐公共牌并摊牌。

## 13. 与本项目素材的直接约束

1. 当前素材目录有 `BigJoker/SmallJoker` 图片，仅作扩展玩法资源，标准德州流程不得发出 Joker。
2. 牌面路径遵循：`src/resources/pokers/{Suit}/{Suit}_{Rank}.png`，其中 `Rank=2..14`。
3. 规则引擎应输出标准化牌面编码（如 `Spade_14`），渲染层负责映射到资源路径。

---

## 参考来源（校验用）

1. Poker TDA 官方规则页（2024 版本入口）：https://www.pokertda.com/view-poker-tda-rules/
2. Poker TDA 2024 文档集合（含 PDF / Longform）：https://www.dropbox.com/scl/fo/6v7ooters065u50bg8a5q/ANr4uXiWLR_-boJZpFva2v4?dl=0&rlkey=twogls36dvxwpklmf5vr2z8zq&st=u4d5di2h
3. Robert's Rules of Poker（参考镜像）：https://homepokertourney.org/roberts-rules-of-poker.htm
4. WSOP Live Action Rules 2025（PDF）：https://wsop.gg-global-cdn.com/wsop/f97e3174-6075-4ef1-a990-7ece42c25de3.pdf

注：项目实现以本手册为准；外部来源用于解释和校验，不直接覆盖本手册。

---

## 附录 A：推荐结算伪代码

```text
settleHand(state):
  refundUncalledIfAny()
  pots = buildPotsFromHandCommit()
  for pot in pots from highest to lowest:
    winners = compareHandsAmong(pot.eligible)
    split pot.amount equally
    if odd chip exists:
      giveOddChipToFirstWinnerLeftOfButton()
  assert chipConservation
```

## 附录 B：术语对照

1. 底牌：Hole Cards
2. 公共牌：Community Cards
3. 主池：Main Pot
4. 边池：Side Pot
5. 全下：All-in
6. 加注重开：Re-open betting
7. 奇数筹码：Odd Chip
