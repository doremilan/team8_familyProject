const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
  event: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  familyId: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  color: {
    type: String,
  },
});

eventSchema.virtual('eventId').get(function () {
  return this._id.toHexString();
});

eventSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Event', eventSchema);
