const express=require('express')
const router=express.Router()



const authController=require('../controllers/authController.js')

const isAuth=require('../middleware/isAuth')
const google = require('../helpers/googleHelper')


router.get('/',authController.getland)
router.get('/landing',authController.getHome)


router.get('/login',authController.getUserLogin)
router.get('/login',authController.userLogin)
router.post('/home',authController.userLogin)
router.get('/usersignup',authController.usersignUp)

router.get('/logout',isAuth.userAuth,authController.doUserLogout)

router.post('/signup',authController.postuserSignup)
router.get('/otp-verification',authController.getotpVerification)
router.post('/otp-verification',authController.signupVerification)
router.get('/resend-otp',authController.resendOtp)
router.get('/forgotresendotp',authController.forgotresendOtp)


router.get('/forgot-password',authController.getforgotpassword)
router.post('/forgot-password',authController.forgotpassword)
router.post( '/password-otp-verification', isAuth.userLoggedout, authController.forgotPasswordOtpVerification  )

router.get('/adminlogin',authController.adminsignUp)
router.post('/adminlogin',authController.postadminlogin)


//get admin dashboard 
router.get('/adminDashBoard', isAuth.adminAuth,authController.adminDashBoard)



//------------google-----------------------------------------------------------------------

router.get('/auth/google',google.googleauth)
router.get('/google/callback',google.goog);
router.get('/admin/bestSelling', authController.getBestSellingPage);
router.post('/admin/filter-best-selling', authController.filterBestSelling);



module.exports=router;