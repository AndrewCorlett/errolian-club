import type { User } from '@/types/user'

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@errolian.club',
    name: 'Sarah Wellington',
    role: 'super-admin',
    memberSince: new Date('2023-01-15'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2', 
    email: 'commodore@errolian.club',
    name: 'James Crawford',
    role: 'commodore',
    memberSince: new Date('2023-02-20'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    email: 'alice.parker@errolian.club', 
    name: 'Alice Parker',
    role: 'officer',
    memberSince: new Date('2023-03-10'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '4',
    email: 'mike.chen@errolian.club',
    name: 'Mike Chen', 
    role: 'officer',
    memberSince: new Date('2023-04-05'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '5',
    email: 'emily.roberts@errolian.club',
    name: 'Emily Roberts',
    role: 'member',
    memberSince: new Date('2023-05-12'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '6',
    email: 'david.thompson@errolian.club',
    name: 'David Thompson',
    role: 'member', 
    memberSince: new Date('2023-06-18'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '7',
    email: 'lisa.garcia@errolian.club',
    name: 'Lisa Garcia',
    role: 'member',
    memberSince: new Date('2023-07-22'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '8',
    email: 'ryan.kelly@errolian.club', 
    name: 'Ryan Kelly',
    role: 'member',
    memberSince: new Date('2023-08-30'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '9',
    email: 'maria.lopez@errolian.club',
    name: 'Maria Lopez',
    role: 'member',
    memberSince: new Date('2023-09-14'),
    isActive: false,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '10',
    email: 'alex.turner@errolian.club',
    name: 'Alex Turner',
    role: 'member',
    memberSince: new Date('2023-10-08'),
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face'
  }
]

// Current logged-in user (for demo purposes)
export const currentUser: User = mockUsers[0] // Sarah Wellington (Super Admin)

export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id)
}

export function getUsersByRole(role: User['role']): User[] {
  return mockUsers.filter(user => user.role === role)
}

export function getActiveUsers(): User[] {
  return mockUsers.filter(user => user.isActive)
}

export function getUserCount(): number {
  return mockUsers.length
}

export function getActiveUserCount(): number {
  return getActiveUsers().length
}