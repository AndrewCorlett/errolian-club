import { supabase } from './supabase'
import type {
  Event,
  EventInsert,
  EventUpdate,
  EventWithDetails,
  Expense,
  ExpenseUpdate,
  ExpenseWithDetails,
  ItineraryItem,
  ItineraryItemInsert,
  ItineraryItemUpdate,
  DocumentFolder,
  DocumentFolderInsert,
  DocumentFolderUpdate,
  Document,
  DocumentInsert,
  DocumentUpdate,
  UserProfile,
  EventParticipant,
  ExpenseParticipant,
  Settlement,
  SettlementInsert,
  PaginatedResponse
} from '@/types/supabase'
import type { ExpenseEvent } from '@/types/expenses'

export const eventService = {
  async getEvents(page = 1, pageSize = 20): Promise<PaginatedResponse<EventWithDetails>> {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from('events')
      .select(`
        *,
        creator:user_profiles!events_created_by_fkey(*),
        participants:event_participants(
          user_id,
          joined_at,
          user:user_profiles(*)
        ),
        itinerary_items(*),
        expenses(*)
      `, { count: 'exact' })
      .order('start_date', { ascending: true })
      .range(start, end)

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  },

  async getEvent(id: string): Promise<EventWithDetails | null> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:user_profiles!events_created_by_fkey(*),
        participants:event_participants(
          user_id,
          joined_at,
          user:user_profiles(*)
        ),
        itinerary_items(*),
        expenses(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createEvent(event: EventInsert): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateEvent(id: string, updates: EventUpdate): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteEvent(id: string): Promise<void> {
    console.log('Attempting to delete event:', id)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user?.id)
    
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .select()

    console.log('Delete result:', { data, error })
    if (error) throw error
  },

  async joinEvent(eventId: string, userId: string): Promise<EventParticipant> {
    // First get the event to access its universal_id
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('universal_id')
      .eq('id', eventId)
      .single()
    
    if (eventError) throw eventError

    const { data, error } = await supabase
      .from('event_participants')
      .insert({ 
        event_id: eventId, 
        user_id: userId,
        universal_id: event.universal_id // Link using universal_id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) throw error
  }
}

export const itineraryService = {
  async getItineraryItems(eventId: string): Promise<ItineraryItem[]> {
    const { data, error } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createItineraryItem(item: ItineraryItemInsert): Promise<ItineraryItem> {
    console.log('Attempting to create itinerary item:', item)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user for itinerary creation:', user?.id)
    
    const { data, error } = await supabase
      .from('itinerary_items')
      .insert(item)
      .select()
      .single()

    console.log('Itinerary creation result:', { data, error })
    if (error) throw error
    return data
  },

  async updateItineraryItem(id: string, updates: ItineraryItemUpdate): Promise<ItineraryItem> {
    const { data, error } = await supabase
      .from('itinerary_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteItineraryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorderItineraryItems(eventId: string, itemIds: string[]): Promise<void> {
    const updates = itemIds.map((id, index) => ({
      id,
      order_index: index
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('itinerary_items')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('event_id', eventId)

      if (error) throw error
    }
  }
}

export const expenseService = {
  async getExpenses(page = 1, pageSize = 20): Promise<PaginatedResponse<ExpenseWithDetails>> {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_user:user_profiles!expenses_paid_by_fkey(*),
        event:events(*),
        participants:expense_participants(
          *,
          user:user_profiles(*)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  },

  async getExpense(id: string): Promise<ExpenseWithDetails | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_user:user_profiles!expenses_paid_by_fkey(*),
        event:events(*),
        participants:expense_participants(
          *,
          user:user_profiles(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createExpense(expenseData: any): Promise<Expense> {
    // Extract participants from expense data
    const { participants, ...expense } = expenseData
    
    // Create the expense first
    const { data: createdExpense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    if (expenseError) throw expenseError

    // Create participants if provided
    if (participants && participants.length > 0) {
      const participantInserts = participants.map((p: any) => ({
        expense_id: createdExpense.id,
        user_id: p.user_id,
        share_amount: p.share_amount,
        is_paid: p.is_paid || false,
        paid_at: p.paid_at || null
      }))

      const { error: participantsError } = await supabase
        .from('expense_participants')
        .insert(participantInserts)

      if (participantsError) {
        // If participants creation fails, delete the expense to maintain consistency
        await supabase.from('expenses').delete().eq('id', createdExpense.id)
        throw participantsError
      }
    }

    return createdExpense
  },

  async updateExpense(id: string, updates: ExpenseUpdate): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async addParticipant(expenseId: string, userId: string, shareAmount: number): Promise<ExpenseParticipant> {
    const { data, error } = await supabase
      .from('expense_participants')
      .insert({
        expense_id: expenseId,
        user_id: userId,
        share_amount: shareAmount
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeParticipant(expenseId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('expense_participants')
      .delete()
      .eq('expense_id', expenseId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async markParticipantPaid(expenseId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('expense_participants')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('expense_id', expenseId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async getUserBalance(userId: string): Promise<{ owed: number; owing: number }> {
    // Get all unsettled expenses where user is involved
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        participants:expense_participants(
          user_id,
          share_amount,
          is_paid
        )
      `)
      .neq('status', 'settled')

    if (error) throw error

    let totalOwed = 0 // What user owes to others
    let totalOwing = 0 // What others owe to user

    expenses?.forEach((expense: any) => {
      const userParticipant = expense.participants?.find((p: any) => p.user_id === userId)
      
      if (expense.paid_by === userId) {
        // User paid for this expense - others owe them
        expense.participants?.forEach((participant: any) => {
          if (participant.user_id !== userId && !participant.is_paid) {
            totalOwing += Number(participant.share_amount)
          }
        })
      } else if (userParticipant && !userParticipant.is_paid) {
        // User owes money for this expense
        totalOwed += Number(userParticipant.share_amount)
      }
    })

    return { owed: totalOwed, owing: totalOwing }
  }
}

export const settlementService = {
  async createSettlement(settlement: SettlementInsert): Promise<Settlement> {
    const { data, error } = await supabase
      .from('settlements')
      .insert(settlement)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async markSettled(id: string): Promise<void> {
    const { error } = await supabase
      .from('settlements')
      .update({ is_settled: true, settled_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  async getUserSettlements(userId: string): Promise<Settlement[]> {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const documentService = {
  async getFolders(): Promise<DocumentFolder[]> {
    const { data, error } = await supabase
      .from('document_folders')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createFolder(folder: DocumentFolderInsert): Promise<DocumentFolder> {
    const { data, error } = await supabase
      .from('document_folders')
      .insert(folder)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateFolder(id: string, updates: DocumentFolderUpdate): Promise<DocumentFolder> {
    const { data, error } = await supabase
      .from('document_folders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteFolder(id: string): Promise<void> {
    const { error } = await supabase
      .from('document_folders')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getDocuments(folderId?: string): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select('*')

    if (folderId) {
      query = query.eq('folder_id', folderId)
    } else {
      query = query.is('folder_id', null)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createDocument(document: DocumentInsert): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateDocument(id: string, updates: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteDocument(id: string): Promise<void> {
    // First get the document to find its storage path
    const document = await this.getDocument(id)
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Clean up file storage if document has a storage path
    if (document?.storage_path) {
      try {
        const { fileStorage } = await import('./fileStorage')
        await fileStorage.deleteFile(document.storage_path)
        // Also delete any versions
        await fileStorage.deleteDocumentVersions(id)
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
        // Don't throw here as the document record is already deleted
      }
    }
  },

  async createDocumentWithFile(
    file: File,
    documentData: Omit<DocumentInsert, 'storage_path' | 'size_bytes' | 'mime_type'>
  ): Promise<{ document: Document; uploadResult: any }> {
    const { fileStorage } = await import('./fileStorage')
    
    const maxRetries = 3
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Upload file first (with retry-specific path generation)
        const uploadResult = await fileStorage.uploadFile(file, {
          folder: documentData.folder_id ? `folders/${documentData.folder_id}` : 'general',
          isPublic: documentData.is_public || false,
          // Add retry suffix to ensure unique paths on subsequent attempts
          retryAttempt: attempt > 1 ? attempt : undefined
        })

        // Create document record with file information
        const documentInsert: DocumentInsert = {
          ...documentData,
          storage_path: uploadResult.path,
          size_bytes: uploadResult.size,
          mime_type: uploadResult.mimeType
        }

        const document = await this.createDocument(documentInsert)

        return { document, uploadResult }
      } catch (error: any) {
        lastError = error
        
        // Check if this is a storage path uniqueness constraint violation
        if (error?.code === '23505' && error?.message?.includes('documents_storage_path_key')) {
          console.log(`Storage path collision on attempt ${attempt}, retrying...`)
          
          if (attempt < maxRetries) {
            // Wait a small random amount before retrying to reduce collision probability
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
            continue
          }
        }
        
        // For non-uniqueness errors or if we've exhausted retries, throw immediately
        console.error('Failed to create document with file:', error)
        throw error
      }
    }
    
    // This should never be reached, but just in case
    throw lastError
  },

  async createDocumentVersion(
    documentId: string,
    file: File,
    versionNumber: number,
    _changelog?: string
  ): Promise<{ document: Document; uploadResult: any }> {
    const { fileStorage } = await import('./fileStorage')
    
    try {
      // Upload new version
      const uploadResult = await fileStorage.uploadVersion(file, documentId, versionNumber)

      // Update document with new version info
      const updates: DocumentUpdate = {
        storage_path: uploadResult.path,
        size_bytes: uploadResult.size,
        mime_type: uploadResult.mimeType,
        version: versionNumber,
        updated_at: new Date().toISOString()
      }

      const document = await this.updateDocument(documentId, updates)

      return { document, uploadResult }
    } catch (error) {
      console.error('Failed to create document version:', error)
      throw error
    }
  },

  async getSecureFileUrl(documentId: string, expiresIn: number = 3600): Promise<string> {
    const document = await this.getDocument(documentId)
    
    if (!document?.storage_path) {
      throw new Error('Document has no associated file')
    }

    const { fileStorage } = await import('./fileStorage')
    return fileStorage.createSignedUrl(document.storage_path, expiresIn)
  },

  async approveDocument(id: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  },

  async rejectDocument(id: string, rejectedBy: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({
        status: 'rejected',
        approved_by: rejectedBy,
        rejected_reason: reason
      })
      .eq('id', id)

    if (error) throw error
  }
}

export const userService = {
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getUser(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updateUserRole(id: string, role: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deactivateUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }
}

export const storageService = {
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)

    if (error) throw error
    return data.path
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  },

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }
}

export const availabilityService = {
  async createAvailability(availability: {
    startDate: string
    endDate?: string
    availability_type: 'available' | 'busy' | 'tentative'
    notes?: string
  }): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Convert single date to date range if endDate not provided
    const startDateTime = new Date(availability.startDate + 'T00:00:00.000Z')
    const endDateTime = availability.endDate 
      ? new Date(availability.endDate + 'T23:59:59.999Z')
      : new Date(availability.startDate + 'T23:59:59.999Z')

    const { data, error } = await supabase
      .from('user_availability')
      .insert({
        user_id: user.id,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        availability_type: availability.availability_type,
        notes: availability.notes || null
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAvailability(userId?: string, startDate?: string, endDate?: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user && !userId) {
      throw new Error('User not authenticated and no user ID provided')
    }

    let query = supabase
      .from('user_availability')
      .select('*')

    // Filter by user
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (user) {
      query = query.eq('user_id', user.id)
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    const { data, error } = await query.order('start_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  async updateAvailability(id: string, updates: {
    availability_type?: 'available' | 'busy' | 'tentative'
    notes?: string
  }): Promise<any> {
    const { data, error } = await supabase
      .from('user_availability')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteAvailability(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_availability')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const expenseEventService = {
  async getExpenseEvents(page = 1, pageSize = 20): Promise<PaginatedResponse<ExpenseEvent>> {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from('expense_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) throw error

    // For now, we'll fetch expenses separately if needed
    // This avoids the 500 error from the nested select
    const expenseEvents = data || []
    
    // Optionally fetch expenses for each event
    for (const event of expenseEvents) {
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('expense_event_id', event.id)
      
      event.expenses = expenses || []
    }

    return {
      data: expenseEvents,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  },

  async getExpenseEvent(id: string): Promise<ExpenseEvent | null> {
    const { data: eventData, error } = await supabase
      .from('expense_events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!eventData) return null

    // Fetch expenses separately
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('expense_event_id', id)
    
    eventData.expenses = expenses || []
    
    return eventData
  },

  async createExpenseEvent(eventData: {
    title: string
    description?: string
    location?: string
    currency: string
    createdBy: string
    participants: string[]
    calendar_event_id?: string
    universal_id?: string
  }): Promise<ExpenseEvent> {
    console.log('📝 Creating expense event with data:', eventData)
    
    // Create the expense event
    const insertData = {
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      currency: eventData.currency,
      created_by: eventData.createdBy,
      participant_count: eventData.participants.length,
      calendar_event_id: eventData.calendar_event_id,
      universal_id: eventData.universal_id, // Include universal_id for linking
      status: 'active' as const,
      total_amount: 0
    }
    
    console.log('📝 Insert data for expense_events table:', insertData)
    
    const { data: expenseEvent, error: eventError } = await supabase
      .from('expense_events')
      .insert(insertData)
      .select()
      .single()

    if (eventError) {
      console.error('❌ Database error creating expense event:', eventError)
      throw eventError
    }
    
    console.log('✅ Expense event created in database:', expenseEvent)

    // Add participants (avoiding duplicates)
    if (eventData.participants.length > 0) {
      // First check which participants already exist
      const { data: existingParticipants } = await supabase
        .from('expense_event_participants')
        .select('user_id')
        .eq('expense_event_id', expenseEvent.id)

      const existingUserIds = existingParticipants?.map(p => p.user_id) || []
      const newParticipants = eventData.participants.filter(userId => !existingUserIds.includes(userId))

      if (newParticipants.length > 0) {
        const participantInserts = newParticipants.map(userId => ({
          expense_event_id: expenseEvent.id,
          user_id: userId,
          universal_id: eventData.universal_id // Link participants using universal_id
        }))

        console.log('📝 Adding new participants to expense event:', participantInserts)

        const { error: participantsError } = await supabase
          .from('expense_event_participants')
          .insert(participantInserts)

        if (participantsError) {
          console.error('❌ Database error creating expense event participants:', participantsError)
          // If participants creation fails, delete the event to maintain consistency
          await supabase.from('expense_events').delete().eq('id', expenseEvent.id)
          throw participantsError
        }
        
        console.log('✅ New participants added to expense event successfully')
      } else {
        console.log('📝 All participants already exist in expense event')
      }
    }

    return expenseEvent
  },

  async updateExpenseEvent(id: string, updates: Partial<ExpenseEvent>): Promise<ExpenseEvent> {
    const { data, error } = await supabase
      .from('expense_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteExpenseEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('expense_events')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async addParticipant(expenseEventId: string, userId: string): Promise<void> {
    // Check if participant already exists
    const { data: existing } = await supabase
      .from('expense_event_participants')
      .select('*')
      .eq('expense_event_id', expenseEventId)
      .eq('user_id', userId)
      .single()

    // If participant already exists, return early
    if (existing) {
      console.log('📝 Participant already exists in expense event:', userId)
      return
    }

    const { error } = await supabase
      .from('expense_event_participants')
      .insert({
        expense_event_id: expenseEventId,
        user_id: userId
      })

    if (error) throw error

    // Update participant count
    const { error: updateError } = await supabase
      .from('expense_events')
      .update({
        participant_count: supabase.rpc('increment_participant_count', { expense_event_id: expenseEventId })
      })
      .eq('id', expenseEventId)

    if (updateError) console.warn('Failed to update participant count:', updateError)
  },

  async removeParticipant(expenseEventId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('expense_event_participants')
      .delete()
      .eq('expense_event_id', expenseEventId)
      .eq('user_id', userId)

    if (error) throw error

    // Update participant count
    const { error: updateError } = await supabase
      .from('expense_events')
      .update({
        participant_count: supabase.rpc('decrement_participant_count', { expense_event_id: expenseEventId })
      })
      .eq('id', expenseEventId)

    if (updateError) console.warn('Failed to update participant count:', updateError)
  }
}