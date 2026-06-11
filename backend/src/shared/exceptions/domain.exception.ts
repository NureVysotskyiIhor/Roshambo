export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainException {}
export class BadRequestError extends DomainException {}
export class ConflictError extends DomainException {}
export class UnauthorizedError extends DomainException {}
export class ForbiddenError extends DomainException {}
