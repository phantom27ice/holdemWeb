# `src/resources` 素材分析（Holdem Web）

## 1. 目录总览

- 路径：`src/resources`
- 总素材数：`85`（全部为 `.png`）
- 分组：
  - `material/`：`30` 张，偏 UI/桌面元素
  - `pokers/`：`55` 张，扑克牌相关元素

## 2. `pokers/`（扑克牌资源）

### 2.1 结构与数量

- `pokers/Spade`：13 张（`Spade_2` ~ `Spade_14`）
- `pokers/Heart`：13 张（`Heart_2` ~ `Heart_14`）
- `pokers/Club`：13 张（`Club_2` ~ `Club_14`）
- `pokers/Diamond`：13 张（`Diamond_2` ~ `Diamond_14`）
- 根目录附加：
  - `pokers/back.png`（牌背）
  - `pokers/BigJoker.png`
  - `pokers/SmallJoker.png`

### 2.2 命名规则（建议作为代码约定）

- 黑桃 | 红心 | 梅花 | 方块
- 即 Spade | Heart | Club | Diamond

- 花色固定：`Spade | Heart | Club | Diamond`
- 点数范围：`2-14`
- 点数语义：
  - `11 = J`
  - `12 = Q`
  - `13 = K`
  - `14 = A`
- 路径拼装模板：
  - 正面牌：`src/resources/pokers/{Suit}/{Suit}_{Rank}.png`
  - 背面牌：`src/resources/pokers/back.png`

### 2.3 尺寸特征

- 绝大多数牌面尺寸一致：`159 x 224`
- 适合统一做“牌组件”，通过花色/点数字段动态换图

## 3. `material/`（UI/牌桌素材）

### 3.1 桌面与基础 UI

- `material/bg.png`（`1332x750`）：主背景图
- `material/bg_.png`（`1332x750`）：备用/变体背景图（名称带 `_`，建议明确用途后再使用）
- `material/button.png`（`146x44`）：通用按钮底图
- `material/close.png` / `confirm.png` / `back.png` / `add.png` / `sub.png`（多为 `60x60`）：图标按钮组
- `material/mask.png`（`40x40`）：遮罩或占位图标

### 3.2 玩家与座位相关

- `material/avatar/avatar_1..8.png`（约 `74x111`）：玩家头像资源池
- `material/seat/BTN.png`：庄家位标（Button）
- `material/seat/SB.png`：小盲位标（Small Blind）
- `material/seat/BB.png`：大盲位标（Big Blind）

### 3.3 筹码与金额相关

- `material/chip/chip_50.png`
- `material/chip/chip_100.png`
- `material/chip/chip_500.png`
- `material/chip/chip_1000.png`
- `material/chip/chip_5000.png`
- `material/chipIcon.png`：通用筹码图标（常用于金额标签/按钮）

### 3.4 手牌展示与卡片容器（推断）

- `material/blackCard.png`（`57x85`）
- `material/border.png`（`57x85`）
- `material/goldCard.png`（`146x80`）
- `material/miniBlackCard.png`（`146x44`）

这些更像 UI 卡片容器、信息框或状态条底图，不是标准扑克牌面（标准牌面在 `pokers/`）。

## 4. 可直接给 AI 使用的规则

- 路径大小写必须严格匹配目录名（如 `Spade` 不能写成 `spade`）。
- 扑克牌资源优先走“花色 + 点数”动态拼接，不要手写 52 张映射表。
- 无牌面信息时使用 `pokers/back.png`，不要用 `material/blackCard.png` 代替。
- 德州场景中位标仅使用 `BTN/SB/BB` 三个素材。
- 筹码面额仅有 `50/100/500/1000/5000` 五档，超出档位需要新增资源或做文本叠加。

## 5. 当前已知情况与待确认点

- 当前 `src` 业务代码尚未实际引用 `src/resources` 素材（项目仍在初始化阶段）。
- `bg.png` 与 `bg_.png` 尺寸一致，但内容可能不同；建议在页面中确认谁是主背景、谁是备用主题。
- `blackCard.png` / `border.png` / `goldCard.png` / `miniBlackCard.png` 的交互语义需结合设计稿再定最终命名。
- 所有 `.png` 文件哈希均不重复，没有完全相同的重复文件。
