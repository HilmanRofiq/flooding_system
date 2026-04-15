function getFloodStatus(tinggi_air) {
  if (tinggi_air < 100) return "AMAN";
  if (tinggi_air < 150) return "WASPADA";
  if (tinggi_air < 200) return "SIAGA";
  return "BAHAYA";
}

module.exports = { getFloodStatus };
