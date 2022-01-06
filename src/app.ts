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

import {UserRouter} from '@servichain/modules/users'
import wallets from '@servichain/modules/wallets/wallet.router'
import {AccountRouter} from '@servichain/modules/accounts/account.router'
import {RefreshTokenRouter} from '@servichain/modules/refreshs'
import {NetworkRouter} from '@servichain/modules/networks/network.router'
import {CoinRouter} from '@servichain/modules/coins/coin.router'
import {TransactionRouter} from '@servichain/modules/transactions/transaction.router'
import { ValidationRouter } from './modules/validations'
import * as ErrorHandler from '@servichain/middlewares/ErrorHandler'

const secret = config.get('secrets.app')
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

app.use('/users', UserRouter)
app.use('/wallets', wallets)
app.use('/accounts', AccountRouter)
app.use('/refresh-tokens', RefreshTokenRouter)
app.use('/validation-tokens', ValidationRouter)
app.use('/networks', NetworkRouter)
app.use('/coins', CoinRouter)
app.use('/transactions', TransactionRouter)

app.use(ErrorHandler.errorMiddleware)
/**
 * Create socket.io instance.
 */
 const io = require('socket.io')();
//  io.on("connection", socket => {
//    console.log("a user connected :D");
// //    socket.on("chat message", msg => {
// //      console.log(msg);
// //      io.emit("chat message", msg);
// //    });
//  });
 io.listen(3000);

module.exports = app
export default io