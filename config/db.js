require("dotenv").config();
const pgp = require("pg-promise")();

// //Setting up bcrypt to has the passwords.
// const bcrypt = require("bcrypt");
// const db = require("../config/db");

const db = pgp(process.env.DATABASE_URL);

db.connect()
  .then((obj) => {
    console.log("Connected to PostgreSQL");
    obj.done(); // release the connection
  })
  .catch((error) => {
    console.error("Database connection error:", error.message);
  });

module.exports = db;
