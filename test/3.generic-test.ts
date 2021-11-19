process.env.NODE_ENV = 'test';

import MongooseClient from '@servichain/helpers/MongooseClient'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'
import chai from 'chai'
import chaiHttp from 'chai-http'
import { networks } from 'bitcoinjs-lib';

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

const coinTest = {
  "name": "Ether",
  "symbol": "ETH",
  "coinIndex": 60
}

const coinERC20Test = {
  "name": "SpecialERC20",
  "symbol": "ERC",
  "coinIndex": 60,
  "contractAddress": "0x0D7F9E5589f8A5983a383606faF13bA1CBd8d157"
}

const networkTest = {
  "name": "Local Chain",
  "chainId": 1337,
  "url": "http://localhost:8545"
}

const networkTest2 = {
  "name": "Testnet BSC",
  "chainId": 97,
  "url": "https://data-seed-prebsc-1-s1.binance.org:8545",
  "currencySymbol": "BNB",
  "blockExplorer": "https://testnet.bscscan.com"
}

let coinID: string;
let coinID2: string
let networkID: string;
let networkID2: string;
let token: string;
let adminToken: string;


describe('Networks', () => {
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

  describe('[POST] /networks', () => {
    it('should be able to create a network with partner/admin rights', done => {
      chai.request(server)
      .post('/networks')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send(networkTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('id')
        networkID = res.body.data.id
        done()
      })
    })
    it('should not be possible to create networks for regular users', done => {
      chai.request(server)
      .post('/networks')
      .set({ Authorization: `Bearer ${token}` })
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Unauthorized)
        done()
      })
    })
  })
  describe('[GET] /networks', () => {
    it('should be able to retrieve the list of coins by anyone', done => {
      chai.request(server)
      .get('/networks')
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        done()
      })
    })
  })
  describe('[GET] /networks/:id', () => {
    it('should be able to retrieve a specific network by anyone', done => {
      chai.request(server)
      .get(`/networks/${networkID}`)
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        done()
      })
    })
  })
  describe('[PUT] /networks/:id', () => {
    it('should be able to update network infos with admin rights', done => {
      chai.request(server)
      .put(`/networks/${networkID}`)
      .set({ Authorization: `Bearer ${adminToken}` })
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Accepted)
        done()
      })
    })
  })
  describe('[DELETE] /networks/:id', () => {
    it('should be able to delete coin infos with admin rights', done => {
      chai.request(server)
      .delete(`/networks/${networkID}`)
      .set({ Authorization: `Bearer ${adminToken}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Accepted)
        done()
      })
    })
  })
})


describe('Coins', () => {
  before('Create local network ID', done => {
    chai.request(server)
    .post('/networks')
    .set({ Authorization: `Bearer ${adminToken}` })
    .send(networkTest)
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.Created)
      res.body.data.should.have.property('id')
      networkID = res.body.data.id
      done()
    })
  })
  before('create a second network', done => {
    chai.request(server)
    .post('/networks')
    .set({ Authorization: `Bearer ${adminToken}` })
    .send(networkTest2)
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.Created)
      res.body.data.should.have.property('id')
      networkID2 = res.body.data.id
      done()
    })
  })
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

  describe('[POST] /coins', () => {
    it('should be able to create a coin with partner/admin rights', done => {
      chai.request(server)
      .post('/coins')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({network: networkID, ...coinTest})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('id')
        coinID = res.body.data.id
        done()
      })
    })
    it('should not be possible to create coin for regular users', done => {
      chai.request(server)
      .post('/coins')
      .set({ Authorization: `Bearer ${token}` })
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Unauthorized)
        done()
      })
    })
    it('should be able to create a coin with an already existing Index but different Network', done => {
      chai.request(server)
      .post('/coins')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({network: networkID2, ...coinTest})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('id')
        coinID2 = res.body.data.id
        done()
      })
    })
    it('should be able to create a coin with an already existing Index & Network but different Contract', done => {
      chai.request(server)
      .post('/coins')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({network: networkID, ...coinERC20Test})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Created)
        res.body.data.should.have.property('id')
        done()
      })
    })
    it('should not be able to create a coin with an already existing Index & Network & Contract', done => {
      chai.request(server)
      .post('/coins')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({network: networkID, ...coinERC20Test})
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.InternalServerError)
        done()
      })
    })
  })
  describe('[GET] /coins', () => {
    it('should be able to retrieve the list of coins by anyone', done => {
      chai.request(server)
      .get('/coins')
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        done()
      })
    })
  })
  describe('[GET] /coins/:id', () => {
    it('should be able to retrieve a specific coin by anyone', done => {
      chai.request(server)
      .get(`/coins/${coinID}`)
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.OK)
        done()
      })
    })
  })
  describe('[PUT] /coins/:id', () => {
    it('should be able to update coin infos with admin rights', done => {
      chai.request(server)
      .put(`/coins/${coinID}`)
      .set({ Authorization: `Bearer ${adminToken}` })
      .send(coinTest)
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Accepted)
        done()
      })
    })
  })
  describe('[DELETE] /coins/:id', () => {
    it('should be able to delete coin infos with admin rights', done => {
      chai.request(server)
      .delete(`/coins/${coinID}`)
      .set({ Authorization: `Bearer ${adminToken}` })
      .end((err, res) => {
        res.should.have.status(EHttpStatusCode.Accepted)
        done()
      })
    })
  })
  after('should delete another coin', done => {
    chai.request(server)
    .delete(`/coins/${coinID2}`)
    .set({ Authorization: `Bearer ${adminToken}` })
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.Accepted)
      done()
    })
  })
})