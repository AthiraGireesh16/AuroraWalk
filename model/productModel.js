const mongoose = require('mongoose')

const Schema = mongoose.Schema

const productSchema = Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'brand',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    discount: {
        type: Number,
        
    },
    image: {
        type: Array,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'offer'
    },
    review: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
    comment: {
            type: String
        },
        rating:{
            type: Number,
            min:1,
            max:5
        }
    }]
   
});
const Product = mongoose.model('product', productSchema);

module.exports = Product;