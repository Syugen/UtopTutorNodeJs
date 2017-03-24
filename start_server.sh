mongoimport --db usersdb --collection users --type json --file seeds/users_seed.json --jsonArray
mongoimport --db usersdb --collection courses --type json --file seeds/courses_seed.json --jsonArray
mongoimport --db usersdb --collection posts --type json --file seeds/posts_seed.json --jsonArray
nodemon server.js
