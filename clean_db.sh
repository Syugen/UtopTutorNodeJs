rm -rf data
mkdir data
mongoimport --db usersdb --collection users --type json --file seeds/users_seed.json --jsonArray
mongoimport --db usersdb --collection courses --type json --file seeds/courses_seed.json --jsonArray
mongoimport --db usersdb --collection orders --type json --file seeds/orders_seed.json --jsonArray
