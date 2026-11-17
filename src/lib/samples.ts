// 三个内置示例场景（输入固定，输出由测算逻辑算出，数值见测试断言）。
// 场景 A：10 条漫剧小批量；场景 B：100 条批量起订；场景 C：1 条单品测试。

import type { CalcInput } from './costcalc.ts'

export interface SampleScenario {
  id: string
  label: string
  description: string
  input: CalcInput
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'sample-a',
    label: '场景 A：10 条漫剧小批量',
    description: '每条 5 镜头，每镜头 5 秒，漫剧风格建议重生成率 35%。',
    input: {
      videos: 10,
      shotsPerVideo: 5,
      secondsPerShot: 5,
      retryRate: 0.35,
      exchangeRate: 7.1,
      qcMinutesPerVideo: 0,
      hourlyRateCny: 0,
      renderSecondsPerVideoSecond: 6,
    },
  },
  {
    id: 'sample-b',
    label: '场景 B：100 条批量起订',
    description: '每条 5 镜头，每镜头 5 秒，漫剧风格建议重生成率 35%，达到外包批量价门槛。',
    input: {
      videos: 100,
      shotsPerVideo: 5,
      secondsPerShot: 5,
      retryRate: 0.35,
      exchangeRate: 7.1,
      qcMinutesPerVideo: 0,
      hourlyRateCny: 0,
      renderSecondsPerVideoSecond: 6,
    },
  },
  {
    id: 'sample-c',
    label: '场景 C：1 条单品测试',
    description: '1 条视频，3 镜头，每镜头 10 秒，动画风格建议重生成率 20%。',
    input: {
      videos: 1,
      shotsPerVideo: 3,
      secondsPerShot: 10,
      retryRate: 0.2,
      exchangeRate: 7.1,
      qcMinutesPerVideo: 0,
      hourlyRateCny: 0,
      renderSecondsPerVideoSecond: 6,
    },
  },
]
