# NOTES — ai-video-cost-calculator

## 已完成（2026-11-17，本地离线完成）

- 完整产品：React 19 + Vite + Tailwind + TypeScript，和 dsh-plugin-picker、skill-check 同一套栈。
- 核心库 `src/lib/costcalc.ts`：总量、模型直接成本、含重生成成本、批量流水线成本、外包市场价、代码渲染成本、节省额，全部确定性计算，零大模型调用。
- 价格表 `src/lib/pricing.ts`：10 个模型单价 + 2 条漫剧外包市场价，每条带来源与核实状态。
- 三个内置示例场景（10 条小批量、100 条批量、1 条单品测试），数值由测试断言锁定。
- 界面 `src/App.tsx`：剧本参数输入、风格建议重生成率、模型单价可编辑、三张对比卡、模型成本表、外包对比、代码渲染对比。
- 双语 README 各 10 节一一对应（中文 README.md、英文 README_EN.md），顶部一句话痛点；演示链接待部署后填写，没有编造。
- CI workflow：test.yml（npm ci + npm test + npm run build）、deploy.yml（GitHub Pages，和 dsh 同款）。

## 设计决定

- 模型单价全部标待核实：2026-11-17 出口不稳，未能实测核实任何一家官方定价页。Veo 3、Sora 2、可灵、海螺、Runway、Pika、Luma 的单价是公开定价页的记忆参考值，即梦未填参考值。记忆值可能过时或记错，页面与 README 多处写明以官方定价页为准，单价可在页面上直接改。
- 漫剧外包价是唯一有调研来源的价格：单条 300-800 元、100 条起订 280 元/条，来自 2026-11-17 调研引用的小红书与行业文，状态标参考价，不是官方定价。
- 风格建议重生成率是假设默认值（写实 25%、动画 20%、漫剧 35%），不是实测数据；用户可在页面上改，改完实时重算。
- 汇率是用户输入的假设值（默认 7.1），不是实时汇率；模型价按此汇率换算成人民币再比较。
- 代码渲染直接成本恒为 0：本地 Chromium 无头渲染加 ffmpeg，无 API 调用；代价只体现在渲染时间与人工成本两项，时薪为 0 时只显示时间。
- 金额保留两位小数，四舍五入；0 条视频时全部为 0，不报错；非法输入返回错误列表，不静默算错。
- 流水线成本 = 模型期望成本 + 质检人工：质检按每条视频分钟数乘时薪算，默认 0 分钟，即默认不计质检。

## 验证情况（2026-11-17，出口断着但 npm 本地缓存可用）

- `npm install --prefer-offline`：挂住约 6 分钟无输出（在等注册表元数据，出口不通），已 kill；改用 `npm install --offline` 一次成功，3 秒装完，71 个包。
- `npm test`：24/24 通过（costcalc.test.ts 17 个、pricing.test.ts 7 个）。修了 1 个测试 bug：排除 Kling Standard 后最便宜的是 Hailuo 02 Standard（同为 0.05 美元/秒），不是 Sora 2；代码本身没错，是测试期望写错了。
- `npm run build`：tsc + vite 构建通过，dist 已生成。
- `npm run lint`（oxlint）：0 警告 0 错误。
- 示例数值已用独立心算复核：场景 A 总秒数 250，Kling 期望成本 119.81 元；场景 B 总秒数 2500，Kling 期望成本 1198.13 元；场景 C 总秒数 30，Kling 期望成本 12.78 元。

## 还需要联网才能做的事

1. 已完成（2026-11-18）：10 个模型单价已按官方定价页核实，价格表扩到 24 行，待核实价格清零；详见文末 2026-11-18 价格表修订一节。
2. 建仓库、推送、开 Pages、演示站核实、README 回填演示链接（走主代理的老流程：浏览器建空仓、连接器一次推送、workflow 浏览器传、开 Pages、核实）。
3. 用 3-5 个真实剧本跑一遍，记录测算与实际账单的偏差，记进 README。

## 已知局限

