function getFloodStatus(tinggi_air) {
  if (tinggi_air < 30) return "AMAN";
  if (tinggi_air < 50) return "WASPADA";
  if (tinggi_air < 70) return "SIAGA";
  return "BAHAYA";
}

module.exports = { getFloodStatus };
