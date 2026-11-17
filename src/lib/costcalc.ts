// 测算逻辑：全部是确定性计算，零大模型调用。
// 确定性层：
//   代码算的：总秒数、模型直接成本、重生成后成本、流水线成本、代码渲染时间与人工成本、
//     外包市场价区间、 cheapest 与节省额、排序。
//   查表的：模型单价（pricing.ts）、漫剧外包市场价（pricing.ts）、风格建议重生成率（pricing.ts）。
//   用户输入的：剧本参数、汇率、质检时间、时薪、渲染耗时。输入变了结果就变，同一输入同一输出。
// 货币：内部统一算人民币；模型价为美元时按输入的汇率换算，汇率为用户输入的假设值，不是实时汇率。
// 单位：per-second/per-video 直接算；per-unit（Units/秒）与 per-credit（credits/次）按 pricing.ts
//   里的 usdPerNativeUnit 换算成美元再算，换算依据写在 conversionBasis，换算结果在
//   ModelRow.converted 里标记。per-count 不换算成本（官方未说明 count 与秒的换算）。
// per-credit 按次计费：生成次数 = 总镜头数 × ceil(每镜头秒数 ÷ 每次生成秒数)，不足一次按一次算（假设）。

import { MARKET_QUOTES, MODEL_PRICES, notComparableReason, type ModelPrice } from './pricing.ts'

export interface CalcInput {
  /** 视频条数 */
  videos: number
  /** 每条视频的镜头数 */
  shotsPerVideo: number
  /** 每个镜头秒数 */
  secondsPerShot: number
  /** 重生成率 0-5（0 表示不重生成，1 表示平均每个镜头多生成一次） */
  retryRate: number
  /** 美元兑人民币汇率（假设值，可改） */
  exchangeRate: number
  /** 每条视频的人工质检分钟数（流水线成本用） */
  qcMinutesPerVideo: number
  /** 人工时薪（人民币/小时，0 表示不计人工成本） */
  hourlyRateCny: number
  /** 代码渲染每 1 秒成片需要的本地计算秒数（默认 6，即 30fps 下每帧约 0.2 秒） */
  renderSecondsPerVideoSecond: number
  /** 用户改过的模型单价（美元），key 为模型 id；不传则用价格表默认值 */
  priceOverrides?: Record<string, number | null>
}

export interface ModelRow {
  model: ModelPrice
  /** 直接成本（人民币，不含重生成） */
  directCny: number
  /** 含重生成后的期望成本（人民币） */
  expectedCny: number
  /** 含重生成与质检的流水线成本（人民币） */
  pipelineCny: number
  /** 每条视频的期望成本（人民币） */
  perVideoCny: number
  /** 每秒成片的期望成本（人民币） */
  perSecondCny: number
  /** 是否有可用单价（无单价时不参与比较） */
  priced: boolean
  /** 成本是否经过换算（Units/credits 换算为美元等） */
  converted: boolean
  /** 不参与比较的原因（已下线、按 count 计费、未填单价等）；可比时为 null */
  notComparableReason: string | null
}

export interface MarketRow {
  label: string
  lowCny: number
  highCny: number
  /** 是否适用（批量价只在条数达标时适用） */
  applies: boolean
  note: string
}

export interface CodeRenderRow {
  /** 直接成本（人民币，恒为 0） */
  directCny: number
  /** 本地渲染总耗时（分钟） */
  renderMinutes: number
  /** 人工成本（人民币，时薪为 0 时为 0） */
  laborCny: number
}

export interface CalcResult {
  totalSeconds: number
  totalShots: number
  models: ModelRow[]
  cheapest: ModelRow | null
  market: MarketRow[]
  codeRender: CodeRenderRow
  /** 最便宜模型相对外包单条低价的节省额（人民币，null 表示无可比项） */
  savingsVsMarketLowCny: number | null
  /** 最便宜模型相对外包单条高价的节省额（人民币） */
  savingsVsMarketHighCny: number | null
}

export interface CalcError {
  ok: false
  errors: string[]
}

export type CalcOutcome = { ok: true; result: CalcResult } | CalcError

/** 金额保留两位小数（四舍五入）。 */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function isNonNegativeInteger(n: number): boolean {
  return Number.isInteger(n) && n >= 0
}

function validate(input: CalcInput): string[] {
  const errors: string[] = []
  if (!isNonNegativeInteger(input.videos)) errors.push('视频条数须为非负整数')
  if (!isNonNegativeInteger(input.shotsPerVideo)) errors.push('每条镜头数须为非负整数')
  if (typeof input.secondsPerShot !== 'number' || Number.isNaN(input.secondsPerShot) || input.secondsPerShot < 0) {
    errors.push('每镜头秒数须为非负数')
  }
  if (typeof input.retryRate !== 'number' || Number.isNaN(input.retryRate) || input.retryRate < 0 || input.retryRate > 5) {
    errors.push('重生成率须在 0 到 5 之间')
  }
  if (typeof input.exchangeRate !== 'number' || Number.isNaN(input.exchangeRate) || input.exchangeRate <= 0) {
    errors.push('汇率须为正数')
  }
  if (typeof input.qcMinutesPerVideo !== 'number' || Number.isNaN(input.qcMinutesPerVideo) || input.qcMinutesPerVideo < 0) {
    errors.push('质检分钟数须为非负数')
  }
  if (typeof input.hourlyRateCny !== 'number' || Number.isNaN(input.hourlyRateCny) || input.hourlyRateCny < 0) {
    errors.push('时薪须为非负数')
  }
  if (
    typeof input.renderSecondsPerVideoSecond !== 'number' ||
    Number.isNaN(input.renderSecondsPerVideoSecond) ||
    input.renderSecondsPerVideoSecond < 0
  ) {
    errors.push('渲染耗时须为非负数')
  }
  if (input.priceOverrides) {
    for (const [id, price] of Object.entries(input.priceOverrides)) {
      if (price !== null && (typeof price !== 'number' || Number.isNaN(price) || price < 0)) {
        errors.push(`模型 ${id} 的单价须为非负数或留空`)
      }
    }
  }
  return errors
}

