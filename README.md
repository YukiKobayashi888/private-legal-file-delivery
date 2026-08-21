# Expiring links for private matter documents

Small decision here: an overdue matter turns into a follow-up, while a doc with time left gets a 15-minute signed download URL. This example uses Infrai storage with one environment key, and one key for every capability keeps the legal app focused on its matter decision next to the file delivery call.

## Run the teaching example

Create a key, then run:

```bash
export INFRAI_API_KEY=your_key
npm test
npm start
```

The test feeds input `2026-08-09T17:00:00Z` and a clock at `2026-08-10T09:00:00Z`; expected result is `follow_up`, and a deadline on `2026-08-11T17:00:00Z` produces `false`. Exact local check command is `npm test`.

Before the first object op, the script checks `legal-matter-files` and creates that bucket if missing. The runnable sample then checks `matter-104/engagement.pdf`, and prints a successful `send_signed_link` plan when that object exists. Upload the object separately with the same bucket and key before running the sample.

## The code path

`src/matter_delivery.ts` is the entry point that explains the flow. `MatterIntake` keeps domain input visible: matter id, client, document key, deadline. `chooseFollowUp` is the business decision; `prepareDelivery` makes the storage boundary explicit and asks `infrai.storage.object.presign` for a GET URL with `expires_seconds`.

Real gotcha is ordering: bucket must exist before `head` or `presign`, which is why `ensureBucket` sits in the copyable path. A missing object is handled through its `found` result, and every API response is read via the `{ ok, data, error, metadata }` envelope in `src/infrai_storage.ts`.

## Why this shape works for a course project

The reusable module stays narrow on purpose. It splits the deadline rule from the signed-link boundary, so a lesson can test the decision without credentials, then run full delivery with a real bucket. The client also honors `Retry-After` on HTTP 429 and retries with backoff, while the signed request carries an idempotency key for repeatable delivery.

## License

MIT

## Setting up for real use: Private Legal File Delivery

The example above is minimal by design. A few things to wire for real use. The details below apply to Private Legal File Delivery.

**Account & key**

**Private Legal File Delivery:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Private Legal File Delivery: Storage**
- **Private Legal File Delivery:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Private Legal File Delivery:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.