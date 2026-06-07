import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DoorOpen, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { EVENTS } from '@roshambo/shared'
import type { RoomResponseDto } from '@roshambo/shared'
import { useMyRoom, useCreateRoom, useJoinRoom } from '../queries/rooms.queries'
import { socket } from '../socket/socket.client'
import { roomStore } from '../store/room.store'
import { authStore } from '../store/auth.store'
import { useRoomSocket, STATUS_BADGES } from '../hooks/use-room-socket.hook'
import { Loader } from '../components/ui/loader.component'
import { Logo } from '../components/shared/logo.component'
import { FormField } from '../components/auth/form-field.component'
import { SubmitButton } from '../components/auth/submit-button.component'
import { ErrorBanner } from '../components/auth/error-banner.component'
import { RoomCodeDisplay } from '../components/rooms/room-code-display.component'
import { CopyButton } from '../components/rooms/copy-button.component'
import { PlayerCard } from '../components/rooms/player-card.component'
import { WaitingIndicator } from '../components/rooms/waiting-indicator.component'
import { WarningBanner } from '../components/rooms/warning-banner.component'
import {
  createRoomSchema,
  joinRoomSchema,
  type CreateRoomFormData,
  type JoinRoomFormData,
} from '../lib/validations/room.validations'
import { parseError } from '../lib/parse-error'

type ActiveTab = 'create' | 'join'

export function RoomsNewPage() {
  const navigate = useNavigate()
  const user = authStore((s) => s.user)

  const [sessionRoom, setSessionRoom] = useState<RoomResponseDto | null>(null)
  const [opponentLeft, setOpponentLeft] = useState(false)
  const [opponentName, setOpponentName] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('create')
  const [joinError, setJoinError] = useState<string | null>(null)
  const navigatedToGame = useRef(false)

  const { data: existingRoom, isLoading } = useMyRoom()
  const createRoom = useCreateRoom()
  const joinRoom = useJoinRoom()

  const createForm = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
  })

  const joinForm = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
  })

  const currentRoom = sessionRoom ?? existingRoom ?? null
  const pageState = currentRoom ? 'waiting' : 'create'
  const showWaiting = activeTab === 'create' && pageState === 'waiting' && !!currentRoom

  const statusBadge = currentRoom
    ? STATUS_BADGES[currentRoom.status] ?? STATUS_BADGES.waiting
    : STATUS_BADGES.waiting

  const tabSwitcher = (
    <div
      style={{
        display: 'flex',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
        padding: 4,
        marginBottom: 24,
      }}
    >
      {(['create', 'join'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => handleTabChange(tab)}
          style={{
            flex: 1,
            height: 36,
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'background-color 0.15s, color 0.15s',
            backgroundColor: activeTab === tab ? 'var(--color-primary)' : 'transparent',
            color: activeTab === tab ? 'white' : 'var(--color-text-muted)',
          }}
        >
          {tab === 'create' ? 'Create room' : 'Join room'}
        </button>
      ))}
    </div>
  )

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    if (tab === 'create') {
      joinForm.reset()
      setJoinError(null)
    } else {
      createForm.reset()
    }
  }

  useRoomSocket({
    existingRoom,
    sessionRoom,
    navigate,
    onOpponentLeft: (name) => {
      setOpponentName(name)
      setOpponentLeft(true)
    },
    markNavigatedToGame: () => {
      navigatedToGame.current = true
    },
  })

  // Disconnect socket on unmount only if we did NOT navigate to game room
  useEffect(() => {
    return () => {
      if (!navigatedToGame.current) {
        socket.disconnect()
      }
    }
  }, [])

  const onCreateSubmit = (data: CreateRoomFormData) => {
    createRoom.mutate(
      { name: data.name || undefined },
      {
        onSuccess: (room) => {
          setSessionRoom(room)
          socket.connect()
          socket.emit(EVENTS.ROOM.JOIN, { code: room.code })
        },
        onError: () => {
          toast.error('Failed to create room')
        },
      },
    )
  }

  const onJoinSubmit = (data: JoinRoomFormData) => {
    setJoinError(null)
    joinRoom.mutate(data.code, {
      onSuccess: (room) => {
        navigatedToGame.current = true
        roomStore.getState().clearRoom()
        socket.connect()
        socket.emit(EVENTS.ROOM.JOIN, { code: room.code })
        void navigate({ to: '/rooms/$code', params: { code: room.code } })
      },
      onError: (err) => {
        setJoinError(parseError(err))
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <Loader size="lg" />
      </div>
    )
  }

  if (showWaiting && currentRoom) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>

        {tabSwitcher}

        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 28 }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <div className="flex items-center" style={{ gap: 4 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-rock)',
                }}
              />
              <div style={{ width: 10, height: 10, backgroundColor: 'var(--color-paper)' }} />
              <div
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: 'var(--color-scissors)',
                  transform: 'rotate(45deg)',
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text)',
                }}
              >
                ROSHAMBO
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Rock · Scissors · Paper
              </p>
            </div>
          </div>

          <div
            className="flex items-center"
            style={{
              gap: 8,
              backgroundColor: statusBadge.background,
              border: statusBadge.border,
              borderRadius: 20,
              padding: '6px 12px',
              color: statusBadge.color,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusBadge.color,
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{statusBadge.label}</span>
          </div>
        </div>

        {opponentLeft && (
          <div style={{ marginBottom: 20 }}>
            <WarningBanner
              message={`${opponentName || 'Opponent'} disconnected. Score has been reset — 0:0. Room is open for a new player.`}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <RoomCodeDisplay code={currentRoom.code} />
        </div>

        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <CopyButton text={currentRoom.code} />
        </div>

        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Share this code with your opponent to start the game
        </p>

        <div style={{ height: 1, backgroundColor: 'var(--color-border)', marginBottom: 20 }} />

        <PlayerCard
          username={user?.username ?? ''}
          avatarUrl={user?.avatarUrl ?? ''}
          isYou={true}
        />

        <WaitingIndicator text="Waiting for opponent to join..." />
      </div>
    )
  }

  // Create / Join form
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 560,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 32,
      }}
    >
      <Logo />

      <div style={{ marginTop: 24 }}>{tabSwitcher}</div>

      {activeTab === 'create' ? (
        <>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Create a room and invite a friend to play.
          </p>
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="flex flex-col gap-4"
          >
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
      ) : (
        <>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Enter the room code shared by your opponent.
          </p>
          <form
            onSubmit={joinForm.handleSubmit(onJoinSubmit)}
            className="flex flex-col gap-4"
          >
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
              <ErrorBanner
                message={joinError ?? joinForm.formState.errors.code!.message!}
              />
            )}
            <SubmitButton isLoading={joinRoom.isPending} loadingText="Joining...">
              Join room
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  )
}
