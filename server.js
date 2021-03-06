'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');
const packListRouter = require('./api/packList/router');
const userRouter = require('./api/users/router');
const { localStrategy, jwtStrategy } = require('./auth/strategies');
const authRouter = require('./auth');

const { PORT, DATABASE_URL, CLIENT_ORIGIN } = require('./config');

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

app.use('/api/packList', packListRouter);
app.use('/api/users', userRouter);
app.use('/auth', authRouter);
mongoose.Promise = global.Promise;

passport.use(localStrategy);
passport.use(jwtStrategy);


// Logging
app.use(morgan('common'));


let server;

function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };