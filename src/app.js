const path = require("path");
const express = require("express");
const cookieSession = require("cookie-session");

const requireAuth = require("./middleware/requireAuth");
const redirectRoutes = require("./routes/redirect");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");

const app = express();

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: false }));
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  })
);

app.use(redirectRoutes);
app.use(authRoutes);
app.use("/admin", requireAuth);
app.use("/api", requireAuth);
app.use(adminRoutes);
app.use(apiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong.");
});

module.exports = app;
