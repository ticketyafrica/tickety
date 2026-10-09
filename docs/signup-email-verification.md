# Signup email verification

New signups must verify their email before an account is created. Existing accounts and staff invitation acceptance continue to work as before.

1. The signup page posts name, email and password to `/api/auth/signup`.
2. The server normalizes the address, stores pending details with bcrypt hashes for both the password and a cryptographically random six-digit code, and sends the code immediately using the existing Resend integration (`RESEND_API_KEY`, sender `experience@tickety.africa`). The cron worker is not required for OTP delivery.
3. The page posts the returned `verificationId` and code to `/api/auth/signup/verify`. On successful verification, the server creates the account with `emailVerifiedAt`, enqueues the welcome email, records signup in the audit log and deletes the pending verification. The page signs the user in.

Codes expire after 10 minutes, allow at most five incorrect attempts, and cannot be reused. A resend replaces the earlier challenge. Requests are limited to one per minute per address, five requests per address per hour, and 20 requests per IP per 10-minute window. Database advisory locks serialize resend and verification across application instances. A delivery failure invalidates the pending code and displays a retry message; it never creates a login account. The existing email cron removes pending records more than 24 hours past expiry and clears expired rate limits.

## Deployment

Apply the committed migration before deploying the new application code:

```sh
npx prisma migrate deploy
```

Ensure `RESEND_API_KEY` is configured and the `tickety.africa` sender domain is verified in Resend. No additional OTP secret is required. `CRON_SECRET` remains necessary for queued welcome emails and cleanup.

## Validation

```sh
npm run test:signup
npx tsc --noEmit
npm run lint
```

The signup suite uses an in-memory transaction fixture; it does not contact Resend or the deployment database. After deployment, complete a signup with a real inbox, check wrong and expired codes and resend, and confirm that signing in before verification does not work.
