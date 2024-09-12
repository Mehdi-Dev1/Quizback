const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
});

router.post('/register', async (req, res) => {
    const { username, password, name, firstname } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password, name, firstname) VALUES (?, ?, ?, ?)';
        db.query(sql, [username, hashedPassword, name, firstname], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            const token = jwt.sign(
                { username: username },
                secretKey,
                { expiresIn: '1h' }
            );

            res.status(201).json({ message: 'Utilisateur créé', token: token });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/questions', (req, res) => {
    const { quiz_id, question_text } = req.body;

    if (!quiz_id || !question_text) {
        return res.status(400).json({ error: 'quiz_id et question_text sont requis.' });
    }

    const query = 'INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)';
    db.query(query, [quiz_id, question_text], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la question:', err);
            return res.status(500).json({ error: 'Erreur lors de l\'ajout de la question' });
        }
        res.status(201).json({ message: 'Question ajoutée avec succès', questionId: results.insertId });
    });
});

router.post('/reponses', (req, res) => {
    const { question_id, reponse_text, correct } = req.body;

    if (question_id === undefined || reponse_text === undefined || correct === undefined) {
        return res.status(400).json({ error: 'question_id, reponse_text et correct sont requis.' });
    }

    const query = 'INSERT INTO reponses (question_id, reponse_text, correct) VALUES (?, ?, ?)';
    db.query(query, [question_id, reponse_text, correct], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la réponse:', err);
            return res.status(500).json({ error: 'Erreur lors de l\'ajout de la réponse' });
        }
        res.status(201).json({ message: 'Réponse ajoutée avec succès', reponseId: results.insertId });
    });
});

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

router.post('/quiz', (req, res) => {
    const { quizName, descQuiz, questions } = req.body;

    if (!quizName || !descQuiz || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Nom du quiz, description et questions sont requis.' });
    }

    const query = 'INSERT INTO quiz (nom, description) VALUES (?, ?)';
    db.query(query, [quizName, descQuiz], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du quiz:', err);
            return res.status(500).json({ error: 'Erreur lors de l\'ajout du quiz' });
        }

        const quizId = results.insertId;

        let questionInsertions = questions.map(question => {
            return new Promise((resolve, reject) => {
                db.query('INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)', [quizId, question.questionText], (err, results) => {
                    if (err) {
                        return reject(err);
                    }
                    const questionId = results.insertId;

                    let answerInsertions = question.reponses.map((reponse, index) => {
                        return new Promise((resolve, reject) => {
                            db.query('INSERT INTO reponses (question_id, reponse_text, correct) VALUES (?, ?, ?)', [questionId, reponse, index === 0], (err) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve();
                            });
                        });
                    });

                    Promise.all(answerInsertions)
                        .then(() => resolve())
                        .catch(reject);
                });
            });
        });

        Promise.all(questionInsertions)
            .then(() => res.status(201).json({ message: 'Quiz ajouté avec succès' }))
            .catch(err => {
                console.error('Erreur lors de l\'ajout du quiz:', err);
                res.status(500).json({ error: 'Erreur lors de l\'ajout du quiz' });
            });
    });
});

router.post('/auth', async (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        const user = results[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Mauvais identifiant !' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            secretKey,
            { expiresIn: '1h' }
        );

        res.json({
            message: `Bienvenue, ${user.username}!`,
            token: token,
            name: user.name,
            firstname: user.firstname,
            role: user.role
        });
    });
});

module.exports = router;
