import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Erreur interne du serveur';

    const error =
      exception instanceof HttpException
        ? (HttpStatus[statusCode] ?? 'UNKNOWN_ERROR')
        : 'INTERNAL_SERVER_ERROR';

    // Capturer dans Sentry : erreurs non-HTTP ET HttpException avec status 5xx
    const shouldCapture =
      !(exception instanceof HttpException) || statusCode >= 500;

    if (shouldCapture) {
      Sentry.captureException(exception);
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error('Exception non gérée', stack);
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
