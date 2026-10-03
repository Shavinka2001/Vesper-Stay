import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@common/interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const message =
      exception instanceof Error
        ? exception.message
        : 'Internal server error';

    this.logger.error(
      message,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: ApiErrorResponse = {
      success: false,
      data: null,
      message: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
