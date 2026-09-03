import './calculator-report.css'

import dtbLogoWhite from '@assets/brand/dtb-logo-white.svg'
import { PUBLIC_SITE_URL } from '../../../utils/siteUrl.js'

const SITE_HOST = new URL(PUBLIC_SITE_URL).host

export default function CalculatorReport({ report }) {
  const projectMeta = [
    report.project.contractorName && { label: 'Contractor', value: report.project.contractorName },
    report.project.estimatorName && { label: 'Estimator', value: report.project.estimatorName },
  ].filter(Boolean)
  const hasProjectContext = projectMeta.length > 0 || Boolean(report.project.notes)

  return (
    <article className="dtb-calculator-report" aria-label="Drywall Toolbox material estimate report">
      <div className="dtb-report-disclosure dtb-report-disclosure--print" role="note" aria-label="Estimate disclosure">
        <p>{report.disclaimer}</p>
      </div>

      <header className="dtb-report-header">
        <div className="dtb-report-brand">
          <img
            className="dtb-report-logo"
            src={dtbLogoWhite}
            alt="Drywall Toolbox"
            loading="eager"
            decoding="sync"
          />
          <div className="dtb-report-brand-copy">
            <span>Professional Material Planning</span>
            <strong>Clear takeoffs for confident project preparation.</strong>
          </div>
        </div>
        <div className="dtb-report-title-block">
          <span className="dtb-report-kicker">Material Estimate</span>
          <strong>{report.project.jobName}</strong>
          {report.project.jobAddress !== '—' && (
            <span className="dtb-report-job-address">{report.project.jobAddress}</span>
          )}
          <small>{report.generatedDateLabel}</small>
        </div>
      </header>

      {hasProjectContext && (
        <section className={`dtb-report-project-card dtb-report-project-card--${projectMeta.length}`} aria-label="Additional project details">
          {projectMeta.map((item) => (
            <ReportMeta key={item.label} {...item} />
          ))}
          {report.project.notes && (
            <div className="dtb-report-notes">
              <span>Project notes</span>
              <p>{report.project.notes}</p>
            </div>
          )}
        </section>
      )}

      <section className="dtb-report-summary-section">
        <SectionHeading
          eyebrow="Purchase planning"
          title="Material Takeoff"
          description="Recommended purchase quantities generated from the current calculator inputs."
        />
        <div className="dtb-report-takeoff-grid">
          {report.summaryItems.map((item, index) => (
            <div className="dtb-report-takeoff-card" key={item.key}>
              <span className="dtb-report-takeoff-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="dtb-report-takeoff-label">{item.label}</span>
              <div className="dtb-report-takeoff-quantity">
                <strong>{item.quantity}</strong>
                <small>{item.unit}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dtb-report-detail-section">
        <SectionHeading
          eyebrow="Calculation record"
          title="Estimate Details"
          description="Inputs, assumptions, and calculated quantities organized by calculator."
        />

        <div className="dtb-report-sections-stack">
          {report.sections.map((section, index) => (
            <section className={`dtb-report-material-section dtb-report-material-section--${section.key}`} key={section.key}>
              <div className="dtb-report-material-header">
                <div className="dtb-report-material-title">
                  <span>{String(index + 1).padStart(2, '0')} · {section.eyebrow}</span>
                  <h3>{section.title}</h3>
                </div>
                <div className="dtb-report-primary-result">
                  <small>{section.primary.label}</small>
                  <div>
                    <strong>{section.primary.value}</strong>
                    {section.primary.unit && <span>{section.primary.unit}</span>}
                  </div>
                </div>
              </div>

              <div className="dtb-report-group-grid">
                {section.groups.map((group) => (
                  <ReportDataTable key={`${section.key}-${group.key}`} title={group.title} rows={group.rows} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <footer className="dtb-report-final-brand">
        <div className="dtb-report-footer-brand">
          <img src={dtbLogoWhite} alt="Drywall Toolbox" />
          <span>{SITE_HOST}</span>
        </div>
      </footer>
      <div className="dtb-report-disclosure dtb-report-disclosure--preview" role="note" aria-label="Estimate disclosure">
        <p>{report.disclaimer}</p>
      </div>
    </article>
  )
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="dtb-report-section-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  )
}

function ReportMeta({ label, value, emphasis = false }) {
  return (
    <div className={`dtb-report-meta${emphasis ? ' dtb-report-meta--emphasis' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ReportDataTable({ title, rows }) {
  return (
    <div className="dtb-report-data-panel">
      <div className="dtb-report-data-panel-title">{title}</div>
      <table className="dtb-report-data-table">
        <tbody>
          {rows.map((row) => (
            <tr key={`${title}-${row.label}`}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
