const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  farmerName: { type: String, required: true },
  location: { type: String, required: true },
  workType: { type: String, required: true },
  date: { type: String, required: true },
  wage: { type: Number, required: true },
  applicants: [
  {
    email: String,
    contact: String, // ✅ This must exist
    appliedAt: { type: Date, default: Date.now },
    accepted: { type: Boolean, default: false } // ✅ NEW FIELD
  }]

});

module.exports = mongoose.model('Job', JobSchema);
