process.env.NODE_ENV = 'test';

import MongooseClient from '../src/helpers/MongooseClient';
import chai from 'chai'
import chaiHttp from 'chai-http'
import { EHttpStatusCode } from '../src/enums/EHttpError';

const server = require('../server')
let should = chai.should()

chai.use(chaiHttp)

const testUser = {
  email: "test.user@gmail.com",
  password: "testing_password123",
  confirmPassword: "testing_password123",
  verified: true
}

const testUser2 = {
  email: "blabla.user@gmail.com",
  password: "testing_password456",
  confirmPassword: "testing_password456",
  verified: true
}

let token;
let userId;

describe('Users', () => {
  before('Clean database before tests', (done) => {
    MongooseClient.User.deleteMany({}, err => {
      done()
    })
  })
  describe('[POST] /', () => {
    it("should create a first user as admin", done => {
      chai.request(server)
      .post('/users')
      .send(testUser)
      .end((err, res) => {
        if (err) {
          console.log(err.message)
          done()
        }
        console.log(res.body)
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('role').eql('admin')
        done()
      })
    })
    it("should not allow to create user with the same email", done => {
      chai.request(server)
      .post('/users')
      .send(testUser)
      .end((err, res) => {
        if (err) {
          console.log(err.message)
          done()
        }
        console.log(res.body)
        res.should.have.status(EHttpStatusCode.InternalServerError)
        done()
      })
    })
    it("should create a second user with default role", done => {
      chai.request(server)
      .post('/users')
      .send(testUser2)
      .end((err, res) => {
        if (err) {
          console.log(err.message)
          done()
        }
        console.log(res.body)
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('role').eql('user')
        done()
      })
    })
  })
})