function resolvePrice(model: ModelPrice, overrides?: Record<string, number | null>): number | null {
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, model.id)) {
    return overrides[model.id]
  }
  return model.price
}

/**
 * 按原生计费单位算直接成本（人民币）。返回 null 表示无法换算成本：未填单价、已下线、
 * 按 count 计费（官方未说明 count 与秒的换算）、Units/credits 模型缺换算比率。
 * per-credit 按次计费：生成次数 = 总镜头数 × ceil(每镜头秒数 ÷ 每次生成秒数)，
 * 不足一次按一次算（假设，未核实）。
 */
function modelDirectCost(
  model: ModelPrice,
  price: number | null,
  input: CalcInput,
  totalSeconds: number,
  totalShots: number,
): { directCny: number; converted: boolean } | null {
  if (price === null) return null
  if (model.unit === 'per-count') return null
  if (model.unit === 'per-second') {
    const native = price * totalSeconds
    return { directCny: round2(native * (model.currency === 'USD' ? input.exchangeRate : 1)), converted: false }
  }
  if (model.unit === 'per-video') {
    const native = price * totalShots
    return { directCny: round2(native * (model.currency === 'USD' ? input.exchangeRate : 1)), converted: false }
  }
  if (model.unit === 'per-unit') {
    if (model.usdPerNativeUnit === null) return null
    const usdPerSecond = price * model.usdPerNativeUnit
    return { directCny: round2(usdPerSecond * totalSeconds * input.exchangeRate), converted: true }
  }
  if (model.secondsPerGeneration === null || model.usdPerNativeUnit === null) return null
  const generations = totalShots * Math.ceil(input.secondsPerShot / model.secondsPerGeneration)
  const usd = generations * price * model.usdPerNativeUnit
  return { directCny: round2(usd * input.exchangeRate), converted: true }
}

export function calculate(input: CalcInput): CalcOutcome {
  const errors = validate(input)
  if (errors.length > 0) return { ok: false, errors }

  const totalShots = input.videos * input.shotsPerVideo
  const totalSeconds = totalShots * input.secondsPerShot
  const retryFactor = 1 + input.retryRate
  const qcCostPerVideo = (input.qcMinutesPerVideo / 60) * input.hourlyRateCny

  const models: ModelRow[] = MODEL_PRICES.map((model) => {
    const reason = notComparableReason(model)
    const price = resolvePrice(model, input.priceOverrides)
    const cost = reason === null ? modelDirectCost(model, price, input, totalSeconds, totalShots) : null
    if (cost === null) {
      return {
        model,
        directCny: 0,
        expectedCny: 0,
        pipelineCny: 0,
        perVideoCny: 0,
        perSecondCny: 0,
        priced: false,
        converted: false,
        notComparableReason: reason ?? '未填单价，不参与比较',
      }
    }
    const directCny = cost.directCny
    const expectedCny = round2(directCny * retryFactor)
    const pipelineCny = round2(expectedCny + input.videos * qcCostPerVideo)
    return {
      model,
      directCny,
      expectedCny,
      pipelineCny,
      perVideoCny: input.videos > 0 ? round2(expectedCny / input.videos) : 0,
      perSecondCny: totalSeconds > 0 ? round2(expectedCny / totalSeconds) : 0,
      priced: true,
      converted: cost.converted,
      notComparableReason: null,
    }
  })

  const pricedModels = models.filter((m) => m.priced)
  const sorted = [...pricedModels].sort((a, b) => a.expectedCny - b.expectedCny)
  const cheapest = sorted.length > 0 ? sorted[0] : null

  const market: MarketRow[] = MARKET_QUOTES.map((q) => {
    const applies = q.bulkMinVideos === null || input.videos >= q.bulkMinVideos
    return {
      label: q.label,
      lowCny: round2(q.lowCny * input.videos),
      highCny: round2(q.highCny * input.videos),
      applies,
      note: q.note,
    }
  })

  const renderMinutes = round2((totalSeconds * input.renderSecondsPerVideoSecond) / 60)
  const codeRender: CodeRenderRow = {
    directCny: 0,
    renderMinutes,
    laborCny: round2((renderMinutes / 60) * input.hourlyRateCny),
  }

  const singleMarket = market.find((m) => m.label.includes('单条'))
  let savingsVsMarketLowCny: number | null = null
  let savingsVsMarketHighCny: number | null = null
  if (cheapest && singleMarket) {
    savingsVsMarketLowCny = round2(singleMarket.lowCny - cheapest.expectedCny)
    savingsVsMarketHighCny = round2(singleMarket.highCny - cheapest.expectedCny)
  }

  return {
    ok: true,
    result: {
      totalSeconds,
      totalShots,
      models,
      cheapest,
      market,
      codeRender,
      savingsVsMarketLowCny,
      savingsVsMarketHighCny,
    },
  }
}

/** 默认输入：10 条漫剧，每条 5 镜头，每镜头 5 秒。 */
export const DEFAULT_INPUT: CalcInput = {
  videos: 10,
  shotsPerVideo: 5,
  secondsPerShot: 5,
  retryRate: 0.35,
  exchangeRate: 7.1,
  qcMinutesPerVideo: 0,
  hourlyRateCny: 0,
  renderSecondsPerVideoSecond: 6,
}
