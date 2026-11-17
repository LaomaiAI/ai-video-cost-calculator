import { describe, expect, it } from 'vitest'
import {
  MODEL_PRICES,
  MARKET_QUOTES,
  PRICE_TABLE_VERIFIED_DATE,
  countUnverifiedPrices,
  formatNativePrice,
  notComparableReason,
  statusLabel,
  unitLabel,
} from './pricing.ts'

describe('价格表完整性', () => {
  it('每个模型都有来源说明', () => {
    for (const m of MODEL_PRICES) {
      expect(m.source.length).toBeGreaterThan(0)
      expect(m.name.length).toBeGreaterThan(0)
      expect(m.vendor.length).toBeGreaterThan(0)
    }
  })

  it('价格表共 24 行，2026-11-18 已核实', () => {
    expect(MODEL_PRICES.length).toBe(24)
    expect(PRICE_TABLE_VERIFIED_DATE).toBe('2026-11-18')
  })

  it('没有待核实的价格', () => {
    expect(countUnverifiedPrices()).toBe(0)
  })

  it('已核实的价格都有核实日期 2026-11-18', () => {
    for (const m of MODEL_PRICES.filter((x) => x.status === 'verified')) {
      expect(m.verifiedDate).toBe('2026-11-18')
    }
  })

  it('待核实的价格没有核实日期', () => {
    for (const m of MODEL_PRICES.filter((x) => x.status === 'unverified')) {
      expect(m.verifiedDate).toBeNull()
    }
  })

  it('单价为 null 的模型只有 Sora 2（已下线）与海螺 02（无统一单价）', () => {
    const nullPriced = MODEL_PRICES.filter((m) => m.price === null)
    expect(nullPriced.map((m) => m.id)).toEqual(['sora2', 'hailuo02'])
  })

  it('状态标签', () => {
    expect(statusLabel('verified')).toBe('已核实')
    expect(statusLabel('reference')).toBe('参考价')
    expect(statusLabel('unverified')).toBe('待核实')
    expect(statusLabel('discontinued')).toBe('已下线')
  })

  it('单位标签', () => {
    expect(unitLabel('per-second')).toBe('按秒')
    expect(unitLabel('per-video')).toBe('按条')
    expect(unitLabel('per-count')).toBe('按 count')
    expect(unitLabel('per-unit')).toBe('Units/秒')
    expect(unitLabel('per-credit')).toBe('credits/次')
  })

  it('原生单价显示文本', () => {
    const byId = Object.fromEntries(MODEL_PRICES.map((m) => [m.id, m]))
    expect(formatNativePrice(byId['veo3-av'])).toBe('$0.4 / count')
    expect(formatNativePrice(byId['kling25-turbo-noaudio-720p'])).toBe('0.3 Units / 秒')
    expect(formatNativePrice(byId['pika25-720p'])).toBe('20 credits / 5 秒')
    expect(formatNativePrice(byId['runway-gen4'])).toBe('12 credits / 秒')
    expect(formatNativePrice(byId['jimeng-super-flash'])).toBe('¥0.21 / 秒')
    expect(formatNativePrice(byId['sora2'])).toBe('—')
  })
})

describe('Sora 2 已下线', () => {
  it('现行价已删除，状态为已下线', () => {
    const sora = MODEL_PRICES.find((m) => m.id === 'sora2')
    expect(sora?.status).toBe('discontinued')
    expect(sora?.price).toBeNull()
    expect(sora?.verifiedDate).toBe('2026-11-18')
    expect(notComparableReason(sora!)).toContain('已下线')
  })
})

describe('Veo 3 按 count 计费，不换算', () => {
  it('6 个 Veo 3 行全部按 count 计费且不参与比较', () => {
    const veoRows = MODEL_PRICES.filter((m) => m.vendor === 'Google')
    expect(veoRows.map((m) => m.id)).toEqual([
      'veo3-av',
      'veo3-video',
      'veo3-fast-av-720p',
      'veo3-fast-av-1080p',
      'veo3-fast-video-720p',
      'veo3-fast-video-1080p',
    ])
    for (const m of veoRows) {
      expect(m.unit).toBe('per-count')
      expect(m.status).toBe('verified')
      expect(notComparableReason(m)).toContain('count')
    }
  })

  it('Veo 3 含音频 0.40 美元/count，仅视频 0.20 美元/count', () => {
    const byId = Object.fromEntries(MODEL_PRICES.map((m) => [m.id, m]))
    expect(byId['veo3-av'].price).toBe(0.4)
    expect(byId['veo3-video'].price).toBe(0.2)
    expect(byId['veo3-fast-av-720p'].price).toBe(0.1)
    expect(byId['veo3-fast-av-1080p'].price).toBe(0.12)
    expect(byId['veo3-fast-video-720p'].price).toBe(0.08)
    expect(byId['veo3-fast-video-1080p'].price).toBe(0.1)
  })
})

describe('Kling 2.5 Turbo（Units 换算）', () => {
  it('4 个分档行，换算比率与依据齐全', () => {
    const klingRows = MODEL_PRICES.filter((m) => m.vendor === 'Kuaishou 可灵')
    expect(klingRows.map((m) => m.id)).toEqual([
      'kling25-turbo-noaudio-720p',
      'kling25-turbo-noaudio-1080p',
      'kling25-turbo-audio-720p',
      'kling25-turbo-audio-1080p',
    ])
    for (const m of klingRows) {
      expect(m.unit).toBe('per-unit')
      expect(m.usdPerNativeUnit).toBe(0.15386)
      expect(m.conversionBasis).toContain('500 美元/3250 Units')
      expect(m.status).toBe('verified')
    }
    const byId = Object.fromEntries(klingRows.map((m) => [m.id, m]))
    expect(byId['kling25-turbo-noaudio-720p'].price).toBe(0.3)
    expect(byId['kling25-turbo-noaudio-1080p'].price).toBe(0.5)
    expect(byId['kling25-turbo-audio-720p'].price).toBe(0.5)
    expect(byId['kling25-turbo-audio-1080p'].price).toBe(0.8)
  })
})

