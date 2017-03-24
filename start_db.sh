npm install
npm install express express-validator ejs body-parser
rm -rf data
mkdir data

#Remove the pound symbol (hashtag) below for the database to work on windows, and add a comment
#to the mac database line below.
#"C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe" --dbpath=$PWD/data

#This line allows Mac (linux) users to run the database.
mongod --dbpath=$PWD/data


