const express = require('express');
const router = express.Router();

const pool = require('../controllers/database/database');
const check_auth = require('../controllers/auth/check-auth');
const check_perms = require('../controllers/permissions/check-permissions');
const calculate_difference = require('../controllers/calculations/calculate-difference-between-times');

/**
 * Here are defined working hours per user
 */

router.get('/today/:id', check_auth, check_perms, async(req, res) => {
    let timestamps_query;
    let timestamps_result;

    try {
        timestamps_query = 'SELECT Timestamp as timestamp FROM transaction  WHERE Timestamp >= CURDATE() && User_id = (?) ORDER BY Timestamp' ;
        timestamps_result = await pool.query(timestamps_query, req.params.id);
        if(timestamps_result.length == 0) {
            // no transactions today
            return res.status(200).json({
                code: 'WARN_NOT_WORKING_TODAY',
            })
        }
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
    // Calculate hours
    let working_time = 0;
    for(let i = 0; i < timestamps_result.length; i+=2) {
        if(timestamps_result[i+1]) {
            working_time += calculate_difference(timestamps_result[i].timestamp, timestamps_result[i+1].timestamp);
        } else {
            working_time += calculate_difference(timestamps_result[i].timestamp);
        }
    }
    working_time /= 60;
    return res.status(200).json({
        code: 'WORKING_HOURS_TODAY_SUCCESS',
        message: {
            time: working_time,
            unit: 'minutes'
        }
    })
})

router.get('/monthly/:year/:month/:id', check_auth, check_perms, async(req, res) => {
    let timestamps_query;
    let timestamps_result;

    const {year, month, id} = req.params;

    // the month is 0-indexed
    let start_date = new Date(year, month - 1, 1);
    start_date = start_date.toISOString().split('T')[0] + ' ' + start_date.toTimeString().split(' ')[0];

    let finish_date = new Date(year, month, 1);
    finish_date = finish_date.toISOString().split('T')[0] + ' ' + finish_date.toTimeString().split(' ')[0];

    try {
        timestamps_query = `SELECT Timestamp as timestamp FROM transaction  WHERE Timestamp >= (?) && Timestamp <= (?) && User_id = (?) ORDER BY Timestamp` ;
        timestamps_result = await pool.query(timestamps_query, [start_date, finish_date, id]);
        if(timestamps_result.length == 0) {
            // no transactions this month
            return res.status(200).json({
                code: 'ERR_NO_RECORDS',
            })
        }
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
    // Calculate hours
    let working_time = 0;
    for(let i = 0; i < timestamps_result.length; i+=2) {
        if(timestamps_result[i+1]) {
            working_time += calculate_difference(timestamps_result[i].timestamp, timestamps_result[i+1].timestamp);
        } else {
            working_time += calculate_difference(timestamps_result[i].timestamp);
        }
    }
    working_time /= 60;
    return res.status(200).json({
        code: 'WORKING_HOURS_PER_MONTH_SUCCESS',
        message: {
            time: working_time,
            unit: 'minutes',
            start_date: start_date,
            finish_date: finish_date
        }
    })
})

router.get('/daily/:year/:month/:day/:id', async(req, res) => {
    let timestamps_query;
    let timestamps_result;

    const {year, month, day, id} = req.params;

    // the month is 0-indexed
    let start_date = new Date(year, month - 1, day, 0, 0, 0);
    start_date = start_date.toISOString().split('T')[0] + ' ' + start_date.toTimeString().split(' ')[0];

    let finish_date = new Date(year, month - 1, day, 23, 59, 59);
    finish_date = finish_date.toISOString().split('T')[0] + ' ' + finish_date.toTimeString().split(' ')[0];

    try {
        timestamps_query = `SELECT Timestamp as timestamp FROM transaction  WHERE Timestamp >= (?) && Timestamp <= (?) && User_id = (?) ORDER BY Timestamp` ;
        timestamps_result = await pool.query(timestamps_query, [start_date, finish_date, id]);
        if(timestamps_result.length == 0) {
            // no transactions this day
            return res.status(200).json({
                code: 'ERR_NO_RECORDS',
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
    // Calculate hours
    let working_time = 0;
    for(let i = 0; i < timestamps_result.length; i+=2) {
        if(timestamps_result[i+1]) {
            working_time += calculate_difference(timestamps_result[i].timestamp, timestamps_result[i+1].timestamp);
        } else {
            working_time += calculate_difference(timestamps_result[i].timestamp);
        }
    }
    working_time /= 60;
    return res.status(200).json({
        code: 'WORKING_HOURS_PER_DAY_SUCCESS',
        message: {
            time: working_time,
            unit: 'minutes',
            start_date: start_date,
            finish_date: finish_date
        }
    })
})

module.exports = router;