describe('海螺 02 历史模型与 MiniMax-H3', () => {
  it('海螺 02 无统一单价，备注里列出已核实分档价', () => {
    const hailuo = MODEL_PRICES.find((m) => m.id === 'hailuo02')
    expect(hailuo?.unit).toBe('per-video')
    expect(hailuo?.currency).toBe('CNY')
    expect(hailuo?.price).toBeNull()
    expect(hailuo?.note).toContain('2.00')
    expect(hailuo?.note).toContain('4.00')
    expect(hailuo?.note).toContain('3.50')
    expect(hailuo?.note).toContain('0.60')
  })

  it('MiniMax-H3 2K 0.80 元/秒，按秒计费', () => {
    const h3 = MODEL_PRICES.find((m) => m.id === 'minimax-h3-2k')
    expect(h3?.unit).toBe('per-second')
    expect(h3?.currency).toBe('CNY')
    expect(h3?.price).toBe(0.8)
    expect(h3?.status).toBe('verified')
  })
})

describe('积分计费模型（换算）', () => {
  it('Runway Gen-4 约 12 credits/秒，换算按 Unlimited 套餐', () => {
    const runway = MODEL_PRICES.find((m) => m.id === 'runway-gen4')
    expect(runway?.unit).toBe('per-credit')
    expect(runway?.price).toBe(12)
    expect(runway?.secondsPerGeneration).toBe(1)
    expect(runway?.usdPerNativeUnit).toBe(0.01)
    expect(runway?.conversionBasis).toContain('95 美元/9500 credits')
  })

  it('Pika 2.5 与 H3 Flex 按 5 秒/次计费，换算按一次性充值', () => {
    const byId = Object.fromEntries(MODEL_PRICES.map((m) => [m.id, m]))
    expect(byId['pika25-720p'].price).toBe(20)
    expect(byId['pika25-720p'].secondsPerGeneration).toBe(5)
    expect(byId['pika-h3-flex-768p'].price).toBe(10)
    expect(byId['pika-h3-flex-768p'].secondsPerGeneration).toBe(5)
    for (const id of ['pika25-720p', 'pika-h3-flex-768p']) {
      expect(byId[id].usdPerNativeUnit).toBeCloseTo(1 / 60, 10)
      expect(byId[id].conversionBasis).toContain('60 credits = 1 美元')
    }
  })

  it('Luma Ray 3.2 四档分辨率，换算按 Plus 套餐', () => {
    const lumaRows = MODEL_PRICES.filter((m) => m.vendor === 'Luma AI')
    expect(lumaRows.map((m) => m.id)).toEqual([
      'luma-ray32-360p',
      'luma-ray32-540p',
      'luma-ray32-720p',
      'luma-ray32-1080p',
    ])
    const byId = Object.fromEntries(lumaRows.map((m) => [m.id, m]))
    expect(byId['luma-ray32-360p'].price).toBe(20)
    expect(byId['luma-ray32-540p'].price).toBe(50)
    expect(byId['luma-ray32-720p'].price).toBe(100)
    expect(byId['luma-ray32-1080p'].price).toBe(400)
    for (const m of lumaRows) {
      expect(m.secondsPerGeneration).toBe(5)
      expect(m.usdPerNativeUnit).toBe(0.003)
      expect(m.conversionBasis).toContain('30 美元/10000 credits')
    }
  })
})

describe('即梦按会员档位分行', () => {
  it('4 个档位行，人民币按秒计费', () => {
    const jimengRows = MODEL_PRICES.filter((m) => m.vendor === 'ByteDance')
    expect(jimengRows.map((m) => m.id)).toEqual([
      'jimeng-super-flash',
      'jimeng-super-25',
      'jimeng-advanced-flash',
      'jimeng-advanced-25',
    ])
    const byId = Object.fromEntries(jimengRows.map((m) => [m.id, m]))
    expect(byId['jimeng-super-flash'].price).toBe(0.21)
    expect(byId['jimeng-super-25'].price).toBe(0.24)
    expect(byId['jimeng-advanced-flash'].price).toBe(0.37)
    expect(byId['jimeng-advanced-25'].price).toBe(0.43)
    for (const m of jimengRows) {
      expect(m.unit).toBe('per-second')
      expect(m.currency).toBe('CNY')
      expect(m.status).toBe('verified')
    }
  })
})

describe('漫剧外包市场价（2026-11-17 调研引用）', () => {
  it('单条 300-800 元，100 条起订 280 元/条', () => {
    const single = MARKET_QUOTES.find((q) => q.id === 'manju-single')
    expect(single?.lowCny).toBe(300)
    expect(single?.highCny).toBe(800)
    expect(single?.bulkMinVideos).toBeNull()
    expect(single?.status).toBe('reference')
    expect(single?.verifiedDate).toBe('2026-11-17')

    const bulk = MARKET_QUOTES.find((q) => q.id === 'manju-bulk')
    expect(bulk?.lowCny).toBe(280)
    expect(bulk?.highCny).toBe(280)
    expect(bulk?.bulkMinVideos).toBe(100)
    expect(bulk?.status).toBe('reference')
  })

  it('市场价来源写明调研日期与渠道', () => {
    for (const q of MARKET_QUOTES) {
      expect(q.source).toContain('2026-11-17')
    }
  })
})
