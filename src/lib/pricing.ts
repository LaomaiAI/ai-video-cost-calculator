// 价格表：AI 视频生成模型与漫剧外包市场价。
// 口径：每条价格必须带来源与核实状态。
//   verified：2026-11-18 已按官方定价页核实，verifiedDate 为核实日期。
//   reference：调研引用的行业文报价（不是官方定价）。
//   unverified：记忆参考值，未实测核实，使用前必须按官方定价页复核。
//   discontinued：已下线，现行价已删除，不参与比较。
// 计费单位：per-second（每秒）、per-video（每条视频/每次生成）、per-count（每个 count）、
//   per-unit（每秒 Units 数，Units 需按套餐价换算成美元）、per-credit（每次生成的 credits 数）。
// 换算规则：Units/credits 换算成美元的比率写在 usdPerNativeUnit，依据写在 conversionBasis；
//   凡是经过换算的成本，测算结果里一律标为换算。
// 特别说明：Veo 3 按 count 计费，官方未注明 1 count = 多少秒，绝不默认 1 count = 1 秒，
//   因此按 count 计费的模型不换算成本、不参与比较。
// 货币：模型价分美元与人民币；换算汇率由测算输入决定，不写死在表里。

export type PriceStatus = 'verified' | 'reference' | 'unverified' | 'discontinued'
export type PriceUnit = 'per-second' | 'per-video' | 'per-count' | 'per-unit' | 'per-credit'
export type PriceCurrency = 'USD' | 'CNY'

export interface ModelPrice {
  id: string
  name: string
  vendor: string
  unit: PriceUnit
  /** 原生单价的货币；Units/credits 类原生单位不是货币时为 null（换算见 usdPerNativeUnit）。 */
  currency: PriceCurrency | null
  /**
   * 原生单价。per-second 为每秒价，per-video 为每条视频价，per-count 为每个 count 价，
   * per-unit 为每秒 Units 数，per-credit 为每次生成的 credits 数。null 表示未填或已下线。
   */
  price: number | null
  /** per-credit 模型一次生成对应的秒数（如 5；Runway 按秒计 credits 时为 1）；其他单位为 null。 */
  secondsPerGeneration: number | null
  /** 原生单位换算为美元的比率（如 1 Unit = 0.15386 美元）；无换算为 null。 */
  usdPerNativeUnit: number | null
  /** 换算依据说明；无换算为空字符串。 */
  conversionBasis: string
  source: string
  /** 核实日期（YYYY-MM-DD），未核实为 null。 */
  verifiedDate: string | null
  status: PriceStatus
  note: string
}

export const PRICE_TABLE_VERIFIED_DATE = '2026-11-18'

