process.env.NODE_ENV = 'test';

import MongooseClient from '@servichain/helpers/MongooseClient'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'
import chai from 'chai'
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

const BIP39Test = {
  name: "My super wallet !",
  mnemonic: "another jazz nest aerobic hurry embody knife park chapter fresh cabin remember",
  seed: "5b60c2acb37fa95a1787d7966eef151a1028415ea2b6f7929788d771d8581a66320b902122855034833847336c86b9dd997b718e582d53d6ae9d80b58f79ffa7",
}

const invalidLengthMnemonic = {
  mnemonic: "another jazz"
}

const invalidWordsMnemonic = {
  mnemonic: "dsqdqs dsqdqs dqsdqs dsqdqs dqsdqs dsqdqs dqsdqs dqsdq dqsdqs dqsdqs dqsqds dqsdqs"
}

let userID: string;
let walletID: string;
let token: string;
let adminToken: string;

describe('Wallets', () => {
  before('Authenticate with user', done => {
    chai.request(server)
    .post('/users/authenticate')
    .send(testUserAuth)
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.OK)
      token = res.body.data.jwtToken
      userID = res.body.data.user.id
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
  describe('[POST] /wallets', () => {
    it('Should be able to generate a HD Wallet with mnemonic following BIP39', done => {
      chai.request(server)
      .post('/wallets')
      .set({ Authorization: `Bearer ${token}` })
      .send({mnemonic: BIP39Test.mnemonic})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        walletID = res.body.data.id
        MongooseClient.Wallet.findOne({user: userID}).exec((err, item) => {
          item.should.have.property('seed').eql(BIP39Test.seed)
          done()
        })
      })
    })
    it('Should be able to generate a wallet without a given mnemonic', done => {
      chai.request(server)
      .post('/wallets')
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        done()
      })
    })
    it('should not be able to generate a wallet with insufficient words number', done => {
      chai.request(server)
      .post('/wallets')
      .set({ Authorization: `Bearer ${token}` })
      .send(invalidLengthMnemonic)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.BadRequest)
        done()
      })
    })
    it('should not be able to generate a wallet with a bad mnemonic', done => {
      chai.request(server)
      .post('/wallets')
      .set({ Authorization: `Bearer ${token}` })
      .send(invalidWordsMnemonic)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.BadRequest)
        done()
      })
    })
  })
  describe('[GET] /wallets/:id', () => {
    it('should be able to retrieve his own wallet', done => {
      chai.request(server)
      .get(`/wallets/${walletID}`)
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        res.body.data.should.have.property('id')
        done()
      })
    })
    it('should not be able to retrieve another user wallet', done => {
      chai.request(server)
      .get(`/wallets/${walletID}`)
      .set({ Authorization: `Bearer ${adminToken}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Unauthorized)
        done()
      })
    })
  })
})