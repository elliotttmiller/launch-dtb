import type { CatalogEvidencePacket, DomainClassification, DrywallProductDomain } from './types';

const RULES: Array<{ domainId: DrywallProductDomain; patterns: RegExp[] }> = [
  { domainId:'maintenance_kit', patterns:[/\bmaintenance kit\b/i,/\brepair kit\b/i,/\bservice kit\b/i] },
  { domainId:'tool_set', patterns:[/\btool\s*set\b/i,/\btoolset\b/i,/\bfinishing set\b/i,/\btaping set\b/i] },
  { domainId:'automatic_taper', patterns:[/\bautomatic (?:drywall )?taper\b/i,/\beasyclean.*taper\b/i] },
  { domainId:'semi_automatic_taper', patterns:[/\bsemi[- ]automatic taper\b/i,/\bsemi[- ]auto taper\b/i,/\bbanjo taper\b/i] },
  { domainId:'finishing_box', patterns:[/\bfinishing box\b/i,/\bflat box\b/i,/\bfat boy\b/i,/\bmaxxbox\b/i,/\bquickbox\b/i] },
  { domainId:'corner_applicator_box', patterns:[/\bcorner applicator box\b/i,/\bcorner box\b/i,/\bangle box\b/i] },
  { domainId:'corner_finisher', patterns:[/\bcorner finisher\b/i,/\bangle head\b/i,/\banglehead\b/i] },
  { domainId:'corner_flusher', patterns:[/\bcorner flusher\b/i,/\bdirect flusher\b/i,/\bcombo flusher\b/i] },
  { domainId:'corner_roller', patterns:[/\bcorner roller\b/i,/\binside corner roller\b/i] },
  { domainId:'compound_tube', patterns:[/\bcompound tube\b/i,/\bmud tube\b/i,/\bminishot\b/i] },
  { domainId:'loading_pump', patterns:[/\bloading pump\b/i,/\bcompound pump\b/i,/\bmud pump\b/i,/\bpowerfill\b/i] },
  { domainId:'loading_adapter', patterns:[/\bgooseneck\b/i,/\bbox filler\b/i,/\bfiller adapter\b/i,/\bfiller valve\b/i] },
  { domainId:'nailspotter', patterns:[/\bnail\s*spotter\b/i,/\bfastener spotter\b/i] },
  { domainId:'smoothing_blade', patterns:[/\bsmoothing blade\b/i,/\bskim(?:ming)? blade\b/i] },
  { domainId:'drywall_sander', patterns:[/\bdrywall sander\b/i,/\bddm sander\b/i] },
  { domainId:'drywall_stilts', patterns:[/\bdrywall stilts?\b/i,/\bdura[- ]?stilts?\b/i,/\bsur[- ]?pro.*stilts?\b/i] },
  { domainId:'storage_case', patterns:[/\btaper case\b/i,/\btool case\b/i,/\broad case\b/i,/\bstorage case\b/i] },
  { domainId:'handle_system', patterns:[/\bbox handle\b/i,/\bcorner.*handle\b/i,/\bextension handle\b/i,/\bhandle adapter\b/i,/\bangle head adapter\b/i] },
  { domainId:'applicator_head', patterns:[/\bapplicator head\b/i,/\binside corner applicator\b/i,/\bflat applicator\b/i] }
];

const ASSEMBLY_RE = /\b(?:assembly|housing assembly|head assembly|wheel assembly|brake assembly|drive assembly|axle assembly|plate assembly|control assembly)\b/i;
const HARDWARE_RE = /\b(?:screw|bolt|nut|washer|o[- ]?ring|pin|clip|retainer|spacer|spring|bushing|bearing)\b/i;
const COMPONENT_RE = /\b(?:blade|cable|wheel|seal|gasket|shaft|bracket|cover|cap|valve|gear|axle|hinge|roller|bearing|bushing)\b/i;

function flatten(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flatten).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(flatten).join(' ');
  return '';
}

export function classifyDrywallDomain(packet: CatalogEvidencePacket | Record<string, unknown>): DomainClassification {
  const facts = (packet as CatalogEvidencePacket).authoritative_facts || packet;
  const text = flatten(facts).replace(/\s+/g,' ').trim();
  const lower = text.toLowerCase();
  const productKind = flatten((facts as Record<string, unknown>).product_kind).toLowerCase();
  const isPart = productKind === 'part' || /\bparts?\b/.test(flatten((facts as Record<string, unknown>).categories).toLowerCase());

  if (isPart) {
    if (ASSEMBLY_RE.test(text)) return { domainId:'replacement_assembly', confidence:'high', reasons:['part identity contains an assembly term'] };
    if (HARDWARE_RE.test(text)) return { domainId:'commodity_hardware', confidence:'high', reasons:['part identity contains commodity-hardware terminology'] };
    if (COMPONENT_RE.test(text)) return { domainId:'replacement_component', confidence:'high', reasons:['part identity contains a functional component term'] };
    return { domainId:'replacement_component', confidence:'medium', reasons:['catalog identifies the product as a part but no narrower part subtype was established'] };
  }

  for (const rule of RULES) {
    if (rule.patterns.some(pattern => pattern.test(text))) {
      return { domainId:rule.domainId, confidence:'high', reasons:[`matched ${rule.domainId} domain terminology`] };
    }
  }

  if (/\bapplicator\b/i.test(lower)) return { domainId:'applicator_head', confidence:'medium', reasons:['matched generic applicator terminology without a box-specific signal'] };
  if (/\bhandle\b/i.test(lower)) return { domainId:'handle_system', confidence:'medium', reasons:['matched handle terminology'] };
  if (/\bcase\b/i.test(lower)) return { domainId:'storage_case', confidence:'medium', reasons:['matched case terminology'] };

  return { domainId:null, confidence:'low', reasons:['no production drywall domain signal matched; explicit domain-map review is required before generation'] };
}
