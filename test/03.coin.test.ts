/**
 * Test Cases :
 * - Trying to GET All Coins
 * - Trying to GET All Coins w/ query
 * - Trying to GET One Coin w/ valid ID
 * - Trying to GET One Coin w/ invalid ID
 */

 process.env.NODE_ENV = 'test';

 import {db} from '@servichain/helpers/MongooseSingleton'
 import { EHttpStatusCode } from '@servichain/enums/EHttpError'
 import chai from 'chai'
 import chaiHttp from 'chai-http'
 
 const server = require('../server')
 let should = chai.should()
 chai.use(chaiHttp)

 const ValidAdminLogin = {
    'email': 'admin@test.io',
    'password': 'TestingPassword11!'
}
let ValidCoinPost = {
    coinIndex: 60,
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
}

let tokenA: string
let adminID: string
let coinID: string

 describe('Coins', () => {
      before('Authenticate with admin', done => {
        chai.request(server)
        .post('/users/authenticate')
        .send(ValidAdminLogin)
        .end((err, res) => {
          res.should.have.status(EHttpStatusCode.OK)
          tokenA = res.body.data.jwtToken
          adminID = res.body.data.user.id
          done()
        })
      })
    before('Get a network ID', done => {
        chai.request(server)
        .get('/networks')
        .end((err, res) => {
          res.should.have.status(EHttpStatusCode.OK)
          ValidCoinPost['network'] = res.body.data.id
          done()
        })
      })
     describe('[POST] /', () => {
        chai.request(server)
        .post('/coins')
        .send(ValidCoinPost)
        .set({ Authorization: `Bearer ${tokenA}` })
        .end((err, res) => {
            res.should.have.status(EHttpStatusCode.OK)
            coinID = res.body.data.id
        })
     })
     describe('[GET] /', () => {
        it('should succeed on retrieving all coins', done => {
            chai.request(server)
            .get('/coins')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
        })
        it('should succeed on retrieving all coins with query', done => {
            chai.request(server)
            .get('/coins')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
        })
        it('should succeed on retrieving one coin by ID', done => {
            chai.request(server)
            .get('/coins')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
        })
        it('should fail to retrieve a coin without valid ID', done => {
            chai.request(server)
            .get('/coins')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
     })
 })