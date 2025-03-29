const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db.js");
const crypto = require("crypto");
const sendEmail = require("../config/emailer.js"); // Import mailer.js

function generateSecureString(length = 32) {
  // Generate random bytes
  const randomBytes = crypto.randomBytes(length);

  // Convert random bytes to a hex string (you can also use 'base64' if you prefer)
  return randomBytes.toString("hex");
}

function checkAuth(req, res, next) {
  if (req.session.user) {
    next(); // If session exists, continue to the requested route
  } else {
    res.redirect("/login"); // If session doesn't exist, redirect to login}
  }
}

router.get("/", checkAuth, async (req, res) => {
  res.render("home", { title: "Home" });
});

router.get("/pws", checkAuth, async (req, res) => {
  res.render("modules/pws", { title: "Password Manager" });
});

router.get("/04122014", async (req, res) => {
  res.render("modules/anniversary", { title: "Happy Anniversary" });
});

module.exports = router;
