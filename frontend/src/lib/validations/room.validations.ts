import { z } from 'zod'

export const createRoomSchema = z.object({
  name: z.string().max(100).optional(),
})

export const joinRoomSchema = z.object({
  code: z.string().length(6, 'Code must be 6 characters'),
})

export type CreateRoomFormData = z.infer<typeof createRoomSchema>
export type JoinRoomFormData = z.infer<typeof joinRoomSchema>
