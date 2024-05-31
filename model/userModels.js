const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = Schema({
    firstName :{
        type : String,
        required : true
    },
    lastName : {
        type : String,
       
    },
    email : {
        type : String,
        required : true
    },
    mobile : {
        type : String,
        
    },
    password :{
        type : String ,
        ew3ired : true
    },
    isAdmin:{
        type : String,
        default : 0
    },
    isVerified : {
        type : Boolean ,
        default : false
    },
    token:{
        otp :{
            type : Number
        },
        generatedTime : {
            type : Date
        }
    },
    isBlocked : {
        type : Boolean ,
        default : false
    },
    joinedDate :{
        type : Date ,
        default : Date.now
    },
    address : [{
        type:mongoose.Schema.Types.ObjectId,
        ref : "address"
    }],
    wallet : {
        type : Number ,
        
    },
    walletHistory : [{
        date : {
            type : Date,
        },
        amount : {
            type : Number
        },
        message : {
            type : String
        }
    }],
    referralCode: {
        type: String,
        unique: true // Ensure referral code is unique
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId, // Store the ID of the referring user
        ref: 'user' // Reference the same model
    },
    isReferred: {
        type: Boolean,
        default: false // Indicate if the user was referred
    },
    googleId:{
        type: String
    },
    isGoogleAuthenticated:{
        type: Boolean,
        default : false
    }
})

module. exports = mongoose.model('user' , userSchema)