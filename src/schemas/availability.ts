import { z } from 'zod'

// Base availability status enum
export const AvailabilityStatus = z.enum(['available', 'unavailable', 'maybe'])

// Single availability record schema
export const AvailabilityRecord = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: AvailabilityStatus,
  notes: z.string().optional().default(''),
  user_id: z.string().uuid().optional(), // Optional for bulk operations where user is inferred from auth
})

// Bulk availability request schema
export const BulkAvailabilityRequest = z.object({
  availability_records: z.array(AvailabilityRecord).min(1, 'At least one availability record is required').max(100, 'Maximum 100 records per bulk operation'),
  overwrite_existing: z.boolean().default(false), // Whether to overwrite existing records for the same date
})

// Bulk availability response schema
export const BulkAvailabilityResponse = z.object({
  success: z.boolean(),
  created_count: z.number().min(0),
  updated_count: z.number().min(0),
  skipped_count: z.number().min(0),
  errors: z.array(z.object({
    index: z.number(), // Index of the record in the request array that failed
    date: z.string(),
    error: z.string(),
  })).default([]),
  message: z.string(),
})

// Query parameters for fetching availability
export const AvailabilityQueryParams = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  user_ids: z.array(z.string().uuid()).optional(), // For fetching multiple users' availability
  status: AvailabilityStatus.optional(), // Filter by specific status
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
})

// Single availability response (for GET operations)
export const AvailabilityRecordResponse = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: AvailabilityStatus,
  notes: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// List availability response
export const AvailabilityListResponse = z.object({
  data: z.array(AvailabilityRecordResponse),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    has_more: z.boolean(),
  }),
})

// Error response schema
export const AvailabilityErrorResponse = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
})

// Type exports for TypeScript usage
export type AvailabilityStatus = z.infer<typeof AvailabilityStatus>
export type AvailabilityRecord = z.infer<typeof AvailabilityRecord>
export type BulkAvailabilityRequest = z.infer<typeof BulkAvailabilityRequest>
export type BulkAvailabilityResponse = z.infer<typeof BulkAvailabilityResponse>
export type AvailabilityQueryParams = z.infer<typeof AvailabilityQueryParams>
export type AvailabilityRecordResponse = z.infer<typeof AvailabilityRecordResponse>
export type AvailabilityListResponse = z.infer<typeof AvailabilityListResponse>
export type AvailabilityErrorResponse = z.infer<typeof AvailabilityErrorResponse>

// Validation helper functions
export const validateBulkAvailabilityRequest = (data: unknown): BulkAvailabilityRequest => {
  return BulkAvailabilityRequest.parse(data)
}

export const validateAvailabilityQueryParams = (data: unknown): AvailabilityQueryParams => {
  return AvailabilityQueryParams.parse(data)
}

// Example usage schema for API documentation
export const BulkAvailabilityRequestExample = {
  availability_records: [
    {
      date: "2024-12-25",
      status: "unavailable" as const,
      notes: "Christmas Day - family time"
    },
    {
      date: "2024-12-26",
      status: "available" as const,
      notes: "Boxing Day - free for golf"
    },
    {
      date: "2024-12-27",
      status: "maybe" as const,
      notes: "Depends on weather conditions"
    }
  ],
  overwrite_existing: true
}

export const BulkAvailabilityResponseExample = {
  success: true,
  created_count: 2,
  updated_count: 1,
  skipped_count: 0,
  errors: [],
  message: "Successfully processed 3 availability records"
}