export const MODEL_PRICES: ModelPrice[] = [
  {
    id: 'sora2',
    name: 'Sora 2',
    vendor: 'OpenAI',
    unit: 'per-second',
    currency: 'USD',
    price: null,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'OpenAI 官方：2026-09-24 关闭 Sora 2 与 Videos API',
    verifiedDate: '2026-11-18',
    status: 'discontinued',
    note: '已下线：OpenAI 于 2026-09-24 关闭 Sora 2 与 Videos API，无替代 API；现行价已删除，不参与比较。',
  },
  {
    id: 'veo3-av',
    name: 'Veo 3（含音频）',
    vendor: 'Google',
    unit: 'per-count',
    currency: 'USD',
    price: 0.4,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'Google Cloud Model Garden 定价页 cloud.google.com/model-garden/pricing',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '视频+音频 720p 与 1080p 均为 0.40 美元/count。官方未注明 1 count = 多少秒，不换算成本，不参与比较。',
  },
  {
    id: 'veo3-video',
    name: 'Veo 3（仅视频）',
    vendor: 'Google',
    unit: 'per-count',
    currency: 'USD',
    price: 0.2,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'Google Cloud Model Garden 定价页 cloud.google.com/model-garden/pricing',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '仅视频 0.20 美元/count。官方未注明 1 count = 多少秒，不换算成本，不参与比较。',
  },
  {
    id: 'veo3-fast-av-720p',
    name: 'Veo 3 Fast（含音频）720p',
    vendor: 'Google',
    unit: 'per-count',
    currency: 'USD',
    price: 0.1,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'Google Cloud Model Garden 定价页 cloud.google.com/model-garden/pricing',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '视频+音频 720p 0.10 美元/count。官方未注明 1 count = 多少秒，不换算成本，不参与比较。',
  },
  {
    id: 'veo3-fast-av-1080p',
    name: 'Veo 3 Fast（含音频）1080p',
    vendor: 'Google',
    unit: 'per-count',
    currency: 'USD',
    price: 0.12,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'Google Cloud Model Garden 定价页 cloud.google.com/model-garden/pricing',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '视频+音频 1080p 0.12 美元/count。官方未注明 1 count = 多少秒，不换算成本，不参与比较。',
  },
  {
    id: 'veo3-fast-video-720p',
    name: 'Veo 3 Fast（仅视频）720p',
    vendor: 'Google',
    unit: 'per-count',
    currency: 'USD',
    price: 0.08,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'Google Cloud Model Garden 定价页 cloud.google.com/model-garden/pricing',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '仅视频 720p 0.08 美元/count。官方未注明 1 count = 多少秒，不换算成本，不参与比较。',
  },
  {
    id: 'veo3-fast-video-1080p',
    name: 'Veo 3 Fast（仅视频）1080p',
    vendor: 'Google',
    unit: 'per-count',
    currency: 'USD',
    price: 0.1,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'Google Cloud Model Garden 定价页 cloud.google.com/model-garden/pricing',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '仅视频 1080p 0.10 美元/count。官方未注明 1 count = 多少秒，不换算成本，不参与比较。',
  },
  {
    id: 'kling25-turbo-noaudio-720p',
    name: 'Kling 2.5 Turbo（无音频）720p',
    vendor: 'Kuaishou 可灵',
    unit: 'per-unit',
    currency: null,
    price: 0.3,
    secondsPerGeneration: null,
    usdPerNativeUnit: 0.15386,
    conversionBasis: 'Standard Package 500 美元/3250 Units（页面标 46% off），折合 1 Unit = 0.15386 美元',
    source: '可灵官方定价页（Kling 2.5 Turbo）',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '无原生音频 720p：0.3 Units/秒；换算约 0.046 美元/秒（换算）。官方现行表已无 2.1，从 2.5 Turbo 起列。',
  },
  {
    id: 'kling25-turbo-noaudio-1080p',
    name: 'Kling 2.5 Turbo（无音频）1080p',
    vendor: 'Kuaishou 可灵',
    unit: 'per-unit',
    currency: null,
    price: 0.5,
    secondsPerGeneration: null,
    usdPerNativeUnit: 0.15386,
    conversionBasis: 'Standard Package 500 美元/3250 Units（页面标 46% off），折合 1 Unit = 0.15386 美元',
    source: '可灵官方定价页（Kling 2.5 Turbo）',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '无原生音频 1080p：0.5 Units/秒；换算约 0.077 美元/秒（换算）。官方现行表已无 2.1，从 2.5 Turbo 起列。',
  },
  {
    id: 'kling25-turbo-audio-720p',
    name: 'Kling 2.5 Turbo（含音频）720p',
    vendor: 'Kuaishou 可灵',
    unit: 'per-unit',
    currency: null,
    price: 0.5,
    secondsPerGeneration: null,
    usdPerNativeUnit: 0.15386,
    conversionBasis: 'Standard Package 500 美元/3250 Units（页面标 46% off），折合 1 Unit = 0.15386 美元',
    source: '可灵官方定价页（Kling 2.5 Turbo）',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '含原生音频 720p：0.5 Units/秒；换算约 0.077 美元/秒（换算）。官方现行表已无 2.1，从 2.5 Turbo 起列。',
  },
  {
    id: 'kling25-turbo-audio-1080p',
    name: 'Kling 2.5 Turbo（含音频）1080p',
    vendor: 'Kuaishou 可灵',
    unit: 'per-unit',
    currency: null,
    price: 0.8,
    secondsPerGeneration: null,
    usdPerNativeUnit: 0.15386,
    conversionBasis: 'Standard Package 500 美元/3250 Units（页面标 46% off），折合 1 Unit = 0.15386 美元',
    source: '可灵官方定价页（Kling 2.5 Turbo）',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '含原生音频 1080p：0.8 Units/秒；换算约 0.123 美元/秒（换算）。官方现行表已无 2.1，从 2.5 Turbo 起列。',
  },
  {
    id: 'hailuo02',
    name: 'Hailuo 02（历史模型）',
    vendor: 'MiniMax 海螺',
    unit: 'per-video',
    currency: 'CNY',
    price: null,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'MiniMax 开放平台定价页 platform.minimax.cn/docs/pricing/overview',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '历史模型：现行旗舰为 MiniMax-H3。已核实的 02 分档价（人民币/视频）：文生/图生 768P 6 秒 2.00 元、10 秒 4.00 元，1080P 6 秒 3.50 元；图生 512P 6 秒 0.60 元、10 秒 1.00 元。单价随片长与分辨率分档，无统一单价，不参与比较；页面上可填一个分档价参与比较。',
  },
  {
    id: 'minimax-h3-2k',
    name: 'MiniMax-H3 2K',
    vendor: 'MiniMax',
    unit: 'per-second',
    currency: 'CNY',
    price: 0.8,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: 'MiniMax 开放平台定价页 platform.minimax.cn/docs/pricing/overview',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '现行旗舰 MiniMax-H3，2K 档 0.80 元/秒。其他分辨率档位单价不同，见官方定价页。',
  },
  {
    id: 'runway-gen4',
    name: 'Runway Gen-4',
    vendor: 'Runway',
    unit: 'per-credit',
    currency: null,
    price: 12,
    secondsPerGeneration: 1,
    usdPerNativeUnit: 95 / 9500,
    conversionBasis: 'Unlimited 套餐 95 美元/9500 credits，1 credit = 0.01 美元；9500 credits = 791 秒 Gen-4，约 12 credits/秒',
    source: 'Runway 官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '积分计费：约 12 credits/秒，换算约 0.12 美元/秒（换算）。API 页仅写视频 From 0.05 美元/秒，未单独列 Gen-4。套餐：Standard 15 美元/月含 625 credits、Pro 35 美元/月含 2250、Unlimited 95 美元/月含 9500。',
  },
  {
    id: 'pika25-720p',
    name: 'Pika 2.5 720p',
    vendor: 'Pika',
    unit: 'per-credit',
    currency: null,
    price: 20,
    secondsPerGeneration: 5,
    usdPerNativeUnit: 1 / 60,
    conversionBasis: '一次性充值 60 credits = 1 美元，1 credit 约 0.0167 美元',
    source: 'Pika 官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '720p 5 秒 20 credits/次。按次计费：不足一次按一次算（假设）。官方现行表已无 2.2，用 2.5 替代。积分价：Starter 10 美元/月 600 credits、Creator 35 美元/月 2600、Fancy 95 美元/月 8550 起。',
  },
  {
    id: 'pika-h3-flex-768p',
    name: 'Pika H3 Flex 768p',
    vendor: 'Pika',
    unit: 'per-credit',
    currency: null,
    price: 10,
    secondsPerGeneration: 5,
    usdPerNativeUnit: 1 / 60,
    conversionBasis: '一次性充值 60 credits = 1 美元，1 credit 约 0.0167 美元',
    source: 'Pika 官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '768p 5 秒 10 credits/次。按次计费：不足一次按一次算（假设）。',
  },
  {
    id: 'luma-ray32-360p',
    name: 'Luma Ray 3.2 360p',
    vendor: 'Luma AI',
    unit: 'per-credit',
    currency: null,
    price: 20,
    secondsPerGeneration: 5,
    usdPerNativeUnit: 30 / 10000,
    conversionBasis: 'Plus 套餐 30 美元/10000 credits，1 credit = 0.003 美元',
    source: 'Luma 官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '文生/图生 360p 20 credits/5 秒。按次计费：不足一次按一次算（假设）。官方现行表已无 Ray 2，用 Ray 3.2 替代。套餐：Plus 30 美元/月 10000 credits、Pro 90 美元/月 40000、Ultra 300 美元/月 150000。',
  },
  {
    id: 'luma-ray32-540p',
    name: 'Luma Ray 3.2 540p',
    vendor: 'Luma AI',
    unit: 'per-credit',
    currency: null,
    price: 50,
    secondsPerGeneration: 5,
    usdPerNativeUnit: 30 / 10000,
    conversionBasis: 'Plus 套餐 30 美元/10000 credits，1 credit = 0.003 美元',
    source: 'Luma 官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '文生/图生 540p 50 credits/5 秒。按次计费：不足一次按一次算（假设）。官方现行表已无 Ray 2，用 Ray 3.2 替代。',
  },
  {
    id: 'luma-ray32-720p',
    name: 'Luma Ray 3.2 720p',
    vendor: 'Luma AI',
    unit: 'per-credit',
    currency: null,
    price: 100,
    secondsPerGeneration: 5,
    usdPerNativeUnit: 30 / 10000,
    conversionBasis: 'Plus 套餐 30 美元/10000 credits，1 credit = 0.003 美元',
    source: 'Luma 官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '文生/图生 720p 100 credits/5 秒。按次计费：不足一次按一次算（假设）。官方现行表已无 Ray 2，用 Ray 3.2 替代。',
  },
  {
    id: 'luma-ray32-1080p',
    name: 'Luma Ray 3.2 1080p',
    vendor: 'Luma AI',
    unit: 'per-credit',
    currency: null,
    price: 400,
    secondsPerGeneration: 5,
    usdPerNativeUnit: 30 / 10000,
    conversionBasis: 'Plus 套餐 30 美元/10000 credits，1 credit = 0.003 美元',
    source: 'Luma 官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '文生/图生 1080p 400 credits/5 秒。按次计费：不足一次按一次算（假设）。官方现行表已无 Ray 2，用 Ray 3.2 替代。',
  },
  {
    id: 'jimeng-super-flash',
    name: '即梦 Seedance 2.5 Flash（超级会员）',
    vendor: 'ByteDance',
    unit: 'per-second',
    currency: 'CNY',
    price: 0.21,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: '即梦官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '连续包季档超级会员 0.21 元/秒；年卡/11 月 16-23 日档（720p 带参考视频）0.09 元/秒。单价随会员档位、促销期、是否带参考视频而变，无公开统一价。',
  },
  {
    id: 'jimeng-super-25',
    name: '即梦 Seedance 2.5（超级会员）',
    vendor: 'ByteDance',
    unit: 'per-second',
    currency: 'CNY',
    price: 0.24,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: '即梦官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '连续包季档超级会员 0.24 元/秒；年卡/11 月 16-23 日档（720p 带参考视频）0.16 元/秒。单价随会员档位、促销期、是否带参考视频而变，无公开统一价。',
  },
  {
    id: 'jimeng-advanced-flash',
    name: '即梦 Seedance 2.5 Flash（高级会员）',
    vendor: 'ByteDance',
    unit: 'per-second',
    currency: 'CNY',
    price: 0.37,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: '即梦官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '连续包季档高级会员 0.37 元/秒；年卡/11 月 16-23 日档（720p 带参考视频）0.29 元/秒。单价随会员档位、促销期、是否带参考视频而变，无公开统一价。',
  },
  {
    id: 'jimeng-advanced-25',
    name: '即梦 Seedance 2.5（高级会员）',
    vendor: 'ByteDance',
    unit: 'per-second',
    currency: 'CNY',
    price: 0.43,
    secondsPerGeneration: null,
    usdPerNativeUnit: null,
    conversionBasis: '',
    source: '即梦官方定价页',
    verifiedDate: '2026-11-18',
    status: 'verified',
    note: '连续包季档高级会员 0.43 元/秒；年卡/11 月 16-23 日档（720p 带参考视频）0.42 元/秒。单价随会员档位、促销期、是否带参考视频而变，无公开统一价。',
  },
]

