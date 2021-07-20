const express = require('express');
const router = express.Router();

const pool = require('../controllers/database/database');
const check_auth = require('../controllers/auth/check-auth');
const check_perms = require('../controllers/permissions/check-permissions');
const check_admin = require('../controllers/permissions/check-admin');


/*
*   Check if user has any conflicts
*/

router.get('/per-user/:id', check_auth, check_perms, async(req, res) => {
    let check_for_conflicts_query;
    let check_for_conflicts_result;

    try {
        check_for_conflicts_query = 'SELECT conflict.Transaction_id as transaction_id, conflict.Conflict_id as conflict_id from conflict join transaction on transaction.Transaction_id = conflict.transaction_id join user on user.User_id = transaction.User_id WHERE user.User_id =(?)';
        check_for_conflicts_result = await pool.query(check_for_conflicts_query, req.params.id);

        // Return warning if there was any conflict catched
        if(check_for_conflicts_result.length > 0) {
            return res.status(200).json({
                code: 'WARN_CONFLICTS_NEED_TO_BE_RESOLVED',
                message: {
                    check_for_conflicts_result
                }
            });
        }

        return res.status(200).json({
            code: 'NO_COFNLICTS_SUCCESS',
            message: 'No conflicts detected'
        })

    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
});

/*
* ADMIN ROUTE -> Check for all conflicts
*/

router.get('/all', check_auth, check_admin, async (req, res) => {
    let check_for_conflicts_query;
    let check_for_conflicts_result;

    try {
        check_for_conflicts_query = 'SELECT conflict.Transaction_id as transaction_id, user.User_id as user_id, conflict.Conflict_id as conflict_id from conflict join transaction on transaction.Transaction_id = conflict.transaction_id join user on user.User_id = transaction.User_id';
        check_for_conflicts_result = await pool.query(check_for_conflicts_query);

        // Return warning if there was any conflict catched
        if(check_for_conflicts_query.length > 0) {
            return res.status(200).json({
                code: 'WARN_CONFLICTS_NEED_TO_BE_RESOLVED',
                message: {
                    check_for_conflicts_result
                }
            });
        }

        return res.status(200).json({
            code: 'NO_COFNLICTS_SUCCESS',
            message: 'No conflicts detected'
        })

    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
});

/**
 * Delete conflict
 */

router.delete('/delete/:id', check_auth, check_perms, async(req, res) => {
    let delete_conflict_query;
    let delete_conflict_result;

    try {
        delete_conflict_query = 'DELETE FROM conflict WHERE Conflict_id = (?)';
        delete_conflict_result = await pool.query(delete_conflict_query, req.params.id);
        return res.status(200).json({
            code: 'DELETE_SUCCCESS',
            message: delete_conflict_result
        })
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})



module.exports = router;