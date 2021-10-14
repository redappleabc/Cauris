process.env.NODE_ENV = 'test';

let mongoose = require('mongoose')
let app = require('../app')

import chai, {should} from 'chai'
import chaiHttp from 'chai-http'

chai.use(chaiHttp)

const testUser = {
  email: "test.user@gmail.com",
  password: "testing_password123",
  verified: true
}

let token;
let userId;

describe("[POST] /users && /users/authenticate", () => {
  before(done => {
    chai.request(app)
    .post('/users')
    .send(testUser)
    .end((req, res) => {
      res.should.have.status(200)
    })
  done()
  })
  before(done => {
    delete testUser.verified
    chai.request(app)
    .post('/authenticate')
    .send(testUser)
    .end((req, res) => {
      res.should.have.status(200)
      token = res.body.token
      userId = res.body.id
    })
    done()
  })
  describe("[GET] /users/:id", () => {
    chai.request(app)
    .get(`/users/${userId}`)
    .set({ Authorization: `Bearer ${token}` })
    .end((req, res) => {
      res.should.have.status(200)
    })
  })
})

describe("/")