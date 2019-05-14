'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); 


mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: true,
  },
  author_of: [{type: mongoose.Schema.Types.ObjectId, ref: 'PackList', autopopulate: true}]
},
{ collection: 'users'});

UserSchema.methods.serialize = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    author_of: this.author_of,
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);
UserSchema.plugin(require('mongoose-autopopulate'));

module.exports = {User};
