const express = require('express');
const router = express.Router();
const { home, sign_up, sign_in, forgot_password, verify_otp, reset_password } = require('../controller/user.controller');

router.get('/home', home);
router.post('/sign-up', sign_up);
router.post('/sign-in', sign_in);
router.post('/forgot-password', forgot_password);
router.post('/verify-otp/:user_id', verify_otp);
router.put('/reset-password/:id', reset_password);

module.exports = router;