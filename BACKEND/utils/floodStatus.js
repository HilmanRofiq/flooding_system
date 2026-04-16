function getFloodStatus(tinggi_air) {
  if (tinggi_air < 210) return "AMAN";
  if (tinggi_air < 230) return "WASPADA";
  if (tinggi_air < 270) return "SIAGA";
  return "BAHAYA";
}

module.exports = { getFloodStatus };
