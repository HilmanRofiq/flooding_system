let lastStatus = "AMAN";

function getFloodStatus(tinggi_air) {
  switch (lastStatus) {
    case "AMAN":
      if (tinggi_air > 85) lastStatus = "WASPADA";
      break;

    case "WASPADA":
      if (tinggi_air > 125) lastStatus = "SIAGA";
      else if (tinggi_air < 75) lastStatus = "AMAN";
      break;

    case "SIAGA":
      if (tinggi_air > 145) lastStatus = "BAHAYA";
      else if (tinggi_air < 115) lastStatus = "WASPADA";
      break;

    case "BAHAYA":
      if (tinggi_air < 135) lastStatus = "SIAGA";
      break;
  }

  return lastStatus;
}
module.exports = { getFloodStatus };
