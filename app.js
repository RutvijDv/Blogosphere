const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// middleware
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static("public"));

const db = mongoose.connect("mongodb://localhost/blogsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  author_id: String,
});

const Blog = mongoose.model("Blog", blogSchema);
const User = mongoose.model("User", userSchema);

app.route("/signup").post(function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    if (err) res.send(err);
    else {
      const user = new User({
        username: req.body.username,
        password: hash,
      });

      user.save(function (err) {
        if (err) {
          res.send(err);
        } else {
          res.send("Successfully signed up");
        }
      });
    }
  });
});

app.route("/login").post(function (req, res) {
  User.findOne({ username: req.body.username }, function (err, user) {
    if (err) res.send(err);
    else if (user != null) {
      const hash = user.password;

      bcrypt.compare(req.body.password, hash, function (err, result) {
        if (err) res.send(err);
        else {
          if (result) {
            const accessToken = jwt.sign(
              { username: user.username, _id: user._id },
              process.env.ACCESS_TOKEN_SECRET
            );
            res.json({ token: "ACCESS-TOKEN : " + accessToken });
          } else res.send("Wrong password");
        }
      });
    } else res.send("Please Sign Up");
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.send(err);
    req.user = user;
    next();
  });
}

app.delete("/deleteUser", authenticateToken, function (req, res) {
  User.findByIdAndDelete(req.user._id, function (err) {
    if (err) res.send(err);
    else res.send("User deleted successfully");
  });
});

app.get("/articles", function (req, res) {
  Blog.find(function (err, foundBlogs) {
    if (err) res.send(err);
    else if (!foundBlogs) res.send("No Articles found");
    else res.send(foundBlogs);
  });
});

app.get("/articles/:title", function (req, res) {
  Blog.find({ title: req.params.title }, function (err, foundBlogs) {
    if (err) res.send(err);
    else if (!foundBlogs) res.send("No Articles found");
    else res.send(foundBlogs);
  });
});

app.get("/userArticles", authenticateToken, (req, res) => {
  Blog.find({ author_id: req.user._id }, function (err, foundBlogs) {
    if (err) res.send(err);
    else if (!foundBlogs) res.send("No Articles found");
    else res.send(foundBlogs);
  });
});

app.post("/userArticles", authenticateToken, function (req, res) {
  const data = new Blog({
    title: req.body.title,
    content: req.body.content,
    author_id: req.user._id,
  });

  data.save(function (err) {
    if (err) res.send(err);
    else res.send("Article Saved Successfully");
  });
});

app.get("/userArticles/:title", authenticateToken, function (req, res) {
  Blog.find(
    { title: req.params.title, author_id: req.user._id },
    function (err, foundBlogs) {
      if (err) res.send(err);
      else if (!foundBlogs) res.send("No Articles found");
      else res.send(foundBlogs);
    }
  );
});

app.put("/userArticles/:title", authenticateToken, function (req, res) {
  Blog.findOneAndUpdate(
    { title: req.params.title, author_id: req.user._id },
    { title: req.body.title, content: req.body.content },
    function (err) {
      if (err) res.send(err);
      else res.send("Article updated successfully");
    }
  );
});

app.delete("/userArticles/:title", authenticateToken, function (req, res) {
  Blog.deleteOne(
    { title: req.params.title, author_id: req.user._id },
    function (err) {
      if (err) res.send(err);
      else res.send("Article deleted successfully");
    }
  );
});

module.exports = app.listen(3000, function () {
  console.log("Server started on port 3000");
});
