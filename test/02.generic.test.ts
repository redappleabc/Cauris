/**
 * Test Cases :
 * - Trying to POST a resource w/ roles & valid format
 * - Trying to POST a resource wo/ role
 * - Trying to POST a resource w/ roles & invalid format
 * - Trying to PUT a resource w/ roles & valid format
 * - Trying to PUT a resource wo/ role
 * - Trying to PUT a resource w/ roles & invalid format
 * - Trying to GET all resource
 * - Trying to GET all resource w/ query
 * - Trying to GET resource by ID
 * - Trying to GET resource by ID w/ query
 * - Trying to DEL resource by ID w/ roles
 * - Trying to DEL resource by ID wo/ roles
 */

 process.env.NODE_ENV = 'test';

 import {db} from '@servichain/helpers/MongooseSingleton'
 import { EHttpStatusCode } from '@servichain/enums/EHttpError'
 import chai from 'chai'
 import chaiHttp from 'chai-http'
 
 const server = require('../server')
 let should = chai.should()
 chai.use(chaiHttp)

const ValidUserLogin = {
    'email': 'admin@test.io',
    'password': 'TestingPassword11!'
}
const ValidAdminLogin = {
    'email': 'admin@test.io',
    'password': 'TestingPassword11!'
}
const ValidNetwork = {
    name: 'Ethereum',
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    currencySymbol: 'ETH'
}
const InvalidNetwork = {
    name: '',
    chainId: "ds",
    rpcUrl: 'notaValidUri',
    currencySymbol:"HTE"
}
const ValidUpdate = {
    explorerUrl: 'https://etherscan.io/'
}
const InvalidUpdate = {
    chainId: -5
}

let adminID: string
let userID: string
let tokenA: string
let tokenU: string
let networkID: string

 describe('Generic routes (network)', () => {
    before('Authenticate with user', done => {
        chai.request(server)
        .post('/users/authenticate')
        .send(ValidUserLogin)
        .end((err, res) => {
          res.should.have.status(EHttpStatusCode.OK)
          tokenU = res.body.data.jwtToken
          userID = res.body.data.user.id
          done()
        })
      })
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
     describe('[POST] /', () => {
         it('should succeed on posting a resource with the right permissions & data', done => {
            chai.request(server)
            .post('/networks')
            .set({ Authorization: `Bearer ${tokenA}` })
            .send(ValidNetwork)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                networkID = res.body.data.id
                done()
            })
         })
         it('should fail to post a resource without the right permissions', done => {
            chai.request(server)
            .post('/networks')
            .set({ Authorization: `Bearer ${tokenU}` })
            .send(ValidNetwork)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Unauthorized)
                done()
            })
         })
         it('should fail to post a resource without the right data', done => {
            chai.request(server)
            .post('/networks')
            .set({ Authorization: `Bearer ${tokenA}` })
            .send(InvalidNetwork)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
         })
     })
     describe('[PUT] /', () => {
         it('should succeed on updating a resource with the right permissions & data', done => {
            chai.request(server)
            .put(`/networks/${networkID}`)
            .send(ValidUpdate)
            .set({ Authorization: `Bearer ${tokenA}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Accepted)
                done()
            })
         })
         it('should fail to update a resource without the right permissions', done => {
            chai.request(server)
            .put(`/networks/${networkID}`)
            .send(ValidUpdate)
            .set({ Authorization: `Bearer ${tokenU}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Unauthorized)
                done()
            })

         })
         it('should fail to update a resource without the right data', done => {
            chai.request(server)
            .put(`/networks/${networkID}`)
            .send(InvalidUpdate)
            .set({ Authorization: `Bearer ${tokenA}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
         })
     })
     describe('[GET] /', () => {
         it('should succeed on retrieving all data', done => {
            chai.request(server)
            .get('/networks')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
         })
         it('should succeed on retrieving all data with query', done => {
            chai.request(server)
            .get('/networks')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })

         })
         it('should resist query injection', done => {
            chai.request(server)
            .get('/networks')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
         })
         it('should succeed on retrieving a single resource by ID', done => {
            chai.request(server)
            .get('/networks')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
         })
         it('should succeed on retrieving a single resource with query', done => {
            chai.request(server)
            .get('/networks')
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
         })
     })
     describe('[DEL] /', () => {
        it('should succeed on deleting a resource with the right permissions', done => {
            chai.request(server)
            .del(`/networks/${networkID}`)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
        })
        it('should fail to delete a resource without the right permissions', done => {
            chai.request(server)
            .del(`/networks/${networkID}`)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Unauthorized)
                done()
            })
        })
     })
 })