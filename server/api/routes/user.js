const express = require('express');
const pool = require('../helpers/database');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const check_auth = require('../helpers/check-auth');
const check_perms = require('../helpers/check-permissions');
const check_admin = require('../helpers/check-admin');

/*
* Register a new user
*/

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
            error: err
        })
    }

    if(email_result.length >= 1) {
        return res.status(409).json({
            message: 'Mail alreay in db!',
            code: 'EMAIL_ALREADY_IN_DB'
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
                message: `successfully added user with ID: ${add_new_user_result.insertId} !`,
                code: 'NEW_USER_SUCCESS'
            });
        } catch (err) {
            return res.status(500).json({
                error: err
            })
        }
    })
});

/*
* Login, return JWT
*/

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    let find_user_query;
    let find_user_result;
    // Firstly check if user is stored in database
    try {
        find_user_query = 'SELECT Password, User_id FROM user WHERE Email = (?)';
        find_user_result = await pool.query(find_user_query, email);
        if (find_user_result < 1) {
            return res.status(401).json({
                message: 'Email does not exist in DB!',
                code: 'EMAIL_AUTH_ERR'
            })
        }
    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }
    // Check if password matches -> return JWT
    bcrypt.compare(password, find_user_result[0].Password, (err, result) => {
        if(err) {
            return res.status(401).json({
                message: 'Entered password does not match!',
                code: 'PASSWORD_AUTH_ERR'
            })
        }
        if(result) {
            const token = jwt.sign({
                email: email,
                user_id: find_user_result[0].User_id
            }, process.env.JWT_KEY,
            {
                expiresIn: "6h"
            });
            return res.status(200).json({
                message: 'Auth successful',
                code: 'AUTH_SUCCESS',
                user_id: find_user_result[0].User_id,
                token: token
            });
        }
        return res.status(401).json({
            message: 'Error checking password',
            code: 'PASSWORD_AUTH_ERR'
        })
    })
})

/*
* Get user data, only if it matches requested ID, or if user is admin
*/

router.get('/:id', check_auth, check_perms, async(req, res) => {
    let find_user_query;
    let find_user_result;
   
    try {
        find_user_query = 'SELECT Email, Name, Role, Key_id, User_id from user where User_id = (?)';
        find_user_result = await pool.query(find_user_query, req.params.id);
        return res.status(200).json({
            code: "USER_SUCCESS",
            data: {
                email: find_user_result[0].Email,
                name: find_user_result[0].Name,
                role: find_user_result[0].Role,
                key_id: find_user_result[0].Key_id ? find_user_result[0].Key_id : null,
                user_id: find_user_result[0].User_id
            } 
            
        })
    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }
})

/*
* Delete user, only if user is admin
*/

router.delete('/:id', check_auth, check_admin, async(req, res) => {
    let delete_user_query;
    let delete_user_result;

    try {
        delete_user_query = 'DELETE FROM user WHERE User_id = (?)';
        delete_user_result = await pool.query(delete_user_query, req.params.id);
        return res.status(200).json({
            code: 'DELETE_SUCCCESS',
            message: delete_user_result
        })
    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }
})

/*
* Update user data, only if it matches requested ID, or if user is admin
*/

router.patch('/update/:id', check_auth, check_perms, async (req, res) => {
    const {email, name, key_id} = req.body;
    let update_user_query;
    let update_user_result;

    try {
        update_user_query = 'UPDATE user SET Name = (?), Email = (?), Key_id = (?) WHERE User_id = (?)';
        update_user_result = await pool.query(update_user_query, [name, email, key_id, req.params.id]);
        return res.status(200).json({
            code: 'UPDATE_SUCCCESS',
            message: update_user_result
        })
    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }
})

/*
* Change password only if it matches requested ID, or if user is admin
*/

router.patch('/update_password/:id', check_auth, check_perms, async (req, res) => {
    const {password} = req.body;
    let update_user_password_query;
    let update_user_password_result;

    // Hash new password and update record in database
    bcrypt.hash(password, 10, async (err, hash) => {
        if(err) {
            return res.status(500).json({
                error: "Error while hashing password!"
            })
        }

        try {
            update_user_password_query = 'UPDATE user SET Password = (?) WHERE User_id = (?)';
            update_user_password_result= await pool.query(update_user_password_query, [hash, req.params.id]);
            return res.status(200).json({
                code: 'UPDATE_SUCCCESS',
                message: update_user_password_result
            })
        } catch (err) {
            return res.status(500).json({
                error: err
            })
        }
    });
})

/*
* Get all users list, only if admin
*/

router.get('/users/all', check_auth, check_admin, async (req, res) => {
    let get_all_users_data_query;
    let get_all_users_data_result;

    console.log("wt")
    try {
        get_all_users_data_query = 'SELECT Name as name, User_id as user_id, Role as role, Key_id as key_id, Email as email FROM user';
        get_all_users_data_result = await pool.query(get_all_users_data_query);
        console.log(get_all_users_data_result)
        return res.status(200).json({
            code: 'GET_ALL_USERS_SUCCESS',
            message: get_all_users_data_result
        })
    } catch (err) {
        return res.status(500).json({
            error: "err"
        })
    }
})

module.exports = router;