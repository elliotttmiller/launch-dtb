import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Boxes,
  Layers3,
  Settings2,
  WandSparkles,
} from 'lucide-react';
import SEOHead from '../components/shared/SEOHead.jsx';
import ToolsetBuilderWorkspace from '../features/toolset-builder/ToolsetBuilderWorkspace.jsx';
import {
  TOOLSET_WORKFLOWS,
  getToolsetWorkflow,
} from '../features/toolset-builder/model.js';
import { getBrandLogo } from '../utils/brandAssets.js';
import toolsetHeroImage from '../assets/media/toolset/toolset-hero-automatic-tapers.webp';
import '../styles/toolset-builder.css';

const WORKFLOW_ICONS = {
  full: Boxes,
  finishing: Layers3,
  taping: WandSparkles,
  flatbox: Box,
};

const TOOLSET_BUILDER_BRANDS = [
  { name: 'TapeTech', slug: 'tapetech' },
  { name: 'Columbia Tools', slug: 'columbia-tools' },
  { name: 'Platinum Drywall Tools', slug: 'platinum-drywall-tools' },
  { name: 'Level5', slug: 'level5' },
  { name: 'SurPro', slug: 'surpro' },
  { name: 'Dura-Stilts', slug: 'dura-stilts' },
].map((brand) => ({ ...brand, logo: getBrandLogo(brand.name) }));

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
        <img
          className="dtb-toolset-hero__media"
          src={toolsetHeroImage}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
        />
        <div className="dtb-container dtb-container--wide">
          <div className="dtb-toolset-hero__grid">
            <div className="dtb-toolset-hero__copy">
              <span className="dtb-toolset-kicker">Toolset Builder</span>
              <h1>Build Your <em>Drywall Tool Set</em></h1>
              <p>
                Configure the exact setup for the work you do, with compatible
                tools from the brands professionals trust.
              </p>
              <div className="dtb-toolset-hero__actions">
                <button type="button" className="dtb-toolset-hero__primary" onClick={() => onSelectWorkflow('full')}>
                  Start building <ArrowRight size={19} aria-hidden="true" />
                </button>
                <a className="dtb-toolset-hero__secondary" href="#toolset-workflow-title">
                  Explore workflows <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
          <dl className="dtb-toolset-hero__proofs" aria-label="Toolset builder benefits">
            <div>
              <dt>Built for your workflow</dt>
              <dd>Select a proven starting point, then configure the details.</dd>
            </div>
            <div>
              <dt>Compatible brand mix</dt>
              <dd>Build with the major drywall-tool brands you already use.</dd>
            </div>
            <div>
              <dt>Clear selections</dt>
              <dd>See every chosen tool together as your set takes shape.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="dtb-section dtb-toolset-workflow-section" aria-labelledby="toolset-workflow-title">
        <div className="dtb-container dtb-container--wide">
          <header className="dtb-toolset-section-heading">
            <h2 id="toolset-workflow-title">Start with a workflow</h2>
            <p>
              Select a proven setup, then make every tool and configuration your own.
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

          <div className="dtb-toolset-brand-rail" aria-label="Compatible major brands">
            <span className="dtb-toolset-brand-rail__label">All major brands</span>
            <div className="dtb-toolset-brand-rail__logos">
              {TOOLSET_BUILDER_BRANDS.map((brand) => (
                <Link key={brand.slug} to={`/products/brands/${brand.slug}`} aria-label={`Shop ${brand.name}`}>
                  <img src={brand.logo} alt={brand.name} width="150" height="46" loading="lazy" decoding="async" />
                </Link>
              ))}
            </div>
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
