const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categoryOfferSchema = new Schema({
  offerType: {
    type: String,
    enum: ['percentage', 'amount'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('CategoryOffer', categoryOfferSchema);
