const mongoose = require('mongoose');

const basePaySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  }
});

const snackSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
});

const BasePay = mongoose.model('BasePay', basePaySchema);
const Snack = mongoose.model('Snack', snackSchema);

module.exports = { BasePay, Snack };