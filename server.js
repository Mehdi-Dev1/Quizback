require ('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json())


//connexion base de donnée
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database : process.env.DB_NAME

})

db.connect((err) => {
    if (err){
        console.log('ERREUR !!!');
    }
    else{
        console.log('bravo !!');
    }
    
})

const userRoutes= require('./routes/users.js');
app.use('/api/users' , userRoutes);

const port = process.env.PORT;
app.listen(port, () =>{
    console.log('SERVER  DEMMARE')
})
