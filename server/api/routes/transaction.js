const express = require('express');
const router = express.Router();

const pool = require('../controllers/database/database');
const check_auth = require('../controllers/auth/check-auth');
const check_perms = require('../controllers/permissions/check-permissions');
const calculate_time_offset = require('../controllers/calculations/calculate-time-offset');

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
            code: 'ERR_DB',
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
                code: 'ERR_DB',
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

        // Check if scan is more than  20 seconds old
        // Undefined if first transaction
        const timestamp = check_last_time_scanned_result[0] ? check_last_time_scanned_result[0].timestamp : undefined;
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
                    code: 'ERR_DB',
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
            code: 'ERR_DB',
            error: err
        })
    }

});

/**
 * Update transaction timestamp
 */

router.patch('/update/:id', check_auth, check_perms, async(req, res) => {
    const {timestamp} = req.body;

    let update_transaction_query;
    let update_transaction_result;

    try {
        update_transaction_query = 'UPDATE transaction SET Timestamp = (?) WHERE Transaction_id = (?)';
        update_transaction_result = await pool.query(update_transaction_query, timestamp, req.params.id);

        return res.status(200).json({
            code: 'UPDATE_SUCCESS',
            message: update_transaction_result
        })

    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})


/* 
* Delete transaction
*/

router.delete('/delete/:id', check_auth, check_perms, async(req, res) => {
    let delete_transaction_query;
    let delete_transaction_result;

    try {
        delete_transaction_query = 'DELETE FROM transaction WHERE Transaction_id = (?)';
        delete_transaction_result = await pool.query(delete_transaction_query, req.params.id);
        return res.status(200).json({
            code: 'DELETE_SUCCCESS',
            message: delete_transaction_result
        })
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})


/*
* Get all transactions for specific user
*/

router.get('/all/:id', check_auth, check_perms, async(req, res) => {
    let return_transactions_query;
    let return_transactions_result;

    try {

        return_transactions_query = 'SELECT * FROM transaction WHERE User_id = (?)';
        return_transactions_result = await pool.query(return_transactions_query, req.params.id);

        return res.status(200).json({
            code: 'TRANSACTION_SUCCESS',
            message: return_transactions_result
        })

    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
});

/*
* Get transactions by month
*/

router.get('/monthly/:year/:month/:id', check_auth, check_perms, async(req, res) => {
        // the month is 0-indexed
        const {year, month, id} = req.params;

        let start_date = new Date(year, month - 1, 1);
        start_date = start_date.toISOString().split('T')[0] + ' ' + start_date.toTimeString().split(' ')[0];
    
        let finish_date = new Date(year, month, 1);
        finish_date = finish_date.toISOString().split('T')[0] + ' ' + finish_date.toTimeString().split(' ')[0];

        let return_monthly_transactions_query;
        let return_monthly_transactions_result;

        try {
            return_monthly_transactions_query = 'SELECT Timestamp as timestamp FROM transaction  WHERE Timestamp >= (?) && Timestamp <= (?) && User_id = (?) ORDER BY Timestamp';
            return_monthly_transactions_result = await pool.query(return_monthly_transactions_query, [start_date, finish_date, id]);

            if(return_monthly_transactions_result.length == 0) {
                // no transactions this month
                return res.status(200).json({
                    code: 'ERR_NO_RECORDS',
                    message: {
                        start_date: start_date,
                        finish_date: finish_date
                    }
                })
            }

            return res.status(200).json({
                code: 'MONTHLY_TRANSACTION_SUCCESS',
                message: {
                    timestamps: return_monthly_transactions_result,
                    start_date: start_date,
                    finish_date: finish_date
                }
            })

        } catch (err) {
            return res.status(500).json({
                code: 'ERR_DB',
                error: err
            })
        }
});


/**
 * Get 20 last unknown transactions
 */

router.get('/unknown-transactions', check_auth, check_perms, async(req, res) => {
    let return_transactions_query;
    let return_transactions_result;

    try {
        return_transactions_query = 'SELECT * FROM unknown_transcation ORDER BY TIMESTAMP DESC LIMIT 20';
        return_transactions_result = await pool.query(return_transactions_query, null);

        return res.status(200).json({
            code: 'UNKNOWN_TRANSACTION_SUCCESS',
            message: return_transactions_result
        })

    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})


module.exports = router;