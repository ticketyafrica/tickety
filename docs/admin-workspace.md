# Admin workspace

The admin workspace starts at `/admin`. It has its own sidebar and header;
the public navbar and footer remain available on public pages and are hidden
on admin routes. Small screens use a slide-out navigation menu.

## Sections

- Overview: date and currency filters; processed revenue, recorded platform
  earnings, ticket issuance, account growth, interactive revenue chart,
  revenue composition, top events, signups, activity and operational counts.
- Events: searchable, date-filtered and paginated listings, event details,
  ticket inventory, linked organisers/attendees/orders and publication controls.
- Payments and orders: ticket orders and a separate listing-fee view. Details
  show customer contacts, stored financial split, Paystack reference, timestamps
  and issued-ticket status. Incomplete ticket issuance remains visible.
- People and signups: all account roles, signup dates, payout readiness,
  organiser events and lifetime financial totals per currency.
- Attendees: contact details, ticket/payment/check-in status, purchase date,
  registration answers and links to orders/events.
- Activity audit: actor, action, time, related record and safe context. Activity
  is append-only through the application; there is no edit/delete endpoint.

## Financial definitions

Overview revenue uses successful order payment dates and successful listing
payment dates. Confirmed paid receipts contribute revenue even if ticket issuance needs attention;
zero-value bookings must have issued tickets to count as confirmed bookings. Free confirmed
bookings contribute tickets but no revenue. Order amounts are not inferred from
individual ticket transaction records, so an order's service fee is counted once.

Processed revenue = full customer ticket payments + NGN listing-fee payments.
Platform earnings = the stored Order.platformFee + listing-fee payments.
The commission/service-fee breakdown is shown where recorded. Differences
between gross receipts and recorded payout shares are flagged for reconciliation
instead of assuming historical fee rules. Paystack processing fees are now saved from verified callbacks/webhooks, in the
payment currency. Tickety net = stored Tickety share minus confirmed Paystack
fees. Missing fees or missing share allocations make the final net unknown.
When all fees are confirmed but shares are incomplete, the recorded Tickety
amount after processing is shown explicitly alongside unallocated receipts. Refunds, taxes and other business costs are
not deducted by these figures.

NGN and USD never share a numeric total. Use the currency selector on the
financial overview/orders. Profile totals show each currency separately. Growth
compares the previous equal-length period; a zero baseline is shown without an
invented percentage. Financial aggregates round to cents.

Dates use Africa/Lagos boundaries; the end date is inclusive. The UI supports
today, 7/30/90 days, this year and custom periods up to 367 days. Editing From/To
automatically selects a custom period. Financial charts use payment dates;
management lists explain whether they filter creation, signup or purchase dates.

## Exports and access

Every section exports its filtered data as CSV. Large management exports stream
in batches of 500 with stable ID pagination; they are not limited to the visible
page. Values are CSV-escaped and spreadsheet-formula strings are neutralised.
The overview exports daily collected revenue, organiser shares, Tickety before/after
Paystack, confirmed processing fees, missing-fee counts and ticket counts. Events,
orders and listing-fee exports also include processing fees and net shares.
Export requests and successful completion are audited. CSV timestamps include
UTC offsets through ISO dates.

All admin pages and data/export/status endpoints verify the current database
role, including on client navigation. A signed-in organiser cannot use the admin
status endpoint. Database roles are not changed by this implementation. After a
role change, sign out and in again to refresh the existing JWT middleware role.

## Audit coverage

Logging starts with this release; historical actions are not fabricated.
Logged actions include signups, successful sign-ins, event creation/edit/deletion,
admin publication changes (before/after status), confirmed paid/free bookings,
listing payments, ticket check-in, staff invitations/acceptance/removal,
payout connection/update requests/completion, PIN setup/security lockouts, and
CSV exports. Database-only operations use the existing transaction where possible;
provider payout updates have a durable request entry before the external call.
PINs, PIN/password hashes, tokens, secret keys and full bank numbers are excluded
from audit metadata. Payment/check-in entries use unique deduplication keys.

The audit-log migration adds a new table and preserves existing data. It has
been applied to the configured database during development. Other deployments
must run `npx prisma migrate deploy` and regenerate Prisma before running this
version. Retain Paystack webhook configuration for reliable payment completion.

## Confirmed Paystack fees

Paystack fee fields are nullable to distinguish unknown charges from zero.
Free bookings have zero processing fees. A successful callback/webhook captures
Paystack's `fees` field (minor units, converted to naira/dollars). Duplicate
confirmations can fill a previously missing fee without issuing tickets twice.

Admin overview and event detail pages provide **Fetch confirmed Paystack fees**.
The action verifies stored references, amount, currency and successful status
before saving a fee. It reads Paystack; it does not initiate charges or transfers.
Requests process bounded batches with cursors, and are audited. Unknown or
unverifiable references stay unknown. If an old integration/key owns the
reference, that key is needed to verify it. The configured database's existing
verifiable paid records were reconciled during implementation.

The event list displays lifetime collections, organiser share, service fees,
processing fees and Tickety's net. Event details show the complete breakdown.
NGN listing fees on USD events remain a separate NGN financial group.
