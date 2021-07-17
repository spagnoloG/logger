/*
* Check if user is admin / if user requests for own data
*/

const pool = require('../helpers/database');

module.exports = async (req, res, next) => {
    let find_request_user_query;
    let find_request_user_result;

    try {
        find_request_user_query = 'SELECT Role FROM user WHERE User_id = (?)';
        find_request_user_result = await pool.query(find_request_user_query, req.user_data.user_id);
    } catch(err) {
        return res.status(500).json({
            error: err
        })
    }

    // if there is no match, throw error
    if(find_request_user_result[0].Role == 'admin' || req.params.id == req.user_data.user_id) {
        next();
    } else {
        return res.status(401).json({
            message: 'Insufficient rights!',
            code: 'ERR_INVALID_RIGHTS'
        })
    }
}