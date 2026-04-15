let lastStatus = null;

const isStatusChanged = (currentStatus) => {
  if (lastStatus !== currentStatus) {
    lastStatus = currentStatus;
    return true;
  }
  return false;
};

module.exports = { isStatusChanged };
