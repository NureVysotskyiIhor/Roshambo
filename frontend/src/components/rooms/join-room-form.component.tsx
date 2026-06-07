import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Hash } from 'lucide-react'
import type { RoomResponseDto } from '@roshambo/shared'
import { useJoinRoom } from '../../queries/rooms.queries'
import { FormField } from '../auth/form-field.component'
import { SubmitButton } from '../auth/submit-button.component'
import { ErrorBanner } from '../auth/error-banner.component'
import { joinRoomSchema, type JoinRoomFormData } from '../../lib/validations/room.validations'
import { parseError } from '../../lib/parse-error'

interface JoinRoomFormProps {
  onSuccess: (room: RoomResponseDto) => void
}

export function JoinRoomForm({ onSuccess }: JoinRoomFormProps) {
  const [joinError, setJoinError] = useState<string | null>(null)
  const joinRoom = useJoinRoom()

  const joinForm = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
  })

  const onJoinSubmit = (data: JoinRoomFormData) => {
    setJoinError(null)
    joinRoom.mutate(data.code, {
      onSuccess,
      onError: (err) => {
        setJoinError(parseError(err))
      },
    })
  }

  return (
    <>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Enter the room code shared by your opponent.
      </p>
      <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="flex flex-col gap-4">
        <FormField
          label="Room code"
          icon={<Hash size={16} />}
          placeholder="ABC123"
          maxLength={6}
          error={!!joinForm.formState.errors.code || !!joinError}
          disabled={joinRoom.isPending}
          inputStyle={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
          {...joinForm.register('code')}
        />
        {(joinError ?? joinForm.formState.errors.code?.message) && (
          <ErrorBanner message={joinError ?? joinForm.formState.errors.code!.message!} />
        )}
        <SubmitButton isLoading={joinRoom.isPending} loadingText="Joining...">
          Join room
        </SubmitButton>
      </form>
    </>
  )
}
