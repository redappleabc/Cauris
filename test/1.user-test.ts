process.env.NODE_ENV = 'test';

import MongooseClient from '@servichain/helpers/MongooseClient'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'
import chai from 'chai'
import chaiHttp from 'chai-http'

//const ganacheServer = require('@servichain/utils/ganache-server')
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

const testUser2Data = {
  email: "ble.user@gmail.com",
  firstName: "USER"
}

const testUser2Auth = {
  email: "blabla.user@gmail.com",
  password: "testing_password456"
}


let token: string;
let userId: string;
let adminId: string;

after('Drop database after tests', (done) => {
  MongooseClient.getConnection().db.dropDatabase(function() {
    MongooseClient.getConnection().close(function() {
      done()
    })
  })
})

describe('Users', () => {
  describe('[POST] /users', () => {
    it("should create a first user as admin", done => {
      chai.request(server)
      .post('/users')
      .send(testUser)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('role').eql('admin')
        res.body.data.should.have.property('id')
        adminId = res.body.data.id
        done()
      })
    })
    it("should not allow to create user with the same email", done => {
      chai.request(server)
      .post('/users')
      .send(testUser)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.InternalServerError)
        done()
      })
    })
    it("should create a second user with default role", done => {
      chai.request(server)
      .post('/users')
      .send(testUser2)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('role').eql('user')
        res.body.data.should.not.have.property('password')
        done()
      })
    })
  })
  describe('[POST] /users/authenticate', () => {
    it("should be able to authenticate", done => {
      chai.request(server)
      .post('/users/authenticate')
      .send(testUser2Auth)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        res.body.data.should.have.property('jwtToken')
        res.body.data.should.have.property('user')
        token = res.body.data.jwtToken
        userId = res.body.data.user.id
        done()
      })
    })
  })
  describe('[GET] /users', () => {
    it("should not be able to get the list of full users", done => {
      chai.request(server)
      .get('/users')
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Unauthorized)
        done()
      })
    })
  })
  describe('[GET] /users/:id', () => {
    it("should be able to retrieve personal data", done => {
      chai.request(server)
      .get(`/users/${userId}`)
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        res.body.data.should.have.property('id')
        res.body.data.should.not.have.property('password')
        done()
      })
    })
    it("should not be able to retrieve infos of other users", done => {
      chai.request(server)
      .get(`/users/${adminId}`)
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Unauthorized)
        done()
      })
    })
  })
  describe('[UPDATE] /users/:id', () => {
    it("should be able to update infos of the user, except password", done => {
      chai.request(server)
      .put(`/users/${userId}`)
      .set({ Authorization: `Bearer ${token}` })
      .send(testUser2Data)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Accepted)
        res.body.data.should.not.have.property('password')
        done()
      })
    })
  })
  describe('[DELETE] /users/:id', () => {
    it("should not be able to delete own user", done => {
      chai.request(server)
      .delete(`/users/${userId}`)
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Unauthorized)
        done()
      })
    })
  })
})