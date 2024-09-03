const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require ('dotenv').config();
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database : process.env.DB_NAME

})


router.post('/register', async (req, res) => {
    const { username, password, name, firstname } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, password, name ,firstname) VALUE (?,?,?,?)';
    db.query(sql, [username, hashedPassword, name, firstname], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        const token = jwt.sign(
            { username: username }, // Payload
            secretKey, // Clé secrète
            { expiresIn: '1h' } // Options
        );

        res.status(201).json({ message: 'Utilisateur créé', token: token });
    });
});

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err){
            return res.status(500).send(err);
        }
      res.status(200).json(results);
    });
})

router.post('/auth', async (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], async (err, results) => {
        if (err) {
            // Gestion des erreurs de la requête SQL
            return res.status(500).json({ message: 'Database error' });
        }

        const user = results[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            // Authentification échouée
            return res.status(401).json({ message: 'Mauvais identifiant !' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username }, // Payload
            secretKey, // Clé secrète
            { expiresIn: '1h' } // Options
        );

        // Authentification réussie
        res.json({ message: `Bienvenue, ${user.username}!`, 
            token: token, 
            name: user.name,
            firstname: user.firstname,
            role: user.role});
    });
});






module.exports = router ;