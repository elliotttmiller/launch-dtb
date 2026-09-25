import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Boxes,
  Layers3,
  Settings2,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import ToolsetBuilderWorkspace from '../features/toolset-builder/ToolsetBuilderWorkspace.jsx';
import {
  TOOLSET_WORKFLOWS,
  getToolsetWorkflow,
} from '../features/toolset-builder/model.js';
import '../styles/toolset-builder.css';

const WORKFLOW_ICONS = {
  full: Boxes,
  finishing: Layers3,
  taping: WandSparkles,
  flatbox: Box,
};

function WorkflowCard({ workflow, onSelect }) {
  const Icon = WORKFLOW_ICONS[workflow.id] || Settings2;

  return (
    <button
      type="button"
      className="dtb-toolset-workflow-card"
      onClick={() => onSelect(workflow.id)}
    >
      <span className="dtb-toolset-workflow-card__icon" aria-hidden="true">
        <Icon size={26} />
      </span>
      <span className="dtb-toolset-workflow-card__copy">
        <span className="dtb-toolset-workflow-card__label">{workflow.label}</span>
        <span className="dtb-toolset-workflow-card__description">{workflow.description}</span>
        <span className="dtb-toolset-workflow-card__meta">{workflow.capabilities.length} tool categories</span>
      </span>
      <span className="dtb-toolset-workflow-card__arrow" aria-hidden="true">
        <ArrowRight size={20} />
      </span>
    </button>
  );
}

function BuilderLanding({ onSelectWorkflow }) {
  return (
    <>
      <section className="dtb-toolset-hero">
        <div className="dtb-container dtb-container--wide">
          <div className="dtb-toolset-hero__grid">
            <div className="dtb-toolset-hero__copy">
              <span className="dtb-toolset-kicker">
                <Sparkles size={15} aria-hidden="true" />
                Universal Toolset Builder
              </span>
              <h1>Build the set that fits how you actually work.</h1>
              <p>
                Start with a workflow, compare real catalog products by function,
                then configure the exact tools and variations you want without
                being forced into a manufacturer-specific kit.
              </p>
              <div className="dtb-toolset-hero__assurances" aria-label="Builder principles">
                <span>Live catalog products</span>
                <span>Exact variation selection</span>
                <span>Server validation before purchase</span>
              </div>
            </div>

            <div className="dtb-toolset-hero__visual" aria-hidden="true">
              <span className="dtb-toolset-hero__visual-grid" />
              <div className="dtb-toolset-hero__visual-card dtb-toolset-hero__visual-card--primary">
                <Boxes size={32} />
                <strong>One set.</strong>
                <span>Your products.</span>
              </div>
              <div className="dtb-toolset-hero__visual-card dtb-toolset-hero__visual-card--secondary">
                <Settings2 size={24} />
                <span>Configure by tool function</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dtb-section dtb-toolset-workflow-section" aria-labelledby="toolset-workflow-title">
        <div className="dtb-container dtb-container--wide">
          <header className="dtb-toolset-section-heading">
            <span className="dtb-toolset-kicker">Choose a starting workflow</span>
            <h2 id="toolset-workflow-title">What are you building?</h2>
            <p>
              The workflow organizes the experience. Brand is a filter, not the
              structure of your set.
            </p>
          </header>

          <div className="dtb-toolset-workflow-grid">
            {TOOLSET_WORKFLOWS.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onSelect={onSelectWorkflow}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function ToolsetBuilder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workflowId = searchParams.get('workflow') || '';
  const workflow = useMemo(() => getToolsetWorkflow(workflowId), [workflowId]);

  const selectWorkflow = (nextWorkflowId) => {
    const next = new URLSearchParams(searchParams);
    next.set('workflow', nextWorkflowId);
    setSearchParams(next, { replace: false });
  };

  const clearWorkflow = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('workflow');
    setSearchParams(next, { replace: false });
  };

  return (
    <div className="dtb-page dtb-toolset-page">
      <SEOHead
        title="Toolset Builder"
        description="Build a custom professional drywall tool set from live catalog products, exact variations, and workflow-focused tool categories."
        canonical="/toolset-builder"
        noindex
      />

      {workflow ? (
        <section className="dtb-section dtb-toolset-builder-section">
          <div className="dtb-container dtb-container--full">
            <ToolsetBuilderWorkspace
              key={workflow.id}
              workflow={workflow}
              onChangeWorkflow={clearWorkflow}
            />
          </div>
        </section>
      ) : (
        <BuilderLanding onSelectWorkflow={selectWorkflow} />
      )}
    </div>
  );
}
