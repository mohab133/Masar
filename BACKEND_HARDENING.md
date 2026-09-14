# Masar backend hardening contract

The frontend now enforces safe request boundaries, but the Edge Function must enforce them server-side too.

## `/api/feedback`

The function should:

- Accept JSON only.
- Reject `details` when it is missing, empty after trimming, or longer than 300 characters.
- Trim input and sanitize/control unexpected markup before persistence.
- Accept an optional `clientId` and use it as one signal for abuse control.
- Apply server-side rate limiting. A practical anonymous-app baseline is 5 submissions per client/IP per hour, with stricter handling for bursts.
- Return `400` for invalid payloads and `429` for rate-limit violations.
- Never expose service credentials or internal errors to the client.

The client already sends `clientId`, but client-side limits are not a security boundary. The Edge Function must enforce the limits.
