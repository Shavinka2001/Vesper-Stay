import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@common/interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message = this.resolveMessage(exceptionResponse, exception.message);

    const body: ApiErrorResponse = {
      success: false,
      data: null,
      message,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(message, exception.stack);
    }

    response.status(status).json(body);
  }

  private resolveMessage(
    exceptionResponse: string | object,
    fallback: string,
  ): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const raw = (exceptionResponse as { message: string | string[] }).message;
      return Array.isArray(raw) ? raw.join(', ') : raw;
    }

    return fallback;
  }
}
