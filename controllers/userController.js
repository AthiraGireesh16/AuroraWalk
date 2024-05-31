const userSchema = require('../model/userModels')
const addressSchema = require('../model/addressModel')
module.exports = {
    getHomepage : async(req,res)=>{
        res.render('shop/home')
    },
    getUserProfile : async(req,res) =>{
        try{
            const user = await userSchema.findOne({_id:req.session.user})
            res.render('user/profile',{user:user})
        }catch(error){
            console.log(error);
        }
    },
    userAddress: async (req, res) => {
        try {
            const user = await userSchema.findOne({ _id: req.session.user });
            const address = await addressSchema.find({ userId: req.session.user });
            res.render('user/address', { user: user, address: address });
        } catch (error) {
            console.log(error);
        }
    },
    

    
    getAddAddress:(req,res)=>{
        res.render('user/add-address')
    },
    //Adding address
    addAddress:async(req,res)=>{
        try{
            const address=new addressSchema({
                fullName:req.body.fullName,
                mobile:req.body.mobile,
                landmark:req.body.landmark,
                street:req.body.street,
                village:req.body.village,
                city:req.body.city,
                pincode:req.body.pincode,
                state:req.body.state,
                country:req.body.country,
                userId:req.session.user
            })
            const result=await address.save()
            await userSchema.updateOne({_id:req.session.user},{
                $push:{address:result._id}
            })
            res.redirect('/user/address')
        }catch(error){
            res.redirect('/500')
        }
    },



    getAddress:async(req,res)=>{
        try{
            const user=await userSchema.find({_id:req.session.user}).populate({
                path:'address',
                model:'address',
                match:{status:true}
            })
            res.render('user/address',{
                user:user[0],
                address:user[0].address,
        
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    

    getEditAddress: async (req, res) => {
        try {
            const addressId = req.params.id;
            const address = await addressSchema.findOne({ _id: addressId });
            res.render('user/edit-address', { address: address });
        } catch (error) {
            res.redirect('/500');
        }
    },
    editAddress: async (req, res) => {
        const addressId = req.body.id;
        try {
            await addressSchema.updateOne({ _id: addressId }, {
                $set: {
                    fullName: req.body.fullName,
                    mobile: req.body.mobile,
                    landmark: req.body.landmark,
                    street: req.body.street,
                    village: req.body.village,
                    city: req.body.city,
                    pincode: req.body.pincode,
                    state: req.body.state,
                    country: req.body.country
                }
            });
            res.redirect('/user/address');
        } catch (error) {
            res.redirect('/500');
        }
    },

    removeAddress : async(req,res) =>{
        try{
            const addressId = req.params.id
        await addressSchema.deleteOne({_id:addressId})
        await userSchema.updateOne({_id:req.session.user},{$pull:{address:addressId}})
        res.status(200).json({success:true})
        }catch(error){
            console.log(error);
        }
        
    },
    editProfile : async(req,res)=>{
        try{
            await userSchema.updateOne({_id:req.session.user},{$set:{
                firstName : req.body.firstName,
                lastName : req.body.lastName,
                mobile : req.body.mobile,
                email : req.body.email
            }})
            res.status(200).json({status : true})
        }catch(error){
            console.log(error);
        }
    },


    

    depositwalletfunction: async function (req, res) {
        try {
            const userId = req.session.user;
            
            const amount = parseFloat(req.body.payment_amount);
            

            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ message: 'Invalid deposit amount' });
            }

            const user = await userSchema.findById(userId);
            

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            user.wallet = (user.wallet || 0) + amount;
            user.walletHistory.push({
                date: new Date(),
                amount: amount,
                message: 'Deposit'
            });

            await user.save();

            res.redirect('profile'); 
        } catch (error) {
            console.error('Error depositing amount:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },





    getWalletHistroy: async (req, res) => {
        try {
            const { user } = req.session;
            const userDetails = await userSchema.findOne({ _id: user });

            if (userDetails && userDetails.WalletHistroy) {
                userDetails.WalletHistroy.sort((a, b) => b.date - a.date);
            }
            
            res.render('user/wallet', { user: userDetails }); 
        } catch (error) {
            console.error(error);
            res.status(500).render('error', { error: error });
        }
    }
    
    

    
    
}