/** 漫剧外包市场价（人民币/条）。来源：2026-11-17 调研，小红书与行业文报价，非官方定价。 */
export interface MarketQuote {
  id: string
  label: string
  lowCny: number
  highCny: number
  /** 批量价起订条数，null 表示无批量价。 */
  bulkMinVideos: number | null
  source: string
  verifiedDate: string
  status: PriceStatus
  note: string
}

export const MARKET_QUOTES: MarketQuote[] = [
  {
    id: 'manju-single',
    label: '漫剧外包（单条）',
    lowCny: 300,
    highCny: 800,
    bulkMinVideos: null,
    source: '2026-11-17 调研：小红书与行业文（AI 漫剧报价）',
    verifiedDate: '2026-11-17',
    status: 'reference',
    note: '单条 300-800 元，报价不透明是普遍抱怨，区间按调研引用。',
  },
  {
    id: 'manju-bulk',
    label: '漫剧外包（100 条起订）',
    lowCny: 280,
    highCny: 280,
    bulkMinVideos: 100,
    source: '2026-11-17 调研：小红书与行业文（AI 漫剧报价）',
    verifiedDate: '2026-11-17',
    status: 'reference',
    note: '100 条起订可低至 280 元/条。',
  },
]

/** 风格对应的建议重生成率（可改的假设默认值，不是实测数据）。 */
export const STYLE_RETRY_SUGGESTIONS: Record<string, { label: string; retryRate: number; reason: string }> = {
  realistic: { label: '写实', retryRate: 0.25, reason: '人物与场景一致性要求高，约四分之一镜头需重生成。' },
  animation: { label: '动画', retryRate: 0.2, reason: '风格化容忍度较高，重生成相对少。' },
  manju: { label: '漫剧', retryRate: 0.35, reason: '分镜多、人物一致性难，重生成最多。' },
}

