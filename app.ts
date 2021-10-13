var express = require('express')
var path = require('path')
var cors = require('cors')
var cookieParser = require('cookie-parser')
var mongoose = require('mongoose')
var passport = require('passport')
var session = require('express-session')
var bearerToken = require('express-bearer-token')
var MongoStore = require('connect-mongo')
var config = require('config')

import users from './src/modules/users/user.router'
import wallets from './src/modules/wallets/wallet.router'
import accounts from './src/modules/accounts/account.router'
import refreshs from './src/modules/refreshs/refresh-token.router'
import networks from './src/modules/networks/network.router'
import coins from './src/modules/coins/coin.router'
import transactions from './src/modules/transactions/transaction.router'

const secret = config.get('secret')
const mongoDB = config.get('mongoDB')

var app = express()

mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
var db = mongoose.connection
db.on('error',  console.error.bind(console, 'MongoDB connection error:'))

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({credentials: true, origin: true}))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(session({secret: secret, saveUninitialized: true, resave: true, store: MongoStore.create({mongoUrl: mongoDB})}))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
app.use(bearerToken())

app.use('/users', users)
app.use('/wallets', wallets)
app.use('/accounts', accounts)
app.use('/refresh-tokens', refreshs)
app.use('/networks', networks)
app.use('/coins', coins)
app.use('/transactions', transactions)

module.exports = app