import { AlertCircle, Check, ChevronDown, Eye, Search, X } from 'lucide-react';

type WeldingInputState = 'default' | 'hover' | 'focus' | 'filled' | 'error' | 'disabled';
type WeldingInputSize = 'sm' | 'md' | 'lg';

type WeldingInputDemoProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  state?: WeldingInputState;
  size?: WeldingInputSize;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  helper?: string;
  block?: boolean;
};

const stateClass: Record<WeldingInputState, string> = {
  default: 'border-[#D9DEE8] bg-white text-[#243044] shadow-[0_1px_2px_rgba(20,31,50,0.03)]',
  hover: 'border-[#B8C2D4] bg-white text-[#243044] shadow-[0_2px_6px_rgba(20,31,50,0.06)]',
  focus: 'border-[#2878FF] bg-white text-[#243044] shadow-[0_0_0_3px_rgba(40,120,255,0.14)]',
  filled: 'border-[#D9DEE8] bg-[#FDFEFF] text-[#1B2537] shadow-[0_1px_2px_rgba(20,31,50,0.03)]',
  error: 'border-[#F04438] bg-white text-[#243044] shadow-[0_0_0_3px_rgba(240,68,56,0.1)]',
  disabled: 'cursor-not-allowed border-[#E3E8F2] bg-[#F5F7FB] text-[#A0A8B8]',
};

const sizeClass: Record<WeldingInputSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-3.5 text-sm',
};

const stateLabel: Record<WeldingInputState, string> = {
  default: 'Default',
  hover: 'Hover',
  focus: 'Focus',
  filled: 'Filled',
  error: 'Error',
  disabled: 'Disabled',
};

