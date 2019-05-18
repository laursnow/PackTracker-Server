'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
require('dotenv').config();
const {app, runServer, closeServer} = require('../server');
const {User} = require('../api/users/models');
const { TEST_DATABASE_URL } = require('../config');
const expect = chai.expect;

chai.use(chaiHttp);

describe('/user endpoints', function() {
  const username = 'exampleuser';
  const password = 'examplePass';
  const email = 'email@email.com';

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  afterEach(function() {
    return User.remove({});
  });

  describe('/users', function() {
    describe('POST', function() {
      it('Should reject users with missing username', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            password,
            email
          })
          .then((res) => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('username');
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should reject users with missing email', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password
          })
          .then((res) => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('email');
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
     
      it('Should reject users with password under 8 chars', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password: '1234',
            email
          })
          .then((res) => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should reject users with invalid email', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password,
            email: 'email'
          })
          .then((res) => {
            expect(res).to.have.status(422);
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
     
      it('Should reject users with non-trimmed password', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password: ` ${password} `,
            email
          })
          .then((res) => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Cannot start or end with whitespace'
            );
            expect(res.body.location).to.equal('password');
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
    
      it('Should reject users with password greater than 72 characters', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password: new Array(73).fill('a').join(''),
            email
          })
          .then((res) => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should reject users with duplicate username', function() {
        return User.create({
          username,
          password,
          email
        })
          .then(() =>
            chai.request(app).post('/api/users').send({
              username,
              password,
              email: 'email2@email.com'
            })
          )
          .then((res) => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('username');
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should reject users with duplicate email', function() {
        return User.create({
          username: 'exampleuser2',
          password,
          email
        })
          .then(() =>
            chai.request(app).post('/api/users').send({
              username,
              password,
              email
            })
          )
          .then((res) => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('email');
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should create a new user', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            username,
            password,
            email
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys(
              'username',
              'email',
              'id',
              'author_of'
            );
            expect(res.body.username).to.equal(username);
            expect(res.body.email).to.equal(email);
          });
      });
    });
  });
});
