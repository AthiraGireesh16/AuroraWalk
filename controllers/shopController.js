const productSchema = require('../model/productModel');
const categorySchema = require('../model/categoryModel');
const brandSchema = require('../model/brandModel');
const paginationHelper = require('../helpers/paginationHelper');
const { search } = require('../routers/shopRouter');
const cartSchema = require('../model/cartModel')
const addressSchema = require('../model/addressModel')
const userSchema = require('../model/userModels')
const cartHelper = require('../helpers/cartHelper')

const couponHelper=require('../helpers/couponHelper') 

module.exports = {
    getGuestShop: async (req, res) => {
        try {
            const { cat, brand, search, sort , hideOutOfStock } = req.query;
            const userLoggedin = req.session.user;
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
                page = 1;
            }
            const condition = {
                status: true
            };
            if (cat) {
                condition.category = cat;
            }
            if (brand) {
                condition.brand = brand;
            }
            if (search) {
                condition.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ];
            }

            if (hideOutOfStock === 'true') { // If hideOutOfStock is set to 'true', filter out products with quantity 0
                condition.quantity = { $gt: 0 };
            }
    
            // Sort condition based on the value of 'sort'
            let sortCondition = {};
            if (sort === 'price_low_to_high') {
                sortCondition = { price: 1 };
            } else if (sort === 'price_high_to_low') {
                sortCondition = { price: -1 };
            } else if (sort === 'name_aA_to_zZ') {
                sortCondition = { name: 1 };
            } else if (sort === 'name_Aa_to_Zz') {
                sortCondition = { name: -1 };
            }else if (sort === 'popularity') {
                sortCondition = { popularity: -1 }; 
            }

            
    
            // const productCount = await productSchema.find(condition).countDocuments();
            // const products = await productSchema.find(condition)
            //     .populate({
            //         path: "category",
            //         match: { status: true }
            //     })
            //     .populate({
            //         path: "brand",
            //         match: { status: true }
            //     })
            const productCount=await productSchema.find(condition).count()
            const products=await productSchema.find(condition).populate({
                path : 'offer',
                match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
            })
            .populate({
                path : 'category',
                populate : {
                    path : 'offer',
                    match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                }
            })
                .sort(sortCondition) // Apply sorting
                .skip((page - 1) * paginationHelper.ITEMS_PER_PAGE)
                .limit(paginationHelper.ITEMS_PER_PAGE);


                const newproducts = await productSchema.find()
                .populate({
                    path : 'offer',
                    match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                })
                .populate({
                    path : 'category',
                    populate : {
                        path : 'offer',
                        match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                    }
                })
                .sort({_id : -1}).limit(3)
                //.skip((page - 1) * paginationHelper.NEW_PRODUCTS_PER_PAGE)
                //.limit(paginationHelper.NEW_PRODUCTS_PER_PAGE);
    
            const filteredProducts = products.filter(product => product.category && product.brand);
            const newfilteredProducts = newproducts.filter(product => product.category && product.brand);  // Pagination
            const category = await categorySchema.find({ status: true });
            const brands = await brandSchema.find({ status: true });
            const startingNo = ((page - 1) * paginationHelper.ITEMS_PER_PAGE) + 1;
            const endingNo = Math.min(startingNo + paginationHelper.ITEMS_PER_PAGE);
            res.render('shop/nonUser', {
                userLoggedin: userLoggedin,
                products: filteredProducts,
                newproducts:newfilteredProducts,
                category: category,
                brands: brands,
                totalCount: productCount,
                currentPage: page,
                hasNextPage: page * paginationHelper.ITEMS_PER_PAGE < productCount, // Checks if there is any product to show to next page
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(productCount / paginationHelper.ITEMS_PER_PAGE || 1),
                startingNo: startingNo,
                endingNo: endingNo,
                cat: cat,
                brand: brand,
                search: search,
                sort: sort,
                hideOutOfStock: hideOutOfStock
            });
        } catch (error) {
            res.redirect(error);
        }
    },   
    getShop: async (req, res) => {
        try {
            const { cat, brand, search, sort , hideOutOfStock } = req.query;
            const userLoggedin = req.session.user;
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
                page = 1;
            }
            const condition = {
                status: true
            };
            if (cat) {
                condition.category = cat;
            }
            if (brand) {
                condition.brand = brand;
            }
            if (search) {
                condition.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ];
            }

            if (hideOutOfStock === 'true') { // If hideOutOfStock is set to 'true', filter out products with quantity 0
                condition.quantity = { $gt: 0 };
            }
    
            // Sort condition based on the value of 'sort'
            let sortCondition = {};
            if (sort === 'price_low_to_high') {
                sortCondition = { price: 1 };
            } else if (sort === 'price_high_to_low') {
                sortCondition = { price: -1 };
            } else if (sort === 'name_aA_to_zZ') {
                sortCondition = { name: 1 };
            } else if (sort === 'name_Aa_to_Zz') {
                sortCondition = { name: -1 };
            }else if (sort === 'popularity') {
                sortCondition = { popularity: -1 }; 
            }

            
    
            // const productCount = await productSchema.find(condition).countDocuments();
            // const products = await productSchema.find(condition)
            //     .populate({
            //         path: "category",
            //         match: { status: true }
            //     })
            //     .populate({
            //         path: "brand",
            //         match: { status: true }
            //     })
            const productCount=await productSchema.find(condition).count()
            const products=await productSchema.find(condition).populate({
                path : 'offer',
                match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
            })
            .populate({
                path : 'category',
                populate : {
                    path : 'offer',
                    match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                }
            })
                .sort(sortCondition) // Apply sorting
                .skip((page - 1) * paginationHelper.ITEMS_PER_PAGE)
                .limit(paginationHelper.ITEMS_PER_PAGE);


                const newproducts = await productSchema.find()
                .populate({
                    path : 'offer',
                    match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                })
                .populate({
                    path : 'category',
                    populate : {
                        path : 'offer',
                        match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                    }
                })
                .sort({_id : -1}).limit(3)
                //.skip((page - 1) * paginationHelper.NEW_PRODUCTS_PER_PAGE)
                //.limit(paginationHelper.NEW_PRODUCTS_PER_PAGE);
    
            const filteredProducts = products.filter(product => product.category && product.brand);
            const newfilteredProducts = newproducts.filter(product => product.category && product.brand);  // Pagination
            const category = await categorySchema.find({ status: true });
            const brands = await brandSchema.find({ status: true });
            const startingNo = ((page - 1) * paginationHelper.ITEMS_PER_PAGE) + 1;
            const endingNo = Math.min(startingNo + paginationHelper.ITEMS_PER_PAGE);
            res.render('shop/shop', {
                userLoggedin: userLoggedin,
                products: filteredProducts,
                newproducts:newfilteredProducts,
                category: category,
                brands: brands,
                totalCount: productCount,
                currentPage: page,
                hasNextPage: page * paginationHelper.ITEMS_PER_PAGE < productCount, // Checks if there is any product to show to next page
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(productCount / paginationHelper.ITEMS_PER_PAGE || 1),
                startingNo: startingNo,
                endingNo: endingNo,
                cat: cat,
                brand: brand,
                search: search,
                sort: sort,
                hideOutOfStock: hideOutOfStock
            });
        } catch (error) {
            res.redirect(error);
        }
    },   
    
    getSingleProduct: async(req, res) => {
        try {
            const productId = req.params.id;
            const product = await productSchema.find({ _id : req.params.id, status : true })
                .populate({
                    path : 'offer',
                    match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                })
                .populate({
                    path : 'category',
                    populate : {
                        path : 'offer',
                        match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                    }
                })
                .populate({
                    path: 'review.userId',
                });  
            
            const relatedProducts = await productSchema.find({ category: product.category, _id: { $ne: productId }, status: true }).limit(4);

            // const breadcrumbs = [
            //     { name: 'Home', link: '/landing' },
            //     { name: 'Shop', link: '/shop' },
            //     { name: 'Products', link: '/products/:_id' } 
            // ];

           // console.log(relatedProducts);
            res.render('shop/single-product', {
                product,
                userLoggedin : req.session.user,
                relatedProducts
            });
        } catch(error) {
            console.error(error);
            res.redirect('/');
        }
    },

    getRelatedProducts: async (req, res, next) => {
        try {
            const mainProductId = req.params.productId;
            const mainProduct = await productSchema.findById(mainProductId);
            if (!mainProduct) {
                return res.status(404).json({ message: 'Main product not found' });
            }
    
            const relatedProducts = await productSchema.find({ category: mainProduct.category, _id: { $ne: mainProductId }, status: true }).limit(4);
    
            res.render('single-product', { product: mainProduct, relatedProducts: relatedProducts });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },



    getCheckOut : async( req, res ) => {
        try {
            const { user } = req.session
            const cartAmount = await cartHelper.totalCartPrice( user )
            const cart = await cartSchema.findOne({ userId : user })
            const userDetails = await userSchema.findOne({ _id : user })
            let discounted
            if( cart && cart.coupon && cartAmount && cartAmount.length > 0 ) {
                discounted = await couponHelper.discountPrice( cart.coupon, cartAmount[0].total )
            }
            const address = await userSchema.findOne({ _id : user }).populate( 'address' )
            const addresses = address.address.reverse()
            const flashMessages = req.flash()
            res.render( 'shop/checkout', {
                cartAmount : cartAmount,
                address : addresses,
                discounted : discounted,
                user : userDetails,
                 messages: flashMessages 
    
            })
        } catch ( error ) {
            console.log(error);
        }
    },
    getCheckoutAddAddress:async(req,res)=>{
        res.render('shop/checkout-address')
    },
    
    
    checkoutAddAddress : async (req,res) =>{
        try{
            const address = new addressSchema({
                fullName : req.body.fullName,
                mobile : req.body.mobile,
                street : req.body.street,
                village : req.body.village,
                city : req.body.city,
                pincode : req.body.pincode,
                landmark : req.body.landmark,
                state : req.body.state,
                country : req.body.country,
                userId : req.session.user
    
            })
    
            const result = await address.save()
            await userSchema.updateOne({_id:req.session.user},{$push :{address : result._id}})
            res.redirect('/checkout')
        }catch(error){
            console.log(error);
        }
    }
    
    
    
};
