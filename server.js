'use strict';

var express = require("express");
var app = require("express")();
var bodyParser = require("body-parser");
var nunjucks = require('nunjucks');
var session = require('express-session');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var multer = require('multer');
var upload = multer({ dest: 'assets/avatars/' });

var course = require("./routes/course");
var dashboard = require("./routes/dashboard");
var profile = require("./routes/profile");
var signin = require("./routes/signin");
var search = require("./routes/search");
var User = require("./models/user");
var Course = require("./models/course");

nunjucks.configure('public', { autoescape: true, express: app });

app.use(express.static(__dirname + '/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'What is this', resave: false, saveUninitialized: false,
                  cookie: { maxAge: 900000 }}));
app.engine('.html', require('ejs').__express);
app.set('views', __dirname);
app.set('view engine', 'html');

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

app.get("/", function(req, res) { // Done
    res.render("index.html", { navbarFixedTop : true});
});

app.get("/signup", function(req, res) { // Done
    res.render("signup.html", { scripts: ["signin"], styles: ["signin"] });
});

app.get("/login", function(req, res) { // Done
    res.render("login.html", { scripts: ["login"], styles: ["signin"] });
});

app.get('/logout', signin.getLogout);// Done
app.post("/signup", signin.postNewUser);// Done
app.post("/login", signin.postLogin); // Done

app.get("/dashboard", dashboard.getDashboard);// Done
app.post("/postAdminUpdate", dashboard.postAdminUpdate);
app.post("/postOrder", dashboard.postOrder);// Done

app.get('/search', search.getSearch);// Done
app.post('/makeFriends', search.makeFriends); //Done
app.post('/addCourse', search.addCourse);// Done

app.get("/course", course.getCourse);
app.post("/course/response", function(req, res) {});
app.post("/course", function(req, res) {});

app.get("/profile", profile.getProfile);// Done
app.post("/profile", upload.single("picture"), profile.postProfile);// Done
app.post("/removeCourse", profile.removeCourse);// Done
app.post("/removeFriend", profile.removeFriend);// Done
app.post("/removeTutorPost", profile.removeTutorPost);// Done

server.listen(3000, function(request, response) {
    console.log("Running on 127.0.0.1:%s", server.address().port);
});
