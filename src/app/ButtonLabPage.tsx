import { useState, type ReactNode } from 'react';
import { ArrowLeft, Check, ChevronRight, Cog, Download, Loader2, Plus, Search, Settings2, Trash2 } from 'lucide-react';

import { Button as DsButton } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';

type PrimitiveTab = 'button' | 'input' | 'checkbox' | 'panel' | 'tree-node-row' | 'modal-shell' | 'object-multi-select' | 'toast';

const primitiveTabs: { id: PrimitiveTab; label: string; ready: boolean }[] = [
  { id: 'button', label: 'Button', ready: true },
  { id: 'input', label: 'Input', ready: true },
  { id: 'checkbox', label: 'Checkbox', ready: true },
  { id: 'panel', label: 'Panel', ready: false },
  { id: 'tree-node-row', label: 'TreeNodeRow', ready: false },
  { id: 'modal-shell', label: 'ModalShell', ready: false },
  { id: 'object-multi-select', label: 'ObjectMultiSelect', ready: false },
  { id: 'toast', label: 'Toast', ready: false },
];

const variants = [
  { name: 'Primary', description: '主操作 / 确认 / 生成', variant: 'primary' as const, icon: Check },
  { name: 'Secondary', description: '次级操作 / 返回 / 取消', variant: 'secondary' as const, icon: Download },
  { name: 'Brand Outline', description: '无底重点入口 / 参数设置', variant: 'brandOutline' as const, icon: Cog },
  { name: 'Subtle', description: '选中态弱反馈 / 推荐动作', variant: 'subtle' as const, icon: Plus },
  { name: 'Ghost', description: '工具栏轻操作 / 行内动作', variant: 'ghost' as const, icon: Settings2 },
  { name: 'Danger', description: '删除 / 危险确认', variant: 'danger' as const, icon: Trash2 },
  { name: 'Link', description: '文本入口 / 轻导航', variant: 'link' as const, icon: ChevronRight },
];

const sizes = [
  { name: 'sm', label: 'Small', use: '28px / 工具按钮、紧凑动作' },
  { name: 'md', label: 'Medium', use: '36px / 默认表单动作' },
  { name: 'lg', label: 'Large', use: '40px / 重点确认动作' },
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-ds-panel-title font-semibold text-ds-text-primary">{title}</h2>
        <div className="h-px flex-1 bg-ds-border-subtle" />
      </div>
      {children}
    </section>
  );
}

