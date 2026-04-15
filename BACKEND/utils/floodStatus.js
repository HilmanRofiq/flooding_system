function getFloodStatus(tinggi_air) {
  if (tinggi_air < 80) return "AMAN";
  if (tinggi_air < 120) return "WASPADA";
  if (tinggi_air < 140) return "SIAGA";
  return "BAHAYA";
}

module.exports = { getFloodStatus };
