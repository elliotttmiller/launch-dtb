import LegalDocument from './LegalDocument.jsx';

const SECTIONS = [
  {
    heading: '1. Agreement and permitted use',
    paragraphs: [
      'This End-User License Agreement applies to the Drywall Toolbox QuickBooks Online integration and its related operator controls (the “Integration”). It is operated by Drywall Toolbox (“DTB,” “we,” or “us”) for authorized business accounting operations.',
      'We grant authorized DTB personnel and contractors a limited, non-exclusive, non-transferable, revocable permission to use the Integration for DTB business purposes, subject to this agreement and the applicable QuickBooks Online terms. Do not share administrator credentials or give access to anyone who is not authorized by DTB.',
    ],
  },
  {
    heading: '2. What the Integration does',
    paragraphs: [
      'The Integration connects an authorized QuickBooks Online company to DTB’s WooCommerce accounting workflow. It can project qualifying WooCommerce sales and concrete refunds to QuickBooks, reconcile those accounting documents, and receive supported QuickBooks change notifications. WooCommerce remains the record for storefront orders, payment status, and refunds; QuickBooks is used for accounting.',
      'The Integration does not collect customer payments, initiate card charges, determine inventory or fulfillment, or provide tax, accounting, legal, or financial advice. DTB operators remain responsible for reviewing accounting configuration, mappings, exceptions, reports, and records with their accountant.',
    ],
  },
  {
    heading: '3. Connected accounts and authorization',
    paragraphs: [
      'An authorized DTB administrator must connect the QuickBooks company and grant the permissions shown by Intuit. Use of QuickBooks Online is also governed by Intuit’s terms and privacy practices. Your QuickBooks subscription, features, and fees are managed by Intuit and are separate from this Integration.',
      'An administrator can disconnect the Integration from its DTB controls. Disconnecting removes the locally stored QuickBooks access credentials and connection identifiers; it does not delete WooCommerce orders, DTB accounting history, or records already created in QuickBooks. Manage or revoke Intuit-side app authorization separately in QuickBooks if required.',
    ],
  },
  {
    heading: '4. Acceptable use and security',
    paragraphs: [
      'You may not use the Integration to access a QuickBooks company without its authorization, bypass access controls, interfere with the service, or violate applicable law or Intuit’s terms. Notify DTB promptly if you believe an account or credential has been compromised.',
      'Do not place payment-card numbers, security codes, or other sensitive payment credentials in notes, support requests, or accounting descriptions. The Integration is not designed to collect or store those credentials.',
    ],
  },
  {
    heading: '5. Availability and changes',
    paragraphs: [
      'The Integration depends on WordPress, WooCommerce, SiteGround hosting, Intuit, and other services. Those services may change or become unavailable. DTB may update, suspend, or discontinue the Integration to maintain security, comply with provider requirements, or support its business operations.',
      'Accounting records and customer obligations are not canceled merely because the Integration is unavailable or disconnected. Operators should use the authoritative WooCommerce and QuickBooks records and follow their organization’s accounting procedures.',
    ],
  },
  {
    heading: '6. Warranty and liability',
    paragraphs: [
      'To the extent permitted by applicable law, the Integration is provided without a promise that every third-party service, synchronization, or accounting result will be uninterrupted or error-free. Nothing in this agreement excludes a right or remedy that cannot lawfully be excluded.',
      'To the extent permitted by applicable law, DTB is not responsible for losses caused by unauthorized account access, inaccurate source records or operator configuration, Intuit or other provider outages or changes, or reliance on an accounting result without appropriate review. This section does not limit liability that applicable law does not allow DTB to limit.',
    ],
  },
  {
    heading: '7. Contact',
    paragraphs: [
      'Questions about this agreement or the Integration can be sent to dtb@drywalltoolbox.com or submitted through the Drywall Toolbox contact page.',
    ],
  },
];

export default function TermsOfService() {
  return (
    <LegalDocument
      title="Terms of Service & End-User License Agreement"
      description="Terms for authorized use of the Drywall Toolbox QuickBooks Online accounting integration."
      canonical="/terms-of-service"
      eyebrow="QuickBooks Online Integration"
      introduction="Terms governing authorized use of the Drywall Toolbox QuickBooks Online integration and its accounting operator controls."
      sections={SECTIONS}
    />
  );
}
