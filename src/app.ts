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
var morgan = require('morgan')

import {UserRouter} from '@servichain/modules/users'
import wallets from '@servichain/modules/wallets/wallet.router'
import contacts from '@servichain/modules/contacts/contacts.router'
import notifications from '@servichain/modules/notifications/notifications.router'
import {AccountRouter} from '@servichain/modules/accounts/account.router'
import {RefreshTokenRouter} from '@servichain/modules/refreshs'
import {NetworkRouter} from '@servichain/modules/networks/network.router'
import {CoinRouter} from '@servichain/modules/coins/coin.router'
import {TransactionRouter} from '@servichain/modules/transactions/transaction.router'
import { ValidationRouter } from './modules/validations'
import * as ErrorHandler from '@servichain/middlewares/ErrorHandler'

import logger from '@servichain/utils/logger'

const secret = config.get('secrets.app')
const mongoDB = config.get('mongoDB')

var app = express()
app.use(morgan('combined', { stream: logger.stream }));

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

const version = '/api/v2'

app.use(`${version}/users`, UserRouter)
app.use(`${version}/wallets`, wallets)
app.use(`${version}/contacts`, contacts)
app.use(`${version}/notifications`, notifications)
app.use(`${version}/accounts`, AccountRouter)
app.use(`${version}/refresh-tokens`, RefreshTokenRouter)
app.use(`${version}/validation-tokens`, ValidationRouter)
app.use(`${version}/networks`, NetworkRouter)
app.use(`${version}/coins`, CoinRouter)
app.use(`${version}/transactions`, TransactionRouter)

app.use(ErrorHandler.errorMiddleware)

module.exports = app