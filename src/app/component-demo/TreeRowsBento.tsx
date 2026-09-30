import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '../../components/ui/checkbox';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';

function TreeRow({
  level,
  name,
  showCaret = true,
  expanded,
  indeterminate,
  selected,
  associated,
  surface = 'part',
  checked,
  hidden,
  hover,
  onToggleExpanded,
  onCheckedChange,
  onVisibilityToggle,
}: {
  level: number;
  name: string;
  showCaret?: boolean;
  expanded?: boolean;
  indeterminate?: boolean;
  selected?: boolean;
  associated?: boolean;
  surface?: 'assembly' | 'part';
  checked?: boolean;
  hidden?: boolean;
  hover?: boolean;
  onToggleExpanded?: () => void;
  onCheckedChange?: (nextChecked: boolean) => void;
  onVisibilityToggle?: () => void;
}) {
  const Caret = expanded ? ChevronDown : ChevronRight;
  const checkboxVisible = checked || indeterminate || hover;

  return (
    <div
      className={`group grid h-8 w-full grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 rounded-ds-md pr-2 text-xs transition-[background-color,color,box-shadow,opacity] duration-[520ms] ease-[cubic-bezier(0.22,1.18,0.36,1)] ${
        selected
          ? 'bg-orange-50/76 text-ds-brand-primary-text ring-1 ring-inset ring-orange-200/90'
          : associated
            ? 'bg-orange-50/36 text-ds-brand-primary-text ring-1 ring-inset ring-orange-200/75'
          : hover
          ? 'bg-white/58 text-ds-text-secondary ring-1 ring-inset ring-zinc-300/65'
            : surface === 'assembly'
              ? 'bg-zinc-100/56 text-ds-text-secondary ring-1 ring-inset ring-white/45 backdrop-blur-xl hover:bg-zinc-200/58'
              : 'bg-white/25 text-ds-text-secondary ring-1 ring-inset ring-white/28 backdrop-blur-xl hover:bg-white/58 hover:text-ds-text-primary hover:ring-zinc-300/65'
      } ${hidden ? 'text-ds-text-disabled' : ''}`}
      style={{ paddingLeft: (surface === 'part' ? 16 : 8) + level * 18 + (level > 0 ? 8 : 0) }}
    >
      {showCaret ? (
        <button type="button" className="flex size-5 shrink-0 items-center justify-center text-ds-text-disabled" onClick={onToggleExpanded}>
          <Caret className="size-3.5 transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1.18,0.36,1)]" />
        </button>
      ) : (
        <span className="size-5 shrink-0" />
      )}
      <Checkbox
        size="sm"
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={onCheckedChange}
        className={`transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1.18,0.36,1)] ${checkboxVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      />
      <span className={`min-w-0 truncate ${hidden ? 'opacity-60' : ''}`}>{name}</span>
      <span className="size-5" />
      <button
        type="button"
        className={`grid size-6 shrink-0 place-items-center rounded-md transition-[background-color,color,opacity] duration-[520ms] ease-[cubic-bezier(0.22,1.18,0.36,1)] hover:bg-white/80 ${
          hidden ? 'text-ds-text-disabled opacity-100' : hover || selected ? 'text-ds-text-muted opacity-100' : 'text-ds-text-disabled opacity-55 group-hover:opacity-100'
        }`}
        title={hidden ? '显示对象' : '隐藏对象'}
        aria-label={hidden ? '显示对象' : '隐藏对象'}
        onClick={onVisibilityToggle}
      >
        {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

type TreeAnimationStage = 'default' | 'expanded' | 'selected' | 'collapsing';

const TREE_COLLAPSED_HOLD_MS = 1100;
const TREE_EXPANDED_HOLD_MS = 1350;
const TREE_SELECTED_HOLD_MS = 3100;
const TREE_COLLAPSE_RESET_MS = 620;

export function TreeRowsBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [hiddenNodes, setHiddenNodes] = useState<Record<string, boolean>>({
    root: false,
    front: false,
    faceBack: true,
    grind: false,
  });
  const [checkedNodes, setCheckedNodes] = useState<Record<string, boolean>>({
    root: false,
    front: false,
    faceBack: false,
    grind: true,
  });
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    faceBack: true,
  });
  const [animationStage, setAnimationStage] = useState<TreeAnimationStage>('default');
  const [selectionRelationActive, setSelectionRelationActive] = useState(false);
  const [userControlled, setUserControlled] = useState(false);

  const toggleHidden = (key: string) => {
    setUserControlled(true);
    setHiddenNodes((current) => ({ ...current, [key]: !current[key] }));
  };
  const toggleChecked = (key: string, nextChecked: boolean) => {
    setUserControlled(true);
    setCheckedNodes((current) => ({ ...current, [key]: nextChecked }));
  };
  const toggleExpanded = (key: string) => {
    setUserControlled(true);
    setExpandedNodes((current) => ({ ...current, [key]: !current[key] }));
  };

  useEffect(() => {
    setAnimationStage('default');
    setSelectionRelationActive(false);
    setUserControlled(false);
    setExpandedNodes((current) => ({ ...current, faceBack: false }));
    setCheckedNodes((current) => ({ ...current, faceBack: false, grind: false }));
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return undefined;

    let timeoutId = 0;

    const showDefault = () => {
      setAnimationStage('default');
      setSelectionRelationActive(false);
      setExpandedNodes((current) => ({ ...current, faceBack: false }));
      setCheckedNodes((current) => ({ ...current, faceBack: false, grind: false }));
      timeoutId = window.setTimeout(showExpanded, TREE_COLLAPSED_HOLD_MS);
    };
    const showCollapsing = () => {
      setAnimationStage('collapsing');
      setExpandedNodes((current) => ({ ...current, faceBack: false }));
      timeoutId = window.setTimeout(showDefault, TREE_COLLAPSE_RESET_MS);
    };
    const showExpanded = () => {
      setAnimationStage('expanded');
      setExpandedNodes((current) => ({ ...current, faceBack: true }));
      timeoutId = window.setTimeout(showSelected, TREE_EXPANDED_HOLD_MS);
    };
    const showSelected = () => {
      setAnimationStage('selected');
      setSelectionRelationActive(true);
      setCheckedNodes((current) => ({ ...current, faceBack: false, grind: true }));
      timeoutId = window.setTimeout(showCollapsing, TREE_SELECTED_HOLD_MS);
    };

    timeoutId = window.setTimeout(() => {
      if (animationStage === 'default') {
        setAnimationStage('expanded');
        setExpandedNodes((current) => ({ ...current, faceBack: true }));
        timeoutId = window.setTimeout(showSelected, TREE_EXPANDED_HOLD_MS);
        return;
      }

      if (animationStage === 'expanded') {
        setAnimationStage('selected');
        setSelectionRelationActive(true);
        setCheckedNodes((current) => ({ ...current, faceBack: false, grind: true }));
        timeoutId = window.setTimeout(showCollapsing, TREE_SELECTED_HOLD_MS);
        return;
      }

      if (animationStage === 'selected') {
        setAnimationStage('collapsing');
        setExpandedNodes((current) => ({ ...current, faceBack: false }));
        timeoutId = window.setTimeout(showDefault, TREE_COLLAPSE_RESET_MS);
        return;
      }

      showDefault();
    }, TREE_COLLAPSED_HOLD_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [animationStage, globalPlaying, restartSignal, userControlled]);

  const faceBackAssociated = selectionRelationActive;
  const grindSelected = selectionRelationActive;
  const grindChecked = checkedNodes.grind || grindSelected;

  return (
    <BentoFrame className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={`${WIDE_PADDED_BENTO_CONTENT_CLASS} space-y-1`}>
          <TreeRow
            level={0}
            name="0162-03-030303"
            surface="assembly"
            expanded
            checked={checkedNodes.root}
            indeterminate={!checkedNodes.root}
            hidden={hiddenNodes.root}
            onCheckedChange={(nextChecked) => toggleChecked('root', nextChecked)}
            onVisibilityToggle={() => toggleHidden('root')}
          />
          <TreeRow
            level={1}
            name="正面工作面 / 03-030303-01"
            checked={checkedNodes.front}
            hidden={hiddenNodes.front}
            onCheckedChange={(nextChecked) => toggleChecked('front', nextChecked)}
            onVisibilityToggle={() => toggleHidden('front')}
          />
          <TreeRow
            level={1}
            name="反面工作面 / 03-030303-02"
            expanded={expandedNodes.faceBack}
            associated={faceBackAssociated}
            checked={checkedNodes.faceBack}
            hidden={hiddenNodes.faceBack}
            onToggleExpanded={() => toggleExpanded('faceBack')}
            onCheckedChange={(nextChecked) => toggleChecked('faceBack', nextChecked)}
            onVisibilityToggle={() => toggleHidden('faceBack')}
          />
          <div className={`transition-opacity duration-200 ${expandedNodes.faceBack ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <TreeRow
            level={2}
            name="打磨面 / 03-030303-03"
            showCaret={false}
            selected={grindSelected}
            checked={grindChecked}
            hidden={hiddenNodes.grind}
            onCheckedChange={(nextChecked) => toggleChecked('grind', nextChecked)}
            onVisibilityToggle={() => toggleHidden('grind')}
            />
          </div>
        </div>
      </div>
    </BentoFrame>
  );
}
