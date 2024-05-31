const orderSchema =require('../model/orderModel')
const cartSchema = require('../model/cartModel')
const productSchema = require('../model/productModel')
const userSchema = require('../model/userModels')
const cartHelper = require('../helpers/cartHelper')
const paginationHelper=require('../helpers/paginationHelper')
const couponSchema=require('../model/couponModel')
const couponHelper=require('../helpers/couponHelper')
const paymentHelper = require('../helpers/paymentHelper')
const moment = require('moment');
const axios = require('axios');
const {RAZORPAY_KEY_SECRET} = process.env
const crypto=require('crypto')
const { log } = require('console')

module.exports = {
    updatePaymentStatus: async (orderId) => {
        try {
            await orderSchema.updateOne({ _id: orderId }, { $set: { paymentStatus: 'Success' } });
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    },
    

    placeOrder : async ( req, res ) => {
        try {
          
            const { user } = req.session
            const products =  await cartHelper.totalCartPrice( user )
            const { paymentMethod, addressId ,walletAmount} = req.body
            const productCount = await cartHelper.updateQuantity( user )
            if( productCount){
                //If product is not available when we are at checkout
                req.session.productCount-=productCount
            res.json({outofStock:true})
            }else{
            let walletBalance
            if( walletAmount ){
                walletBalance = Number( walletAmount )
            }
            const productItems = products[0].items
            const cartProducts = productItems.map( ( items ) => ({
                productId : items.productId,
                quantity : items.quantity,
                price : ( items.totalPrice )
            }))
            const cart = await cartSchema.findOne({ userId : user })
            const totalAmount = await cartHelper.totalCartPrice( user );
            let discounted= {};
            if( cart && cart.coupon && totalAmount && totalAmount.length > 0 ) {
                discounted = await couponHelper.discountPrice( cart.coupon, totalAmount[0].total )
                await couponSchema.updateOne({ _id : cart.coupon},{
                    $push : {
                        users : user
                    }
                })
            }
            let discountAmount=0
            if(discounted.discountAmount>0){
             discountAmount=discounted.discountAmount
            }
            const totalPrice = discounted && discounted.discountedTotal ? discounted.discountedTotal : totalAmount[0].total
            let walletUsed, amountPayable
            if( walletAmount ) {
                if( totalPrice > walletBalance ) {
                    amountPayable = totalPrice - walletBalance
                    walletUsed = walletBalance
                } else if( walletBalance > totalPrice ) {
                    amountPayable = 0
                    walletUsed = totalPrice
                }
            } else {
                amountPayable = totalPrice
            }
            const generatedID = Math.floor(100000 + Math.random() * 900000);
            let existingOrder = await orderSchema.findOne({ orderId: generatedID });
    
          
            while (existingOrder) {
                generatedID = Math.floor(100000 + Math.random() * 900000);
                existingOrder = orderSchema.findOne({ orderId: generatedID });
            }
    
            // Use the generated unique orderId for the new order
            const orderId = `ORD${generatedID}`;
            
            let orderStatus = paymentMethod === 'COD' ? 'Confirmed' : 'Pending';
            if (amountPayable === 0 || paymentMethod === 'razorpay') {
                orderStatus = 'Confirmed';
            }
            const order = new orderSchema({
                userId : user,
                orderId:orderId,
                products : cartProducts,
                totalPrice : totalPrice,
                paymentMethod : paymentMethod,
                orderStatus : orderStatus,
                address : addressId,
                walletUsed : walletUsed,
                amountPayable : amountPayable,
                discounted:discountAmount
            })
            const ordered = await order.save()
            
            for( const items of cartProducts ){
                const { productId, quantity } = items
                await productSchema.updateOne({_id : productId},
                    { $inc : { quantity :  -quantity  }})
                } 
            
            await cartSchema.deleteOne({ userId : user })
            req.session.productCount = 0
            if(  paymentMethod === 'COD' || amountPayable === 0 ){
               
                    if( walletAmount ) {
                        await userSchema.updateOne({ _id : user }, {
                            $inc : {
                                wallet : -walletUsed
                            },
                            $push : {
                                walletHistory : {
                                    date : Date.now(),
                                    amount : -walletUsed,
                                    message : 'Used for purachse'
                                }
                            }
                        })
                    }
                    return res.json({ success : true})
            } else if( paymentMethod === 'razorpay'){
                // Razorpay 
                const payment = await paymentHelper.razorpayPayment( ordered._id, amountPayable )
                res.json({ payment : payment , success : false  })
            }
        }
        } catch ( error ) {
            res.redirect('/500')
        }
    },



    getConfirmOrder: async (req, res) => {
        try {
            const { user } = req.session;
            
            await cartHelper.totalCartPrice(user);
           
    
            const lastOrder = await orderSchema.findOne({ userId: user })
                .sort({ date: -1 })
                .populate({
                    path: 'products.productId',
                    populate: { path: 'brand' }
                })
                .populate('address');
           
            if (lastOrder) {
                if (lastOrder.orderStatus === 'Pending') {
                    
                    if (lastOrder.paymentStatus === 'Success') {
                        
                        await orderSchema.updateOne(
                            { _id: lastOrder._id },
                            { $set: { orderStatus: 'Confirmed', paymentStatus: 'Confirmed' } }
                        );
                        
                        lastOrder.orderStatus = 'Confirmed';
                        lastOrder.paymentStatus = 'Confirmed';
                    } else {
                        
                        await orderSchema.updateOne(
                            { _id: lastOrder._id },
                            { $set: { orderStatus: 'Failed', paymentStatus: 'Failed' } }
                        );
                        
                        lastOrder.orderStatus = 'Failed';
                        lastOrder.paymentStatus = 'Failed';
                    }
                } else {
                    
                    if (lastOrder.paymentStatus === 'Pending') {
                        
                        await orderSchema.updateOne(
                            { _id: lastOrder._id },
                            { $set: { paymentStatus: 'Confirmed' } }
                        );
                        
                        lastOrder.paymentStatus = 'Confirmed';
                    }
                }
            } 
            res.render('shop/confirm-order', {
                order: lastOrder,
                products: lastOrder ? lastOrder.products : []
            });
           
        } catch (error) {
            
            res.redirect('/500');
        }
    },
    confirmOrder: async (req, res) => {
        const { paymentId } = req.body;
        try {
            // Simulate payment verification logic with Razorpay (replace with actual verification)
            const paymentVerified = true; // Assume payment verification succeeded
            console.log('Payment verification result:', paymentVerified);
    
            if (paymentVerified) {
                const { user } = req.session;
    
                await cartHelper.totalCartPrice(user);
    
                const lastOrder = await orderSchema.findOne({ userId: user })
                    .sort({ date: -1 })
                    .populate({
                        path: 'products.productId',
                        populate: { path: 'brand' }
                    })
                    .populate('address');
    
                if (lastOrder) {
                    // Check if both order and payment statuses are 'Pending'
                    if (lastOrder.orderStatus === 'Pending' && lastOrder.paymentStatus === 'Pending') {
                        // Update both statuses to 'Confirmed'
                        await orderSchema.updateOne(
                            { _id: lastOrder._id },
                            { $set: { orderStatus: 'Confirmed', paymentStatus: 'Confirmed' } }
                        );
                        lastOrder.orderStatus = 'Confirmed';
                        lastOrder.paymentStatus = 'Confirmed';
                    } else {
                        // Handle other scenarios (e.g., payment failed, statuses already updated)
                        // This block will execute if either status is not 'Pending'
                        console.log('Order or payment status is not Pending');
                    }
                }
    
                // Send JSON response after successful confirmation
                res.json({ success: true });
            } else {
                res.status(400).json({ success: false, message: 'Payment verification failed' });
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            res.status(500).json({ success: false, message: 'Error confirming order' });
        }
    },
    
    
    




    getOrder : async(req,res) =>{
        try{
            const {user} = req.session
            const orders = await orderSchema.find({userId : user}).sort({date : -1}).populate('address').populate({
                path : 'products.productId',
                populate : {
                    path : 'brand'
                }
            })
            const userDetails = await userSchema.findOne({_id : user})
            res.render('user/orders',{
                orders : orders,
                user : userDetails,
                now : new Date()
            })
        }catch(error){
            console.log(error);
        }
    },


    userOrderProducts : async(req,res) =>{
        try{
            const {id} = req.params
            const order = await orderSchema.findOne({_id : id}).populate('address').populate('address').populate({
                path : 'products.productId',
                populate :{
                    path : 'brand' 
                }
            })

            res.render('user/order-products',{
                order : order,
                products : order.products
            })
        }catch(error){
            console.log(error);
        }
    },



    cancelOrder: async (req, res) => {
        try {
            const { orderId, status } = req.body;
            const { user } = req.session;
            const order = await orderSchema.findOne({ _id: orderId });
            if (order.paymentMethod === 'razorpay') {
                // Refund the amount to the wallet
                await userSchema.updateOne({ _id: user }, {
                    $inc: { wallet: order.totalPrice },
                    $push: {
                        walletHistory: {
                            date: Date.now(),
                            amount: order.totalPrice,
                            message: 'Refund for canceled order (Razorpay)'
                        }
                    }
                });
            }
            await orderSchema.findOneAndUpdate({ _id: orderId }, { $set: { orderStatus: status } });
            const newStatus = await orderSchema.findOne({ _id: orderId });
            res.status(200).json({ success: true, status: newStatus.orderStatus });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },
    
    getreturnOrder : async(req,res) =>{
        const orderId=req.params.id
   
    res.render('shop/return',{orderId:orderId})
    },

    returnOrder:async(req,res)=>{
        const orderId=req.query.orderId
        const {user}=req.session
        const reason=req.body.returnReason
        const message=req.body.message
        const order=await orderSchema.findOne({_id:orderId})
        if(reason === 'Other'){
            for(let products of order.products){
                await productSchema.updateOne({_id:products.productId},{
                    $inc:{
                        quantity: products.quantity
                    }
                })
            }
        }
        await orderSchema.updateOne({_id:orderId},{
            $set:{
                orderStatus:'Returned',ReturnReason:message
            }
        })
        await userSchema.updateOne({_id:user},{
            $inc:{
                wallet:order.totalPrice
            },
            $push:{
                walletHistory:{
                    date:new Date(),
                    amount:order.totalPrice,
                    message:"Deposit on return"
                }
            }
        },)
        res.redirect('/user/orders')
        
       },








    
    getAdminOrderList : async(req,res) =>{
        try{
            const {sortData , sortOrder} = req.query
            let page = Number(req.query.page)
            if(isNaN(page) || page < 1){
                page = 1
            }
            const sort = {}
            if(sortData) {
                if(sortOrder === "Ascending"){
                    sort[sortData] = 1
                }else{
                    sort[sortData] = -1
                }
            }else{
                sort['date'] = -1
            }

            const ordersCount = await orderSchema.find().count()
            const orders = await orderSchema.find().sort(sort)
            .skip((page - 1)*paginationHelper.ORDER_PER_PAGE)
            .populate('userId')
            .populate('products.productId')
            .populate('address')

            res.render('admin/orders',{
                orders : orders,
                currentPage: page,
                hasNextPage: page * paginationHelper.ORDER_PER_PAGE < ordersCount,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(ordersCount / paginationHelper.ORDER_PER_PAGE),
                // search: search,
                sortData: sortData,
                sortOrder: sortOrder,
            })
        }catch(error){
            console.log(error);
        }
    },
    orderDetails : async(req,res) =>{
        try{
            const {id} = req.params
            const order = await orderSchema.findOne({_id:id})
            .populate('products.productId')
            .populate('address')
            .populate({
                path : 'products.productId',
                populate : {
                    path : 'brand'
                }
            })

            res.render('admin/order-products',{
                order : order ,
                 products : order.products,
                 admin : true
            })
        }catch(error){
            console.log(error);
        }
    },
    changeOrderStatus : async(req,res) =>{
        try{
            const {status,orderId} = req.body
            if(status === 'Cancelled'){
                // if the order is cancelled 
                const order = await orderSchema.findOne({_id : orderId})
                for(let produts of order.products){
                    await productSchema.updateOne({_id : products.productId},{$inc : {quantity : products.quantity}})

                }
                await orderSchema.findOneAndUpdate({_id : orderId},{$set : {orderStatus : status}})
            }else {
                await orderSchema.findOneAndUpdate({_id : orderId},{$set : {orderStatus : status}})
            }

            const newStatus = await orderSchema.findOne({_id : orderId})
            res.status(200).json({success : true , status : newStatus.orderStatus})
        }catch(error){
            console.log(error);
        }
    },
    
    getSalesReport: async (req, res) => {
        try {
            const { from, to, period, sortData, sortOrder } = req.query;
            const currentDate = new Date();
            let startDate, endDate;
    
            // Determine startDate and endDate based on period
            switch (period) {
                case 'daily':
                    startDate = new Date(currentDate);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(currentDate);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'weekly':
                    startDate = new Date(currentDate);
                    startDate.setDate(currentDate.getDate() - 6); 
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(currentDate);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'monthly':
                    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'yearly':
                    startDate = new Date(currentDate.getFullYear(), 0, 1);
                    endDate = new Date(currentDate.getFullYear(), 11, 31);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                default:
                    startDate = new Date(1970, 0, 1); // Default start date if none is provided
                    endDate = new Date();
                    break;
            }
    
            const conditions = {
                orderStatus: 'Delivered' // Add this condition to filter only 'delivered' orders
            };
            
            if (from && to) {
                conditions.date = {
                    $gte: new Date(from),
                    $lte: new Date(to)
                };
            } else if (from) {
                conditions.date = {
                    $gte: new Date(from)
                };
            } else if (to) {
                conditions.date = {
                    $lte: new Date(to)
                };
            } else if (startDate && endDate) {
                conditions.date = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
    
           
            const sort = {};
            if (sortData) {
                sort[sortData] = sortOrder === "Ascending" ? 1 : -1;
            } else {
                sort['date'] = sortOrder === "Ascending" ? 1 : -1;
            }
    
            const orders = await orderSchema.find(conditions).sort(sort);
            const overallSalesCount = orders.length;
            let overallOrderAmount = 0;
            let overallDiscountAmount = 0;
    
            for (const order of orders) {
                overallOrderAmount += order.totalPrice;
                overallDiscountAmount += order.discounted || 0;
            }
    
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
                page = 1;
            }
    
            const orderCount = await orderSchema.countDocuments(conditions);
            const limit = req.query.seeAll === "seeAll" ? orderCount : paginationHelper.SALES_PER_PAGE;
            const filteredOrders = await orderSchema.find(conditions)
                .sort(sort)
                .skip((page - 1) * paginationHelper.SALES_PER_PAGE)
                .limit(limit);
    
           
            res.render('admin/sales-report', {
                admin: true,
                orders: filteredOrders,
                from: from,
                to: to,
                period: period,
                currentPage: page,
                hasNextPage: page * paginationHelper.SALES_PER_PAGE < orderCount,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(orderCount / paginationHelper.SALES_PER_PAGE),
                sortData: sortData,
                sortOrder: sortOrder,
                overallSalesCount: overallSalesCount,
                overallOrderAmount: overallOrderAmount,
                overallDiscountAmount: overallDiscountAmount
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },
    getPaymentFailed: async (req, res) => {
        try {
            const { user } = req.session;
    
            
    
            const lastOrder = await orderSchema.findOne({ userId: user })
                .sort({ date: -1 })
                .populate({
                    path: 'products.productId',
                    populate: { path: 'brand' }
                })
                .populate('address');
    
    
            if (lastOrder) {
                // Update the order status and payment status to "Pending" in the database
                await orderSchema.updateOne({ _id: lastOrder._id }, { $set: { 
                    orderStatus: 'Pending', paymentStatus: 'Pending' }});
    
                res.render('shop/payment-failed', {
                    order: lastOrder,
                    products: lastOrder.products,
                    moment: moment
                });
            } else {
                res.render('shop/payment-failed', {
                    order: null,
                    products: [],
                    moment: moment
                });
            }
        } catch (error) {
           
            res.redirect('/500');
        }
    }
    
    
    
    
}