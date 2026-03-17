# PERFORMANCE_CHECK.md

> 检查时间：2026-03-18  
> 检查方式：`vite build` 产物体积 + 资源目录体积盘点 + 页面交互观察

## 1. 构建体积结果

1. JS 主包：`dist/assets/index-sUcr8xaj.js`，173.11 kB（gzip 66.22 kB）。
2. CSS 主包：`dist/assets/index-BqiaCVMc.css`，7.31 kB（gzip 2.36 kB）。
3. 构建成功，`vite build` 无报错。

## 2. 资源体积热点

1. `src/resources/material/bg.png`：约 1.1 MB。
2. `src/resources/material/bg_.png`：约 1.1 MB。
3. `src/resources/pokers` 总体积：约 964 KB。
4. `src/resources` 总体积：约 3.4 MB。

## 3. 运行时观察

1. 关键交互（CALL/CHECK/RAISE、翻牌、toast、筹码飞行）无明显卡顿。
2. 连续动作中未观察到事件队列堆积导致的视觉阻塞。

## 4. 风险与建议

1. 当前首屏下载热点主要来自两张桌面背景图（合计约 2.2 MB）。
2. 建议优先将 `bg.png` / `bg_.png` 转换为 WebP/AVIF 并按设备分辨率分档加载。
3. 若目标平台含弱网移动端，建议下一步增加懒加载与资源预加载策略验证。

