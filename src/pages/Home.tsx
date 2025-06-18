import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import IOSHeader from '@/components/layout/IOSHeader'
import Logo from '@/components/ui/Logo'
import { useAuth } from '@/hooks/useAuth'
import { eventService, expenseService } from '@/lib/database'
import type { EventWithDetails } from '@/types/supabase'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [timeOfDay, setTimeOfDay] = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithDetails[]>([])
  const [userBalance, setUserBalance] = useState({ totalOwed: 0, totalOwedTo: 0, netBalance: 0 })
  const [eventsLoading, setEventsLoading] = useState(true)
  const [balanceLoading, setBalanceLoading] = useState(true)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('morning')
    else if (hour < 17) setTimeOfDay('afternoon')
    else setTimeOfDay('evening')
  }, [])

  useEffect(() => {
    if (user) {
      loadUpcomingEvents()
      loadUserBalance()
    }
  }, [user])

  const loadUpcomingEvents = async () => {
    try {
      setEventsLoading(true)
      const response = await eventService.getEvents()
      const events = response.data || []
      const now = new Date()
      const upcoming = events
        .filter((event: EventWithDetails) => new Date(event.start_date) >= now)
        .sort((a: EventWithDetails, b: EventWithDetails) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 3)
      setUpcomingEvents(upcoming)
    } catch (error) {
      console.error('Error loading upcoming events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  const loadUserBalance = async () => {
    if (!user) return
    
    try {
      setBalanceLoading(true)
      const balance = await expenseService.getUserBalance(user.id)
      setUserBalance({
        totalOwed: balance.owing || 0,
        totalOwedTo: balance.owed || 0,
        netBalance: (balance.owed || 0) - (balance.owing || 0)
      })
    } catch (error) {
      console.error('Error loading user balance:', error)
    } finally {
      setBalanceLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-primary-50 pb-20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-white border-primary-200 shadow-lg">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">Welcome to Errolian Club</h2>
            <p className="text-primary-700 mb-4">Please log in to access your dashboard</p>
            <Link to="/auth/login">
              <Button className="w-full bg-royal-600 hover:bg-royal-700 text-white">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const getGreeting = () => {
    const firstName = profile.name.split(' ')[0]
    return `Good ${timeOfDay}, ${firstName}`
  }

  const getRankTitle = () => {
    if (!profile?.role) return 'Member'
    
    switch (profile.role) {
      case 'super-admin':
        return 'Commodore'
      case 'commodore':
        return 'Commodore'
      case 'officer':
        return 'Officer'
      case 'member':
      default:
        return 'Member'
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-royal-50">
      {/* iOS Header */}
      <IOSHeader 
        title=""
        subtitle=""
        leftActions={[
          <div key="logo-greeting" className="flex items-center gap-3">
            <Logo size="xl" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary-900 leading-tight tracking-tight">
                {getGreeting()}
              </span>
              <span className="text-sm text-royal-600 leading-tight">
                {getRankTitle()} • Errolian Club
              </span>
            </div>
          </div>
        ]}
        rightActions={[]}
      />

      <div className="px-6 pt-36 pb-24 max-w-6xl mx-auto space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 stagger-item" style={{ animationDelay: '0.1s' }}>
          <Link to="/calendar">
            <Card hover variant="elevated" className="h-24 bg-white border-primary-200 hover:border-royal-300 transition-colors">
              <CardContent className="flex flex-col items-center justify-center h-full p-4">
                <svg className="w-6 h-6 text-royal-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-primary-900">New Event</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/split-pay/new-expense">
            <Card hover variant="elevated" className="h-24 bg-white border-primary-200 hover:border-forest-300 transition-colors">
              <CardContent className="flex flex-col items-center justify-center h-full p-4">
                <svg className="w-6 h-6 text-forest-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-primary-900">Add Expense</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Split-Pay Balance Widget */}
        <Card variant="elevated" className="stagger-item bg-white border-primary-200" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-primary-900">
                <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Financial Overview
              </CardTitle>
              <Link to="/split-pay">
                <Button size="sm" variant="ghost" className="text-primary-700 hover:text-primary-900 hover:bg-primary-100">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-6 bg-primary-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-primary-200 rounded animate-pulse w-16 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-xl font-bold mb-1 ${userBalance.totalOwed > 0 ? 'text-burgundy-600' : 'text-primary-400'}`}>
                      £{userBalance.totalOwed.toFixed(2)}
                    </div>
                    <div className="text-xs text-primary-600">You owe</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold mb-1 ${userBalance.totalOwedTo > 0 ? 'text-forest-600' : 'text-primary-400'}`}>
                      £{userBalance.totalOwedTo.toFixed(2)}
                    </div>
                    <div className="text-xs text-primary-600">Owed to you</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold mb-1 ${
                      userBalance.netBalance > 0 ? 'text-forest-600' : 
                      userBalance.netBalance < 0 ? 'text-burgundy-600' : 'text-primary-400'
                    }`}>
                      £{Math.abs(userBalance.netBalance).toFixed(2)}
                    </div>
                    <div className="text-xs text-primary-600">
                      {userBalance.netBalance > 0 ? 'Net positive' : 
                       userBalance.netBalance < 0 ? 'Net owed' : 'Settled'}
                    </div>
                  </div>
                </div>
                {userBalance.netBalance !== 0 && (
                  <div className="mt-4 text-center">
                    <Link to="/split-pay">
                      <Button size="sm" className="bg-royal-600 hover:bg-royal-700 text-white">
                        {userBalance.netBalance > 0 ? 'Collect Money' : 'Settle Up'}
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Widget */}
        <Card variant="elevated" className="stagger-item bg-white border-primary-200" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-primary-900">
                <svg className="w-5 h-5 text-royal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Upcoming Events
              </CardTitle>
              <Link to="/calendar">
                <Button size="sm" variant="ghost" className="text-primary-700 hover:text-primary-900 hover:bg-primary-100">View Calendar</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 bg-primary-50 rounded-xl animate-pulse">
                    <div className="h-4 bg-primary-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-primary-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between p-3 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors-smooth"
                    style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-primary-900 text-sm">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-primary-600 mt-1">
                        <span>{formatEventDate(event.start_date)}</span>
                        <span>•</span>
                        <span>{format(new Date(event.start_date), 'h:mm a')}</span>
                        {event.creator && (
                          <>
                            <span>•</span>
                            <span>by {event.creator.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-primary-500">
                        {event.participants?.length || 0}
                        {event.max_participants && `/${event.max_participants}`}
                      </div>
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-primary-600 mb-4">No upcoming events</p>
                <Link to="/calendar">
                  <Button size="sm" className="bg-royal-600 hover:bg-royal-700 text-white">Plan Something</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Widget */}
        <Card variant="elevated" className="stagger-item bg-white border-primary-200" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-primary-900">
              <svg className="w-5 h-5 text-royal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5 5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-royal-50 rounded-xl">
                <div className="w-8 h-8 bg-royal-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-royal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-900">Welcome to Errolian Club!</p>
                  <p className="text-xs text-primary-600">Your membership journey begins here</p>
                </div>
                <span className="text-xs text-primary-500">Now</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Club Stats */}
        <Card variant="glass" className="stagger-item bg-white/80 border-primary-200" style={{ animationDelay: '0.5s' }}>
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-royal-600 mb-1">5</div>
                <div className="text-xs text-primary-600">Active Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-forest-600 mb-1">10</div>
                <div className="text-xs text-primary-600">Club Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-600 mb-1">23</div>
                <div className="text-xs text-primary-600">Activities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}