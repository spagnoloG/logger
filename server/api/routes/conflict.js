const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const formidable = require('formidable');
const path = require("path");
const fs = require('fs');

const pool = require('../controllers/database/database');
const check_auth = require('../controllers/auth/check-auth');
const check_perms = require('../controllers/permissions/check-permissions');
const check_admin = require('../controllers/permissions/check-admin');


/*
*   Check if user has any conflicts
*/
router.get('/per-user/:id', async(req, res) => {
    let check_for_conflicts_query;
    let check_for_conflicts_result;

    try {
        check_for_conflicts_query = 'SELECT * FROM CONFLICTS WHERE User_id = (?)';
        

    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
});



module.exports = router;