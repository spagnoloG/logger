const express = require('express');
const router = express.Router();

const pool = require('../controllers/database/database');
const check_auth = require('../controllers/auth/check-auth');
const check_admin = require('../controllers/permissions/check-admin');
const calculate_difference = require('../controllers/calculations/calculate-difference-between-times');


router.get('/daily/:year/:month/:day',  async(req, res) => {

    const {year, month, day} = req.params;

    let check_for_conflicts_query;
    let check_for_conflicts_result;

    // the month is 0-indexed
    let start_date = new Date(year, month - 1, day, 0, 0, 0);
    start_date = start_date.toISOString().split('T')[0] + ' ' + start_date.toTimeString().split(' ')[0];

    let finish_date = new Date(year, month - 1, day, 23, 59, 59);
    finish_date = finish_date.toISOString().split('T')[0] + ' ' + finish_date.toTimeString().split(' ')[0];
    

    try {
        check_for_conflicts_query = 'SELECT conflict.Transaction_id as transaction_id, user.User_id as user_id, conflict.Conflict_id as conflict_id from conflict join transaction on transaction.Transaction_id = conflict.transaction_id join user on user.User_id = transaction.User_id WHERE conflict.Timestamp < CURDATE()';
        check_for_conflicts_result = await pool.query(check_for_conflicts_query);

        // Return warning if there was any conflict catched
        if(check_for_conflicts_result.length > 0) {
            return res.status(200).json({
                code: 'ERR_CONFLICTS_NEED_TO_BE_RESOLVED',
                message: {
                    check_for_conflicts_result
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }


    let timestamps_query;
    let timestamps_result;

    try {
        timestamps_query = 'SELECT Timestamp as timestamp, User_id as user_id FROM transaction WHERE Timestamp >= (?) && Timestamp <= (?) ORDER BY User_id' ;
        timestamps_result = await pool.query(timestamps_query, [start_date, finish_date]);
        if(timestamps_result.length == 0) {
            // no transactions that day
            return res.status(200).json({
                code: 'WARN_NOBODY_WORKING',
                message: {
                    start_date: start_date,
                    finish_date: finish_date
                }
            })
        }
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }

    let current_user = timestamps_result[0].user_id;
    let working_hours_today = [];
    let working_time = 0;

    for(let i = 0; i < timestamps_result.length; i+=2) {
        if(timestamps_result[i].user_id != current_user) {
            working_hours_today.push({
                user_id: timestamps_result[i-1].user_id,
                working_time: working_time/60
            })
            working_time = 0;

            if(i == timestamps_result.length - 2) {
                working_time += calculate_difference(timestamps_result[i].timestamp, timestamps_result[i+1].timestamp);
                working_hours_today.push({
                    user_id: timestamps_result[i].user_id,
                    working_time: working_time/60
                })  
            }
        }
        working_time += calculate_difference(timestamps_result[i].timestamp, timestamps_result[i+1].timestamp);
    }

    return res.status(200).json({
        code: 'WORKING_HOURS_BY_DAY_SUCCESS',
        message: {
            working_hours: working_hours_today,
            unit: 'minutes',
            code: 'WARN_NOBODY_WORKING',
            start_date: start_date,
            finish_date: finish_date
        }
    })
})

router.get('/monthly/:year/:month/',  async(req, res) => {

    const {year, month} = req.params;

    let check_for_conflicts_query;
    let check_for_conflicts_result;

    const today = new Date();

    // the month is 0-indexed
    let start_date = new Date(year, month - 1, 1, 0, 0, 0);
    start_date = start_date.toISOString().split('T')[0] + ' ' + start_date.toTimeString().split(' ')[0];

    let finish_date;

    if(today.getFullYear() == parseInt(year) && (today.getMonth() + 1) == parseInt(month)) {
        finish_date = new Date(year, month - 1, today.getDate() - 1, 23, 59, 59);
        finish_date = finish_date.toISOString().split('T')[0] + ' ' + finish_date.toTimeString().split(' ')[0];
    } else {
        finish_date = new Date(year, month,  0, 0, 0);
        finish_date = finish_date.toISOString().split('T')[0] + ' ' + finish_date.toTimeString().split(' ')[0];
    }


    try {
        check_for_conflicts_query = 'SELECT conflict.Transaction_id as transaction_id, user.User_id as user_id, conflict.Conflict_id as conflict_id from conflict join transaction on transaction.Transaction_id = conflict.transaction_id join user on user.User_id = transaction.User_id WHERE conflict.Timestamp < CURDATE()';
        check_for_conflicts_result = await pool.query(check_for_conflicts_query);

        // Return warning if there was any conflict catched
        if(check_for_conflicts_result.length > 0) {
            return res.status(200).json({
                code: 'ERR_CONFLICTS_NEED_TO_BE_RESOLVED',
                message: {
                    check_for_conflicts_result
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }


    let timestamps_query;
    let timestamps_result;

    try {
        timestamps_query = 'SELECT Timestamp as timestamp, User_id as user_id FROM transaction WHERE Timestamp >= (?) && Timestamp < (?) ORDER BY User_id, Timestamp' ;
        timestamps_result = await pool.query(timestamps_query, [start_date, finish_date]);
        if(timestamps_result.length == 0) {
            // no transactions that day
            return res.status(200).json({
                code: 'WARN_NOBODY_WORKING',
                message: {
                    start_date: start_date,
                    finish_date: finish_date
                }
            })
        }
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }

    let current_user = timestamps_result[0].user_id;
    let working_hours_today = [];
    let working_time = 0;

    let current_day = get_day_from_sql_timestamp(timestamps_result[0].timestamp);
    let day_changed = false;

    for(let i = 0; i < timestamps_result.length; i+=2) {
        if(get_day_from_sql_timestamp(timestamps_result[i].timestamp) != current_day) {
            current_day = get_day_from_sql_timestamp(timestamps_result[i].timestamp);
            day_changed = true;
        }

        if(timestamps_result[i].user_id != current_user || day_changed) {
            day_changed = false;
            working_hours_today.push({
                user_id: timestamps_result[i-1].user_id,
                working_time: working_time/60,
                day: get_day_from_sql_timestamp(timestamps_result[i-1].timestamp)
            })

            if(i == timestamps_result.length - 2) {
                working_time += calculate_difference(timestamps_result[i].timestamp, timestamps_result[i+1].timestamp);
                working_hours_today.push({
                    user_id: timestamps_result[i].user_id,
                    working_time: working_time/60,
                    day: get_day_from_sql_timestamp(timestamps_result[i].timestamp)
                })  
            }
        }
        working_time += calculate_difference(timestamps_result[i].timestamp, timestamps_result[i+1].timestamp);
    }

    return res.status(200).json({
        code: 'WORKING_HOURS_MONTHLY_SUCCESS',
        message: {
            working_hours: working_hours_today,
            unit: 'minutes',
            start_date: start_date,
            finish_date: finish_date
        }
    })
})

const get_day_from_sql_timestamp = (timestamp) => {
   return parseInt(timestamp.toString().slice(8,10));
}

module.exports = router;