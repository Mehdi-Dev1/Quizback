const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require ('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database : process.env.DB_NAME

})


router.post('/register', async (req, res) =>{
    const {username, password, name, firstname} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, password, name ,firstname) VALUE (?,?,?,?)';
    db.query (sql, [username,hashedPassword,name,firstname], (err, results) => { 
        if (err){
            return res.status(500).send(err);
        }
      res.status(201).send({message:'Utilisateur créé'});
    })
})

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err){
            return res.status(500).send(err);
        }
      res.status(200).json(results);
    });
})

router.post('/auth', async function(request, response) {
    const { username, password } = request.body;

    if (!username || !password) {
        return response.status(400).json({ message: 'Besoin user+mdp' });
    }

    try {
        
        const sql = 'SELECT * FROM users WHERE username = ?';
        db.query(sql, [username], async (err, results) => {
            if (err) {
                return response.status(500);
            }

    
            const passwordMatch = await bcrypt.compare(password, user.password);

            // Si le mot de passe ne correspond pas
            if (!passwordMatch) {
                return response.status(401).json({ message: 'mauvais mdp' });
            }

            // Si l'authentification réussit
            return response.status(200).json({ message: 'Connexion établie', user: { username: user.username, name: user.name, firstname: user.firstname } });
        });

    } catch (error) {
        return response.status(500);
    }
});




module.exports = router ;