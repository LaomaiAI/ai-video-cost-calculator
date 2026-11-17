import { describe, expect, it } from 'vitest'
import { calculate, round2, DEFAULT_INPUT, type CalcInput } from './costcalc.ts'
import { SAMPLE_SCENARIOS } from './samples.ts'

function assertOk(outcome: ReturnType<typeof calculate>) {
  if (!outcome.ok) throw new Error(`expected ok, got errors: ${outcome.errors.join('; ')}`)
  return outcome.result
}

describe('round2', () => {
  it('保留两位小数并四舍五入', () => {
    expect(round2(119.8125)).toBe(119.81)
    expect(round2(239.625)).toBe(239.63)
    expect(round2(0.125)).toBe(0.13)
    expect(round2(0)).toBe(0)
  })
})

describe('场景 A：10 条漫剧小批量', () => {
  const result = assertOk(calculate(SAMPLE_SCENARIOS[0].input))

  it('总秒数与总镜头数', () => {
    expect(result.totalSeconds).toBe(250)
    expect(result.totalShots).toBe(50)
  })

  it('各模型含重生成成本（2026-11-18 核实价）', () => {
    const byId = Object.fromEntries(result.models.map((m) => [m.model.id, m]))
    expect(byId['luma-ray32-360p'].directCny).toBe(21.3)
    expect(byId['luma-ray32-360p'].expectedCny).toBe(28.76)
    expect(byId['luma-ray32-360p'].perVideoCny).toBe(2.88)
    expect(byId['luma-ray32-360p'].perSecondCny).toBe(0.12)
    expect(byId['jimeng-super-flash'].directCny).toBe(52.5)
    expect(byId['jimeng-super-flash'].expectedCny).toBe(70.88)
    expect(byId['kling25-turbo-noaudio-720p'].directCny).toBe(81.93)
    expect(byId['kling25-turbo-noaudio-720p'].expectedCny).toBe(110.61)
    expect(byId['pika-h3-flex-768p'].directCny).toBe(59.17)
    expect(byId['pika-h3-flex-768p'].expectedCny).toBe(79.88)
    expect(byId['runway-gen4'].directCny).toBe(213)
    expect(byId['runway-gen4'].expectedCny).toBe(287.55)
    expect(byId['minimax-h3-2k'].directCny).toBe(200)
    expect(byId['minimax-h3-2k'].expectedCny).toBe(270)
  })

  it('最便宜的是 Luma Ray 3.2 360p，相对外包节省', () => {
    expect(result.cheapest?.model.id).toBe('luma-ray32-360p')
    expect(result.cheapest?.expectedCny).toBe(28.76)
    expect(result.savingsVsMarketLowCny).toBe(2971.24)
    expect(result.savingsVsMarketHighCny).toBe(7971.24)
  })

  it('换算的成本标为换算，直接价的不标', () => {
    const byId = Object.fromEntries(result.models.map((m) => [m.model.id, m]))
    expect(byId['kling25-turbo-noaudio-720p'].converted).toBe(true)
    expect(byId['runway-gen4'].converted).toBe(true)
    expect(byId['pika-h3-flex-768p'].converted).toBe(true)
    expect(byId['luma-ray32-360p'].converted).toBe(true)
    expect(byId['jimeng-super-flash'].converted).toBe(false)
    expect(byId['minimax-h3-2k'].converted).toBe(false)
  })

  it('按 count 计费与已下线、未填单价的模型不参与比较', () => {
    const byId = Object.fromEntries(result.models.map((m) => [m.model.id, m]))
    expect(byId['veo3-av'].priced).toBe(false)
    expect(byId['veo3-av'].notComparableReason).toContain('count')
    expect(byId['veo3-fast-av-720p'].priced).toBe(false)
    expect(byId['sora2'].priced).toBe(false)
    expect(byId['sora2'].notComparableReason).toContain('已下线')
    expect(byId['hailuo02'].priced).toBe(false)
    expect(byId['hailuo02'].notComparableReason).toContain('未填单价')
  })

  it('外包市场价区间与批量价不适用', () => {
    const single = result.market.find((m) => m.label.includes('单条'))
    expect(single?.lowCny).toBe(3000)
    expect(single?.highCny).toBe(8000)
    expect(single?.applies).toBe(true)
    const bulk = result.market.find((m) => m.label.includes('100 条'))
    expect(bulk?.applies).toBe(false)
    expect(bulk?.lowCny).toBe(2800)
  })

  it('代码渲染直接成本为 0，耗时 25 分钟', () => {
    expect(result.codeRender.directCny).toBe(0)
    expect(result.codeRender.renderMinutes).toBe(25)
    expect(result.codeRender.laborCny).toBe(0)
  })
})

