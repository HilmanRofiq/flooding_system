const express = require("express");
const router = express.Router();
const { receiveFloodData } = require("../controllers/floodController");

router.post("/flood", receiveFloodData);

module.exports = router;
