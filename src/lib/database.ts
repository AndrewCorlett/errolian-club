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
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async joinEvent(eventId: string, userId: string): Promise<EventParticipant> {
    const { data, error } = await supabase
      .from('event_participants')
      .insert({ event_id: eventId, user_id: userId })
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
    const { data, error } = await supabase
      .from('itinerary_items')
      .insert(item)
      .select()
      .single()

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
    const { data: owed, error: owedError } = await supabase
      .from('expense_participants')
      .select('share_amount')
      .eq('user_id', userId)
      .eq('is_paid', false)

    const { data: owing, error: owingError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('paid_by', userId)
      .eq('status', 'pending')

    if (owedError || owingError) throw owedError || owingError

    const totalOwed = owed?.reduce((sum: number, item: any) => sum + item.share_amount, 0) || 0
    const totalOwing = owing?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0

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
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error
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