const dotenv = require('dotenv');
const express = require('express');
const schedule = require('node-schedule');
const auto_finish = require('./api/auto/auto-finish');
const cors = require('cors');

dotenv.config({path: './.env'});

const PORT = process.env.PORT || '3000';
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended:false}));


// Import routes
const userRoute = require('./api/routes/user');
const transactionRoute = require('./api/routes/transaction');
const statusRoute = require('./api/routes/status');
const workingHoursUserRoute = require('./api/routes/working-hours-user');
const workingHoursAdminRoute = require('./api/routes/working-hours-admin');
const conflictRoute = require('./api/routes/conflict');


// Define routes
app.use('/user', userRoute);
app.use('/transaction', transactionRoute);
app.use('/status', statusRoute);
app.use('/working-hours-user', workingHoursUserRoute);
app.use('/working-hours-admin', workingHoursAdminRoute);
app.use('/conflict', conflictRoute);

// Define public route (For images)
app.use('/profile', express.static('public/uploads/profile-pictures'));

// // Request permissions
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header(
//         'Access-Control-Allow-Headers',
//         'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//     );
//     if (req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
//         return res.status(200).json({});
//     }
//     next();
// });


// // Error handling
// app.use((req, res, next) => {
//     const error = new Error('Not found');
//     error.status = 404;
//     next(error);
// });

// app.use((error, req, res, next) => {
//     res.status(error.status || 500);
//     res.json({
//         error: {
//             message: error.message
//         }
//     })
// });

// Start listening
app.listen(PORT, () => {
    console.log(`Listening for requests on port ${PORT}`);
});

// Start daily schedule 
const scheduler = schedule.scheduleJob('0 55 23 * * *', () => {
    console.log('AUTOMATIC SCRIPT RUNNING TO CHECK IF ALL WORKERS HAVE CHECKED OUT!');
    console.log('-----------------------------> START <-----------------------------');
    auto_finish();
    console.log('----------------------------> FINISHED <---------------------------');
})