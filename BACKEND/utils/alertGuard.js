let lastStatus = null;
let lastSentAt = 0;

const MIN_INTERVAL_MS = 30 * 60 * 1000; // 30 menit

const shouldSendAlert = (currentStatus) => {
  const now = Date.now();

  // hanya level penting
  if (!["SIAGA", "BAHAYA"].includes(currentStatus)) return false;

  // harus BERUBAH status
  if (lastStatus === currentStatus) return false;

  // rate limit
  if (now - lastSentAt < MIN_INTERVAL_MS) return false;

  lastStatus = currentStatus;
  lastSentAt = now;
  return true;
};

module.exports = { shouldSendAlert };
