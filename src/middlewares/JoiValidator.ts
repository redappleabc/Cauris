import Joi from "@hapi/joi";
import { Request, NextFunction } from "express";

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
            next(`Validation error: ${error.details.map(x => x.message).join(', ')}`)
        } else {
            req.body = value
            next()
        }
    }
}