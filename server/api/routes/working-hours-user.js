const express = require('express');
const pool = require('../helpers/database');
const router = express.Router();
const check_auth = require('../helpers/check-auth');
const check_perms = require('../helpers/check-permissions');

/**
 * Here are defined working hours per user
 */
// https://stackoverflow.com/a/17198760

router.get('/today', check_auth, check_perms, (req, res) => {
    
})

module.exports = router;