const { createLogger, format, transports } = require('winston');
const { combine, splat, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message} `
    if (metadata) {
        msg += JSON.stringify(metadata)
    }
    return msg
});

const logger = createLogger({
    format: combine(
        format.colorize(),
        splat(),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: "logs/log.txt"}),
        new transports.File({ filename: "logs/error-log.txt", level:'error'}),
    ]
});

logger.stream = {
    write: function (message, encoding) {
        // use the 'info' log level so the output will be picked up by both
        // transports (file and console)
        logger.info(message);
    },
};

export default logger