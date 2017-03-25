'use strict';

var User = require("../models/user");
var Course = require("../models/course");
var Post = require("../models/post");
var Timetable = require("../models/timetable");

exports.getDashboard = function(req, res) {
    if (req.session.user === undefined) return res.redirect("/login");

    if (req.session.user.type === "admin") {
        let start = new Date(), end = new Date(), dateString = [];
        end.setDate(start.getDate() + 8);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        for (let i = 0; i < 7; i++) {
            let weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            let d = new Date();
            d.setDate(start.getDate() + i);
            let year = d.getFullYear(), month = d.getMonth() + 1, date = d.getDate();
            if (date < 10) date = "0" + date;
            if (month < 10) month = "0" + month;
            dateString.push("" + year + month + date + "\n" + weekday[d.getDay()])
        }

        Timetable.find({}, function(err, slots) {
            if (err) throw err;
            let cells = [], orders = [];
            for (let i = 9; i < 22; i++) {
                let row = [];
                for (let j = 0; j < 7; j++) {
                    row.push("");
                }
                cells.push(row);
            }
            for (let i = 0; i < slots.length; i++) {
                let diff = slots[i].date.getTime() - start.getTime();
                let diffDays = Math.floor(diff / (1000 * 3600 * 24));
                if (0 <= diffDays < 7) cells[slots[i].date.getHours() - 9][diffDays] = slots[i];
                if (diffDays >= 0) {
                    let d = slots[i].order_date;
                    let t = [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
                    for (let j = 1; j < t.length; j++) if (t[j] < 10) t[j] = "0" + t[j];
                    orders.push({"order_date": "" + t[0] + t[1] + t[2] + t[3] + t[4] + t[5], "username": slots[i].username});
                }  
            }
                
            User.find({}, function(err, users) {
                if (err) throw err;
                let setting = {users: users, dates: dateString, cells: cells, orders: orders, styles: ["dashboard"], scripts: ["admin"]};
                return res.render("admin.html", setting);
            });
        });
    } else {
        User.findOne({ username : req.session.user.username }, function(err, user) {
            if (err) throw err;
            Course.find({ code : { $in: user.courses }}, function(err, courses) {
                let enrolled = [];
                for (let i = 0; i < courses.length; i++)
                    enrolled.push({ code : courses[i].code,
                                    num_posts : courses[i].posts.length,
                                    num_tutors : courses[i].tutors.length,
                                    num_students : courses[i].students.length});

                User.find({ username: { $in: user.friends }}, function(err, users) {
                    let friends = [];
                    for (let i = 0; i < users.length; i++)
                        friends.push({ username : users[i].username,
                                       online : users[i].online});

                    let settings = {friends: friends, courses: enrolled, scripts: ["dashboard"], styles: ["dashboard"]};
                    res.render("dashboard.html", settings);
                });
            });
        });
    }
}

exports.postStudentRequest = function(req, res) {
    if (req.session.user === undefined) return res.redirect("/login");

    if(!req.body.subject || !req.body.title || !req.body.detail || !req.body.when)
        return res.send({status: 1});

    let new_post_json = JSON.parse(JSON.stringify(req.body));
    new_post_json["is_student"] = true;
    new_post_json["username"] = req.session.user.username;
    new_post_json["date"] = new Date();
    let new_post = new Post(new_post_json);
    new_post.save(function(err, result) {
        if (err) throw err;
        res.send({status: 0});
    });
};

exports.postTutorRequest = function(req, res) {
    if (req.session.user === undefined) return res.redirect("/login");
    if(!req.body.subject || !req.body.title || !req.body.detail)
        return res.send({status: 1});

    let new_post = new Post({
        is_student: false,
        username: req.session.user.username,
        subject: req.body.subject,
        title: req.body.title,
        range: req.body.range,
        detail: req.body.detail,
        when: 'none',
        date: new Date()
    });

    new_post.save(function(err, result) {
        if (err) throw err;
        res.send({status: 0});
    });
}
