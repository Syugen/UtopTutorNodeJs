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
app.post("/postStudentRequest", dashboard.postStudentRequest);// Done
app.post("/postTutorRequest", dashboard.postTutorRequest);// Done


//Raymond Begins
app.get('/search', search.getSearch);// Done
app.post('/makeFriends', search.makeFriends); //Done
app.post('/addCourse', search.addCourse);// Done
// Other functions needed in search.js
//Raymond Ends..

app.get("/course", course.getCourse);
app.post("/course/response", function(req, res)
{
    let postUser, postText, postResponse;
    let url = req.url;
    url = url.substring(url.indexOf("id=") + "id=".length).trim();

    for(let i in req.body)
    {
        postUser = i.substring(0, i.indexOf("|")).trim();
        let newStr = i.substring(i.indexOf("|") + 1);
        postText = newStr.substring(0, newStr.indexOf("|")).trim();
        postResponse = req.body[i];
        break;
    }

    let newResponse =[{"text": postResponse}]
    getRows(req.url.substring(req.url.indexOf("id=") + "id=".length).trim(),
            postUser, postText, newResponse, function(err, val)
          {
              if(err)
              {
                  console.log("Error with retreiving posts for courses.");
              }
              else
              {
                  Course.update({_id:val[0]}, {$set:{posts:val[1]}}, function(err, result)
                  {
                        if(err)
                        {
                            console.log("Error: Updating Course Table, at row with _id: " + val[0] + "\n with new responses: " + val[1] + "\n");
                        }
                        else
                        {
                            io.emit('responseMessage', {user: postUser, text: postText, response: postResponse, responsesLength: val[2]});
                            res.end();
                        }
                  });

                }
          });

    function getRows(groupCode, postUser, postText, newResponse, callback)
    {
      Course.find(function(error, cursor)
      {
        if(error)
        {
            callback("error", null);
        }
        else
        {
            let currID;
            let currResponses, currPosts;
            for(let i = 0; i < cursor.length; i++)
            {
                if(cursor[i].code.toLowerCase() == groupCode.toLowerCase())
                {
                    currID = cursor[i]._id;
                    currPosts = cursor[i].posts;
                    break;
                }
            }

            let p = [];
            let responsesLength;
            for(let i = 0; i < currPosts.length; i++)
            {
                p.push(currPosts[i]);
            }

            for(let i = 0; i < p.length; i++)
            {
                if(p[i].author == postUser &&
                   p[i].text == postText)
                {
                    let r = [];
                    for(let x = 0; x < p[i].responses.length; x++)
                    {
                        r.push(p[i].responses[x]);
                    }
                    responsesLength = p[i].responses.length;
                    r.push(newResponse[0]);
                    p[i].responses = r;
                }
            }
            callback(null, [currID, p, responsesLength]);
        }
      });
    }
});

app.post("/course", function(req, res)
{
    let question = req.body.textQuestion;
    let username = req.session.user.username;
    let userType = req.session.user.type;
    let currDate = getDate();
    let currTime = getTime();
    let groupCode = req.url.substring(req.url.indexOf("id=") + "id=".length).trim();
    let newPost = [{"text": question, "author": username, "date": currDate + currTime,
                   "responses": []}];
    let currID;
    let currPosts;

    getRows(groupCode, newPost, function(err, val)
    {
          if(err)
          {
              console.log("Error with retreiving posts for courses.");
          }
          else
          {
              Course.update({_id:val[0]}, {$set:{posts:val[1]}}, function(err, result)
              {
                    if(err)
                    {
                        console.log("Error: Updating Course Table, at row with _id: " + val[0] + "\n with new posts: " + val[1] + "\n");
                    }
                    else if(val.length > 0)
                    {
                        console.log("Success: Updating Course Table, at row with _id: " + val[0] + "\n");

                        io.emit('message', {username: username, msg: question, cName: groupCode});
                        res.end();

                    }
                    else
                    {
                        io.emit('Duplicate Post', {});
                        res.end();
                    }
              });
            }
      });

      function getRows(groupCode, newPost, callback)
      {
        Course.find(function(error, cursor)
        {
          if(error)
          {
              callback("error", null, []);
          }
          else
          {
              let currID;
              let currPosts;
              let notDuplicate = true;
              for(let i = 0; i < cursor.length; i++)
              {
                  if(cursor[i].code.toLowerCase() == groupCode.toLowerCase())
                  {
                      currID = cursor[i]._id;
                      currPosts = cursor[i].posts;
                      break;
                  }
              }

              for(let i = 0; i < currPosts.length; i++)
              {
                  if(newPost[0].author == currPosts[i].author &&
                     newPost[0].text == currPosts[i].text)
                     {
                          notDuplicate = false;
                          break;
                     }
              }

              if(notDuplicate)
              {
                  let p = [];
                  for(let i = 0; i < currPosts.length; i++)
                  {
                      p.push(currPosts[i]);
                  }
                  p.push(newPost[0]);
                  callback(null, [currID, p]);
              }
              else
              {
                  callback(null, []);
              }
          }
        });
      }

      function getDate()
      {
          let today = new Date();
          let dd = today.getDate();
          let mm = today.getMonth() + 1; //January is 0!
          let yyyy = today.getFullYear();

          if(dd < 10)
          {
              dd = '0' + dd
          }

          if(mm < 10)
          {
              mm = '0' + mm
          }

          today = yyyy + '-' + mm + '-' + dd + "T";
          return today;
      }

      function getTime()
      {
          let d = new Date();
          let hh = d.getHours();
          let mm = d.getMinutes();
          let ss = d.getSeconds();

          if(hh < 10)
          {
              hh = '0' + hh;
          }

          if(mm < 10)
          {
              mm = '0' + mm;
          }

          if(ss < 10)
          {
              ss = '0' + ss;
          }
          return(hh + ":" + mm + ":" + ss + "Z");
      }
});
// Other functions needed in course.js

app.get("/profile", profile.getProfile);// Done
app.post("/profile", upload.single("picture"), profile.postProfile);// Done
app.post("/removeCourse", profile.removeCourse);// Done
app.post("/removeFriend", profile.removeFriend);// Done
app.post("/removeTutorPost", profile.removeTutorPost);// Done

server.listen(3000, function(request, response) {
    console.log("Running on 127.0.0.1:%s", server.address().port);
});
