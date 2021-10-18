import Joi from "@hapi/joi";
import { Request, NextFunction } from "express";
import { EHttpStatusCode } from "@servichain/enums";
import { BaseError } from '@servichain/helpers/BaseError';

export class JoiValidator {
    private joiSchema?

    constructor(schema: Joi.Schema) {
        this.joiSchema = schema
    }

    middleware(req: Request, next: NextFunction) {
        const options = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        }
        const { error, value } = this.joiSchema.validate(req.body, options)
        if (error) {
            throw new BaseError(EHttpStatusCode.BadRequest, `Validation error: ${error.details.map(x => x.message).join(', ')}`)
        } else {
            req.body = value
            next()
        }
    }
}