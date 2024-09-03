require ('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require("cors")
const app = express();
app.use(cors());
app.use(cors({origin:"http://localhost:8081"}));
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
