const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    mobile: {
        type: Number,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    passwordResetOTP: {
        type: String,
    },
});

module.exports = mongoose.model('User', userSchema);