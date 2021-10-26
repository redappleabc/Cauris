import MongooseClient from '@servichain/helpers/MongooseClient'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import ganache from 'ganache-cli'

const server = require('../server')
let should = chai.should()

chai.use(chaiHttp)

const options = {
  account: "0x2D658C1d51448450758baaCaD517F4AeA8C2E38a2e736c3881ebc1C0ecDcB726",
  networkId: 1337
};
const ganacheServer = ganache.server(options);
const PORT = 8545;
ganacheServer.listen(async (PORT, err) => {
  if (err) throw err;

  console.log(`ganache listening on port ${PORT}...`);
  const provider = ganacheServer.provider;
  const accounts = await provider.request({ method: "eth_accounts", params:[] })
  console.log(accounts);
});

const testUserAuth = {
  email: "ble.user@gmail.com",
  password: "testing_password456"
}

let token: string
let networkID: string
let coinID: string

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
  before('Get local coin ID', done => {
    chai.request(server)
    .get('/coins')
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.OK)
      expect(res.body.data.length).eql(1)
      coinID = res.body.data[0].id
    })
  })
  before('Get local network ID', done => {
    chai.request(server)
    .get('/networks')
    .end((err, res) => {
      res.should.have.status(EHttpStatusCode.OK)
      expect(res.body.data.length).eql(1)
      coinID = res.body.data[0].id
    })
  })
})