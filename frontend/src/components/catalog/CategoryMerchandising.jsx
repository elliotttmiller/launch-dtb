import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { buildCategoryPageUrl } from '../../utils/catalogFacets.js';
import { getCategoryMerchandising, resolveIntentTarget } from '../../data/categoryMerchandising.js';
import '../../styles/category-merchandising.css';
import '../../styles/contractor-shopping.css';

function IntentCard({ intent, target }) {
  const hasRoutableTarget = Boolean(target?.slug);
  const content = (
    <>
      <span className="dtb-category-intent-card__title">{intent.label}</span>
      <span className="dtb-category-intent-card__description">{intent.description}</span>
      {hasRoutableTarget && (
        <span className="dtb-category-intent-card__action">
          Shop {target.name || target.label || intent.label}
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (!hasRoutableTarget) {
    return (
      <article className="dtb-category-intent-card dtb-category-intent-card--informational">
        {content}
      </article>
    );
  }

  return (
    <Link className="dtb-category-intent-card" to={buildCategoryPageUrl(target.slug)}>
      {content}
    </Link>
  );
}

function WorkflowContext({ workflow }) {
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];
  if (!steps.length) return null;

  return (
    <aside className="dtb-workflow-context" aria-label={workflow.eyebrow || 'Workflow context'}>
      <p className="dtb-workflow-context__eyebrow">{workflow.eyebrow || 'Workflow context'}</p>
      <ol className="dtb-workflow-context__steps">
        {steps.map((step) => (
          <li
            key={step.id || step.label}
            className={`dtb-workflow-context__step${step.id === workflow.currentStage ? ' is-current' : ''}`}
            aria-current={step.id === workflow.currentStage ? 'step' : undefined}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </aside>
  );
}

export default function CategoryMerchandising({ category }) {
  const config = getCategoryMerchandising(category);
  if (!config) return null;

  const children = Array.isArray(category?.children) ? category.children : [];
  const intents = Array.isArray(config.intents) ? config.intents : [];
  const hasMerchandisingBody = intents.length > 0 || Boolean(config.guide);

  return (
    <>
      {config.workflow ? <WorkflowContext workflow={config.workflow} /> : null}

      {hasMerchandisingBody ? (
        <section className="dtb-category-merchandising" aria-labelledby="dtb-category-merchandising-title">
          {intents.length > 0 ? (
            <>
              <div className="dtb-category-merchandising__head">
                <div>
                  <p className="dtb-category-merchandising__eyebrow">{config.eyebrow}</p>
                  <h2 id="dtb-category-merchandising-title">{config.title}</h2>
                  <p>{config.description}</p>
                </div>
              </div>

              <div className="dtb-category-merchandising__grid">
                {intents.map((intent) => (
                  <IntentCard
                    key={intent.label}
                    intent={intent}
                    target={resolveIntentTarget(intent, children)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {config.guide && (
            <div className="dtb-category-buying-guide" aria-labelledby="dtb-category-buying-guide-title">
              <div className="dtb-category-buying-guide__intro">
                <p className="dtb-category-merchandising__eyebrow">Buying guide</p>
                <h3 id="dtb-category-buying-guide-title">{config.guide.title}</h3>
              </div>
              <div className="dtb-category-buying-guide__items">
                {config.guide.items.map((item) => (
                  <article key={item.label}>
                    <h4>{item.label}</h4>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
