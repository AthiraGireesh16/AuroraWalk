const bcrypt = require('bcrypt')
const userSchema = require('../model/userModels')
const adminSchema = require('../model/adminSchema')
const Product = require('../model/productModel')
const Brand = require('../model/brandModel')
const Order = require('../model/orderModel')
const Category = require('../model/categoryModel')
const flash = require('connect-flash');
const Swal = require('sweetalert2')
const isAuth = require('../middleware/isAuth')
const verificationController = require('../controllers/verificationController');
const { longFormatters } = require('date-fns');


module.exports={

    getland:async(req,res)=>{
        try{
            res.render('shop/land')
        }catch(error){
            console.log(error);
        }
    },
    getHome: async (req, res) => {
        try {
            isAuth.userAuth(req, res, () => {
                const userLoggedin = req.session.user;
                res.render('shop/home');
            });
        } catch (error) {
            console.log(error);
        }
    },
    getUserLogin:async(req,res)=>{
        try{
            res.render('auth/userLogin')
        }catch(error){
            console.log(error)
        }
    },
   
   


    userLogin: async (req, res) => {
        try {
            userData = await userSchema.findOne({ email: req.body.email });
            if (userData && userData.isAdmin !== 1) {
                if (userData.isBlocked === false) {
                    const password = await bcrypt.compare(req.body.password, userData.password);
                    if (password) {
                        if (userData.isVerified) {
                            req.session.user = userData._id;
                            res.redirect('/landing');
                        } else {
                            const newOtp = verificationController.sendMail(req.body.email, req.body.lastName);
                            await userSchema.updateOne({ email: req.body.email }, {
                                $set: { 'token.otp': newOtp, 'token.generatedTime': new Date() }
                            });
                            req.session.unVerfiedMail = req.body.email;
                            res.redirect('/otp-verification');
                        }
                    } else {
                       
                        res.send(`
                            <script>
                                alert('Incorrect password');
                                window.location.href = '/login';
                            </script>
                        `);
                    }
                } else {
                    
                    res.send(`
                        <script>
                            alert('User Blocked by the Admin');
                            window.location.href = '/login';
                        </script>
                    `);
                }
            } else {
                
                res.send(`
                    <script>
                        alert('Incorrect email');
                        window.location.href = '/login';
                    </script>
                `);
            }
        } catch (err) {
            console.log(err);
        }
    },
    


   
    
    
    usersignUp : async(req,res)=>{
        try{
            res.render('auth/userSignup')
        }catch(error){
            console.log(error);
        }
    },








    generateReferralCode: async () => {
        try {
            
            const randomString = (length) => {
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let result = '';
                for (let i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                return result;
            };

            let referralCode;
            let referralCodeExists = true;
            while (referralCodeExists) {// referral code generate cheyyum until its find a unique code
                referralCode = randomString(6); 
                const existingUser = await userSchema.findOne({ referralCode: referralCode });
                if (!existingUser) {
                    referralCodeExists = false;
                }
            }
            return referralCode;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },



    postuserSignup: async (req, res) => {
        try {
            const {referal} = req.body;
           
            const userData = await userSchema.findOne({ email: req.body.email });
    
            if (userData) {
                req.flash('userExist', "User Already Exist..............");
                return res.redirect('/signup');
            }
    
            let walletBalance = 0;

        
           
            if (referal) {
                const referrer = await userSchema.findOne({ referralCode: referal });// finding the referrer bu using the referal code
                
                if (referrer) {
                    
                    let refererBalance = referrer.wallet + 1000;
                    
                    await userSchema.updateOne({ _id: referrer._id }, { $set: { wallet: refererBalance } });
                    const referrerTransaction = {
                        amount: 1000,
                        date: new Date(),
                        message: 'Referal Bonus'
                    };
                    referrer.walletHistory.push(referrerTransaction);
                    await referrer.save();
                    walletBalance=1000;
                } else {
                    
                }
            }  
            const referralCode = await module.exports.generateReferralCode();
            const otp = verificationController.sendMail(req.body.email);
            const password = await bcrypt.hash(req.body.password, 12);//password hashing
    
            // Create a new user with the generated referral code
            const user = new userSchema({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                isAdmin: 0,
                mobile: req.body.mobile,
                password: password,
                token: {
                    otp: otp,
                    generatedTime: new Date()
                },
                referralCode: referralCode,
                wallet: walletBalance
            });



            // Add referral bonus transaction to referee's wallet history
        const refereeTransaction = {
            amount: walletBalance,
            date: new Date(),
            message: 'Referal Bonus'
        };
        user.walletHistory.push(refereeTransaction);
    
            await user.save();

         


            req.session.unVerifiedMail = req.body.email;
            res.redirect('/otp-verification');
        } catch (error) {
            console.log(error);
            res.redirect('/500'); // Redirect to an error page if there's an error
        }
    },
    
    




    
    
    // otp verification page
    getotpVerification :(req,res)=>{
        res.render('auth/signup-otp')

    },
    //signup verification
    signupVerification : async(req,res)=>{
        try{
            
            const entertime = new Date()
            let {val1,val2,val3,val4,val5,val6} = req.body
            userotp = val1 + val2 + val3 + val4 + val5 + val6
            
            const otpCheck = await userSchema.findOne({email : req.session.unVerifiedMail,'token.otp' :userotp})
            
            if(otpCheck){
                const timeDiff=(new Date(entertime)-otpCheck.token.generatedTime)/1000/60
                
                if(timeDiff <= 1){
                    await userSchema.updateOne({email:otpCheck.email},{$set:{    
                    isVerified : true
                    }})
                }
                req.session.user = otpCheck._id;
                req.session.unVerfiedMail = null
                        req.session.user = otpCheck._id
                        res.redirect('/landing')
                
            }else{
                res.redirect('/otp-verification')
            }

        }catch(error){
            console.log(error);
        }
    },

    resendOtp: async (req, res) => {
        try {
            const email = req.session.unVerifiedMail;
            const otp = verificationController.sendMail(email);
            await userSchema.updateOne({ email: email }, {
                $set: {
                    token: {
                        otp: otp,
                        generatedTime: new Date()
                    }
                }
            });
            res.redirect('/otp-verification'); // Redirect to the OTP verification page after sending OTP
        } catch (error) {
            console.log(error);
            res.redirect('/500'); 
        }
    },
    
    forgotresendOtp : async(req,res)=>{
        try{
            let email = req.session.unVerifiedMail
            const otp = verificationController.sendMail(email)
            await userSchema.updateOne({email: email},{$set:{
                token :{
                    otp : otp,
                    generatedTime : new Date()
                }
            }})
        }catch(error){
            console.log(error);
        }
    },
    doUserLogout:(req,res)=>{
        try{
            req.session.user=null
            req.session.productCount=0;
            res.render('shop/land')
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    adminsignUp : async(req,res)=>{
        try{
            res.render('auth/adminLogin')
        }catch(error){
            console.log(error);
        }
    },
    postadminlogin : async(req,res)=>{
        try{

            const values = {
                email : "admin@gmail.com",
                password : 1234
            }
            if(req.body.email== values.email && req.body.password == values.password){
                req.session.admin=req.body.email;
                res.render('admin/dashboard')
                
            }else{
                res.send("ERROR : Wrong username and/or password")
            }
        }catch(error){
            console.log(error);
        }
    },
    doAdminLogout:(req,res)=>{
        try{
            req.session.admin=null
            res.redirect('/admin-login')
        }catch(error){
            res.redirect('/500')
        }
    },
    getforgotpassword : async(req,res)=>{
        res.render('auth/forgot-password')
    },
    forgotpassword : async(req,res)=>{

        try{
            const emailExist = await userSchema.findOne({email:req.body.email})
            if(emailExist){
                const newOtp = verificationController.sendMail(req.body.email,req.body.lastname)
                await userSchema.updateOne(
                    { email: req.body.email },
                    {
                        $set: {
                            'token.otp': newOtp,
                            'token.generatedTime': new Date()
                        }
                    }
                )
                req.session.unVerifiedMail = req.body.email
                res.render('auth/forgot-password-otp')
            }else{
                res.redirect('/forgot-password')
            }
        }catch(error){
            console.log(error);
        }
        
    },
    forgotPasswordOtpVerification:async(req,res)=>{
        try{
             const enterTime = new Date()
            let { val1, val2, val3, val4, val5, val6 } = req.body
            userOtp = val1 + val2 + val3 + val4 + val5 + val6
            const otpCheck = await userSchema.findOne({email: req.session.unVerfiedMail, 'token.otp' : userOtp })
            if( otpCheck ) { 
                const timeDiff =  (new Date(enterTime) - otpCheck.token.generatedTime) / 1000 / 60
                if( timeDiff <= 60 ) {
                    console.log('otp matched');
                    res.render('auth/passwordReEnter',{
                        err : req.flash('err')
                    })
                } else {
                    console.log('timout');
                    res.redirect( '/otp-verification' )
                }
            } else {
                console.log('otp not matched');
                res.redirect('/otp-verification')
            }
            
        }catch(error){
            res.redirect('/500')
        }
    },
    getuserChangePassword : async(req,res) =>{
        res.render('auth/changepassword',{err:req.flash('existErr')})
    },
    changeUserPassword : async(req,res) =>{
        try{
            const user = req.session.user;
            const { oldpassword, password , confirmpassword} = req.body
            const userExist = await userSchema.findOne({_id : user})
           
            if (userExist) {
                const isPasswordMatch = await bcrypt.compare(oldpassword, userExist.password)

                if(isPasswordMatch){
                    const hashedNewPassword = await bcrypt.hash(password , 12);
                    await userSchema.updateOne({ _id: user }, { $set: { password: hashedNewPassword } });
                    return res.status(200).json({ success: true });
                }else {
                    return res.status(401).json({ oldpasswordwrong: true});                    
                }
            }else {
                return res.status(401).json({oldpassword : true});
            }

        }catch(error){
            console.log(error);
        }
    },
    newPassword:async(req,res)=>{
        try{
            const password=await bcrypt.hash(req.body.password,12)
            await userSchema.findOneAndUpdate({email:req.session.unVerfiedMail,isBlocked:false},{
                $set:{
                    password:password
                }
            })
            res.redirect('/login')
        }catch(error){
            res.redirect('/500')
        }
    },
    adminDashBoard : async(req,res) =>{
        try{
            res.render('admin/dashboard')
        }catch(error){
            console.log(error);
        
    }
},
getbestSelling:async(req,res)=>{
    try{
        res.render('admin/bestSelling')
    }catch(error){
        console.log(error);
    }
},
getBestSellingPage: async (req, res) => {
    try {
        res.render('admin/bestSelling', { data: [], selectedOption: '' });
    } catch (err) {
        console.error('Error rendering page:', err);
        res.status(500).send('Internal Server Error');
    }
},

filterBestSelling: async (req, res) => {
    try {
        const { option } = req.body;
        let data;

        if (option === 'products') {
            data = await getTopSellingProducts();
        } else if (option === 'categories') {
            data = await getTopSellingCategories();
        } else if (option === 'brands') {
            data = await getTopSellingBrands();
        } else {
            data = [];
        }

        res.render('admin/bestSelling', {
            data,
            selectedOption: option
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
    }
}
};

async function getTopSellingProducts() {
return await Order.aggregate([
    { $unwind: "$products" },
    {
        $lookup: {
            from: 'products',
            localField: 'products.productId',
            foreignField: '_id',
            as: 'productDetails'
        }
    },
    { $unwind: "$productDetails" },
    {
        $group: {
            _id: "$products.productId",
            productName: { $first: "$productDetails.name" },
            totalSales: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
        }
    },
    { $sort: { totalSales: -1 } },
    { $limit: 10 },
    {
        $project: {
            _id: 0,
            productName: 1,
            totalSales: 1
        }
    }
]);
}

async function getTopSellingCategories() {

     return await Order.aggregate([
        {$unwind: "$products"},
        {
            $lookup:{
                from:'products',
                localField :'products.productId',
                foreignField :'_id',
                as:'productDetails'
            }
        },
        {$unwind :"$productDetails"},
        {
            $lookup:{
                from:'categories',
                localField:'productDetails.category',
                foreignField: '_id',
                as:'categoryDetails'

            }
        },
        {$unwind : "$categoryDetails"},
        {
            $group:{
                _id:"$categoryDetails.category",
                categoryName:{ $first:"$categoryDetails.category"},
                totalSales: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }

            }
        },
        { $sort :{ totalSales:-1}},
        {$limit:10},
        {
            $project:{
                _id:0,
                categoryName:1,
                totalSales:1
            }
        }
     ]);







}




async function getTopSellingBrands() {
return await Order.aggregate([
    { $unwind: "$products" },
    {
        $lookup: {
            from: 'products',
            localField: 'products.productId',
            foreignField: '_id',
            as: 'productDetails'
        }
    },
    { $unwind: "$productDetails" },
    {
        $lookup: {
            from: 'brands',
            localField: 'productDetails.brand',
            foreignField: '_id',
            as: 'brandDetails'
        }
    },
    { $unwind: "$brandDetails" },
    {
        $group: {
            _id: "$productDetails.brand",
            brandName: { $first: "$brandDetails.brand" },
            totalSales: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
        }
    },
    { $sort: { totalSales: -1 } },
    { $limit: 10 },
    {
        $project: {
            _id: 0,
            brandName: 1,
            totalSales: 1
        }
    }
]);
}


