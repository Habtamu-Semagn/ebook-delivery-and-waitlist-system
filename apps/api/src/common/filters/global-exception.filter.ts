import {
  ExceptionFilter,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { ArgumentsHost } from '@nestjs/common'
import { Request, Response as ExpressResponse } from 'express' // Alias to avoid collision with global Fetch Response
import { SentryExceptionCaptured } from '@sentry/nestjs'
import * as Sentry from '@sentry/nestjs'

export interface ErrorResponse {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
  correlationId?: string | undefined // Explicitly allow undefined for exactOptionalPropertyTypes
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
   
    const response = ctx.getResponse<ExpressResponse>()
    const request = ctx.getRequest<Request>()

    const rawCorrelationId = request.headers['x-correlation-id']
    const correlationId = typeof rawCorrelationId === 'string' ? rawCorrelationId : undefined

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Internal server error'
    let errorName = 'InternalServerError'

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const res = exception.getResponse()

      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message
        errorName = (res as any).error || exception.name
      } else {
        message = res
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack)

      Sentry.captureException(exception, {
        extra: { correlationId, path: request.url },
      })
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(correlationId ? { correlationId } : {}), // Avoids assigning explicit undefined when omitted
    }

    this.logger.warn(
      `[${correlationId ?? 'N/A'}] ${request.method} ${request.url} -> ${statusCode}`
    )

    // response.status() works as a function call
    response.status(statusCode).json(errorResponse)
  }
}