require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/db");
const session = require("express-session");
const userhandelingroutes = require("./routes/userhandeling");
const modules = require("./routes/modules");

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Session middleware setup
app.use(
  session({
    secret: "f1b8ad9e60a274d5e5e9c32147a76ab73f79d7f6b93f888d5c94e7ee1d7f6cc2", // Secret for signing the session ID cookie
    resave: false, // Don't save the session if it wasn't modified
    saveUninitialized: false, // Don't create a session until something is stored
    cookie: { secure: false }, // Set secure to true if using HTTPS
  })
);

// Routes
app.use("/", userhandelingroutes);
app.use("/home", modules);

app.use((req, res, next) => {
  res.status(404).render("unknownpage", { title: "Unknown Page" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
