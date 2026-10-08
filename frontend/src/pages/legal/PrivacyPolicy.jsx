import LegalDocument from './LegalDocument.jsx';

const SECTIONS = [
  {
    heading: '1. Scope and operator',
    paragraphs: [
      'This Privacy Policy describes information handled by Drywall Toolbox (“DTB,” “we,” or “us”) through the Drywall Toolbox website and, in particular, the QuickBooks Online accounting integration. It explains the integration’s data access, uses, disclosures, retention, and disconnection.',
      'The Integration is an operator tool for DTB accounting. It is not a customer payment service. WooCommerce remains the source of storefront order, payment-status, and refund records; QuickBooks Online receives accounting projections.',
    ],
  },
  {
    heading: '2. Information handled by the QuickBooks integration',
    paragraphs: [
      'When an order or refund qualifies for accounting synchronization, DTB uses the relevant WooCommerce accounting and customer fields. Depending on the transaction, this can include a customer’s name and billing email; order or refund identifiers and dates; product or fee descriptions; quantities; currency; subtotal; discounts; shipping, fees, and tax; and transaction totals.',
      'DTB sends the customer name and email needed for QuickBooks customer matching or creation, together with the accounting document details needed to create and reconcile sales receipts and refund receipts. The Integration may read QuickBooks customer records, accounting items and references, company information, supported sales/refund documents, and reports needed for matching, readiness, and reconciliation. Intuit may send supported change notifications so DTB can queue reconciliation work.',
      'The Integration does not send payment-card numbers or card security codes to QuickBooks. Payment processing remains with the payment provider used at WooCommerce checkout.',
    ],
  },
  {
    heading: '3. Information stored by DTB',
    paragraphs: [
      'DTB stores the QuickBooks OAuth access and refresh credentials in encrypted form in the WordPress database, along with the connected company identifier and connection metadata. DTB also keeps a QuickBooks accounting ledger for operational reconciliation. That ledger is designed to contain WooCommerce order/refund identifiers, accounting amounts and tax totals, document state, QuickBooks document identifiers, line descriptions, and payload hashes rather than customer names or contact details. DTB may store a QuickBooks customer identifier against a WooCommerce order or registered account to support deterministic matching.',
      'WooCommerce continues to retain its own order, refund, and customer records under the applicable store and accounting retention practices. QuickBooks retains records created in the connected company under the account holder’s QuickBooks settings and Intuit’s terms.',
    ],
  },
  {
    heading: '4. Purposes and legal bases',
    paragraphs: [
      'DTB uses this information to maintain the accounting integration, match customers, create and reconcile accounting documents, process refund records, investigate errors, prevent duplicate accounting entries, secure the service, and meet bookkeeping, tax, and legal obligations. Where privacy law requires a legal basis, the applicable basis may include performing a transaction or service, legitimate business interests, consent or authorization for the QuickBooks connection, and compliance with legal obligations.',
    ],
  },
  {
    heading: '5. Sharing and service providers',
    paragraphs: [
      'DTB shares relevant customer and transaction information with Intuit when the authorized QuickBooks connection requires it. Information is also processed by DTB’s website and hosting infrastructure and may be handled by service providers supporting hosting, security, payment processing, or business operations. Those providers receive information needed for their services and may process it under their own terms and privacy notices.',
      'DTB may disclose information when required by law, to protect users or the service, or in connection with a business transfer subject to applicable law. DTB does not use the QuickBooks connection to sell customer payment credentials or to authorize storefront payments.',
    ],
  },
  {
    heading: '6. Retention and disconnection',
    paragraphs: [
      'QuickBooks OAuth credentials and connection identifiers are retained while the connection is active. When an administrator disconnects through DTB, the Integration deletes its locally stored OAuth credentials and connected company identifiers. This does not delete WooCommerce orders, DTB’s historical accounting ledger, or QuickBooks records already created. Accounting and order records may be retained for bookkeeping, tax, dispute, security, and legal requirements; applicable retention periods depend on those obligations and the systems holding the records.',
      'Disconnecting in DTB stops the Integration from using the locally stored credentials. To manage or revoke the authorization on Intuit’s side, use the connected-app controls in QuickBooks. Data already held by Intuit remains subject to Intuit’s retention and privacy practices.',
    ],
  },
  {
    heading: '7. Security',
    paragraphs: [
      'DTB uses server-side access controls for the operator integration and encrypts stored QuickBooks OAuth credentials. Data is transmitted to Intuit through HTTPS API connections. No security measure can guarantee absolute security; access is limited to authorized operations and credentials should not be shared.',
    ],
  },
  {
    heading: '8. Your choices and privacy requests',
    paragraphs: [
      'You may contact DTB to request access to, correction of, or deletion of personal information associated with a DTB account or order. DTB may need to retain records required for accounting, tax, legal, security, or dispute-resolution purposes. Requests concerning information held in QuickBooks may also need to be made to the QuickBooks account administrator or Intuit.',
      'Contact dtb@drywalltoolbox.com or use the Drywall Toolbox contact page for privacy questions or requests. Include enough information for DTB to locate the request, but do not send passwords, OAuth tokens, payment-card details, or other secrets.',
    ],
  },
  {
    heading: '9. International processing and updates',
    paragraphs: [
      'DTB and its providers may process information in the countries where their infrastructure and services operate. Where required, applicable safeguards will govern international transfers. This policy may be updated as the Integration or its data practices change; the date above indicates the latest revision.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How Drywall Toolbox handles website and QuickBooks Online integration information, including accounting data, retention, sharing, and disconnection."
      canonical="/privacy-policy"
      eyebrow="QuickBooks Online Integration"
      introduction="How Drywall Toolbox uses and protects information when its QuickBooks Online accounting integration is connected."
      sections={SECTIONS}
    />
  );
}