function WeldingInputDemo({
  label,
  value = '',
  placeholder = '请输入',
  state = 'default',
  size = 'md',
  prefix,
  suffix,
  helper,
  block = true,
}: WeldingInputDemoProps) {
  const hasValue = value.length > 0;
  const disabled = state === 'disabled';
  const helperColor = state === 'error' ? 'text-[#F04438]' : 'text-[#7B8498]';

  return (
    <label className={`${block ? 'w-full' : 'w-[240px]'} flex flex-col gap-1.5`}>
      {label ? <span className="text-xs font-medium leading-4 text-[#4B5568]">{label}</span> : null}
      <span
        className={`flex w-full items-center gap-2 rounded-md border transition-[border-color,box-shadow,background-color] duration-150 ${stateClass[state]} ${sizeClass[size]}`}
      >
        {prefix ? <span className={disabled ? 'text-[#A0A8B8]' : 'text-[#6B7486]'}>{prefix}</span> : null}
        <input
          value={value}
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent p-0 text-inherit outline-none placeholder:text-[#A0A8B8]"
        />
        {!hasValue && !suffix ? null : <span className={disabled ? 'text-[#A0A8B8]' : 'text-[#6B7486]'}>{suffix}</span>}
      </span>
      {helper ? <span className={`text-xs leading-4 ${helperColor}`}>{helper}</span> : null}
    </label>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#E7EBF3] bg-white px-3 py-2">
      <div className="text-[11px] uppercase leading-4 tracking-wide text-[#8A93A6]">{label}</div>
      <div className="mt-1 font-mono text-xs leading-5 text-[#263248]">{value}</div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E7EBF3] bg-white p-5 shadow-[0_12px_28px_rgba(20,31,50,0.06)]">
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#2878FF]">{eyebrow}</div>
        <h2 className="mt-1 text-base font-semibold leading-6 text-[#182235]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const states: WeldingInputState[] = ['default', 'hover', 'focus', 'filled', 'error', 'disabled'];
const sizes: WeldingInputSize[] = ['sm', 'md', 'lg'];

export function WeldingInputStylePage() {
  return (
    <main className="min-h-screen bg-[#F3F6FB] px-8 py-8 text-[#182235]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDE3EE] pb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2878FF]">Welding 4.0 Component Library</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.01em] text-[#111827]">Input 样式复刻页</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7486]">
              独立承载焊接软件旧组件风格，暂不接入北煤机业务流程；用于后续按 Figma frame 继续精调尺寸、状态和组合规则。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SpecChip label="Height" value="32 / 36 / 40" />
            <SpecChip label="Radius" value="6px" />
            <SpecChip label="Stroke" value="1px" />
            <SpecChip label="Focus" value="#2878FF / 14%" />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <Section eyebrow="States" title="基础状态矩阵">
              <div className="grid gap-4 md:grid-cols-2">
                {states.map((state) => (
                  <div key={state} className="rounded-lg border border-[#EEF1F7] bg-[#FAFBFE] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#4B5568]">{stateLabel[state]}</span>
                      <span className="font-mono text-[11px] text-[#8A93A6]">{stateClass[state].split(' ')[0].replace('border-', '')}</span>
                    </div>
                    <WeldingInputDemo
                      label="焊接参数"
                      value={state === 'default' || state === 'hover' || state === 'focus' || state === 'disabled' ? '' : state === 'error' ? 'ABC-01' : 'WLD-2026-01'}
                      placeholder="请输入参数名称"
                      state={state}
                      helper={state === 'error' ? '格式错误，请输入数字或有效编号' : state === 'focus' ? '当前输入框获得焦点' : undefined}
                    />
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="Sizes" title="尺寸和密度">
              <div className="overflow-hidden rounded-lg border border-[#E7EBF3]">
                <div className="grid grid-cols-[88px_110px_minmax(220px,1fr)_minmax(220px,1fr)] bg-[#F8FAFD] px-4 py-3 text-xs font-semibold text-[#6B7486]">
                  <div>规格</div>
                  <div>高度</div>
                  <div>默认输入</div>
                  <div>带图标输入</div>
                </div>
                <div className="divide-y divide-[#EEF1F7] bg-white">
                  {sizes.map((size) => (
                    <div key={size} className="grid grid-cols-[88px_110px_minmax(220px,1fr)_minmax(220px,1fr)] items-center gap-4 px-4 py-4">
                      <div className="font-mono text-xs uppercase text-[#263248]">{size}</div>
                      <div className="font-mono text-xs text-[#7B8498]">{size === 'sm' ? '32px' : size === 'md' ? '36px' : '40px'}</div>
                      <WeldingInputDemo value="250" state="filled" size={size} suffix={<span className="text-xs">mm</span>} />
                      <WeldingInputDemo placeholder="搜索焊缝编号" state={size === 'md' ? 'focus' : 'default'} size={size} prefix={<Search className="size-4" />} />
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section eyebrow="Compositions" title="常见组合形态">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[#EEF1F7] bg-[#FAFBFE] p-4">
                  <div className="mb-3 text-xs font-semibold text-[#4B5568]">下拉选择</div>
                  <WeldingInputDemo value="定位焊扫描" state="filled" suffix={<ChevronDown className="size-4" />} />
                </div>
                <div className="rounded-lg border border-[#EEF1F7] bg-[#FAFBFE] p-4">
                  <div className="mb-3 text-xs font-semibold text-[#4B5568]">密码 / 可见性</div>
                  <WeldingInputDemo value="••••••••" state="filled" suffix={<Eye className="size-4" />} />
                </div>
                <div className="rounded-lg border border-[#EEF1F7] bg-[#FAFBFE] p-4">
                  <div className="mb-3 text-xs font-semibold text-[#4B5568]">校验成功</div>
                  <WeldingInputDemo value="A-01/B-02" state="focus" suffix={<Check className="size-4 text-[#12B76A]" />} helper="板件关系已匹配" />
                </div>
                <div className="rounded-lg border border-[#EEF1F7] bg-[#FAFBFE] p-4">
                  <div className="mb-3 text-xs font-semibold text-[#4B5568]">清空输入</div>
                  <WeldingInputDemo value="WLD-SEG-04" state="hover" suffix={<X className="size-4" />} />
                </div>
              </div>
            </Section>
          </div>

          <aside className="flex flex-col gap-6">
            <Section eyebrow="Tokens" title="页面级样式变量">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7486]">文本</span>
                  <span className="font-mono text-xs text-[#263248]">#243044</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7486]">默认描边</span>
                  <span className="font-mono text-xs text-[#263248]">#D9DEE8</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7486]">Hover 描边</span>
                  <span className="font-mono text-xs text-[#263248]">#B8C2D4</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7486]">Focus 描边</span>
                  <span className="font-mono text-xs text-[#263248]">#2878FF</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6B7486]">Error 描边</span>
                  <span className="font-mono text-xs text-[#263248]">#F04438</span>
                </div>
              </div>
            </Section>

            <Section eyebrow="Preview" title="参数卡片示例">
              <div className="rounded-xl border border-[#E1E7F1] bg-[#F8FAFD] p-4">
                <div className="mb-4 flex items-start gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#EAF2FF] text-[#2878FF]">
                    <AlertCircle className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#182235]">焊缝基础信息</div>
                    <div className="mt-0.5 text-xs text-[#7B8498]">模拟旧焊接软件参数面板</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <WeldingInputDemo label="焊缝编号" value="WLD-SEG-04" state="filled" />
                  <WeldingInputDemo label="焊脚高度" value="6" state="focus" suffix={<span className="text-xs">mm</span>} />
                  <WeldingInputDemo label="坡口角度" value="abc" state="error" suffix={<span className="text-xs">°</span>} helper="请输入合法角度" />
                  <WeldingInputDemo label="工艺模板" value="CO2 保护焊" state="disabled" suffix={<ChevronDown className="size-4" />} />
                </div>
              </div>
            </Section>
          </aside>
        </div>
      </div>
    </main>
  );
}
