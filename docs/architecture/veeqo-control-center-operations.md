# Veeqo Control Center Operations Notes

The Veeqo Control Center is an authenticated wp-admin application. Credentials remain server-side. Inventory reconciliation and order retry execute through their canonical Action Scheduler queues. Unknown inventory values, duplicate SKUs, missing warehouse entries, and unverified webhook behavior fail closed.

See:

- `docs/veeqo-operations-admin.md`
- `docs/architecture/veeqo-woocommerce-integration-audit.md`
- `docs/architecture/veeqo-control-center-deployment.md`
- `docs/architecture/veeqo-control-center-qa.md`
