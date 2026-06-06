export type Choice = 'rock' | 'paper' | 'scissors'

export interface AuthResponseDto {
  id: string
  username: string
  avatarUrl: string
  role: string
  email: string | null
  isEmailVerified: boolean
  createdAt: string
}

export interface UserResponseDto extends AuthResponseDto {
  updatedAt: string
}

export interface RoomResponseDto {
  id: string
  code: string
  name: string | null
  status: 'waiting' | 'in_progress' | 'finished'
  isPrivate: boolean
  creatorId: string
  createdAt: string
  updatedAt: string
}

export interface ParticipantDto {
  userId: string
  username: string
  avatarUrl: string
  score: number
  role: string
  joinedAt: string
}

export interface RoundResultPayload {
  playerOneId: string
  playerTwoId: string
  playerOneChoice: Choice
  playerTwoChoice: Choice
  winnerId: string | null
  isDraw: boolean
  scores: { [userId: string]: number }
}

export interface UpdateUserDto {
  username?: string
  password?: string
  email?: string
  avatarUrl?: string
}
