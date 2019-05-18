'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const packListSchema = mongoose.Schema({
  title: { type: String },
  date_leave: { type: Date },
  date_return: { type: Date },
  pack: [{
    pack_item: { type: String }, 
    complete: { type: Boolean, default: false } 
  }],
  timestamp: { type: Date, default: Date.now },
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', autopopulate: true}
},
{ collection: 'packlist'});
  
packListSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    date_leave: this.date_leave,
    date_return: this.date_return,
    pack: this.pack,
    timestamp: this.timestamp,
    user: this.user
  };
};

packListSchema.plugin(require('mongoose-autopopulate'));
const PackList = mongoose.model('PackList', packListSchema);

module.exports = { PackList };