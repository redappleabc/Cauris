process.env.NODE_ENV = 'test';

import chai, {assert} from 'chai'
import chaiHttp from 'chai-http'
import db from '../src/helpers/MongooseClient'


let app = require('../app')
chai.use(chaiHttp)

const testUser = {
  email: "test.user@gmail.com",
  password: "testing_password123",
  verified: true
}

const walletMnemonic = {
  network: "Ethereum",
  mnemonic: "awake deer approve grit thunder check key affair wood neglect differ choose"
}

let token;
let userId;
let walletId;

describe("Users", () => {
  before(done => {
    db.User.remove({}, err => {
      done()
    })
  })
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
  it("it should generate a wallet", (done) => {
    chai.request(app)
    .post('/wallets')
    .send(walletMnemonic)
    .set({ Authorization: `Bearer ${token}` })
    .end((req, res) => {
      res.should.have.status(200)
      walletId = res.body
      done()
    })
    done()
  })
})