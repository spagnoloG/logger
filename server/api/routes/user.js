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
* Register a new user
*/

router.post('/register', async (req, res) => {
    const {email, password, name, role, key_id, profile_picture} = req.body;
    // first check if user is already in database
    let check_email_query;
    let add_new_user_query;
    let email_result;
    let add_new_user_result;
    try {
        check_email_query = 'SELECT * FROM user WHERE Email = (?)';
        email_result = await pool.query(check_email_query, email);
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }

    if(email_result.length >= 1) {
        return res.status(409).json({
            message: 'Mail alreay in db!',
            code: 'ERR_EMAIL_ALREADY_IN_DB'
        })
    }

    // then check if key is already assinged to any user
    if(key_id) {
        let check_if_key_is_valid_query;
        let check_if_key_is_valid_result;
        try {
            check_if_key_is_valid_query = 'SELECT Key_id FROM user WHERE Key_id = (?)';
            check_if_key_is_valid_result = await pool.query(check_if_key_is_valid_query, key_id);

            if(check_if_key_is_valid_result.length != 0) {
                return res.status(409).json({
                    message: "Key is already assigned to another user!",
                    code: 'ERR_KEY_ALREADY_IN_DB'
                })
            }
        } catch (err) {
            return res.status(500).json({
                code: 'ERR_DB',
                error: err
            })
        }
    }

    // if everything is OK, hash password and store new user into DB
    bcrypt.hash(password, 10, async (err, hash) => {
        if(err) {
            return res.status(500).json({
                error: "Error while hashing password!",
                code: 'ERR_FATAL'
            })
        }
        try {
            // Key id and profile picture are optional on register
            let add_new_user_parameters = [email, hash, name, role];

            // Add key if present in post request
            if(key_id) {
                add_new_user_parameters.push(key_id);
            }

            // Add profile picture url if present in post request
            if(profile_picture) {
                add_new_user_parameters.push(profile_picture);
            }

            add_new_user_query = `INSERT INTO user (Email, Password, Name, Role ${key_id != undefined ? ', Key_id' : ''} ${profile_picture != undefined ? ', Profile_picture' : ''}) VALUES (?, ?, ?, ? ${key_id != undefined ? ', ?' : ''} ${profile_picture != undefined ? ', ?' : ''})`;
            add_new_user_result = await pool.query(add_new_user_query, add_new_user_parameters);

            return res.status(200).json({
                message: `successfully added user with ID: ${add_new_user_result.insertId} !`,
                code: 'NEW_USER_SUCCESS'
            });
        } catch (err) {
            return res.status(500).json({
                code: 'ERR_DB',
                error: err
            })
        }
    })
});

/*
* Login, return JWT
*/

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    let find_user_query;
    let find_user_result;
    // Firstly check if user is stored in database
    try {
        find_user_query = 'SELECT Password, User_id FROM user WHERE Email = (?)';
        find_user_result = await pool.query(find_user_query, email);
        if (find_user_result < 1) {
            return res.status(200).json({
                message: 'Email does not exist in DB!',
                code: 'ERR_EMAIL_NOT_FOUND'
            })
        }
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
    // Check if password matches -> return JWT
    bcrypt.compare(password, find_user_result[0].Password, (err, result) => {
        if(err) {
            return res.status(200).json({
                message: 'Encryption/Decryption failed',
                code: 'ERR_UNKNOWN'
            })
        }
        if(result) {
            const token = jwt.sign({
                email: email,
                user_id: find_user_result[0].User_id
            }, process.env.JWT_KEY,
            {
                expiresIn: "6h"
            });
            return res.status(200).json({
                message: 'Auth successful',
                code: 'AUTH_SUCCESS',
                user_id: find_user_result[0].User_id,
                token: token
            });
        }
        return res.status(200).json({
            message: 'Entered password does not match!',
            code: 'ERR_INVALID_PASSWORD'
        })
    })
})

/*
* Verify is JWT is valid
*/

router.post('/validate-session', async (req, res) => {
    const { token } = req.body;

    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if(err) {
            return res.status(200).json({
                message: 'There was an error validating your key!',
                code: 'ERR_SESSION_EXPIRED'
            })
        }
        return res.status(200).json({
            message: 'Session is still valid',
            code: 'SESSION_VALID_SUCCESS'
        })
    })
})


/*
* Get user data, only if it matches requested ID, or if user is admin
*/

