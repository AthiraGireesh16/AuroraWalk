const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const isAuth = require('../middleware/isAuth');
const isBlocked = require('../middleware/isBlocked');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const productController = require('../controllers/productController')
const couponController = require('../controllers/couponController')
const wishlistController = require('../controllers/wishlistController')

// router.get('/', shopController.getHome);
router.get('/shop',shopController.getShop);
router.get('/guestShop',shopController.getGuestShop);
router.get('/products/:id',shopController.getSingleProduct);

router.get('/products/:productId', shopController.getRelatedProducts);

router.get('/cart',isAuth.userAuth,cartController.getCart)
router.post('/add-to-cart',isAuth.userAuth,cartController.addToCart)
router.post('/decrease-cart',isAuth.userAuth,cartController.deCart)
router.patch('/removeCartItem',isAuth.userAuth,cartController.removeCartItem)


router.get('/checkout',isAuth.userAuth,isBlocked.isBlocked,shopController.getCheckOut)
router.get('/add-checkout-address',isAuth.userAuth,isBlocked.isBlocked,shopController.getCheckoutAddAddress)
router.post('/add-checkout-address',isAuth.userAuth,isBlocked.isBlocked,shopController.checkoutAddAddress)
router.post('/place-order',isAuth.userAuth,isBlocked.isBlocked,orderController.placeOrder)
router.get('/confirm-order',isAuth.userAuth,isBlocked.isBlocked,orderController.getConfirmOrder)
router.post('/confirm-order', orderController.confirmOrder);

router.post('/products/:productId/rate',isAuth.userAuth, productController.rateProduct)

//coupon

router.post('/apply-coupon',isAuth.userAuth,couponController.applyCoupn)
router.get('/cancelCoupon',isAuth.userAuth,couponController.cancelCouponuser)


//wishlist

router.post('/add-to-wishlist',isAuth.userAuth,wishlistController.addToWishlist)
router.get ( '/wishlist', isAuth.userAuth, wishlistController.getWishlist )
router.put( '/remove-wishlist-item', isAuth.userAuth, wishlistController.removeItem )



router.get('/payment-failed',  orderController.getPaymentFailed);








module.exports = router;