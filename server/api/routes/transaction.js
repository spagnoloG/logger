const express = require('express');
const pool = require('../helpers/database');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const check_auth = require('../helpers/check-auth');
const check_perms = require('../helpers/check-permissions');
const check_admin = require('../helpers/check-admin');
const calculate_time_offset = require('../helpers/calculate-time-offset');


/*
* Post a new transaction
*/

router.post('/new', async (req, res) => {
    const {key_id} = req.body;
    // first check if key is asociated with any user
    let check_key_query;
    let check_key_result;
    let new_transaction_query;
    let new_transaction_result;
    try {
        check_key_query = 'SELECT User_id as user_id, Name as name, Email as email FROM user WHERE Key_id = (?)';
        check_key_result = await pool.query(check_key_query, key_id);
    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }

    // No user found with that key, add transaction to unknown transactions table
    if(check_key_result.length < 1) {
        try {
            new_transaction_query = 'INSERT INTO unknown_transcation(Key_id) VALUES(?)'
            new_transaction_result = await pool.query(new_transaction_query, key_id);

            return res.status(200).json({
                code: 'WARN_NO_USER_ASSOCIATED',
                message: new_transaction_result
            })
            
        } catch (err) {
            return res.status(500).json({
                error: err
            })
        }
    }

    // User is asociated with scanned key, try to insert into DB
    // First check if user has scanned in last minute, if this happened, cancel transaction
    let check_last_time_scanned_query;
    let check_last_time_scanned_result;

    const {user_id, name, email} = check_key_result[0];

    try {
        check_last_time_scanned_query = 'SELECT Timestamp as timestamp FROM transaction WHERE User_id = (?) ORDER BY Timestamp DESC LIMIT 1';
        check_last_time_scanned_result = await pool.query(check_last_time_scanned_query, user_id);
        const timestamp = check_last_time_scanned_result[0].timestamp;
        // Check if scan is more than  20 seconds old
        // Undefined if first transaction

        if(calculate_time_offset(timestamp) >= 20000 || timestamp == undefined) {
            try {
                new_transaction_query = 'INSERT INTO transaction(User_id) VALUES(?)';
                new_transaction_result = await pool.query(new_transaction_query, user_id);

                return res.status(200).json({
                    code: 'NEW_TRANSACTION_SUCCESS',
                    message: new_transaction_result,
                    user_info: {
                        name: name,
                        email: email,
                        user_id: user_id
                    }
                })

            } catch (err) {
                return res.status(500).json({
                    error: err
                })
            }
        } else {
            return res.status(200).json({
                code: 'ERR_TRANSACTION_DECLINED',
                message: 'User scanned card less than 20s ago!'
            })
        }
        

    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }

});

router.get('/unknown_transactions/:id', async(req, res) => {

    let return_transaction_query;
    let return_transaction_result;

    try {

        return_transaction_query = 'SELECT * FROM unknown_transcation WHERE Transaction_id = (?)';
        return_transaction_result = await pool.query(return_transaction_query, req.params.id);
        console.log(checkDate(return_transaction_result[0].Timestamp));

        return res.status(200).json({
            code: 'TRANSACTION_SUCCESS',
            message: return_transaction_result
        })

    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }
})


module.exports = router;