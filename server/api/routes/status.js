const express = require('express');
const pool = require('../helpers/database');
const router = express.Router();
const check_auth = require('../helpers/check-auth');
const check_admin = require('../helpers/check-admin');

/*
* Return list of users that are currently working
*/

// https://stackoverflow.com/a/17198760
router.get('/currently-working', check_auth, check_admin, async (req, res) => {
    let get_currently_working_users_query;
    let get_currently_working_users_result;

    try {
        get_currently_working_users_query = 'SELECT COUNT(Transaction_id) as num_of_transactions, User_id user_id FROM transaction  WHERE Timestamp >= CURDATE() GROUP BY User_id HAVING COUNT(Transaction_id) % 2 = 1 ORDER BY Timestamp DESC';
        get_currently_working_users_result = await pool.query(get_currently_working_users_query);

        return res.status(200).json({
            code: 'GET_CURRENTLY_WORKING_SUCCESS',
            message: get_currently_working_users_result
        })
    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }
})

module.exports = router;