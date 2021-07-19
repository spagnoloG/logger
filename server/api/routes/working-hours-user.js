const express = require('express');
const router = express.Router();

const pool = require('../controllers/database/database');
const check_auth = require('../controllers/auth/check-auth');
const check_perms = require('../controllers/permissions/check-permissions');

/**
 * Here are defined working hours per user
 */
// https://stackoverflow.com/a/17198760

router.get('/today', check_auth, check_perms, (req, res) => {
    
})

module.exports = router;