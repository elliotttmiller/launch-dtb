import { CalculatorHub } from '../components/calculators'
import SEOHead from '../components/shared/SEOHead'
import PageHeroBanner from '../components/shared/PageHeroBanner'

export default function Calculators() {
  return (
    <>
      <SEOHead
        title="Drywall Calculators — Sheets, Tape, Corner Bead & Screws"
        description="Drywall calculators for estimating sheets, tape, compound, corner bead, and screws for project planning."
        canonical="/calculators"
      />
      <div className="page-wrapper">
        <PageHeroBanner
          eyebrow="Project Estimating"
          title="Drywall Calculators"
          highlight="Plan Materials Faster."
          description="Estimate common drywall materials for project planning."
          align="center"
        />
        <CalculatorHub />
      </div>
    </>
  )
}
