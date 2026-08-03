# Security Boundary

The DTB Email Previewer is local-development tooling only.

- It returns `404` unless `wp_get_environment_type()` is `local` or `development`.
- It requires an authenticated user with `manage_woocommerce`.
- It loads an existing order read-only and never calls email `trigger()` or `send()`.
- It must not be transferred to or enabled on production as a public tool.
- Production credentials, customer exports, payment data, and live database dumps must never be copied into the local preview environment.