- 计费单位不统一：Veo 3 按 count 计费，官方未说明 1 count = 多少秒，不参与成本比较；Sora 2 已下线；海螺 02 无统一单价。
- 换算依赖套餐价：Kling、Pika、Luma、Runway 的换算各按一个指定套餐价算，换其他套餐买积分实际成本会变。
- 按次计费不足一次按一次算是假设，未经官方确认；月套餐与免费额度未建模。
- 重生成率与渲染耗时是假设默认值，未经实测校准。
- 汇率手动输入，不是实时汇率。
- 未计生成失败整条作废、反复返工等极端情况。

## 2026-11-18 价格表修订（按当日官方定价核实结果）

- 核实范围：Sora 2、Veo 3、Kling、可灵、即梦、海螺、Runway、Pika、Luma 全部按官方定价页核实，核实日期 2026-11-18；价格表从 10 行扩到 24 行，待核实价格清零。
- Sora 2 已下线：OpenAI 于 2026-09-24 关闭 Sora 2 与 Videos API，无替代 API；行保留、现行价删除、状态 discontinued，不参与比较。
- Veo 3 按 count 计费：含音频 0.40 美元/count（720p/1080p 同价）、仅视频 0.20 美元/count；Fast 含音频 720p 0.10、1080p 0.12，仅视频 720p 0.08、1080p 0.10 美元/count；来源 cloud.google.com/model-garden/pricing。官方未注明 1 count = 多少秒，绝不默认按秒，6 行全部不换算成本、不参与比较，单价栏在页面上不可改。
- Kling 2.1 换成 2.5 Turbo：官方现行表已无 2.1，从 2.5 Turbo 起列；4 行按 Units/秒分档（无音频 720p 0.3、1080p 0.5，含音频 720p 0.5、1080p 0.8），按 Standard Package 500 美元/3250 Units 换算（1 Unit = 0.15386 美元，页面标 46% off），成本标为换算。
- 即梦按会员档位分行：当前模型 Seedance 2.5 / 2.5 Flash，人民币按秒，连续包季档超级会员 Flash 0.21、2.5 0.24，高级会员 Flash 0.37、2.5 0.43 元/秒；年卡/11 月 16-23 日档（720p 带参考视频）的价写在各行备注里。无公开统一价，单价随档位、促销期、是否带参考视频而变。
- 海螺 02 列为历史模型：分档价（人民币/视频）写在备注里，无统一单价，不参与比较；现行旗舰 MiniMax-H3 新增一行，2K 档 0.80 元/秒，按秒计费。来源 platform.minimax.cn/docs/pricing/overview。
- Runway Gen-4 积分计费：约 12 credits/秒（9500 credits = 791 秒），按 Unlimited 套餐 95 美元/9500 credits 换算（1 credit = 0.01 美元），约 0.12 美元/秒（换算）；API 页仅写视频 From 0.05 美元/秒，未单独列 Gen-4。
- Pika 2.2 换成 2.5：720p 5 秒 20 credits/次；另有 Pika H3 Flex 768p 5 秒 10 credits/次；换算按一次性充值 60 credits = 1 美元（1 credit 约 0.0167 美元）。
- Luma Ray 2 换成 Ray 3.2：文生/图生 360p 20、540p 50、720p 100、1080p 400 credits/5 秒；换算按 Plus 套餐 30 美元/10000 credits（1 credit = 0.003 美元）。
- 测算逻辑改动：pricing.ts 新增 PriceUnit 五种单位（per-second/per-video/per-count/per-unit/per-credit）、PriceCurrency（美元/人民币，原生单位非货币时为 null）、usdPerNativeUnit 与 conversionBasis（换算比率与依据）、secondsPerGeneration（按次计费时每次对应的秒数）、status 新增 discontinued；costcalc.ts 按原生单位分算，per-count 与已下线不参与比较，per-unit/per-credit 换算后成本在 ModelRow.converted 里标记；按次计费不足一次按一次算（假设，写在备注与 README 第 10 节里）。
- 示例数值已变（测试断言锁定）：场景 A 最便宜为 Luma Ray 3.2 360p 28.76 元（直接 21.30 元，换算），场景 B 最便宜同为 360p 287.55 元；README 第 4.7 节已同步。
- 待办更新：逐个核实模型单价已完成；剩下建仓库、推送、开 Pages、演示站核实、README 回填演示链接（走主代理老流程），以及跑 3-5 个真实剧本验证测算与实际账单的偏差。
