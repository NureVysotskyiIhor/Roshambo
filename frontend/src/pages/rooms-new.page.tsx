import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { EVENTS } from '@roshambo/shared'
import type { RoomResponseDto } from '@roshambo/shared'
import { useMyRoom } from '../queries/rooms.queries'
import { socket } from '../socket/socket.client'
import { roomStore } from '../store/room.store'
import { authStore } from '../store/auth.store'
import { useRoomSocket, STATUS_BADGES } from '../hooks/use-room-socket.hook'
import { Loader } from '../components/ui/loader.component'
import { Logo } from '../components/shared/logo.component'
import { RoomWaitingView } from '../components/rooms/room-waiting-view.component'
import { CreateRoomForm } from '../components/rooms/create-room-form.component'
import { JoinRoomForm } from '../components/rooms/join-room-form.component'

type ActiveTab = 'create' | 'join'

export function RoomsNewPage() {
  const navigate = useNavigate()
  const user = authStore((s) => s.user)

  const [sessionRoom, setSessionRoom] = useState<RoomResponseDto | null>(null)
  const [opponentLeft, setOpponentLeft] = useState(false)
  const [opponentName, setOpponentName] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('create')
  const navigatedToGame = useRef(false)

  const { data: existingRoom, isLoading } = useMyRoom()

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

  const handleCreateSuccess = (room: RoomResponseDto) => {
    setSessionRoom(room)
    socket.connect()
    socket.emit(EVENTS.ROOM.JOIN, { code: room.code })
  }

  const handleJoinSuccess = (room: RoomResponseDto) => {
    navigatedToGame.current = true
    roomStore.getState().clearRoom()
    socket.connect()
    socket.emit(EVENTS.ROOM.JOIN, { code: room.code })
    void navigate({ to: '/rooms/$code', params: { code: room.code } })
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
      <RoomWaitingView
        room={currentRoom}
        currentUser={user}
        opponentLeft={opponentLeft}
        opponentName={opponentName}
        statusBadge={statusBadge}
        tabSwitcher={tabSwitcher}
      />
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
        <CreateRoomForm onSuccess={handleCreateSuccess} />
      ) : (
        <JoinRoomForm onSuccess={handleJoinSuccess} />
      )}
    </div>
  )
}
