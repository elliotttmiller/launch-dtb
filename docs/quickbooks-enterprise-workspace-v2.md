# QuickBooks Enterprise Workspace Acceptance Contract

This branch contains the implementation source for the enterprise QuickBooks workspace. Because the BrikPanel component PR was merged before these commits were completed, these changes must be proposed from a fresh branch based on current `main` before merge.

Required production validation:

1. PHP lint the enterprise controller, admin page, and integration bootstrap.
2. Run `node --check` on `quickbooks-admin.js`.
3. Verify all enterprise REST views return bounded, redacted responses.
4. Verify the active view refreshes every 15 seconds only while the browser page is visible.
5. Verify no accounting write occurs in the enterprise read endpoint.
6. Verify reconciliation queues through `dtb-orders` and does not create a QuickBooks entity inline.
7. Verify one controlled captured-payment sandbox order creates or reconciles exactly one SalesReceipt.
8. Repeat the queue operation and verify duplicate protection.
