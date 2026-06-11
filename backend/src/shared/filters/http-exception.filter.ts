import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  BadRequestError,
  ConflictError,
  DomainException,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../exceptions/domain.exception.js';

function mapDomainExceptionToStatus(exception: DomainException): number {
  if (exception instanceof NotFoundError) return HttpStatus.NOT_FOUND;
  if (exception instanceof BadRequestError) return HttpStatus.BAD_REQUEST;
  if (exception instanceof ConflictError) return HttpStatus.CONFLICT;
  if (exception instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
  if (exception instanceof ForbiddenError) return HttpStatus.FORBIDDEN;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

@Catch(HttpException, DomainException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof DomainException) {
      const statusCode = mapDomainExceptionToStatus(exception);
      response.status(statusCode).json({
        statusCode,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exception.message;

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
