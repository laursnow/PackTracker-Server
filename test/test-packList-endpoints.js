'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
require('dotenv').config();
const { PackList } = require('../api/packList/models');
const { User } = require('../api/users/models');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');
const { closeServer, runServer, app } = require('../server');
const { TEST_DATABASE_URL } = require('../config');
const { expect } = require('chai');
const should = chai.should();
const assert = require('assertthat');

chai.use(chaiHttp);

function tearDownDb() {
  return new Promise((resolve, reject) => {
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}


let testUser;

function seedPackListData() {
  for (let i = 1; i <= 10; i++) {
    PackList.create({ 
      title: faker.random.words(),
      date_leave: faker.date.future(),
      date_return: faker.date.future(),
      pack: [{
        pack_item: faker.random.word(), 
        complete: false
      }],
      timestamp: faker.date.recent(0),
      user: testUser.id })
      .then( function(post) {
        return User.findOneAndUpdate({username: testUser.username}, { $push: {author_of: post.id}});
      });
  }}

function makeDates (dates) {
  const makeDatesObj = {};
  Object.keys(dates).forEach(function (key) {
    let value = dates[key];
    makeDatesObj[key] = new Date(value);
  });
  formatDates(makeDatesObj);
}

function formatDates (dates) {
  const formatDatesObj = {};
  Object.keys(dates).forEach(function (key) {
    let value = dates[key];
    formatDatesObj[key] = value.toGMTString();
  });
  checkDates(formatDatesObj);
}

// dates are checked below after running through above logic to convert them to consistent GMT formatting
function checkDates (dates) {
  dates._date_leave.should.equal(dates.date_leave);
  dates._date_return.should.equal(dates.date_return);
  dates._timestamp.should.equal(dates.timestamp);
}

describe('Itinerator API resource: PackList', function () {
  const username = faker.random.word(1);
  const password = 'dummyPw1234';
  const email = faker.internet.email();

  before(function () {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password => {
      return User.create({
        username,
        password,
        email
      })
        .then((user) => {
          testUser = user;});
    }
    );});

  beforeEach(function () {
    return seedPackListData();
  });

  afterEach(function () {
    return tearDownDb();
  });

  after(function () {
    return closeServer();
  });


  describe('GET endpoint', function () {

    it('should return single selected packList', function () 
    {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
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
            .set( 'Authorization', `Bearer ${ token }` )
            .then((res) => {
              let _result = res.body;
              let _id = _result.id;
              expect(_result).to.exist;
              expect(_result).to.be.a('object');
              expect(_id).to.equal(id.toString());
            });
        });
    });

    it('should return post with correct fields', function ()
    {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
      return PackList.findOne()
        .then( function (res) {
          let result = res.toJSON();
          return result;
        })
        .then( function(result) {
          let id = result._id;
          return chai.request(app)
            .get(`/api/packList/${id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .then( function(res) {
              let _result = res.body;
              const dates = {_date_leave: _result.date_leave, _date_return: _result.date_return, _timestamp: _result.timestamp, date_leave: result.date_leave, date_return: result.date_return, timestamp: result.timestamp};
              makeDates(dates);
              _result.should.include.keys('id', 'title', 'date_leave', 'date_return', 'pack', 'timestamp', 'user');
              _result.title.should.equal(result.title);
              _result.pack[0].pack_item.should.equal(result.pack[0].pack_item);
              _result.user._id.should.equal(result.user._id.toString());
            });
        });
    });
  });

  describe('POST endpoint', function () {
    it('should create a new packList and update user record',
      function () {

        const token = jwt.sign(
          {
            user: {
              username,
              email
            }
          },
          JWT_SECRET,
          {
            algorithm: 'HS256',
            subject: username,
            expiresIn: '7d'
          }
        );
        let _result;
        const newEntry = {
          title: 'Toronto',
          date_leave: '08/02/2019',
          date_return: '08/16/2019',
          pack: [{pack_item :'Wallet'}, {pack_item: 'Jacket'}, {pack_item: 'Passport'}]
        };
        
        return chai.request(app)
          .post('/api/packList')
          .set( 'Authorization', `Bearer ${ token }` )
          .send(newEntry)
          .then(function (res) {
            _result = res.body;
            _result.should.include.keys('id', 'title', 'date_leave', 'date_return', 'pack', 'timestamp');
            _result.title.should.equal(newEntry.title);
            _result.pack[0].pack_item.should.equal(newEntry.pack[0].pack_item);
            _result.id.should.not.be.null;
            return PackList.findById(_result.id);
          })
          .then(function (entry) {
            entry.title.should.equal(newEntry.title);
            return User.find({username: testUser.username})
              .then(function(user) {
                user[0].author_of.should.have.lengthOf.at.least(1);
                assert.that(user[0].author_of.toString()).is.containing(_result.id.toString());   
              });
          });
      });
  });

  describe('PUT endpoint', function () {
    it('should update selected packList', function () {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
        
      const updateData = {
        title: 'Toronto',
        date_leave: '08/02/2019',
        date_return: '08/16/2019',
        pack: [{pack_item :'Wallet'}, {pack_item: 'Passport'}]
      };
      return PackList.findOne()
        .then( function(result) {
          updateData.id = result.id;
          return chai.request(app)
            .put(`/api/packList/${updateData.id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(200);
          return PackList.findById(updateData.id);
        });
    });
  });
  describe('DELETE endpoint', function () {
    it('should delete selected packList and update user record', function () {
    
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
    
      let entry;
    
      return PackList.findOne()
        .then(post => {
          entry = post;
          return chai.request(app)
            .delete(`/api/packList/${entry.id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .send({id: post.id});
        })
        .then( function(res) {
          res.should.have.status(204);
          return PackList.findById(entry.id);
        })
        .then(post => {
          should.not.exist(post);
          return User.find({username: testUser.username})
            .then(function(user) {
              assert.that(user[0].author_of.toString()).is.not.containing(entry.id);
            });
        });
    });
  });
});
  