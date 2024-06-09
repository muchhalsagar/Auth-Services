const express = require('express');
const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

//Create a Transporter using default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

//Send mail for reset password
const send_mail = async (user, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'OTP for Reset your Password',
        html: `
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: black;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              background-color: #007bff;
              padding: 20px;
              text-align: center;
              color: #fff;
            }
            .content {
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #fff;
            }
            h2 {
              color: white;
            }
            strong {
              color: #007bff;
            }
            a {
              color: blue;
            }
            p {
              margin: 0 0 15px;
            }
            .link{
                color:blue;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 >ABC Todo Application</h2>
            </div>
            <div class="content">
              <p>
                <span>Dear ${user.username},</span>
              </p>
              <p>
                Thank you for choosing ABC Todo Application.
              </p>
              <p>Your OTP for Reset Password : <b>${otp}</p>
              <p>
                <p>Company Information:</p>
                <p>Helpline mail id: helplineabctodo@gmail.com</p><br>
                <p>Helpline No : 12234567890 </a>
               </p>
              <!-- Remaining content... -->
            </div>
          </div>
        </body>
      </html>
        `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if(error) {
            console.log(error);
        }
    });
};

/******************************************************
 * @home
 * @route http://localhost:8080/user/home
 * @description home API for Test
 * @returns Test Message
 ******************************************************/
const home = async(req,res) => {
    try{
        res.status(200).json({message : 'This is a Test API....' });
    } catch(error) {
        console.log('Error : ', error);
        res.status(500).json({ messsage : 'Internal Server Error...' });
    }
}

/******************************************************
 * @sign_up
 * @route http://localhost:8080/user/sign_up
 * @description API for Create a New User
 * @returns Success Message and new User object
 ******************************************************/
const sign_up = async(req,res) => {
    try{
        const { username, mobile, email, password } = req.body;
        if (!username || !mobile || !email || !password ) {
            return res.status(400).json({ message: 'All Fields are required...' });
        }
        const exists_user = await User.findOne({
            email: email
        });
        if (exists_user) {
            return res.status(400).json({message: 'Email Allready Exists in DB...' });
        }
        const new_user = new User({
            username: username,
            mobile: mobile,
            email: email,
            password: password,
        });
        await new_user.save();
        res.status(200).json({ meassage: 'User Added Successfully...', new_user });
    } catch(error) {
        console.log('Error : ', error);
        res.status(500).json({ message: 'Internal Server error...' });
    }
}

//Generate a Authenticated Token
const GenerateAuthToken = async (user) => {
    const token = jwt.sign(
        { _id: user._id, email: user.email },
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NjY1NDQwYTQ1Zjg1NzQ0YWUwYmJjYmIiLCJlbWFpbCI6Im11Y2hoYWxzYWdhckBnbWFpbC5jb20iLCJpYXQiOjE3MTc5MTQ2NDYsImV4cCI6MTcxNzkxODI0Nn0.LvVD6qGZj0AZOVU62fqw0PDHD4M6t__ZrgJXQ6RMDjk',
        { expiresIn: '1h' }
    );
    return token;
};

/******************************************************
 * @sign-in
 * @route http://localhost:8080/user/sign-in
 * @description API for Sign-in a User and Generate a Token
 * @returns Success Message and return Auth Token
 ******************************************************/
const sign_in = async(req,res) => {
    try {
        const {email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and Password both required....' });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: 'Email and Password not valid.' });
        }
        const token = await GenerateAuthToken(user);
        res.status(200).json({ message: 'Login Success...', token });
    } catch(error) {
        console.log('Error : ', error);
        res.status(500).json({ message: 'Internal Server error...' });
    }
}

//Generate 6-Digit OTP
const Generate_OTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

/******************************************************
 * @forgot_password
 * @route http://localhost:8080/user/forgot-password
 * @description API for forgot password
 * @returns Success Message and sent mail
 ******************************************************/
const forgot_password = async(req,res) => {
    try{
        const { email } = req.body;
        if(!email) {
            return res.status(400).json({message : 'Email is Required...'});
        }
        const user = await User.findOne({ email: email });
        if(!user) {
            return res.status(400).json({ message: 'User not found..'});
        }
        const otp = await Generate_OTP();
        user.passwordResetOTP = otp;
        await user.save();
        await send_mail(user, otp);
        const id = user._id;
        res.status(200).json({ message: 'OTP sent to your Registered email address for reset password.', id })
    } catch(error) {
        console.log('Error : ', error);
        res.status(500).json({ message: 'Internal Server error...' });
    }
}

/******************************************************
 * @verify_otp
 * @route http://localhost:8080/user/verify-otp/:user_id
 * @description API for Verify OTP
 * @returns Success Message
 ******************************************************/
const verify_otp = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { passwordResetOTP } = req.body;
        if (!passwordResetOTP) {
            return res.status(400).json({ message: 'OTP is required...' });
        }
        const user = await User.findOne({ _id: user_id });
        if (!user) {
            return res.status(400).json({ message: 'User Not Found...' });
        }
        if (passwordResetOTP !== user.passwordResetOTP) {
            return res.status(400).json({ message: 'OTP is not valid, please enter the correct OTP...' });
        }
        const id = user._id;
        res.status(200).json({ message: 'OTP verified successfully...', id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server error.' });
    }
};


/******************************************************
 * @reset_password
 * @route http://localhost:8080/user/reset-password/:user_id
 * @description API for Reset password
 * @returns Success Message
 ******************************************************/
const reset_password = async (req, res) => {
    try{
        const { id } = req.params;
        const { newPassword, confirm_password } = req.body;
        if (!newPassword || !confirm_password ) {
            return res.status(400).json({ message: 'Password and Confirm password are required...' });
        }
        const user = await User.findOne({ _id: id });
        if(!user) {
            return res.status(400).json({message: 'User not found...' });
        }
        if (newPassword !== confirm_password) {
            return res.status(400).json({ message: 'Password and Confirm password not Same...' });
        }
        user.password = newPassword;
        user.passwordResetOTP = undefined;
        await user.save();
        res.status(200).json({ message: 'Password Reset Successfully...' }); 
    } catch(error) {
        console.log('Error : ', error);
        res.status(500).json({message: 'Internal Server Error...' });
    }
}

module.exports = { home, sign_up, sign_in, forgot_password, verify_otp, reset_password };