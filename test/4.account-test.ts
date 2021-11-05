process.env.NODE_ENV = 'test';

import MongooseClient from '@servichain/helpers/MongooseClient'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'
import chai from 'chai'
import chaiHttp from 'chai-http'

const server = require('../server')
let should = chai.should()
let expect = chai.expect

chai.use(chaiHttp)

const testUserAuth = {
  email: "ble.user@gmail.com",
  password: "testing_password456"
}

const testAdminAuth = {
  email: "test.user@gmail.com",
  password: "testing_password123",
}

const coinTest = {
  "name": "Ether",
  "symbol": "ETH",
  "coinIndex": 60
}

const accountTest = {
  "coinIndex": 60,
}

const accountCompare = {
  "publicKey": "0x03de7dfd32122110e2fe3687c68c84ca29ffc431d2838ef018420e0945dbcda98a",
  "address": "0xdB4676Eb3c50b271e7193466461519eC7773c223"
}

const accountTestFail = {
  "coinIndex": 610,
  "change": 1
}

let token: string
let adminToken: string;
let accountID: string

describe('Accounts', () => {
  before('Authenticate with user', done => {
    chai.request(server)
    .post('/users/authenticate')
    .send(testUserAuth)
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.OK)
      token = res.body.data.jwtToken
      done()
    })
  })
  before('Authenticate with admin', done => {
    chai.request(server)
    .post('/users/authenticate')
    .send(testAdminAuth)
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.OK)
      adminToken = res.body.data.jwtToken
      done()
    })
  })
  before('Create a test coin', done => {
    chai.request(server)
    .post('/coins')
    .set({ Authorization: `Bearer ${adminToken}` })
    .send(coinTest)
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.Created)
      res.body.data.should.have.property('id')
      done()
    })
  })
  describe('[POST] /accounts', () => {
    it('should be able to create an account linked to an existing coin index', done => {
      chai.request(server)
      .post('/accounts')
      .set({Authorization: `Bearer ${token}`})
      .send(accountTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('address')
        res.body.data.should.have.property('publicKey')
        let address = res.body.data.address.toUpperCase()
        let publicKey = res.body.data.publicKey.toUpperCase()
        expect(address).eql(accountCompare.address.toUpperCase())
        expect(publicKey).eql(accountCompare.publicKey.toUpperCase())
        accountID = res.body.data.id
        done()
      })
    })
    it('should not be able to create an account with a false coinIndex', done => {
      chai.request(server)
      .post('/accounts')
      .set({Authorization: `Bearer ${token}`})
      .send(accountTestFail)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.NotFound)
        done()
      })
    })
    it('should not be possible to create an account without possessing a wallet', done => {
      chai.request(server)
      .post('/accounts')
      .set({Authorization: `Bearer ${adminToken}`})
      .send(accountTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Forbidden)
        done()
      })
    })
  })
  describe('[GET] /accounts', () => {
    it('should be able to retrieve accounts information', done => {
      chai.request(server)
      .get(`/accounts/${accountID}`)
      .set({Authorization: `Bearer ${token}`})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        res.body.data.should.have.property('address')
        res.body.data.should.have.property('publicKey')
        done()
      })
    })
  })
  describe('[DELETE] /accounts', () => {
    it('should be able to delete account with admin rights', done => {
      chai.request(server)
      .delete(`/accounts/${accountID}`)
      .set({Authorization: `Bearer ${adminToken}`})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Accepted)
        done()
      })
    })
  })
})