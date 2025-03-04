const express = require("express");
const app = express();
const port = 3003;
const middleware = require("./middleware");
const path = require("path");
const bodyParser = require("body-parser");
const db = require("./database");
const session = require("express-session");
const server = app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "do it",
    resave: true,
    saveUninitialized: false,
  })
);
// Routes
const loginRoute = require("./routes/loginRoutes");
const registerRoute = require("./routes/registerRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoute = require("./routes/profileRoutes");
const logoutRoute = require("./routes/logout");
const uploadRoute = require("./routes/uploadRoutes");
const searchRoute = require("./routes/searchRoutes");
const messagesRoute = require("./routes/messagesRoutes");

//APi routes
const postsApiRoute = require("./routes/api/posts");
const usersApiRoute = require("./routes/api/users");
const chatsApiRoute = require("./routes/api/chats");
const messagesApiRoute = require("./routes/api/messages");

app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/posts", middleware.requireLogin, postRoutes);
app.use("/profile", middleware.requireLogin, profileRoute);
app.use("/uploads", uploadRoute);
app.use("/search", middleware.requireLogin, searchRoute);
app.use("/messages", middleware.requireLogin, messagesRoute);
app.use("/logout", logoutRoute);

app.use("/api/posts", postsApiRoute);
app.use("/api/users", usersApiRoute);
app.use("/api/chats", chatsApiRoute);
app.use("/api/messages", messagesApiRoute);

app.get("/", middleware.requireLogin, (req, res, next) => {
  let payload = {
    pageTitle: "Home",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render("home", payload);
});
