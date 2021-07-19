const express = require('express');
const router = express.Router();

const pool = require('../controllers/database/database');
const check_auth = require('../controllers/auth/check-auth');
const check_admin = require('../controllers/permissions/check-admin');

/*
* Return list of users that are currently working / have worked
*/

router.get('/working-today', check_auth, check_admin, async (req, res) => {
    let get_currently_working_users_query;
    let get_currently_working_users_result;
    let get_worked_today_users_query;
    let get_worked_today_users_result;

    try {
        get_currently_working_users_query = 'SELECT COUNT(Transaction_id) as num_of_transactions, User_id user_id FROM transaction  WHERE Timestamp >= CURDATE() GROUP BY User_id HAVING COUNT(Transaction_id) % 2 = 1 ORDER BY Timestamp DESC';
        get_currently_working_users_result = await pool.query(get_currently_working_users_query);
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }

    try {
        get_worked_today_users_query = 'SELECT COUNT(Transaction_id) as num_of_transactions, User_id user_id FROM transaction  WHERE Timestamp >= CURDATE() GROUP BY User_id HAVING COUNT(Transaction_id) % 2 = 0 ORDER BY Timestamp DESC';
        get_worked_today_users_result = await pool.query(get_worked_today_users_query);
        return res.status(200).json({
            code: 'GET_CURRENTLY_WORKING_SUCCESS',
            message: {
                currently_working: get_currently_working_users_result,
                worked_today: get_worked_today_users_result
            }
        })
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})

module.exports = router;