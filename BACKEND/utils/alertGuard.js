let lastStatus = null;
let lastSentAt = 0;
let statusBuffer = [];

const MIN_INTERVAL_MS = 30 * 60 * 1000;
const REQUIRED_COUNT = 3; // harus 3x berturut-turut

const shouldSendAlert = (currentStatus) => {
  const now = Date.now();

  // hanya status penting
  if (!["SIAGA", "BAHAYA"].includes(currentStatus)) {
    statusBuffer = [];
    return false;
  }

  // simpan history
  statusBuffer.push(currentStatus);

  if (statusBuffer.length > REQUIRED_COUNT) {
    statusBuffer.shift();
  }

  // cek apakah stabil
  const isStable = statusBuffer.every(s => s === currentStatus);
  if (!isStable) return false;

  // harus berubah
  if (lastStatus === currentStatus) return false;

  // rate limit
  if (now - lastSentAt < MIN_INTERVAL_MS) return false;

  lastStatus = currentStatus;
  lastSentAt = now;
  return true;
};

module.exports = { shouldSendAlert };
