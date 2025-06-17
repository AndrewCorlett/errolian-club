import { supabase } from '@/lib/supabase'
import { 
  validateBulkAvailabilityRequest, 
  validateAvailabilityQueryParams,
  type AvailabilityRecord,
  type BulkAvailabilityRequest,
  type BulkAvailabilityResponse,
  type AvailabilityQueryParams,
  type AvailabilityListResponse 
} from '@/schemas/availability'

/**
 * Submit a single availability record
 */
export async function submitAvailability(record: Omit<AvailabilityRecord, 'user_id'>): Promise<BulkAvailabilityResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const requestData: BulkAvailabilityRequest = {
      availability_records: [{ ...record, user_id: user.id }],
      overwrite_existing: true
    }

    return await submitBulkAvailability(requestData)
  } catch (error) {
    return {
      success: false,
      created_count: 0,
      updated_count: 0,
      skipped_count: 0,
      errors: [{ index: 0, date: record.date, error: error instanceof Error ? error.message : 'Unknown error' }],
      message: 'Failed to submit availability'
    }
  }
}

/**
 * Submit multiple availability records in bulk
 */
export async function submitBulkAvailability(request: BulkAvailabilityRequest): Promise<BulkAvailabilityResponse> {
  try {
    // Validate the request
    const validatedRequest = validateBulkAvailabilityRequest(request)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Add user_id to records that don't have it
    const recordsWithUserId = validatedRequest.availability_records.map(record => ({
      ...record,
      user_id: record.user_id || user.id
    }))

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: Array<{ index: number; date: string; error: string }> = []

    // Process each record
    for (let i = 0; i < recordsWithUserId.length; i++) {
      const record = recordsWithUserId[i]
      
      try {
        // Check if record already exists
        const { data: existing } = await supabase
          .from('availability')
          .select('id')
          .eq('user_id', record.user_id)
          .eq('date', record.date)
          .single()

        if (existing) {
          if (validatedRequest.overwrite_existing) {
            // Update existing record
            const { error } = await supabase
              .from('availability')
              .update({
                status: record.status,
                notes: record.notes || '',
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)

            if (error) {
              errors.push({ index: i, date: record.date, error: error.message })
            } else {
              updatedCount++
            }
          } else {
            skippedCount++
          }
        } else {
          // Create new record
          const { error } = await supabase
            .from('availability')
            .insert({
              user_id: record.user_id,
              date: record.date,
              status: record.status,
              notes: record.notes || ''
            })

          if (error) {
            errors.push({ index: i, date: record.date, error: error.message })
          } else {
            createdCount++
          }
        }
      } catch (error) {
        errors.push({ 
          index: i, 
          date: record.date, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    const totalProcessed = createdCount + updatedCount + skippedCount
    const success = errors.length === 0

    return {
      success,
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      errors,
      message: success 
        ? `Successfully processed ${totalProcessed} availability records`
        : `Processed ${totalProcessed} records with ${errors.length} errors`
    }

  } catch (error) {
    return {
      success: false,
      created_count: 0,
      updated_count: 0,
      skipped_count: 0,
      errors: [{ index: 0, date: '', error: error instanceof Error ? error.message : 'Unknown error' }],
      message: 'Failed to process bulk availability request'
    }
  }
}

/**
 * Fetch availability records with optional filtering
 */
export async function getAvailability(params?: AvailabilityQueryParams): Promise<AvailabilityListResponse> {
  try {
    const validatedParams = params ? validateAvailabilityQueryParams(params) : { limit: 100, offset: 0 }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user && !validatedParams.user_ids) {
      throw new Error('User not authenticated and no user IDs provided')
    }

    let query = supabase
      .from('availability')
      .select('*', { count: 'exact' })

    // Apply filters
    if (validatedParams.user_ids) {
      query = query.in('user_id', validatedParams.user_ids)
    } else if (user) {
      query = query.eq('user_id', user.id)
    }

    if (validatedParams.start_date) {
      query = query.gte('date', validatedParams.start_date)
    }

    if (validatedParams.end_date) {
      query = query.lte('date', validatedParams.end_date)
    }

    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status)
    }

    // Apply pagination
    query = query
      .range(validatedParams.offset || 0, (validatedParams.offset || 0) + (validatedParams.limit || 100) - 1)
      .order('date', { ascending: true })

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const total = count || 0
    const limit = validatedParams.limit || 100
    const offset = validatedParams.offset || 0

    return {
      data: data || [],
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    }

  } catch (error) {
    throw new Error(`Failed to fetch availability: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete availability record
 */
export async function deleteAvailability(date: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date)

    if (error) {
      throw error
    }

    return {
      success: true,
      message: 'Availability record deleted successfully'
    }

  } catch (error) {
    return {
      success: false,
      message: `Failed to delete availability: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}