'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
require('dotenv').config();
const {app, runServer, closeServer} = require('../server');
const {User} = require('../api/users/models');
const {JWT_SECRET} = require('../config');
const { TEST_DATABASE_URL } = require('../config');
const { PackList } = require('../api/packList/models');
const faker = require('faker');

chai.use(chaiHttp);


  
function seedPackListData() {
  PackList.create({ 
    title: faker.random.words(),
    date_leave: faker.date.future(),
    date_return: faker.date.future(),
    pack: [{
      pack_item: faker.random.word(), 
      complete: false
    }],
    timestamp: faker.date.recent(0)
  });
}

function tearDownDb() {
  return new Promise((resolve, reject) => {
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}


describe('Protected endpoint', function() {
  const username = 'exampleUser';
  const password = 'examplePass';
  const email = 'exampleEmail@email.com';

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function () {
    return seedPackListData();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password =>
      User.create({
        username,
        password,
        email
      })
    );
  });

  afterEach(function () {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });


  describe('get requests', function() {
    it('Should reject requests with no credentials: packList', function() {
      return PackList.findOne()
        .then( function (res) {
          let result = res;
          return result;
        })
        .then( function(result) {
          let id = result._id;
          return chai.request(app)
            .get(`/api/packList/${id}`)
            .then((res) => {
              expect(res).to.have.status(401);
            })
            .catch(err => {
              if (err instanceof chai.AssertionError) {
                throw err;
              }
            });
        });
    });

    
    
    it('Should reject requests with an invalid token', function() {
      const token = jwt.sign(
        {
          username,
          email
        },
        'wrongSecret',
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      );

      return PackList.findOne()
        .then( function (res) {
          let result = res;
          return result;
        })
        .then( function(result) {
          let id = result._id;
          return chai.request(app)
            .get(`/api/packList/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
              expect(res).to.have.status(401);
            })
            .catch(err => {
              if (err instanceof chai.AssertionError) {
                throw err;
              }
            });
        });
    });
    it('Should reject requests with an expired token', function() {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          },
          exp: Math.floor(Date.now() / 1000) - 10
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username
        }
      );

      return PackList.findOne()
        .then( function (res) {
          let result = res;
          return result;
        })
        .then( function(result) {
          let id = result._id;
          return chai.request(app)
            .get(`/api/packList/${id}`)
            .then((res) => {
              expect(res).to.have.status(401);
            })
            .catch(err => {
              if (err instanceof chai.AssertionError) {
                throw err;
              }
            });
        });
    });
  });
});
