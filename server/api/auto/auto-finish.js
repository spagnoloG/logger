const pool = require('../controllers/database/database');

module.exports = async () => {
    let get_currently_working_users_query;
    let get_currently_working_users_result;
    try {
        get_currently_working_users_query = 'SELECT COUNT(Transaction_id) as num_of_transactions, User_id user_id FROM transaction  WHERE Timestamp >= CURDATE() GROUP BY User_id HAVING COUNT(Transaction_id) % 2 = 1 ORDER BY Timestamp DESC';
        get_currently_working_users_result = await pool.query(get_currently_working_users_query);

        get_currently_working_users_result.forEach(async user => {
            let conflict_transaction_query = 'INSERT INTO transaction(User_id) VALUES(?)';
            let conflict_transaction_result = await pool.query(conflict_transaction_query, user.user_id);

            console.log('CONFLICT -> FOR USER: ' + user.user_id);
            
            let conflict_query = 'INSERT INTO conflict(Transaction_id) VALUES(?)';
            await pool.query(conflict_query, conflict_transaction_result.insertId);
        });

    } catch (err) {
        console.log('FATAL ERROR! -> CONFLICTS ARE NOT LOGGED <>*<>');
        process.exit(1);
    }
}