const express = require("express");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (password && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect("/admin");
  }

  res.status(401).render("login", { error: "Incorrect password." });
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

module.exports = router;