export function statusLabel(status: PriceStatus): string {
  if (status === 'verified') return '已核实'
  if (status === 'reference') return '参考价'
  if (status === 'discontinued') return '已下线'
  return '待核实'
}

/** 计费单位的中文标签。 */
export function unitLabel(unit: PriceUnit): string {
  if (unit === 'per-second') return '按秒'
  if (unit === 'per-video') return '按条'
  if (unit === 'per-count') return '按 count'
  if (unit === 'per-unit') return 'Units/秒'
  return 'credits/次'
}

/** 原生单价的显示文本（如 $0.40 / count、0.3 Units / 秒、20 credits / 5 秒、¥0.21 / 秒）。 */
export function formatNativePrice(model: ModelPrice): string {
  if (model.price === null) return '—'
  if (model.unit === 'per-second') {
    return model.currency === 'CNY' ? `¥${model.price} / 秒` : `$${model.price} / 秒`
  }
  if (model.unit === 'per-video') {
    return model.currency === 'CNY' ? `¥${model.price} / 条` : `$${model.price} / 条`
  }
  if (model.unit === 'per-count') return `$${model.price} / count`
  if (model.unit === 'per-unit') return `${model.price} Units / 秒`
  const seconds = model.secondsPerGeneration === 1 ? '秒' : `${model.secondsPerGeneration ?? '?'} 秒`
  return `${model.price} credits / ${seconds}`
}

/**
 * 模型不参与成本比较的原因；可比时为 null。
 * 按 count 计费的模型：官方未说明 1 count = 多少秒，无法换算成本。
 * 已下线的模型：服务不存在，填单价也不参与比较。
 */
export function notComparableReason(model: ModelPrice): string | null {
  if (model.status === 'discontinued') return '已下线，不参与比较'
  if (model.unit === 'per-count') return '按 count 计费，官方未说明 1 count = 多少秒，无法换算成本'
  return null
}

/** 表里有多少模型价是待核实的（供界面与测试用）。 */
export function countUnverifiedPrices(): number {
  return MODEL_PRICES.filter((m) => m.status === 'unverified').length
}
