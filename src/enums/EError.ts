export enum EError {
    //10XXX Servichain API (helpers) error
    Offline = '10001|API Offline',
    Internal = '10002|',
    JoiPermission = '10011|Invalid Permission',
    JoiValidation = '10012|Invalid Fields Validation',
    JWTGenerating = '10021|JWT Generating Failed',
    JWTDecoding = '10022|JWT Decoding Failed',
    JwtUnauthorized = '10023|JWT Unauthorized',
    JwtUnverified = '10024|User Not Verified',
    ReqUsurpation = '10031|User ID comparison Failed',
    ReqNoParams = '10032|Params Not Provided',
    ReqNoBody = '10033|Body Not Provided',
    ReqNoQuery = '10034|Query Not Provided',
    ReqIncompleteParams = '10035|Missing Params',
    ReqIncompleteBody = '10036|Missing Body Fields',
    ReqIncompleteQuery = '10037|Missing Query Fields',
    TokenNoType = '10041|Validation Token Type Not Specified',
    TokenInvalidType = '10042|Invalid Validation Token',
    TokenRefreshFailed = '10043|Could Not Refresh Token',
    TokenGenerationFailed = '10044|Could Not Generate Refresh Token',
    TokenNoEmail = '10045|No User Related To The Email',
    TokenExpired = '10046|Token Has Expired',
    TokenUsed = '10047|Token Already Used',
    AccountNoWallet = '10051|Cannot Perform Action Without Owning Wallet',
    AccountNoContact = '10054|Contact Does Not Own Valid Address',
    ManagerRPC = '10061|Manager RPC Failed',
    AESFailed = '10081|AES Failed',
    AESCipher= '10082|AES Cypher Failed',
    AESDecipher='10083|AES Decipher Failed',
    LibraryCrash = '10091|App Library Crashed',
    BadCredentials = '10092|User Bad Credentials',
    //102XX Mongo Error
    MongoOffline = '10201|Mongo Authentication Failed',
    MongoInvalidID = '10202|Mongo Invalid ID',
    MongoEmpty = '10203|Mongo Item Not Found',
    MongoCreate = '10204|Mongo Cannot Create',
    //103XX Coin Tracker Error
    TrackerOffline = '10301|Tracker Offline',
    TrackerNomicsRetrieve = '10311|Nomics Could Not Retrieve Coins',
    ScannerOffline = '10321|Scan Offline',
    //104XX AWS Error
    AWSOffline = '10401|AWS Offline',
    AWSBadCredentials = '10402|AWS Bad Credentials',
    AWSSecretFailed = '10403|AWS Secret Could Not Retrieve',
    //105XX Blockchain Error
    BCOffline = '10501|RPC Offline',
    BCBalance= '10511|Unsifficient Balance',
    BCNoUtxo = '10512|Does Not Own Unspent Transactions',
    BCEstimation = '10513|Could Not Estimate Transaction',
    BCNotSupported = '10514|Action Not Supported On Blockchain',
    BCSwapSame = '10515|Trying to Swap Same Token',
    BCParaOffline = '10551|Paraswap Offline',
    BCParaRate = '10552|Paraswap Rate Failed',
    BCParaBuild = '10553|Paraswap Build Failed',
    //106XX Mailer Error
    MailerOffline = '10601|Mailer Offline'
}