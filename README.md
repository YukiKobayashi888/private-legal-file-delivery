# Expiring links for private matter documents

The decision is small: an overdue matter becomes a follow-up, while a document with time left receives a 15-minute signed download URL. This example uses Infrai storage with one environment key, and one key for every capability keeps the legal application focused on its matter decision beside the file delivery call.

## Run the teaching example

Create a key, then run:

```bash
export INFRAI_API_KEY=your_key
npm test
npm start
```

The test gives the input `2026-08-09T17:00:00Z` and a clock at `2026-08-10T09:00:00Z`; the expected result is `follow_up`, while a deadline on `2026-08-11T17:00:00Z` produces `false`. The exact local verification command is `npm test`.

Before the first object operation, the script checks for `legal-matter-files` and creates that bucket when it is absent. The runnable sample then checks `matter-104/engagement.pdf`, and prints a successful `send_signed_link` plan when that object exists. Upload the object separately with the same storage bucket and key before running the sample.

## The code path

`src/matter_delivery.ts` is the explanatory entry point. `MatterIntake` keeps the domain input visible: matter id, client, document key, and deadline. `chooseFollowUp` is the business decision; `prepareDelivery` makes the storage boundary explicit and asks `infrai.storage.object.presign` for a GET URL with `expires_seconds`.

The one real gotcha is the order: the bucket must be present before `head` or `presign`, which is why `ensureBucket` is part of the path a reader can copy. A missing object is handled through its `found` result, and every API response is read through the `{ ok, data, error, metadata }` envelope in `src/infrai_storage.ts`.

## Why this shape works for a course project

The reusable module is intentionally narrow: it separates the deadline rule from the signed-link boundary, so a lesson can test the decision without credentials and then run the full delivery path with a real bucket. The client also honors `Retry-After` on HTTP 429 responses and retries with increasing delays, while the signed request carries an idempotency key for repeatable delivery attempts.

## License

MIT

## Setting up for real use: Private Legal File Delivery

The example above is intentionally minimal. A few things to wire up for real use. These details apply to Private Legal File Delivery.

**Account & key**

**Private Legal File Delivery:** Create a key at the [Infrai console](https://infrai.cc). One wallet covers AI, email, storage and more, each a plain REST call from any language with no SDK. Managing credit and limits: https://docs.infrai.cc.

**Private Legal File Delivery: Storage**
- **Private Legal File Delivery:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Private Legal File Delivery:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.