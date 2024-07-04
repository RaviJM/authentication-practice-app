/////// app.js

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// ------------------------------------------------------------------------------------------------------------------
// importing libraries for authentication (Login, Logout)
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcrypt");
// ------------------------------------------------------------------------------------------------------------------/

const mongoDb =
  "mongodb+srv://ravimak2003:QxYup8Nsw2HYz4Oe@cluster0.4xfcek1.mongodb.net/authorization-practice-db?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

// ------------------------------------------------------------------------------------------------------------------
const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
  })
);
// ------------------------------------------------------------------------------------------------------------------/

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

// ------------------------------------------------------------------------------------------------------------------
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// index page
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

// Routes for SIGN-UP
app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
  try {
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      const user = new User({
        username: req.body.username,
        password: hashedPassword,
      });
      const result = await user.save();
      res.redirect("/");
    });
  } catch (err) {
    return next(err);
  }
});

// functions that passport.js uses internally
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Route to handle LOGIN
app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);

// Route to handle LOGOUT
app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// ------------------------------------------------------------------------------------------------------------------/

app.listen(3000, () => console.log("app listening on port 3000!"));
