/**
 * Test Cases :
 * - Creating User w/ correct data format
 * - Creating User w/ incorrect data format
 * - Authenticate w/ correct data format
 * - Authenticate w/ incorrect data format
 * - Retrieve user with user ID
 * - Retrieve user details
 * - Trying to retrieve invalid user ID
 * - Trying to validate user with invalid token
 * - Trying to validate user with valid token
 * - Trying to update user infos w/ correct data
 * - Trying to update user infos w/ nothing
 * - Trying to update user infos w/ incorrect data
 * - Trying to update user password w/ valid password
 * - Trying to update user password w/ invalid old password
 * - Trying to update user password w/ invalid confirm password
 * - Trying to generate validation token w/ invalid email
 * - Trying to generate validation token w/ valid email
 * - Trying to reset password through mail confirmation

 * - Trying to delete user
 * - Trying to generate secret for 2FA
 * - Trying to verify secret for 2FA
 */
process.env.NODE_ENV = 'test';

import {db} from '@servichain/helpers/MongooseSingleton'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'
import chai from 'chai'
import chaiHttp from 'chai-http'

const server = require('../server')
let should = chai.should()
chai.use(chaiHttp)

const ValidAdminPost = {
    'email': 'admin@test.io',
    'username': 'Tester',
    'password': 'TestingPassword11!',
    'confirmPassword': 'TestingPassword11!'
}
const ValidUserPost = {
    'email': 'user@test.io',
    'username': 'Dev',
    'password': 'AnotherPassword0!',
    'confirmPassword': 'AnotherPassword0!'
}
const InvalidUserPost = {
    'email': 'NotAnEmail',
    'username': '',
    'password': ''
}
const ValidUserLogin = {
    'email': 'admin@test.io',
    'password': 'TestingPassword11!'
}
const InvalidUserLogin = {
    'email': 'admin@test.io',
    'password': 'test'
}
let ValidUserVerify = {
    'token': 'MUST BE FILLED WITH REQUEST'
}
const InvalidUserVerify = {
    'token': 'InvalidToken'
}
const ValidUserUpdate = {
    'firstName': 'Admi',
    'lastName': 'Nistrator'
}
const InvalidUserUpdate = {
    'email': 'NotAnEmail',
    'password': 'test'
}
const ValidUserPwd = {
    'oldPassword': 'TestingPassword11!',
    'newPassword': 'PasswordTesting11!',
    'newPasswordRepeat': 'PasswordTesting11!'
}
const InvalidUserOldPwd = {
    'oldPassword': 'test',
    'newPassword': 'PasswordTesting11!',
    'newPasswordRepeat': 'PasswordTesting11'
}
const InvalidUserNewPwd = {
    'oldPassword': 'TestingPassword11!',
    'newPassword': 'PasswordTesting11!',
    'newPasswordRepeat': 'test'
}
let ValidTokenEmail = {
    'token': 'MUST BE CHANGED WITH REQUEST'
}
const InvalidTokenEmail = {
    'token': 'InvalidToken'
}
let ValidUserResetPwd = {
    'newPassword': '',
    'confirmPassword': '',
    'token': ''
}

let AdminID: string
let UserID: string
let token: string

after('Drop database after tests', done => {
    db.getConnection().db.dropDatabase(function() {
      db.getConnection().close(function() {
        done()
      })
    })
})

describe('Users', () => {
    describe('[POST] /users', () => {
        it('should manage to create an admin with right body data', done => {
            chai.request(server)
            .post('/users')
            .send(ValidAdminPost)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Created)
                let {data} = res.body
                AdminID = data['id']
                done()
            })
        })
        it('should fail to create an user with an already used email', done => {
            chai.request(server)
            .post('/users')
            .send(ValidAdminPost)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
        it('should manage to create a second user with a default role', done => {
            chai.request(server)
            .post('/users')
            .send(ValidUserPost)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Created)
                let {data} = res.body
                UserID = data['id']
                done()
            })
        })
        it('should fail to create an user with incorrect body data', done => {
            chai.request(server)
            .post('/users')
            .send(InvalidUserPost)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
    })
    describe('[POST] /users/authenticate', () => {
        it('should fail to authenticate with incorrect password', done => {
            chai.request(server)
            .post('/users/authenticate')
            .send(InvalidUserLogin)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
        it('should manage to authenticate with right body data', done => {
            chai.request(server)
            .post('/users/authenticate')
            .send(ValidUserLogin)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                let {data} = res.body
                token = data['jwtToken']
                done()
            })
        })
    })
    describe('[PUT] /users/:id/verify', () => {
        it('should fail to verify an user with incorrect body data', done => {
            chai.request(server)
            .put(`/users/${UserID}/verify`)
            .send(InvalidUserVerify)
            .set({ Authorization: `Bearer ${token}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
        it('should manage to verify an user with right body data', done => {
            chai.request(server)
            .put(`/users/${UserID}/verify`)
            .send(ValidUserVerify)
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.OK)
                done()
            })
        })
    })
    describe('[PUT] /users/:id', () => {
        it('should fail to update user with incorrect body data', done => {
            chai.request(server)
            .put(`/users/${UserID}`)
            .send(InvalidUserUpdate)
            .set({ Authorization: `Bearer ${token}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
        it('should fail to update user with empty body data', done => {
            chai.request(server)
            .put(`/users/${UserID}`)
            .send()
            .set({ Authorization: `Bearer ${token}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
        it('should manage to update user with valid body data, except password', done => {
            chai.request(server)
            .put(`/users/${UserID}`)
            .send(ValidUserUpdate)
            .set({ Authorization: `Bearer ${token}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Accepted)
                done()
            })
        })
    })
    describe('[PUT] /users/:id/update-password', () => {
        it('should fail to update password with invalid body data', done => {
            chai.request(server)
            .put(`/users/${UserID}/update-password`)
            .send(InvalidUserNewPwd)
            .set({ Authorization: `Bearer ${token}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.BadRequest)
                done()
            })
        })
        it('should manage to update password with right body data', done => {
            chai.request(server)
            .put(`/users/${UserID}/update-password`)
            .send(ValidUserPwd)
            .set({ Authorization: `Bearer ${token}` })
            .end((err, res) => {
                res.should.have.status(EHttpStatusCode.Accepted)
                done()
            })
        })
    })
})