router.get('/:id', check_auth, check_perms, async(req, res) => {
    let find_user_query;
    let find_user_result;
   
    try {
        find_user_query = 'SELECT Email as email, Name as name, Role as role, Key_id as key_id, User_id as user_id from user where User_id = (?)';
        find_user_result = await pool.query(find_user_query, req.params.id);
        return res.status(200).json({
            code: "USER_SUCCESS",
            data: find_user_result
        })
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})

/*
* Delete user, only if user is admin
*/

router.delete('/:id', check_auth, check_admin, async(req, res) => {
    let delete_user_query;
    let delete_user_result;

    try {
        delete_user_query = 'DELETE FROM user WHERE User_id = (?)';
        delete_user_result = await pool.query(delete_user_query, req.params.id);
        return res.status(200).json({
            code: 'DELETE_SUCCCESS',
            message: delete_user_result
        })
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})

/*
* Update user data, only if it matches requested ID, or if user is admin
*/

router.patch('/update/:id', check_auth, check_perms, async (req, res) => {
    const {email, name, key_id} = req.body;
    let update_user_query;
    let update_user_result;

    try {
        update_user_query = 'UPDATE user SET Name = (?), Email = (?), Key_id = (?) WHERE User_id = (?)';
        update_user_result = await pool.query(update_user_query, [name, email, key_id, req.params.id]);
        return res.status(200).json({
            code: 'UPDATE_SUCCCESS',
            message: update_user_result
        })
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})

/*
* Change password only if it matches requested ID, or if user is admin
*/

router.patch('/update-password/:id', check_auth, check_perms, async (req, res) => {
    const {password} = req.body;
    let update_user_password_query;
    let update_user_password_result;

    // Hash new password and update record in database
    bcrypt.hash(password, 10, async (err, hash) => {
        if(err) {
            return res.status(500).json({
                code: 'ERR_HASH',
                error: "Error while hashing password!"
            })
        }

        try {
            update_user_password_query = 'UPDATE user SET Password = (?) WHERE User_id = (?)';
            update_user_password_result= await pool.query(update_user_password_query, [hash, req.params.id]);
            return res.status(200).json({
                code: 'UPDATE_SUCCCESS',
                message: update_user_password_result
            })
        } catch (err) {
            return res.status(500).json({
                code: 'ERR_DB',
                error: err
            })
        }
    });
})

/*
* Get all users list, only if admin
*/

router.get('/users/all', check_auth, check_admin, async (req, res) => {
    let get_all_users_data_query;
    let get_all_users_data_result;
    try {
        get_all_users_data_query = 'SELECT Name as name, User_id as user_id, Role as role, Key_id as key_id, Email as email FROM user';
        get_all_users_data_result = await pool.query(get_all_users_data_query);
        return res.status(200).json({
            code: 'GET_ALL_USERS_SUCCESS',
            message: get_all_users_data_result
        })
    } catch (err) {
        return res.status(500).json({
            code: 'ERR_DB',
            error: err
        })
    }
})

/*
* Upload profile picture
*/

router.post('/profile-picture/:id', check_auth, check_perms, async(req, res) => {
    const file_types = ['image/jpeg', 'image/png', 'image/gif'];
    const picture_path = './public/uploads/profile-pictures';
    const current_time = new Date().getTime();
    let file_name;
    let failed = false;

    let form = new formidable.IncomingForm();
    form.uploadDir = path.resolve(picture_path);
    form.maxFileSize = 5 * 1024 * 1024; // 5MB
    form.multiples = false;

    form.on('fileBegin', (name, file) => {
        if(file_types.indexOf(file.type) === -1) {
            failed = true;
            res.status(415).json({
                code: 'ERR_UNSUPPORTED_FILETYPE',
                message: 'File type is not supported!',
                supported: file_types
            })
            return res.end();
        }
    });

    form.on('file', (name, file) => {
        file_name = current_time + '_' +file.name;
        fs.rename(file.path, path.join(form.uploadDir, file_name), (err) =>{
            if(err) {
                return res.status(500).json({
                    code: 'ERR_FILE_UPLOAD_FAIL',
                    message: 'Renaming of file failed',
                })
            }
        })
    });

    form.on('end', async(file) => {
        if(!failed) {
            let update_profile_picutre_query;
            let update_profile_picutre_result;
            try {
                update_profile_picutre_query = 'UPDATE user SET Profile_picture = (?) WHERE User_id = ?';
                update_profile_picutre_result = await pool.query(update_profile_picutre_query, [file_name, req.params.id])

                return res.status(200).json({
                    code: 'PROFILE_PICTURE_UPLOAD_SUCCESS',
                    message: update_profile_picutre_result
                })

            } catch(err) {
                return res.status(500).json({
                    code: 'ERR_DB',
                    error: err
                })
            }
        }
    })

    form.parse(req);
});

module.exports = router;