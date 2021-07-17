const { response } = require('express');
const dotenv = require('dotenv');
const express = require('express');

dotenv.config({path: '.env'});

const PORT = process.env.PORT || '3000';
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Import routes
const userRoute = require('./api/routes/user');
const transactionRoute = require('./api/routes/transaction');

// Define routes
app.use('/user', userRoute);
app.use('/transaction', transactionRoute);

// Request permissions
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});


// Error handling
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
});

// Start listening
app.listen(PORT, () => {
    console.log(`Listening for requests on port ${PORT}`);
});
