'use strict';

var admin = {};

admin.init = function() {
    let d = new Date()
    document.getElementById("start-date").valueAsDate = d;
    d.setDate(d.getDate() + 6);
    document.getElementById("end-date").valueAsDate = d;
}

$(document).ready(function() {
    admin.init();
});
