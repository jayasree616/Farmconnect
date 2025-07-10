const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['farmer', 'laborer'], // Optional: add validation
    default: 'farmer'            // ✅ default so it’s not required in signup
  },
  contact: {
     type: String,
     required: true 
  } // ✅ Add this

});

module.exports = mongoose.model('User', UserSchema);