describe('场景 B：100 条批量起订', () => {
  const result = assertOk(calculate(SAMPLE_SCENARIOS[1].input))

  it('批量价适用，最便宜模型 287.55 元', () => {
    expect(result.totalSeconds).toBe(2500)
    expect(result.cheapest?.model.id).toBe('luma-ray32-360p')
    expect(result.cheapest?.expectedCny).toBe(287.55)
    const bulk = result.market.find((m) => m.label.includes('100 条'))
    expect(bulk?.applies).toBe(true)
    expect(bulk?.lowCny).toBe(28000)
    expect(bulk?.highCny).toBe(28000)
    const single = result.market.find((m) => m.label.includes('单条'))
    expect(single?.lowCny).toBe(30000)
    expect(single?.highCny).toBe(80000)
    expect(result.savingsVsMarketLowCny).toBe(29712.45)
    expect(result.savingsVsMarketHighCny).toBe(79712.45)
  })

  it('Kling 2.5 Turbo 无音频 720p 批量期望成本 1106.06 元', () => {
    const byId = Object.fromEntries(result.models.map((m) => [m.model.id, m]))
    expect(byId['kling25-turbo-noaudio-720p'].directCny).toBe(819.3)
    expect(byId['kling25-turbo-noaudio-720p'].expectedCny).toBe(1106.06)
  })

  it('代码渲染耗时 250 分钟', () => {
    expect(result.codeRender.renderMinutes).toBe(250)
  })
})

describe('场景 C：1 条单品测试（每镜头 10 秒，按次计费按 2 次算）', () => {
  const result = assertOk(calculate(SAMPLE_SCENARIOS[2].input))

  it('各模型成本与最便宜项', () => {
    expect(result.totalSeconds).toBe(30)
    const byId = Object.fromEntries(result.models.map((m) => [m.model.id, m]))
    expect(byId['luma-ray32-360p'].directCny).toBe(2.56)
    expect(byId['luma-ray32-360p'].expectedCny).toBe(3.07)
    expect(byId['pika-h3-flex-768p'].directCny).toBe(7.1)
    expect(byId['pika-h3-flex-768p'].expectedCny).toBe(8.52)
    expect(byId['jimeng-super-flash'].directCny).toBe(6.3)
    expect(byId['jimeng-super-flash'].expectedCny).toBe(7.56)
    expect(byId['kling25-turbo-noaudio-720p'].directCny).toBe(9.83)
    expect(byId['kling25-turbo-noaudio-720p'].expectedCny).toBe(11.8)
    expect(result.cheapest?.model.id).toBe('luma-ray32-360p')
    expect(result.codeRender.renderMinutes).toBe(3)
    const single = result.market.find((m) => m.label.includes('单条'))
    expect(single?.lowCny).toBe(300)
    expect(single?.highCny).toBe(800)
  })
})

describe('按条计费、单价覆盖与换算', () => {
  it('海螺 02 按条计费：覆盖单价 5 元/条，场景 A 期望成本 337.50 元', () => {
    const input: CalcInput = { ...SAMPLE_SCENARIOS[0].input, priceOverrides: { hailuo02: 5 } }
    const result = assertOk(calculate(input))
    const hailuo = result.models.find((m) => m.model.id === 'hailuo02')
    expect(hailuo?.priced).toBe(true)
    expect(hailuo?.directCny).toBe(250)
    expect(hailuo?.expectedCny).toBe(337.5)
    expect(hailuo?.converted).toBe(false)
  })

  it('即梦按秒计费（人民币）：覆盖单价 0.5 元/秒，场景 A 期望成本 168.75 元', () => {
    const input: CalcInput = { ...SAMPLE_SCENARIOS[0].input, priceOverrides: { 'jimeng-super-flash': 0.5 } }
    const result = assertOk(calculate(input))
    const jimeng = result.models.find((m) => m.model.id === 'jimeng-super-flash')
    expect(jimeng?.priced).toBe(true)
    expect(jimeng?.directCny).toBe(125)
    expect(jimeng?.expectedCny).toBe(168.75)
  })

  it('最便宜模型被排除后由下一家接替', () => {
    const input: CalcInput = { ...SAMPLE_SCENARIOS[0].input, priceOverrides: { 'luma-ray32-360p': null } }
    const result = assertOk(calculate(input))
    const luma = result.models.find((m) => m.model.id === 'luma-ray32-360p')
    expect(luma?.priced).toBe(false)
    expect(result.cheapest?.model.id).toBe('jimeng-super-flash')
    expect(result.cheapest?.expectedCny).toBe(70.88)
  })

  it('按 count 计费的模型填了单价也不参与比较', () => {
    const input: CalcInput = { ...SAMPLE_SCENARIOS[0].input, priceOverrides: { 'veo3-av': 0.4 } }
    const result = assertOk(calculate(input))
    const veo = result.models.find((m) => m.model.id === 'veo3-av')
    expect(veo?.priced).toBe(false)
    expect(veo?.notComparableReason).toContain('count')
  })

  it('每镜头 7 秒时按次计费按 2 次算（不足一次按一次）', () => {
    const input: CalcInput = { ...DEFAULT_INPUT, videos: 1, shotsPerVideo: 1, secondsPerShot: 7, retryRate: 0 }
    const result = assertOk(calculate(input))
    const luma = result.models.find((m) => m.model.id === 'luma-ray32-360p')
    expect(luma?.directCny).toBe(0.85)
    expect(luma?.expectedCny).toBe(0.85)
  })
})

