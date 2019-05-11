const mongoose = require('mongoose');  
const Schema   = mongoose.Schema;

const transactionSchema = new Schema({ 
  nested: { stuff: { type: String, lowercase: true, trim: true } }
});

module.exports = mongoose.model('Transaction', transactionSchema);