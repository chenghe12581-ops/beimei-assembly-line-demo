import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, LayoutTemplate, Play, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/button';
import { draftPageSpecFromPrompt, evaluatePageSpec } from '../design-system/registry/page-agent';
import { getComponentContract, getLayoutTemplate } from '../design-system/registry/page-spec';

const defaultPrompt = '创建一个工艺规划页面：左侧选择工件，中间查看 3D 模型，右侧配置工序参数，点击生成后要处理校验失败和请求失败。';

export function PageAgentPage() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [runId, setRunId] = useState(0);
  const result = useMemo(() => {
    const spec = draftPageSpecFromPrompt(prompt);
    return { spec, evaluation: evaluatePageSpec(spec) };
  }, [prompt, runId]);
  const { spec, evaluation } = result;
  const layout = getLayoutTemplate(spec.layout);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><div className="flex items-center gap-2 text-base font-semibold"><LayoutTemplate className="size-4 text-orange-500" />页面生成 Agent</div><div className="mt-1 font-mono text-xs text-slate-400">/page-agent</div></div>
          <a href="/component-system"><Button size="sm" variant="outline">查看组件契约</Button></a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-semibold text-slate-800" htmlFor="page-prompt">需求 Prompt</label>
          <textarea id="page-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} className="mt-3 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">LLM 输出应落成 PageSpec，再由 registry 校验和评估。</span><Button onClick={() => setRunId((value) => value + 1)}><Play className="size-3.5" />分析并生成协议</Button></div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <ScoreCard label="视觉一致性" score={evaluation.visualScore} />
          <ScoreCard label="交互 Workflow" score={evaluation.workflowScore} />
          <ScoreCard label="综合评分" score={evaluation.totalScore} />
        </section>
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <Panel title="页面决策"><div className="grid gap-3 text-sm sm:grid-cols-2"><Info label="页面" value={spec.intent.title} /><Info label="布局" value={`${layout?.name ?? spec.layout} · ${layout?.grid ?? ''}`} /><Info label="领域" value={spec.intent.domain} /><Info label="目标" value={spec.intent.primaryGoal} /></div></Panel>
            <Panel title="组件选择与排布"><div className="space-y-2">{spec.components.map((instance) => { const contract = getComponentContract(instance.component); return <div key={instance.id} className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs sm:grid-cols-[150px_150px_minmax(0,1fr)]"><span className="font-mono text-slate-700">{instance.id}</span><span className="font-semibold text-orange-700">{contract?.name ?? instance.component}</span><span className="text-slate-500">{instance.slot} · {instance.purpose}</span></div>; })}</div></Panel>
            <Panel title="Workflow 状态机"><div className="flex flex-wrap items-center gap-2 text-xs">{spec.workflow.states.map((state) => <span key={state.id} className={`rounded-full border px-2.5 py-1 ${state.initial ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600'}`}>{state.label}</span>)}</div><div className="mt-3 space-y-2">{spec.workflow.transitions.map((transition) => <div key={transition.id} className="font-mono text-[11px] text-slate-500">{transition.from} -- {transition.event} --&gt; {transition.to}</div>)}</div></Panel>
            <Panel title="异常情况"><div className="space-y-2">{spec.edgeCases.map((edgeCase) => <div key={edgeCase.id} className="flex gap-2 text-xs"><AlertTriangle className={`mt-0.5 size-3.5 shrink-0 ${edgeCase.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`} /><span><b className="text-slate-700">{edgeCase.trigger}</b><span className="text-slate-500">：{edgeCase.expected}</span></span></div>)}</div></Panel>
          </div>
          <Panel title="Evaluate 结果"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">{evaluation.valid ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4 text-red-500" />}{evaluation.valid ? '协议通过结构校验' : '协议存在阻断错误'}</div><div className="mt-4 space-y-2">{evaluation.findings.length === 0 ? <div className="text-xs text-slate-500">没有额外发现。</div> : evaluation.findings.map((finding, index) => <div key={`${finding.message}-${index}`} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs"><span className={`mr-2 font-semibold ${finding.level === 'error' ? 'text-red-600' : finding.level === 'warning' ? 'text-amber-600' : 'text-slate-500'}`}>{finding.level}</span>{finding.message}</div>)}</div><details className="mt-5"><summary className="cursor-pointer text-xs font-semibold text-slate-700">查看 PageSpec JSON</summary><pre className="mt-3 max-h-96 overflow-auto rounded-md bg-slate-950 p-3 text-[10px] leading-5 text-slate-200">{JSON.stringify(spec, null, 2)}</pre></details><Button size="sm" variant="subtle" className="mt-4" onClick={() => setRunId((value) => value + 1)}><RefreshCw className="size-3.5" />重新评估</Button></Panel>
        </section>
      </main>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) { return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 text-2xl font-semibold text-slate-900">{score}<span className="ml-1 text-sm font-normal text-slate-400">/100</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-orange-500" style={{ width: `${score}%` }} /></div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><div className="text-[11px] text-slate-400">{label}</div><div className="mt-1 text-sm font-medium text-slate-800">{value}</div></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-sm font-semibold text-slate-900">{title}</h2><div className="mt-3">{children}</div></section>; }
