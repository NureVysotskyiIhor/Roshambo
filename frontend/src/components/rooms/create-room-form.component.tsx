import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DoorOpen } from 'lucide-react'
import { toast } from 'sonner'
import type { RoomResponseDto } from '@roshambo/shared'
import { useCreateRoom } from '../../queries/rooms.queries'
import { FormField } from '../auth/form-field.component'
import { SubmitButton } from '../auth/submit-button.component'
import { createRoomSchema, type CreateRoomFormData } from '../../lib/validations/room.validations'

interface CreateRoomFormProps {
  onSuccess: (room: RoomResponseDto) => void
}

export function CreateRoomForm({ onSuccess }: CreateRoomFormProps) {
  const createRoom = useCreateRoom()

  const createForm = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
  })

  const onCreateSubmit = (data: CreateRoomFormData) => {
    createRoom.mutate(
      { name: data.name || undefined },
      {
        onSuccess,
        onError: () => {
          toast.error('Failed to create room')
        },
      },
    )
  }

  return (
    <>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Create a room and invite a friend to play.
      </p>
      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
        <FormField
          label="Room name"
          labelRight={<span style={{ fontSize: 11 }}>Optional</span>}
          icon={<DoorOpen size={16} />}
          placeholder="Evening rematch"
          maxLength={50}
          error={!!createForm.formState.errors.name}
          disabled={createRoom.isPending}
          {...createForm.register('name')}
        />
        <SubmitButton isLoading={createRoom.isPending} loadingText="Creating room...">
          Create room
        </SubmitButton>
      </form>
    </>
  )
}
