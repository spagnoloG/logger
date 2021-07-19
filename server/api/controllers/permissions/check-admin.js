/*
* Check if user is admin
*/

const pool = require('../database/database');

module.exports = async (req, res, next) => {
    let find_request_user_query;
    let find_request_user_result;

    try {
        find_request_user_query = 'SELECT Role from user where User_id = (?)';
        find_request_user_result = await pool.query(find_request_user_query, req.user_data.user_id);
    } catch (err) {
        return res.status(500).json({
            error: err
        })
    }

    // if there is no match, throw error
    if(find_request_user_result[0].Role == 'admin') {
        next();
    } else {
        return res.status(401).json({
            message: 'Insufficient rights!',
            code: 'RIGHTS_ERR'
        })
    }
}