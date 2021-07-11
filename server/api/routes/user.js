const express = require('express');
const pool = require('../helpers/database');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/:id', async (req, res) => {
    try {
        const sql_query = 'SELECT id, email, created_at FROM user WHERE id=?';
        const rows = await pool.query(sql_query, req.params.id);
        res.status(200).json(rows);
    } catch(error) {
        res.status(400).send(error.message)
    }
});

router.post('/register', async (req, res) => {
    const {email, password, name, role, key_id} = req.body;
    // first check if user is already in database
    let check_email_query;
    let add_new_user_query;
    let email_result;
    let add_new_user_result;
    try {
        check_email_query = 'SELECT * FROM user WHERE Email = (?)';
        email_result = await pool.query(check_email_query, email);
    } catch (err) {
        return res.status(500).json({
            error: "Error executing SQL query"
        })
    }

    if(email_result.length >= 1) {
        return res.status(409).json({
            message: 'Mail alreay in db!'
        })
    }
    // if everything is OK, hash password and store new user into DB
    bcrypt.hash(password, 10, async (err, hash) => {
        if(err) {
            return res.status(500).json({
                error: "Error while hashing password!"
            })
        }
        try {
            add_new_user_query = 'INSERT INTO user (Email, Password, Name, Role, Key_id) VALUES (?, ?, ?, ?, ?)';
            add_new_user_result = await pool.query(add_new_user_query, [email, hash, name, role, key_id]);
            return res.status(200).json({
                message: `successfully added user with ID: ${add_new_user_result.insertId} !`
            });
        } catch (err) {
            return res.status(500).json({
                error: err
            })
        }
    })
    //const sql_query = 'INSERT INTO user (email, password) VALUES (?,?)';
    //const result = await pool.query(sql_query, [email, password]);
});

module.exports = router;