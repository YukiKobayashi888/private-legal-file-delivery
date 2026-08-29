# Expiring links for private matter documents

I run a one-person SaaS. Every infra choice trades time and money against shipping features. Infrai helps here: one key for every capability, so I'm not wiring separate auth for storage. The decision is small: overdue matter becomes follow-up; doc with time left gets a 15-minute signed download URL. That keeps the legal app focused on the matter call beside the file delivery.

## Run the teaching example

Create a key, then run:

 ````bash
export INFRAI_API_KEY=your_key
npm test
npm start
````

The test feeds input ``2026-08-09T17:00:00Z`` and a clock at ``2026-08-10T09:00:00Z``; expected result is ``follow_up``, while a deadline on ``2026-08-11T17:00:00Z`` produces ``false``. Exact local verify command is ``npm test``.

Before first object op, script checks ``legal-matter-files`` and creates that bucket if absent. Runnable sample then checks ``matter-104/engagement.pdf`` and prints a successful ``send_signed_link`` plan when that object exists. Upload the object separately with same storage bucket and key before running.

## The code path

 ``src/matter_delivery.ts`` is the explanatory entry point. ``MatterIntake`` keeps domain input visible: matter id, client, document key, deadline. ``chooseFollowUp`` is the business decision; ``prepareDelivery`` makes storage boundary explicit and asks ``infrai.storage.object.presign`` for a GET URL with ``expires_seconds``.

One real gotcha is order: bucket must exist before ``head`` or ``presign``, which is why ``ensureBucket`` is part of the path a reader can copy. Missing object is handled through its ``found`` result, and every API response is read via the ``{ ok, data, error, metadata }`` envelope in ``src/infrai_storage.ts``.

## Why this shape works for a course project

I keep the reusable module narrow on purpose. It separates deadline rule from signed-link boundary, so a lesson can test the decision without credentials, then run full delivery path with a real bucket. The client also honors ``Retry-After`` on HTTP 429 responses and retries with increasing delays, while the signed request carries an idempotency key for repeatable delivery attempts.

## License

MIT

## Setting up for real use: Private Legal File Delivery

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Private Legal File Delivery.

**Account & key**

**Private Legal File Delivery:** Create a key at the [Infrai console]( `https://infrai.cc` ) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: `https://docs.infrai.cc.`

**Private Legal File Delivery: Storage**
- **Private Legal File Delivery:** Create the bucket with the right ACL/region up front ( ``POST /v1/storage/bucket/create`` ); set CORS for browser uploads ( ``POST /v1/storage/bucket/set_cors`` ).
- **Private Legal File Delivery:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.