export function enqueueUnique(queue, operation) {
  if (queue.some((item) => item.idempotencyKey === operation.idempotencyKey)) return queue;
  return [...queue, operation];
}

export function markSynced(queue, id, timestamp = Date.now()) {
  return queue.map((item) => item.id === id
    ? { ...item, status: "synced", syncedAt: timestamp }
    : item);
}

export function nextRetryDelay(attempts) {
  return Math.min(300000, 1000 * Math.pow(2, Math.max(0, Number(attempts) || 0)));
}
