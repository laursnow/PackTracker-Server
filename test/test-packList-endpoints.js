'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
require('dotenv').config();
const { PackList } = require('../api/packList/models');
const { Travel } = require('../api/travel/models');
const { Activity } = require('../api/activity/models');
const { Lodging } = require('../api/lodging/models');
const { User } = require('../api/users/models');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');
const { closeServer, runServer, app } = require('../server');
const { TEST_DATABASE_URL } = require('../config');
const ObjectID = require('mongodb').ObjectID;
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

let _idActivity = new ObjectID();
let _idTravel = new ObjectID();
let _idLodging = new ObjectID();
let testUser;

function seedActivityData() {
  Activity.create({  
    _id: _idActivity,
    date: faker.random.number(),
    time: faker.date.future(),
    address: faker.address.streetAddress(),
    phone: faker.phone.phoneNumber(),
    email: faker.internet.email(),
    notes: faker.random.words(),
    ticket: faker.image.imageUrl()
  }); 
}

function seedLodgingData() {
  Lodging.create({  
    _id: _idLodging,
    check_in: faker.date.future(),
    check_out: faker.date.future(),
    address: faker.address.streetAddress(),
    phone: faker.phone.phoneNumber(),
    email: faker.internet.email(),
    notes: faker.random.words(),
    confirmation: faker.image.imageUrl()
  });
}
  

function seedTravelData() {
  Travel.create({  
    _id: _idTravel,
    depart: {
      date: faker.date.future(),
      time: faker.random.number(),
      location: faker.address.streetAddress(),
      mode: faker.random.word(),
      service: faker.random.word(),
      seat: faker.random.number(),
      notes: faker.random.words(),
      ticket: faker.image.imageUrl(), 
    },
    arrive: {
      date: faker.date.future(),
      time: faker.random.number(),
      location: faker.address.streetAddress(),
      mode: faker.random.word(),
      service: faker.random.word(),
      seat: faker.random.number(),
      notes: faker.random.words(),
      ticket: faker.image.imageUrl(), 
    }
  }); 
}

function seedPackListData() {
  for (let i = 1; i <= 10; i++) {
    PackList.create({ 
      title: faker.random.words(),
      date_leave: faker.date.future(),
      date_return: faker.date.future(),
      travel: _idTravel,
      lodging: _idLodging,
      activity: _idActivity,
      public: faker.random.boolean(),
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
    return seedTravelData();
  });

  beforeEach(function () {
    return seedLodgingData();
  });

  beforeEach(function () {
    return seedActivityData();
  });

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
              _result.should.include.keys('title', 'date_leave', 'date_return', 'travel', 'lodging', 'activity', 'public', 'timestamp', 'user');
              _result.title.should.equal(result.title);
              _result.travel[0]._id.should.equal(result.travel[0]._id.toString());
              _result.lodging[0]._id.should.equal(result.lodging[0]._id.toString());
              _result.activity[0]._id.should.equal(result.activity[0]._id.toString());
              _result.public.should.equal(result.public);
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
          title: 'Trip to Philadelphia',
          date_leave: '5/6/2019',
          date_return: '5/12/2019',
          public: false,
          user: testUser.id
        };
        return chai.request(app)
          .post('/api/packList')
          .set( 'Authorization', `Bearer ${ token }` )
          .send(newEntry)
          .then(function (res) {
            _result = res.body;
            _result.should.include.keys('id', 'title', 'date_leave', 'date_return', 'travel', 'lodging', 'activity', 'public', 'timestamp');
            //WHY WON'T USER SHOW UP?!!
            _result.title.should.equal(newEntry.title);
            _result.public.should.equal(newEntry.public);
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
        title: 'Trip to Seoul',
        date_leave: 'Thu, 25 Apr 2019 05:23:53 GMT',
        date_return: 'Wed, May 1 2019 09:23:53 GMT',
        public: false,
        user: testUser.id,
        timestamp: faker.date.recent(0)
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
        })
        .then( function(_result) {
          const dates = {_date_leave: _result.date_leave, _date_return: _result.date_return, _timestamp: _result.timestamp, date_leave: updateData.date_leave, date_return: updateData.date_return, timestamp: updateData.timestamp};
          makeDates(dates);
          _result.title.should.equal(updateData.title);
          _result.public.should.equal(updateData.public);
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
  