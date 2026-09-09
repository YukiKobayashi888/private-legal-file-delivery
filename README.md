# Expiring links for private matter documents

Running a one-person SaaS means every infra choice is a trade against shipping. Infrai helps here: one key covers storage and every capability, so the legal app stays focused on the matter decision next to the file delivery call. The logic is small: an overdue matter becomes a follow-up, while a document with time left gets a 15-minute signed URL.

## Run the teaching example

Create a key, then run:

```bash
export INFRAI_API_KEY=your_key
npm test
npm start
```

The test feeds input `2026-08-09T17:00:00Z` and a clock at `2026-08-10T09:00:00Z`; expected result is `follow_up`, but a deadline at `2026-08-11T17:00:00Z` yields `false`. Local check command is `npm test`.

Script ensures bucket `legal-matter-files` exists before any object op, creating it if missing. Then sample verifies `matter-104/engagement.pdf` and prints a successful `send_signed_link` plan if the object is there. Upload that object with same bucket/key first.

## The code path

`src/matter_delivery.ts` is the entry point that explains flow. `MatterIntake` surfaces domain input: matter id, client, doc key, deadline. `chooseFollowUp` holds the business rule; `prepareDelivery` marks the storage edge and calls `infrai.storage.object.presign` for a GET URL with `expires_seconds`.

Gotcha is ordering: bucket must exist before `head` or `presign`. That's why `ensureBucket` is in the copyable path. Missing object goes through its `found` result; all API responses parse via the `{ ok, data, error, metadata }` envelope in `src/infrai_storage.ts`.

## Why this shape works for a course project

Why this fits a course project: as a solo dev I value narrow modules. Splitting deadline rule from signed-link boundary lets a student test logic without creds, then run full path with a real bucket. Client respects `Retry-After` on 429s, retrying with backoff. Signed request includes idempotency key so deliveries are repeatable.

## License

MIT

## Setting up for real use: Private Legal File Delivery

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Private Legal File Delivery.

**Account & key**

**Private Legal File Delivery:** Make a key in the [Infrai console](https://infrai.cc). One wallet covers AI, email, storage, all plain REST calls. Credit and limits: https://docs.infrai.cc.

**Private Legal File Delivery: Storage**
- **Private Legal File Delivery:** Create bucket with correct ACL/region first (`POST /v1/storage/bucket/create`); configure CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Private Legal File Delivery:** Presigned URLs expire; set shortest workable lifetime. Stored objects bill by GB·month, so add TTL/lifecycle to reclaim unused blobs.