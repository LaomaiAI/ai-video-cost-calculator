import { useMemo, useState } from 'react'
import { calculate, DEFAULT_INPUT, type CalcInput } from './lib/costcalc.ts'
import {
  MARKET_QUOTES,
  STYLE_RETRY_SUGGESTIONS,
  formatNativePrice,
  statusLabel,
  unitLabel,
  type PriceStatus,
} from './lib/pricing.ts'
import { SAMPLE_SCENARIOS } from './lib/samples.ts'

function formatCny(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusBadge(status: PriceStatus) {
  const style =
    status === 'verified'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'reference'
        ? 'bg-sky-100 text-sky-800'
        : 'bg-amber-100 text-amber-800'
  return <span className={`rounded-full px-2 py-0.5 text-xs ${style}`}>{statusLabel(status)}</span>
}

function NumberField(props: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  hint?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{props.label}</span>
      <input
        type="number"
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
        value={props.value}
        min={props.min ?? 0}
        step={props.step ?? 1}
        onChange={(e) => {
          const v = Number(e.target.value)
          props.onChange(Number.isNaN(v) ? 0 : v)
        }}
      />
      {props.hint ? <span className="mt-1 block text-xs text-stone-500">{props.hint}</span> : null}
    </label>
  )
}

export default function App() {
  const [input, setInput] = useState<CalcInput>(DEFAULT_INPUT)
  const [style, setStyle] = useState<string>('manju')
  const [overrides, setOverrides] = useState<Record<string, number | null>>({})
  const [activeSample, setActiveSample] = useState<string>('sample-a')

  const outcome = useMemo(
    () => calculate({ ...input, priceOverrides: overrides }),
    [input, overrides],
  )

  const applySample = (id: string) => {
    const sample = SAMPLE_SCENARIOS.find((s) => s.id === id)
    if (!sample) return
    setActiveSample(id)
    setInput({ ...sample.input })
    setOverrides({})
    setStyle(id === 'sample-c' ? 'animation' : 'manju')
  }

  const applyStyle = (key: string) => {
    setStyle(key)
    const suggestion = STYLE_RETRY_SUGGESTIONS[key]
    if (suggestion) setInput((prev) => ({ ...prev, retryRate: suggestion.retryRate }))
  }

  const setField = <K extends keyof CalcInput>(key: K, value: CalcInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  const pricedCount = outcome.ok ? outcome.result.models.filter((m) => m.priced).length : 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">AI 视频与漫剧成本测算器</h1>
        <p className="mt-2 text-stone-600">
          输入剧本（时长、镜头数、风格、条数），算各家模型与批量流水线成本，再和漫剧外包价、代码渲染成本放一起比。
          全部代码算的，零大模型调用；模型单价已按 2026-11-18 官方定价页核实。按 count 计费的模型无法换算成本，不参与比较；
          积分与 Units 换算的成本标为换算。
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-stone-900">示例场景</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {SAMPLE_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applySample(s.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                activeSample === s.id
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-700'
              }`}
              title={s.description}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">剧本参数</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="视频条数" value={input.videos} onChange={(v) => setField('videos', v)} />
          <NumberField label="每条镜头数" value={input.shotsPerVideo} onChange={(v) => setField('shotsPerVideo', v)} />
          <NumberField
            label="每镜头秒数"
            value={input.secondsPerShot}
            onChange={(v) => setField('secondsPerShot', v)}
            step={0.5}
          />
          <label className="block">
            <span className="text-sm font-medium text-stone-700">风格（决定建议重生成率）</span>
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
              value={style}
              onChange={(e) => applyStyle(e.target.value)}
            >
              {Object.entries(STYLE_RETRY_SUGGESTIONS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}（建议重生成率 {Math.round(s.retryRate * 100)}%）
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-stone-500">
              {STYLE_RETRY_SUGGESTIONS[style]?.reason} 建议值可改，只是假设默认值，不是实测数据。
            </span>
          </label>
          <NumberField
            label="重生成率（0-5）"
            value={input.retryRate}
            onChange={(v) => setField('retryRate', v)}
            step={0.05}
            hint="1 表示平均每个镜头多生成一次。"
          />
          <NumberField
            label="美元兑人民币汇率"
            value={input.exchangeRate}
            onChange={(v) => setField('exchangeRate', v)}
            step={0.1}
            hint="假设值，可改，不是实时汇率。"
          />
          <NumberField
            label="质检分钟数 / 条"
            value={input.qcMinutesPerVideo}
            onChange={(v) => setField('qcMinutesPerVideo', v)}
            hint="流水线成本用，0 表示不计质检。"
          />
          <NumberField
            label="人工时薪（元/小时）"
            value={input.hourlyRateCny}
            onChange={(v) => setField('hourlyRateCny', v)}
            hint="0 表示只看直接成本，不计人工。"
          />
          <NumberField
            label="代码渲染耗时（秒/每秒成片）"
            value={input.renderSecondsPerVideoSecond}
            onChange={(v) => setField('renderSecondsPerVideoSecond', v)}
            step={0.5}
            hint="默认 6，即 30fps 下每帧约 0.2 秒。"
          />
        </div>
      </section>

      {!outcome.ok ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800">输入有问题</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
            {outcome.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h3 className="text-sm text-stone-500">总成片</h3>
              <p className="mt-1 text-2xl font-bold text-stone-900">
                {outcome.result.totalSeconds} 秒 · {outcome.result.totalShots} 镜头
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {input.videos} 条 × {input.shotsPerVideo} 镜头 × {input.secondsPerShot} 秒
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-sm text-emerald-700">最便宜的模型</h3>
              {outcome.result.cheapest ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">
                    {outcome.result.cheapest.model.name} · {formatCny(outcome.result.cheapest.expectedCny)}
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    每条 {formatCny(outcome.result.cheapest.perVideoCny)}，每秒成片{' '}
                    {formatCny(outcome.result.cheapest.perSecondCny)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-stone-600">没有可用单价的模型，请先填写单价。</p>
              )}
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h3 className="text-sm text-stone-500">代码渲染</h3>
              <p className="mt-1 text-2xl font-bold text-stone-900">直接成本 ¥0.00</p>
              <p className="mt-1 text-sm text-stone-500">
                本地渲染约 {outcome.result.codeRender.renderMinutes} 分钟
                {input.hourlyRateCny > 0 ? `，人工成本 ${formatCny(outcome.result.codeRender.laborCny)}` : ''}
              </p>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-stone-900">各家模型成本（按含重生成成本从低到高）</h2>
            <p className="mt-1 text-sm text-stone-500">
              共 {pricedCount} 个模型参与比较；其余因按 count 计费、已下线或未填单价不参与比较；单价可直接在表里改，改完结果实时重算。
            </p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-600">
                  <tr>
                    <th className="px-3 py-2">模型</th>
                    <th className="px-3 py-2">单价（原生单位）</th>
                    <th className="px-3 py-2">直接成本</th>
                    <th className="px-3 py-2">含重生成</th>
                    <th className="px-3 py-2">流水线（含质检）</th>
                    <th className="px-3 py-2">每条</th>
                    <th className="px-3 py-2">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {[...outcome.result.models]
                    .sort((a, b) => {
                      if (a.priced !== b.priced) return a.priced ? -1 : 1
                      return a.expectedCny - b.expectedCny
                    })
                    .map((row) => {
                      const current =
                        Object.prototype.hasOwnProperty.call(overrides, row.model.id)
                          ? overrides[row.model.id]
                          : row.model.price
                      const locked =
                        row.model.status === 'discontinued' || row.model.unit === 'per-count'
                      const priceStep =
                        row.model.unit === 'per-credit' ? 1 : row.model.unit === 'per-unit' ? 0.1 : 0.01
                      return (
                        <tr key={row.model.id} className="border-t border-stone-100">
                          <td className="px-3 py-2">
                            <span className="font-medium text-stone-900">
                              {row.model.name}
                              {row.converted ? (
                                <span className="ml-1 text-xs text-stone-500">（换算）</span>
                              ) : null}
                            </span>
                            <span className="block text-xs text-stone-500">
                              {row.model.vendor} · {unitLabel(row.model.unit)} · {row.model.note}
                            </span>
                            {row.model.conversionBasis ? (
                              <span className="block text-xs text-stone-500">
                                换算依据：{row.model.conversionBasis}
                              </span>
                            ) : null}
                            {row.notComparableReason ? (
                              <span className="block text-xs text-amber-700">{row.notComparableReason}</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-24 rounded border border-stone-300 px-2 py-1 disabled:bg-stone-100 disabled:text-stone-400"
                              value={current ?? ''}
                              min={0}
                              step={priceStep}
                              placeholder="待填"
                              disabled={locked}
                              title={
                                locked
                                  ? row.model.status === 'discontinued'
                                    ? '已下线，不可改价'
                                    : '按 count 计费，无法换算成本'
                                  : formatNativePrice(row.model)
                              }
                              onChange={(e) => {
                                const v = e.target.value === '' ? null : Number(e.target.value)
                                setOverrides((prev) => ({ ...prev, [row.model.id]: v }))
                              }}
                            />
                            <span className="block text-xs text-stone-500">{formatNativePrice(row.model)}</span>
                          </td>
                          <td className="px-3 py-2">{row.priced ? formatCny(row.directCny) : '-'}</td>
                          <td className="px-3 py-2 font-medium">{row.priced ? formatCny(row.expectedCny) : '-'}</td>
                          <td className="px-3 py-2">{row.priced ? formatCny(row.pipelineCny) : '-'}</td>
                          <td className="px-3 py-2">{row.priced ? formatCny(row.perVideoCny) : '-'}</td>
                          <td className="px-3 py-2">
                            {statusBadge(row.model.status)}
                            <span className="block text-xs text-stone-500">{row.model.source}</span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-stone-900">漫剧外包市场价对比</h2>
              <ul className="mt-2 space-y-2 text-sm text-stone-700">
                {outcome.result.market.map((m) => (
                  <li key={m.label}>
                    <span className="font-medium">{m.label}：</span>
                    {formatCny(m.lowCny)}
                    {m.lowCny !== m.highCny ? ` - ${formatCny(m.highCny)}` : ''}
                    {!m.applies ? <span className="text-stone-400">（未达起订量，不适用）</span> : null}
                  </li>
                ))}
              </ul>
              {outcome.result.cheapest && outcome.result.savingsVsMarketLowCny !== null ? (
                <p className="mt-3 text-sm text-stone-700">
                  最便宜的模型比外包单条低价省 {formatCny(outcome.result.savingsVsMarketLowCny)}，比高价省{' '}
                  {formatCny(outcome.result.savingsVsMarketHighCny ?? 0)}。
                </p>
              ) : null}
              <p className="mt-2 text-xs text-stone-500">
                市场价来源：{MARKET_QUOTES[0].source}。区间价不是官方定价，实际报价因画风与交付要求而异。
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-stone-900">代码渲染对比</h2>
              <p className="mt-2 text-sm text-stone-700">
                直接成本 {formatCny(outcome.result.codeRender.directCny)}（本地 Chromium 无头渲染加 ffmpeg，无 API
                调用），本地渲染约 {outcome.result.codeRender.renderMinutes} 分钟
                {input.hourlyRateCny > 0
                  ? `，按时薪折算人工成本 ${formatCny(outcome.result.codeRender.laborCny)}`
                  : '，人工成本未计（时薪为 0）'}
                。
              </p>
              <p className="mt-2 text-sm text-stone-700">
                差异点：模型生成按秒付费、越长越贵；代码渲染直接成本恒为 0，代价是本地渲染时间与前期写代码的时间。
                漫剧这类分镜多、改动多的内容，代码渲染改一处只重渲一处，不用整条重生成。
              </p>
            </div>
          </section>
        </>
      )}

      <footer className="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-500">
        <p>
          依据说明：模型单价已按 2026-11-18 官方定价页核实，单价可在上表直接改；按 count 计费的模型（Veo 3 系列）官方未说明
          count 与秒的换算，不换算成本、不参与比较；积分与 Units 换算的成本标为换算，换算依据写在各行下方；
          按次计费的模型不足一次按一次算（假设）。漫剧外包价为 2026-11-17 调研引用的行业文报价；
          汇率、重生成率、渲染耗时均为可改的假设值，不是实测数据。测算结果只作决策参考，不构成采购建议。
        </p>
      </footer>
    </div>
  )
}
