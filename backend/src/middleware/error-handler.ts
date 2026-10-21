import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { isProduction } from '../config/env.js';
import { ApiError, type ErrorDetail } from '../lib/api-error.js';

export const notFoundHandler: RequestHandler = (req) => {
  throw new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
};

function isDuplicateKeyError(err: unknown): err is { code: 11000; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details: ErrorDetail[] = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return ApiError.validation(details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}"`);
  }

  if (isDuplicateKeyError(err)) {
    const fields = Object.keys(err.keyValue ?? {});
    const field = fields[0] ?? 'field';
    return ApiError.conflict(
      `A record with this ${field} already exists`,
      fields.map((path) => ({ path, message: `This ${path} is already in use` })),
    );
  }

  // body-parser errors
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body');
  if (type === 'entity.too.large') return new ApiError(413, 'BAD_REQUEST', 'Request body too large');

  return new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const apiError = toApiError(err);

  if (apiError.status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(apiError.status).json({
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details && { details: apiError.details }),
      ...(!isProduction && apiError.status >= 500 && err instanceof Error && { debug: err.message }),
    },
  });
};
