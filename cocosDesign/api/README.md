# 联机接口文档入口

## 1. 目录说明

这个目录是给后续联机德州扑克项目做“协议中心”用的，目标是让前端、Cocos 客户端、后端都看同一份接口定义。

当前包含三类文件：

1. [../COCOS_NET_API_SPEC.md](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/COCOS_NET_API_SPEC.md)
   - 人类可读版接口说明
   - 适合产品、前端、后端一起讨论

2. [openapi.yaml](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/api/openapi.yaml)
   - HTTP 接口的机器可读文档
   - 适合 Swagger Editor、Apifox、OpenAPI Generator

3. [asyncapi.yaml](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/api/asyncapi.yaml)
   - WebSocket 接口的机器可读文档
   - 适合 AsyncAPI Studio、消息协议讨论和后续网关实现

## 2. 推荐使用顺序

### 2.1 讨论阶段

先看：

1. [../COCOS_NET_API_SPEC.md](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/COCOS_NET_API_SPEC.md)

原因：

1. 这份文档解释了为什么要这样分接口
2. 写明了大厅选座、固定 `seatNo`、服务端权威这些规则

### 2.2 联调前

再看：

1. [openapi.yaml](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/api/openapi.yaml)
2. [asyncapi.yaml](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/api/asyncapi.yaml)

原因：

1. 这两份更适合做字段级校对
2. 更适合生成接口文档站点或客户端代码

### 2.3 写代码时

同时对照：

1. [../types/protocol/http.ts](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/types/protocol/http.ts)
2. [../types/protocol/ws.ts](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/types/protocol/ws.ts)
3. [../types/model/index.ts](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/types/model/index.ts)

原因：

1. Markdown 文档适合阅读
2. YAML 适合工具
3. TS 类型适合直接落代码

## 3. 当前接口覆盖范围

当前文档只覆盖第一版联机德州 MVP 所需接口：

1. 游客登录
2. 拉大厅桌子列表
3. 选座进入牌桌
4. 拉全量牌桌快照
5. 牌桌订阅
6. 准备
7. 站起
8. 行动
9. 事件广播
10. 座位更新
11. 心跳

暂时不覆盖：

1. 复杂重连补帧
2. 战绩查询
3. 排行榜
4. 多币种钱包
5. 锦标赛接口

## 4. 使用建议

### 4.1 给后端

建议把：

1. `openapi.yaml`
2. `asyncapi.yaml`

作为接口合同基线，不要让实现先跑到文档前面。

### 4.2 给 Cocos 客户端

建议优先使用：

1. [../types/protocol/http.ts](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/types/protocol/http.ts)
2. [../types/protocol/ws.ts](/Users/kangzhenbin/Desktop/holdemWeb/cocosDesign/types/protocol/ws.ts)

YAML 主要用于查阅和联调，不建议直接手抄字段。

### 4.3 给前端或工具链

后续如果要接：

1. Swagger UI
2. Apifox
3. OpenAPI Generator
4. AsyncAPI Studio

直接从这两个 YAML 文件开始即可。

## 5. 维护规则

后续改接口时，建议按这个顺序更新：

1. 先改 `types/protocol/*`
2. 再改 `COCOS_NET_API_SPEC.md`
3. 再改 `openapi.yaml` / `asyncapi.yaml`

不要只改其中一份，否则很快会失真。
