import { infrai } from "./infrai_storage.ts";

const BUCKET = "legal-matter-files";

export type MatterIntake = {
  matterId: string;
  clientName: string;
  documentKey: string;
  deadline: string;
};

export type DeliveryPlan = {
  matterId: string;
  action: "send_signed_link" | "follow_up";
  deadline: string;
  url?: string;
};

export function chooseFollowUp(deadline: string, now = new Date()): boolean {
  return new Date(deadline).getTime() <= now.getTime();
}

async function ensureBucket(): Promise<void> {
  try {
    await infrai.storage.bucket.get(BUCKET);
  } catch {
    await infrai.storage.bucket.create(BUCKET);
  }
}

async function ensureObject(bucket: string, key: string): Promise<void> {
  const object = await infrai.storage.object.head(bucket, key) as { found: boolean };
  if (object.found) return;

  const upload = await infrai.storage.object.presign(bucket, key, {
    op: "put",
    content_type: "application/pdf",
    max_bytes: 1024,
    idempotency_key: `upload-${key}`,
  });
  const response = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: "%PDF-1.4\n% legal matter placeholder\n",
  });
  if (!response.ok) throw new Error(`Object upload failed with HTTP ${response.status}`);
}

export async function prepareDelivery(intake: MatterIntake, now = new Date()): Promise<DeliveryPlan> {
  await ensureBucket();
  await ensureObject(BUCKET, intake.documentKey);
  if (chooseFollowUp(intake.deadline, now)) {
    return { matterId: intake.matterId, action: "follow_up", deadline: intake.deadline };
  }
  const signed = await infrai.storage.object.presign(BUCKET, intake.documentKey, {
    op: "get",
    expires_seconds: 900,
    response_disposition: `attachment; filename=${intake.matterId}-document`,
    idempotency_key: `delivery-${intake.matterId}-${intake.documentKey}`,
  });
  return { matterId: intake.matterId, action: "send_signed_link", deadline: intake.deadline, url: signed.url };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const intake: MatterIntake = { matterId: "matter-104", clientName: "Aster Labs", documentKey: "matter-104/engagement.pdf", deadline: "2099-06-30T17:00:00Z" };
  const plan = await prepareDelivery(intake);
  console.log(JSON.stringify(plan, null, 2));
}
