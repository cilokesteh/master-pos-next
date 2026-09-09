import test from "node:test";
import assert from "node:assert/strict";
import { enqueueUnique, markSynced, nextRetryDelay } from "../src/lib/sync-domain.mjs";

test("queue menolak operasi duplikat berdasarkan idempotency key", () => {
  const first = { id: "q1", idempotencyKey: "tx-001", status: "pending", attempts: 0 };
  assert.deepEqual(enqueueUnique([], first), [first]);
  assert.deepEqual(enqueueUnique([first], { ...first, id: "q2" }), [first]);
});

test("mark synced menyimpan timestamp tanpa menggandakan operasi", () => {
  const queue = [{ id: "q1", idempotencyKey: "tx-001", status: "pending", attempts: 1 }];
  const result = markSynced(queue, "q1", 12345);
  assert.equal(result[0].status, "synced");
  assert.equal(result[0].syncedAt, 12345);
  assert.equal(result.length, 1);
});

test("retry menggunakan exponential backoff dengan batas 5 menit", () => {
  assert.equal(nextRetryDelay(0), 1000);
  assert.equal(nextRetryDelay(3), 8000);
  assert.equal(nextRetryDelay(20), 300000);
});
