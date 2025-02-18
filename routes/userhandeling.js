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

// Home Route
router.get("/", checkAuth, async (req, res) => {
  res.render("home", { title: "Home" });
});

router.get("/register", async (req, res) => {
  const registrationCode = req.query.code;

  if (!registrationCode) {
    return res.redirect("/login");
  }

  const record = await db.oneOrNone(
    "SELECT email, registrationcode FROM registrationcodes WHERE registrationcode = $1",
    [registrationCode]
  );

  if (record) {
    const email = record.email;
    res.render("userhandeling/register", {
      title: "Register",
      email: record.email,
      registrationCode: registrationCode,
    });
  } else {
    res.render("userhandeling/login", {
      title: "Login",
      message: "Not a valid registration code",
    });
  }
});

router.get("/login", async (req, res) => {
  res.render("userhandeling/login", { title: "Login", message: "" });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.render("userhandeling/login", {
      title: "Login",
      message: "Logged out",
    });
  });
});

router.get("/registrationlink", checkAuth, async (req, res) => {
  res.render("sendRegistrationLink", {
    title: "Registration Link",
    message: "",
    registrationLink: "",
  });
});

router.get("/checkitem", async (req, res) => {
  const { username, table } = req.query;

  if (!username || !table) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Example database check (adjust for your DB)
  const userExists = await db.oneOrNone(
    `SELECT * FROM ${table} WHERE username = $1`,
    [username]
  );

  res.json({ exists: !!userExists }); // Sends JSON response
});

router.get("/forgotpassword", async (req, res) => {
  res.render("userhandeling/forgotpassword", {
    title: "Forgot Password",
    message: "",
  });
});

router.get("/resetpassword", async (req, res) => {
  const registrationCode = req.query.code;

  if (!registrationCode) {
    return res.redirect("/login");
  }

  const record = await db.oneOrNone(
    "SELECT email, registrationcode FROM registrationcodes WHERE registrationcode = $1",
    [registrationCode]
  );

  if (record) {
    const email = record.email;
    res.render("userhandeling/resetpassword", {
      title: "Reset Password",
      email: record.email,
      registrationCode: registrationCode,
    });
  } else {
    res.render("userhandeling/login", {
      title: "Login",
      message: "Not a valid registration code",
    });
  }
});

//////////////////////////////////////////////////////
//Post Routes
//////////////////////////////////////////////////////

router.post("/register", async (req, res) => {
  const { username, password, confirmPassword, registrationCode } = req.body;

  //if the passwords do not match it will rerender the site with a message
  if (password !== confirmPassword) {
    return res.render("userhandeling/register", {
      title: "Register",
      message: "Passwords do not match",
      registrationCode: registrationCode,
    });
  }
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the new user into the database
  // Check if the username already exists
  const userExists = await db.oneOrNone(
    "SELECT username FROM users WHERE username = $1",
    [username]
  );

  if (userExists) {
    return res.render("userhandeling/login", {
      title: "login",
      message: "Username already exists",
    });
  }

  // Insert the new user into the database
  db.none("INSERT INTO users(username, password, locked) VALUES($1, $2, $3)", [
    username,
    hashedPassword,
    false,
  ])
    .then(async () => {
      await db.none(
        "DELETE FROM registrationCodes WHERE registrationCode = $1",
        [registrationCode]
      );
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
      res.render("userhandeling/register", {
        title: "Register",
        message: "Error registering user",
        registrationCode: registrationCode,
      });
    });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Find the user in the database
  const user = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  if (!user) {
    return res.render("userhandeling/login", {
      title: "Login",
      message: "Invalid username or password",
    });
  }

  if (user.locked == true) {
    return res.render("userhandeling/login", {
      title: "Login",
      message: "This account is locked, reset your password to unlock",
    });
  }

  // Check if the password is correct
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render("userhandeling/login", {
      title: "Login",
      message: "Invalid username or password",
    });
  }

  // Authenticate the user and set the session
  req.session.user = user;

  res.redirect("/");
});

router.post("/registrationlink", checkAuth, async (req, res) => {
  const { email } = req.body;

  // Validate the email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("sendRegistrationLink", {
      title: "Registration Link",
      message: "Invalid email format",
      registrationLink: "",
    });
  }

  // Generate a secure registration code
  const registrationCode = generateSecureString(64);

  // Insert the email and registration code into the database
  // Check if the email already exists in the table
  const emailExists = await db.oneOrNone(
    "SELECT email FROM registrationCodes WHERE email = $1",
    [email]
  );

  if (emailExists) {
    // Update the existing record with the new registration code
    await db.none(
      "UPDATE registrationCodes SET registrationCode = $2 WHERE email = $1",
      [email, registrationCode]
    );
  } else {
    // Insert the new email and registration code into the database
    await db.none(
      "INSERT INTO registrationCodes(email, registrationCode) VALUES($1, $2)",
      [email, registrationCode]
    );
  }

  sendEmail(
    email,
    "McMenemy House Registration",
    `<p>Please click on <a href="http://${req.get(
      "host"
    )}/register?code=${registrationCode}">this link</a> to register</p>`
  );

  res.render("sendregistrationlink", {
    title: "Registration Link",
    message: "Registration link sent",
    registrationLink: `${req.get("host")}/register/${registrationCode}`,
  });
});

router.post("/forgotpassword", async (req, res) => {
  const { username } = req.body;

  // Check if the username exists in the database
  const user = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  if (user) {
    // Lock the user account
    await db.none("UPDATE users SET locked = true WHERE username = $1", [
      username,
    ]);

    // Generate a secure string
    const resetCode = generateSecureString(64);

    // Check if the username already exists in the registrationCodes table
    const emailExists = await db.oneOrNone(
      "SELECT email FROM registrationCodes WHERE email = $1",
      [username]
    );

    if (emailExists) {
      // Update the existing record with the new registration code
      await db.none(
        "UPDATE registrationCodes SET registrationCode = $2 WHERE email = $1",
        [username, resetCode]
      );
    } else {
      // Insert the new email and registration code into the database
      await db.none(
        "INSERT INTO registrationCodes(email, registrationCode) VALUES($1, $2)",
        [username, resetCode]
      );
    }
    ``;

    // Send the reset email
    sendEmail(
      user.username,
      "Password Reset",
      `<p>Please click on <a href="http://${req.get(
        "host"
      )}/resetPassword?code=${resetCode}">this link</a> to reset your password</p>`
    );
  }

  // Redirect to login with a message
  res.render("userhandeling/login", {
    title: "Login",
    message:
      "If there is an account with your username, you will be sent an email shortly.",
  });
});

router.post("/resetpassword", async (req, res) => {
  const { password, confirmPassword, registrationCode } = req.body;

  // Find the registration code in the database
  const record = await db.oneOrNone(
    "SELECT email FROM registrationCodes WHERE registrationCode = $1",
    [registrationCode]
  );

  if (!record) {
    return res.render("userhandeling/resetpassword", {
      title: "Reset Password",
      message: "Invalid or expired registration code",
    });
  }

  const username = record.email;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the user password
  await db.none(
    "UPDATE users SET password = $1, locked = false WHERE username = $2",
    [hashedPassword, username]
  );

  // Delete the registration code
  await db.none("DELETE FROM registrationCodes WHERE registrationCode = $1", [
    registrationCode,
  ]);

  // Redirect to login with a message
  res.render("userhandeling/login", {
    title: "Login",
    message: "Password reset successfully",
  });
});

module.exports = router;
