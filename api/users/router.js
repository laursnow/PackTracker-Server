'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const userRouter = express.Router();
const jsonParser = bodyParser.json();
const {User} = require('./models');

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

userRouter.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password', 'email'];
  const missingField = requiredFields.find(field => !(field in req.body));
  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const explicityTrimmedFields = ['password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }


  let { username, password, email } = req.body;

  if (password.length < 8 || password.length > 72) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Password must be between 8 and 72 characters',
    });
  } 
  if (!validateEmail(email)) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Invalid e-mail address'
    });
  }

  return User.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }

      return User.find({email})
        .count()
        .then(count => {
          if (count > 0) {
            return Promise.reject({
              code: 422,
              reason: 'ValidationError',
              message: 'Email already taken',
              location: 'email'
            });
          }
          return User.hashPassword(password)
            .then(hash => {
              return User.create({
                username,
                password: hash,
                email
              });
            })

            .then(user => {
              return res.status(201).json(user.serialize());
            })
            .catch(err => {
              if (err.name === 'ValidationError') {
                res.status(412).json(err.message);
              }
              res.status(500).json({code: 500, message: 'Internal server error'});
            });
        });      
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});


module.exports = userRouter;