function ButtonTab() {
  return (
    <>
      <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-md">
        <div className="text-ds-section-title font-medium text-ds-text-primary">基于当前 Button Component Token</div>
        <div className="mt-2 grid gap-2 text-ds-helper text-ds-text-muted md:grid-cols-3">
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">button.height.sm</span> = 28px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">button.height.md</span> = 36px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">button.radius.default</span> = 8px
          </div>
        </div>
      </div>

      <Section title="Variants">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {variants.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
                <div className="flex min-h-16 items-center justify-between gap-3">
                  <div>
                    <div className="text-ds-body font-medium text-ds-text-primary">{item.name}</div>
                    <div className="mt-1 text-ds-helper text-ds-text-muted">{item.description}</div>
                  </div>
                  <DsButton variant={item.variant}>
                    <Icon />
                    操作
                  </DsButton>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Sizes">
        <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface shadow-ds-sm">
          {sizes.map((item) => (
            <div key={item.name} className="grid items-center gap-4 border-b border-ds-border-subtle px-ds-200 py-ds-150 last:border-b-0 md:grid-cols-[160px_minmax(0,1fr)_360px]">
              <div>
                <div className="font-mono text-ds-label text-ds-text-primary">size={item.name}</div>
                <div className="mt-1 text-ds-helper text-ds-text-muted">{item.use}</div>
              </div>
              <div className="flex items-center gap-2">
                <DsButton size={item.name} variant="primary">主操作</DsButton>
                <DsButton size={item.name} variant="secondary">次级操作</DsButton>
                <DsButton size={item.name} variant="ghost">轻操作</DsButton>
              </div>
              <div className="flex items-center gap-2">
                <DsButton size="icon" variant="secondary" aria-label={`${item.label} settings`}>
                  <Settings2 />
                </DsButton>
                <DsButton size="icon" variant="primary" aria-label={`${item.label} add`}>
                  <Plus />
                </DsButton>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="States">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-3 text-ds-helper text-ds-text-muted">Default</div>
            <DsButton>生成路径</DsButton>
          </div>
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-3 text-ds-helper text-ds-text-muted">Disabled</div>
            <DsButton disabled>不可用</DsButton>
          </div>
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-3 text-ds-helper text-ds-text-muted">Loading</div>
            <DsButton disabled>
              <Loader2 className="animate-spin" />
              生成中
            </DsButton>
          </div>
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-3 text-ds-helper text-ds-text-muted">Danger</div>
            <DsButton variant="danger">
              <Trash2 />
              删除
            </DsButton>
          </div>
        </div>
      </Section>
    </>
  );
}

function InputTab() {
  return (
    <>
      <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-md">
        <div className="text-ds-section-title font-medium text-ds-text-primary">基于当前 Input Component Token</div>
        <div className="mt-2 grid gap-2 text-ds-helper text-ds-text-muted md:grid-cols-4">
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">input.height.sm</span> = 28px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">input.height.md</span> = 32px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">input.height.lg</span> = 36px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">input.radius.default</span> = 8px
          </div>
        </div>
      </div>

      <Section title="Sizes">
        <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface shadow-ds-sm">
          {[
            { size: 'sm' as const, label: 'Small', use: '28px / 紧凑工具栏、表格内输入' },
            { size: 'md' as const, label: 'Medium', use: '32px / 默认表单输入' },
            { size: 'lg' as const, label: 'Large', use: '36px / 大表单或弹窗重点输入' },
          ].map((item) => (
            <div key={item.size} className="grid items-center gap-4 border-b border-ds-border-subtle px-ds-200 py-ds-150 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <div className="font-mono text-ds-label text-ds-text-primary">size={item.size}</div>
                <div className="mt-1 text-ds-helper text-ds-text-muted">{item.use}</div>
              </div>
              <Input size={item.size} defaultValue={`${item.label} input`} aria-label={`${item.label} input`} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="States">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-2 text-ds-helper text-ds-text-muted">Default</div>
            <Input defaultValue="0162-01-010101" aria-label="Default input" />
          </div>
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-2 text-ds-helper text-ds-text-muted">Placeholder</div>
            <Input placeholder="请输入装配体名称" aria-label="Placeholder input" />
          </div>
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-2 text-ds-helper text-ds-text-muted">Invalid</div>
            <Input invalid defaultValue="-20" aria-label="Invalid input" />
          </div>
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <div className="mb-2 text-ds-helper text-ds-text-muted">Disabled</div>
            <Input disabled defaultValue="不可编辑" aria-label="Disabled input" />
          </div>
        </div>
      </Section>

      <Section title="Examples">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <label className="mb-2 block text-ds-label font-medium text-ds-text-secondary">图纸编号</label>
            <Input defaultValue="0162-01-010101-01" aria-label="图纸编号" />
          </div>
          <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
            <label className="mb-2 block text-ds-label font-medium text-ds-text-secondary">搜索工件</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-ds-150 top-1/2 size-4 -translate-y-1/2 text-ds-text-disabled" />
              <Input className="pl-ds-400" placeholder="输入工件或特征名称" aria-label="搜索工件" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function CheckboxTab() {
  return (
    <>
      <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-md">
        <div className="text-ds-section-title font-medium text-ds-text-primary">基于当前 Checkbox Component Token</div>
        <div className="mt-2 grid gap-2 text-ds-helper text-ds-text-muted md:grid-cols-4">
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">checkbox.size.sm</span> = 16px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">checkbox.size.md</span> = 20px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">checkbox.radius.default</span> = 4px
          </div>
          <div className="rounded-ds-lg bg-ds-bg-subtle px-ds-150 py-ds-100">
            <span className="font-mono text-ds-brand-primary-text">checkbox.bg.checked</span> = #FF6900
          </div>
        </div>
      </div>

      <Section title="States">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Unchecked', props: {} },
            { label: 'Checked', props: { checked: true } },
            { label: 'Indeterminate', props: { indeterminate: true } },
            { label: 'Invalid', props: { invalid: true } },
            { label: 'Disabled', props: { checked: true, disabled: true } },
          ].map((item) => (
            <div key={item.label} className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface p-ds-200 shadow-ds-sm">
              <div className="mb-3 text-ds-helper text-ds-text-muted">{item.label}</div>
              <div className="flex items-center gap-ds-100">
                <Checkbox {...item.props} aria-label={item.label} />
                <span className="text-ds-label text-ds-text-secondary">工件模型</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sizes">
        <div className="rounded-ds-xl border border-ds-border-default bg-ds-bg-surface shadow-ds-sm">
          {[
            { size: 'sm' as const, label: 'Small', use: '16px / 下拉列表、树行内勾选' },
            { size: 'md' as const, label: 'Medium', use: '20px / 普通表单勾选' },
          ].map((item) => (
            <div key={item.size} className="grid items-center gap-4 border-b border-ds-border-subtle px-ds-200 py-ds-150 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <div className="font-mono text-ds-label text-ds-text-primary">size={item.size}</div>
                <div className="mt-1 text-ds-helper text-ds-text-muted">{item.use}</div>
              </div>
              <div className="flex items-center gap-ds-150">
                <Checkbox size={item.size} checked aria-label={`${item.label} checked`} />
                <Checkbox size={item.size} aria-label={`${item.label} unchecked`} />
                <Checkbox size={item.size} indeterminate aria-label={`${item.label} indeterminate`} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="rounded-ds-xl border border-dashed border-ds-border-default bg-ds-bg-surface p-ds-300 text-center shadow-ds-sm">
      <div className="text-ds-panel-title font-semibold text-ds-text-primary">{label}</div>
      <div className="mt-2 text-ds-body text-ds-text-muted">已按长期顺序占位，后续会在这里接入对应 token 组件展示。</div>
    </div>
  );
}

export function ButtonLabPage() {
  const [activeTab, setActiveTab] = useState<PrimitiveTab>('button');
  const activeMeta = primitiveTabs.find((item) => item.id === activeTab) ?? primitiveTabs[0];

  return (
    <div className="min-h-screen bg-ds-bg-page text-ds-text-primary">
      <header className="sticky top-0 z-10 border-b border-ds-border-default bg-ds-bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-ds-page-title font-semibold">Primitive Component Lab</div>
            <div className="mt-1 font-mono text-ds-helper text-ds-text-disabled">/primitive-lab · token driven primitives</div>
          </div>
          <DsButton variant="secondary" size="sm" asChild>
            <a href="/component-lab">
              <ArrowLeft />
              组件库
            </a>
          </DsButton>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-3">
          {primitiveTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`h-ds-control-sm shrink-0 rounded-ds-lg px-ds-150 text-ds-label transition-colors ${
                activeTab === item.id
                  ? 'bg-ds-brand-primary-subtle text-ds-brand-primary-text'
                  : 'text-ds-text-muted hover:bg-ds-bg-subtle hover:text-ds-text-primary'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
              {!item.ready && <span className="ml-1 text-ds-text-disabled">待接</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-6">
        {activeTab === 'button' && <ButtonTab />}
        {activeTab === 'input' && <InputTab />}
        {activeTab === 'checkbox' && <CheckboxTab />}
        {activeTab !== 'button' && activeTab !== 'input' && activeTab !== 'checkbox' && <ComingSoonTab label={activeMeta.label} />}
      </main>
    </div>
  );
}
