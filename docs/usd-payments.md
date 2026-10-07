# USD ticket payments

Events have one fixed ticket currency: NGN (default) or USD. Selecting USD sets
dollar prices; it does not convert existing naira prices. Existing events and
orders stay NGN. Monetary database fields use Decimal(14,2); Paystack receives
integer minor units (kobo/cents). The service fee is 5% once per order, capped at
₦2,500 for NGN or $5 for USD. Free bookings carry no service fee. USD fees and
commissions round to cents; existing NGN fees and commissions round to naira.

## Activation

1. Apply the checked-in migration with `npx prisma migrate deploy`, and regenerate
   the client with `npx prisma generate`, before starting this version of the app.
2. Enable USD on Tickety's Nigerian Paystack account. Paystack currently requires
   an approved Zenith Bank USD domiciliary account. Check the account approval
   and USD split eligibility with Paystack before enabling sales:
   https://support.paystack.com/en/articles/2130690
3. Set up a separate, active **USD** Paystack subaccount for each organiser under
   Tickety's integration. Set its primary contact email to the organiser's
   Tickety email. Do not use an existing NGN subaccount for dollar sales. If
   Paystack cannot provide a USD subaccount for the organiser, leave their USD
   sales disabled; this implementation does not convert or manually remit USD.
4. Verify and connect the subaccount using the support script (Node 20.6+):

   ```sh
   TS_NODE_PROJECT=tsconfig.scripts.json node --env-file=.env --require ts-node/register scripts/connect-usd-payout.ts --email organiser@example.com --subaccount ACCT_xxx
   ```

   Add `--apply` after reviewing the successful dry run. The script checks USD,
   active status and the organiser's contact email before saving the separate
   connection. It does not change an existing connection or transfer money.
5. Set `PAYSTACK_USD_ENABLED=true` in the deployment environment only after
   Paystack approval and a successful test checkout/split. Keep it unset or
   false until then. Deploy the application.
6. Configure the existing `/api/webhooks/paystack` URL on Paystack. On local
   development, use a reachable development callback/webhook origin.

## Behaviour

A $20 ticket costs $21 including a $1 service fee. The organiser split is $18;
Tickety keeps $3 before Paystack processing costs. Paystack requires a USD
payment total of at least $2; smaller orders must add more tickets. Checkout
checks the USD subaccount currency and status before reserving inventory.

Both the callback and signed ticket webhook check the stored currency, amount
and reference before issuing tickets. Receipts, ticket pages, contacts and
reports show the correct currency. Aggregate reports list NGN and USD totals
separately; no exchange rate is assumed. Free-event listing fees remain NGN.

USD is gated on both the platform setting and the organiser's USD connection.
Existing NGN payout setup remains separate. The payout page directs organisers
to support for USD onboarding and shows whether their USD connection is ready.

## Validation before enabling live sales

Test an approved USD account with a cent-priced ticket, a $5-capped order,
callback and webhook confirmation, repeated notifications, and a rejected
wrong-currency payment. Confirm the organiser receives the intended USD split
on Paystack's dashboard. Automated tests mock Paystack; they cannot establish
account approval or real settlement eligibility.
