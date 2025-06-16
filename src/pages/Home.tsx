import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import IOSHeader, { IOSActionButton } from '@/components/layout/IOSHeader'
import Logo from '@/components/ui/Logo'
import { useUserStore } from '@/store/userStore'
import { getUserBalance } from '@/data/mockExpenses'
import { getUpcomingEvents } from '@/data/mockEvents'
import { getUserById } from '@/data/mockUsers'

export default function Home() {
  const { currentUser } = useUserStore()
  const [timeOfDay, setTimeOfDay] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('morning')
    else if (hour < 17) setTimeOfDay('afternoon')
    else setTimeOfDay('evening')
  }, [])

  if (!currentUser) {
    return (
      <div className="min-h-screen pb-24 bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Errolian Club</h2>
            <p className="text-gray-600">Please log in to access your dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userBalance = getUserBalance(currentUser.id)
  const upcomingEvents = getUpcomingEvents().slice(0, 3)
  
  const getGreeting = () => {
    const emoji = timeOfDay === 'morning' ? '🌅' : timeOfDay === 'afternoon' ? '☀️' : '🌙'
    return `Good ${timeOfDay}, ${currentUser.name.split(' ')[0]} ${emoji}`
  }

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* iOS Header */}
      <IOSHeader 
        title={getGreeting()} 
        subtitle="Ready for your next adventure?"
        leftActions={[
          <Logo key="logo" size="sm" />
        ]}
        rightActions={[
          <IOSActionButton key="notifications" aria-label="Notifications">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5 5-5" />
            </svg>
          </IOSActionButton>,
          <IOSActionButton key="profile" aria-label="Profile" variant="primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </IOSActionButton>
        ]}
      />

      <div className="px-6 pt-32 pb-6 max-w-6xl mx-auto space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 stagger-item" style={{ animationDelay: '0.1s' }}>
          <Link to="/calendar">
            <Card hover variant="elevated" className="h-24">
              <CardContent className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-2xl mb-1">📅</div>
                <span className="text-sm font-medium text-gray-900">New Event</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/split-pay">
            <Card hover variant="elevated" className="h-24">
              <CardContent className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-2xl mb-1">💳</div>
                <span className="text-sm font-medium text-gray-900">Add Expense</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Split-Pay Balance Widget */}
        <Card variant="elevated" className="stagger-item" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">💰 Financial Overview</CardTitle>
              <Link to="/split-pay">
                <Button size="sm" variant="ghost">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={`text-xl font-bold mb-1 ${userBalance.totalOwed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  ${userBalance.totalOwed.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">You owe</div>
              </div>
              <div>
                <div className={`text-xl font-bold mb-1 ${userBalance.totalOwedTo > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  ${userBalance.totalOwedTo.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Owed to you</div>
              </div>
              <div>
                <div className={`text-xl font-bold mb-1 ${
                  userBalance.netBalance > 0 ? 'text-green-600' : 
                  userBalance.netBalance < 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  ${Math.abs(userBalance.netBalance).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">
                  {userBalance.netBalance > 0 ? 'Net positive' : 
                   userBalance.netBalance < 0 ? 'Net owed' : 'Settled'}
                </div>
              </div>
            </div>
            {userBalance.netBalance !== 0 && (
              <div className="mt-4 text-center">
                <Link to="/split-pay">
                  <Button size="sm">
                    {userBalance.netBalance > 0 ? 'Collect Money' : 'Settle Up'}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Widget */}
        <Card variant="elevated" className="stagger-item" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">🗓️ Upcoming Events</CardTitle>
              <Link to="/calendar">
                <Button size="sm" variant="ghost">View Calendar</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => {
                  const organizer = getUserById(event.createdBy)
                  return (
                    <div 
                      key={event.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors-smooth"
                      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <span>{formatEventDate(event.startDate)}</span>
                          <span>•</span>
                          <span>{format(event.startDate, 'h:mm a')}</span>
                          {organizer && (
                            <>
                              <span>•</span>
                              <span>by {organizer.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          {event.currentParticipants.length}
                          {event.maxParticipants && `/${event.maxParticipants}`}
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🏔️</div>
                <p className="text-gray-600 mb-4">No upcoming events</p>
                <Link to="/calendar">
                  <Button size="sm">Plan Something</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Widget */}
        <Card variant="elevated" className="stagger-item" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🔔 Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">🎉</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Welcome to Errolian Club!</p>
                  <p className="text-xs text-gray-600">Your adventure planning journey begins here</p>
                </div>
                <span className="text-xs text-gray-500">Now</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Club Stats */}
        <Card variant="glass" className="stagger-item" style={{ animationDelay: '0.5s' }}>
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">5</div>
                <div className="text-xs text-gray-600">Active Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">10</div>
                <div className="text-xs text-gray-600">Club Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-1">23</div>
                <div className="text-xs text-gray-600">Adventures</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}