describe('流水线成本（重生成 + 质检人工）', () => {
  it('场景 A 加质检 6 分钟/条、时薪 100 元，Luma 360p 流水线 128.76 元', () => {
    const input: CalcInput = { ...SAMPLE_SCENARIOS[0].input, qcMinutesPerVideo: 6, hourlyRateCny: 100 }
    const result = assertOk(calculate(input))
    const luma = result.models.find((m) => m.model.id === 'luma-ray32-360p')
    expect(luma?.pipelineCny).toBe(128.76)
  })

  it('时薪为 0 时流水线成本等于期望成本', () => {
    const result = assertOk(calculate(SAMPLE_SCENARIOS[0].input))
    const luma = result.models.find((m) => m.model.id === 'luma-ray32-360p')
    expect(luma?.pipelineCny).toBe(luma?.expectedCny)
  })
})

describe('边界与校验', () => {
  it('0 条视频时全部为 0', () => {
    const result = assertOk(calculate({ ...DEFAULT_INPUT, videos: 0 }))
    expect(result.totalSeconds).toBe(0)
    expect(result.totalShots).toBe(0)
    expect(result.codeRender.renderMinutes).toBe(0)
    expect(result.market.every((m) => m.lowCny === 0 && m.highCny === 0)).toBe(true)
    expect(result.models.every((m) => m.expectedCny === 0)).toBe(true)
  })

  it('非法输入返回错误信息', () => {
    const bad: Array<[CalcInput, string]> = [
      [{ ...DEFAULT_INPUT, videos: -1 }, '视频条数须为非负整数'],
      [{ ...DEFAULT_INPUT, videos: 1.5 }, '视频条数须为非负整数'],
      [{ ...DEFAULT_INPUT, shotsPerVideo: -2 }, '每条镜头数须为非负整数'],
      [{ ...DEFAULT_INPUT, secondsPerShot: -5 }, '每镜头秒数须为非负数'],
      [{ ...DEFAULT_INPUT, retryRate: 6 }, '重生成率须在 0 到 5 之间'],
      [{ ...DEFAULT_INPUT, retryRate: -0.1 }, '重生成率须在 0 到 5 之间'],
      [{ ...DEFAULT_INPUT, exchangeRate: 0 }, '汇率须为正数'],
      [{ ...DEFAULT_INPUT, qcMinutesPerVideo: -1 }, '质检分钟数须为非负数'],
      [{ ...DEFAULT_INPUT, hourlyRateCny: -10 }, '时薪须为非负数'],
      [{ ...DEFAULT_INPUT, renderSecondsPerVideoSecond: -1 }, '渲染耗时须为非负数'],
      [{ ...DEFAULT_INPUT, priceOverrides: { sora2: -0.1 } }, '模型 sora2 的单价须为非负数或留空'],
    ]
    for (const [input, message] of bad) {
      const outcome = calculate(input)
      expect(outcome.ok).toBe(false)
      if (!outcome.ok) expect(outcome.errors).toContain(message)
    }
  })

  it('同一输入两次结果完全一致（确定性）', () => {
    const a = calculate(SAMPLE_SCENARIOS[0].input)
    const b = calculate(SAMPLE_SCENARIOS[0].input)
    expect(a).toEqual(b)
  })
})
