const axios = require("axios");

const sendWhatsApp = async (message) => {
  try {
    await axios.post(
      "https://api.fonnte.com/send",
      {
        target: process.env.ALERT_PHONE,
        message: message,
      },
      {
        headers: {
          Authorization: process.env.FONNTE_TOKEN,
        },
      }
    );

    console.log(" WhatsApp alert terkirim");
  } catch (error) {
    console.error(" Gagal kirim WhatsApp:", error.response?.data || error.message);
  }
};

module.exports = { sendWhatsApp };
