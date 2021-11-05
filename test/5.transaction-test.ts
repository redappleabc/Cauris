import { EHttpStatusCode } from '@servichain/enums/EHttpError'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'

const server = require('../server')
let should = chai.should()

chai.use(chaiHttp)

const testUserAuth = {
  email: "ble.user@gmail.com",
  password: "testing_password456"
}

const testAdminAuth = {
  email: "test.user@gmail.com",
  password: "testing_password123",
}

const newtorkTest = {
  "name": "Local Chain",
  "chainId": 1337,
  "url": "http://localhost:8545"
}

let token: string
let adminToken: string
let networkId: string
let coinId: string
let coinERC20Id: string

const transactionTest = {
  from: '0xdB4676Eb3c50b271e7193466461519eC7773c223',
  to: '0x301CC84934Ca030080514ea907866475243A6790',
  value: 1000
}

const transactionTestFail = {
  from: '0xdB4676Eb3c50b271e7193466461519eC7773c223',
  to: '0x301CC84934Ca030080514ea907866475243A6790',
  value: 1000000000000000000000
}

describe('Transactions', () => {
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
  before('Get local coin ID', done => {
    chai.request(server)
    .get('/coins')
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.OK)
      expect(res.body.data.total).eql(2)
      if (res.body.data[0]['contractAddress'] === "") {
        coinId = res.body.data[0]['id']
        coinERC20Id = res.body.data[1]['id']
      } else {
        coinId = res.body.data[1]['id']
        coinERC20Id = res.body.data[0]['id']
      }
      done()
    })
  })
  before('Create local network ID', done => {
    chai.request(server)
    .post('/networks')
    .set({ Authorization: `Bearer ${adminToken}` })
    .send(newtorkTest)
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.Created)
      res.body.data.should.have.property('id')
      networkId = res.body.data.id
      done()
    })
  })
  describe('[POST] /transactions', () => {
    it('should not be able to send transaction from a non-owned account', done => {
      chai.request(server)
      .post('/transactions')
      .set({ Authorization: `Bearer ${adminToken}`})
      .send({
        networkId,
        coinId,
        ...transactionTest
      })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Unauthorized)
        done()
      })
    })
    before('should be able to create the account used for transactions', done => {
      chai.request(server)
      .post('/accounts')
      .set({Authorization: `Bearer ${token}`})
      .send({coinIndex: '60'})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        done()
      })
    })
    it('should be able to send a transaction with ethereum', done => {
      chai.request(server)
      .post('/transactions')
      .set({Authorization: `Bearer ${token}`})
      .send({
        networkId,
        coinId,
        ...transactionTest
      })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        done()
      })
    })
    it('should not be possible to send transaction if the balance doesnt have enough eth', done => {
      chai.request(server)
      .post('/transactions')
      .set({Authorization: `Bearer ${token}`})
      .send({
        networkId,
        coinId,
        ...transactionTestFail
      })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.BadRequest)
        done()
      })
    })
    it('should be able to send transaction to a custom ERC20', done => {
      chai.request(server)
      .post('/transactions')
      .set({Authorization: `Bearer ${token}`})
      .send({
        networkId,
        coinId: coinERC20Id,
        ...transactionTest
      })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        done()
      })
    })
  })
})
