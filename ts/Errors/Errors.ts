/**
 * Base class for all of our custom error types.
 */
export abstract class RunoApiError extends Error {
    public abstract readonly runoHttpStatus: number;
    constructor(message?: string) {
        super(message);
    }
}

export class BadRequestError extends RunoApiError {
    public readonly runoHttpStatus = 400;
    constructor(message = 'Bad request') {
        super(message);
    }
}

export class NotAuthorizedError extends RunoApiError {
    public readonly runoHttpStatus = 401;
    constructor(message = 'Not authorized') {
        super(message);
    }
}

export class NotFoundError extends RunoApiError {
    public readonly runoHttpStatus = 404;
    constructor(message = 'Not found') {
        super(message);
    }
}

export class InternalServerError extends RunoApiError {
    public readonly runoHttpStatus = 500;
    constructor(message = 'Internal error') {
        super(message);
    }
}
