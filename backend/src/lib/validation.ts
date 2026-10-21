import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { ApiError } from './api-error.js';

/** Parses untrusted input with a Zod schema, converting failures into a 400 ApiError. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw ApiError.validation(
      result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

export const objectId = z
  .string()
  .trim()
  .refine((value) => isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value), 'Invalid id');

export const idParams = z.object({ id: objectId });

export const pageQuery = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

export const searchQuery = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => (value ? value : undefined));

const isoDate = z.coerce.date({ error: 'Invalid date' });

/**
 * Accepts `from`/`to` as ISO dates (YYYY-MM-DD or full ISO strings). `to` is made inclusive
 * of the whole day when only a date is supplied.
 */
export const dateRangeQuery = {
  from: isoDate.optional(),
  to: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: 'custom', message: 'Invalid date' });
        return z.NEVER;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999);
      return date;
    }),
};

/** Comma separated list (`a,b,c`) or repeated query params (`?x=a&x=b`) → string[] */
export function listOf<T extends z.ZodType<string, string>>(item: T) {
  return z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const values = (Array.isArray(value) ? value : value.split(','))
        .map((v) => v.trim())
        .filter(Boolean);
      return values.length ? values : undefined;
    })
    .pipe(z.array(item).max(20).optional());
}

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number');

export const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

export const personName = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be at most 80 characters');
