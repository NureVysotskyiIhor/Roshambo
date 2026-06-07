import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EVENTS } from '@roshambo/shared'
import type { Choice, RoundResultPayload } from '@roshambo/shared'
import { socket } from '../socket/socket.client'
import { gameSocket } from '../socket/game.socket'
import { roomSocket } from '../socket/room.socket'
import { authStore } from '../store/auth.store'
import { roomStore } from '../store/room.store'
import { gameStore } from '../store/game.store'
import { roomsApi } from '../api/rooms.api'
import { roomKeys } from '../queries/rooms.queries'
import { Loader } from '../components/ui/loader.component'
import { PATHS } from '../routes/paths'
import { PlayerColumn } from '../components/game/player-column.component'
import { ChoiceCard } from '../components/game/choice-card.component'
import { ChoiceSymbol } from '../components/game/choice-symbol.component'
import { OpponentCard } from '../components/game/opponent-card.component'
import { ScoreCircle } from '../components/game/score-circle.component'
import { queryClient } from '../lib/query-client'

const CHOICES: Choice[] = ['rock', 'paper', 'scissors']

const LEAVE_REASON_MESSAGES: Record<string, string> = {
  host_left: 'Host left the room',
  host_disconnected: 'Host disconnected',
  opponent_left: 'Opponent left the room',
  opponent_disconnected: 'Opponent disconnected',
}

export function RoomPage() {
  const navigate = useNavigate()
  const { code } = useParams({ from: '/rooms/$code' })

  const myUser = authStore((s) => s.user)
  const myId = myUser?.id

  const storeRoom = roomStore((s) => s.room)
  const { data: fetchedRoom, isLoading } = useQuery({
    queryKey: roomKeys.my(),
    queryFn: roomsApi.getMyRoom,
    enabled: !storeRoom,
  })
  const room = storeRoom ?? fetchedRoom ?? null

  // Opponent derived from store participants (set before navigating here,
  // or fetched below if the user landed here directly)
  const participants = roomStore((s) => s.participants)
  const opponent = participants.find((p) => p.userId !== myId)
  const opponentId = opponent?.userId
  const opponentUsername = opponent?.username ?? 'Opponent'
  const opponentAvatarUrl = opponent?.avatarUrl ?? ''

  // Game state
  const gameStatus = gameStore((s) => s.status)
  const myChoice = gameStore((s) => s.myChoice)
  const opponentChose = gameStore((s) => s.opponentChose)
  const roundResult = gameStore((s) => s.roundResult)
  const sessionScores = gameStore((s) => s.sessionScores)

  const [opponentDisconnected, setOpponentDisconnected] = useState(false)
  const [waitingForRestart, setWaitingForRestart] = useState(false)

  const myScore = sessionScores[myId ?? ''] ?? 0
  const opponentScore = sessionScores[opponentId ?? ''] ?? 0
  const roundNumber = myScore + opponentScore + 1

  // Connect socket + join room on mount
  useEffect(() => {
    if (!socket.connected) socket.connect()
    socket.emit(EVENTS.ROOM.JOIN, { code })
  }, [code])

  // Re-join the room after a socket reconnect (e.g. network blip) so the
  // server resyncs Socket.IO room membership for this client
  useEffect(() => {
    const handleReconnect = () => {
      socket.emit(EVENTS.ROOM.JOIN, { code })
    }
    socket.io.on('reconnect', handleReconnect)
    return () => {
      socket.io.off('reconnect', handleReconnect)
    }
  }, [code])

  // Always fetch participants on mount to ensure fresh, accurate data
  useEffect(() => {
    if (!room) return
    roomsApi
      .getParticipants(room.id)
      .then((fetched) => {
        roomStore.getState().setParticipants(fetched)
        const historical: { [userId: string]: number } = {}
        fetched.forEach((p) => {
          historical[p.userId] = p.score
        })
        gameStore.getState().setHistoricalScores(historical)
      })
      .catch(() => {
        toast.error('Failed to load participants')
      })
  }, [room?.id])

  // When room loads and game is in_progress but status is still idle (creator flow:
  // game:started was emitted before room.page mounted), initialize to 'choosing'
  useEffect(() => {
    if (room?.status === 'in_progress' && gameStore.getState().status === 'idle') {
      gameStore.getState().setStatus('choosing')
    }
  }, [room?.status])

  // Socket event listeners
  useEffect(() => {
    const offStarted = gameSocket.onStarted(() => {
      gameStore.getState().resetRound()
      setWaitingForRestart(false)
    })

    const offOpponentChose = gameSocket.onOpponentChose(() => {
      gameStore.getState().setOpponentChose(true)
    })

    const offRoundResult = gameSocket.onRoundResult((result: RoundResultPayload) => {
      gameStore.getState().setRoundResult(result)
      gameStore.getState().setSessionScores(result.scores)
    })

    const offScoreUpdated = gameSocket.onScoreUpdated((data) => {
      gameStore.getState().setSessionScores(data.scores)
    })

    const offRestartRequested = gameSocket.onRestartRequested((data) => {
      gameStore.getState().setRestartRequestedBy(data.requestedBy)
    })

    const offPlayerJoined = roomSocket.onPlayerJoined((data) => {
      setOpponentDisconnected(false)
      roomStore.getState().upsertParticipant(data.participant)
    })

    const offOpponentLeft = roomSocket.onOpponentLeft((data) => {
      setOpponentDisconnected(true)
      const remaining = roomStore.getState().participants.filter((p) => p.userId === myId)
      roomStore.getState().setParticipants(remaining)
      gameStore.getState().resetSessionScores()
      toast.info(LEAVE_REASON_MESSAGES[data.reason] ?? 'Opponent disconnected')
    })

    const offClosed = roomSocket.onClosed((data) => {
      console.log('onClosed fired', data)
      toast.info(LEAVE_REASON_MESSAGES[data.reason] ?? 'Host disconnected')
      socket.disconnect()
      roomStore.getState().clearRoom()
      gameStore.getState().resetAll()
      queryClient.removeQueries({ queryKey: roomKeys.my() })
      void navigate({ to: PATHS.ROOMS_NEW })
    })

    const handleError = (data: { message: string }) => {
      toast.error(data?.message ?? 'Socket error')
    }
    socket.on(EVENTS.ERROR, handleError)

    return () => {
      offStarted()
      offOpponentChose()
      offRoundResult()
      offScoreUpdated()
      offRestartRequested()
      offPlayerJoined()
      offOpponentLeft()
      offClosed()
      socket.off(EVENTS.ERROR, handleError)
    }
  }, [navigate, myId])

  const handleChoice = (choice: Choice) => {
    const state = gameStore.getState()
    if (state.myChoice && state.opponentChose) return
    gameStore.getState().setMyChoice(choice)
    gameSocket.makeChoice(choice)
    gameStore.getState().setStatus('waiting_opponent')
  }

  const handlePlayAgain = () => {
    if (waitingForRestart) return
    setWaitingForRestart(true)
    gameSocket.requestRestart()
  }

  const handleExit = () => {
    const finish = () => {
      socket.disconnect()
      roomStore.getState().clearRoom()
      gameStore.getState().resetAll()
      queryClient.removeQueries({ queryKey: roomKeys.my() })
      void navigate({ to: PATHS.ROOMS_NEW })
    }

    const timeout = setTimeout(finish, 3000)

    socket.emit(EVENTS.ROOM.LEFT, {}, async  () => {
      clearTimeout(timeout)
      finish()
    })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader size="lg" />
      </div>
    )
  }

  if (!room) {
    void navigate({ to: PATHS.ROOMS_NEW })
    return null
  }

  // Derived choices from round result
  const myRoundChoice: Choice | null = roundResult
    ? roundResult.playerOneId === myId
      ? roundResult.playerOneChoice
      : roundResult.playerTwoChoice
    : null

  const opponentRoundChoice: Choice | null = roundResult
    ? roundResult.playerOneId === myId
      ? roundResult.playerTwoChoice
      : roundResult.playerOneChoice
    : null

  // Result label for score circle
  let resultLabel: 'VICTORY' | 'DEFEAT' | 'DRAW' | 'FINAL' | undefined
  if (opponentDisconnected) {
    resultLabel = 'FINAL'
  } else if (roundResult) {
    if (roundResult.isDraw) resultLabel = 'DRAW'
    else if (roundResult.winnerId === myId) resultLabel = 'VICTORY'
    else resultLabel = 'DEFEAT'
  }

  // Badge logic
  const myBadgeVariant = myChoice ? 'ready' : 'choosing'
  const myBadgeText = myChoice ? 'Ready' : 'Your turn'

  let opponentBadgeVariant: 'ready' | 'choosing' | 'waiting' | 'disconnected'
  let opponentBadgeText: string
  if (opponentDisconnected) {
    opponentBadgeVariant = 'disconnected'
    opponentBadgeText = 'Disconnected'
  } else if (opponentChose || roundResult) {
    opponentBadgeVariant = 'ready'
    opponentBadgeText = 'Ready'
  } else {
    opponentBadgeVariant = 'waiting'
    opponentBadgeText = 'Choosing...'
  }

  // Opponent card state
  let opponentCardState: 'waiting' | 'chosen' | 'revealed'
  if (roundResult && opponentRoundChoice) {
    opponentCardState = 'revealed'
  } else if (opponentChose) {
    opponentCardState = 'chosen'
  } else {
    opponentCardState = 'waiting'
  }

  // Score circle game state
  const circleGameState: 'playing' | 'round_result' | 'disconnected' =
    opponentDisconnected ? 'disconnected' : roundResult ? 'round_result' : 'playing'

  // Status text
  let myStatusText: string
  if (roundResult && myRoundChoice) {
    myStatusText = myRoundChoice.charAt(0).toUpperCase() + myRoundChoice.slice(1)
  } else if (myChoice) {
    myStatusText = 'Your choice is made'
  } else {
    myStatusText = 'Choose your move'
  }

  let opponentStatusText: string
  if (opponentDisconnected) {
    opponentStatusText = 'Left the game'
  } else if (roundResult && opponentRoundChoice) {
    opponentStatusText = opponentRoundChoice.charAt(0).toUpperCase() + opponentRoundChoice.slice(1)
  } else if (opponentChose) {
    opponentStatusText = 'Ready for round'
  } else {
    opponentStatusText = 'Making a choice...'
  }

  const showCards = gameStatus === 'choosing' || gameStatus === 'waiting_opponent'
  const showResult = roundResult !== null || opponentDisconnected
  const otherChoices = CHOICES.filter((c) => c !== myChoice)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-background)',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Vertical divider */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 1,
          backgroundColor: 'var(--color-border)',
        }}
      />

      {/* Score circle centered */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
      >
        <ScoreCircle
          myScore={myScore}
          opponentScore={opponentScore}
          roundNumber={roundNumber}
          gameState={circleGameState}
          resultLabel={resultLabel}
        />
      </div>

      {/* Left column — current player */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 60,
          paddingBottom: 80,
          overflow: 'auto',
        }}
      >
        <PlayerColumn
          username={myUser?.username ?? ''}
          avatarUrl={myUser?.avatarUrl ?? ''}
          badgeVariant={myBadgeVariant}
          badgeText={myBadgeText}
        />

        <div
          style={{
            marginTop: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {showResult && myRoundChoice ? (
            <ChoiceSymbol choice={myRoundChoice} size="lg" />
          ) : showCards ? (
            myChoice ? (
              <>
                <ChoiceCard
                  choice={myChoice}
                  index={CHOICES.indexOf(myChoice) + 1}
                  isSelected
                  isLarge
                  onClick={() => handleChoice(myChoice)}
                  disabled={opponentChose}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  {otherChoices.map((c) => (
                    <ChoiceCard
                      key={c}
                      choice={c}
                      index={CHOICES.indexOf(c) + 1}
                      isSelected={false}
                      isLarge={false}
                      onClick={() => handleChoice(c)}
                      disabled={opponentChose}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                {CHOICES.map((c) => (
                  <ChoiceCard
                    key={c}
                    choice={c}
                    index={CHOICES.indexOf(c) + 1}
                    isSelected={false}
                    isLarge={false}
                    onClick={() => handleChoice(c)}
                  />
                ))}
              </div>
            )
          ) : null}
        </div>

        <p
          style={{
            marginTop: 'auto',
            paddingTop: 20,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          {myStatusText}
        </p>
      </div>

      {/* Right column — opponent */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 60,
          paddingBottom: 80,
          overflow: 'auto',
        }}
      >
        <PlayerColumn
          username={opponentUsername}
          avatarUrl={opponentAvatarUrl}
          badgeVariant={opponentBadgeVariant}
          badgeText={opponentBadgeText}
          isOpponent
          opacity={opponentDisconnected ? 0.4 : 1}
        />

        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {opponentDisconnected ? (
            <span style={{ fontSize: 32, color: 'var(--color-text-muted)' }}>—</span>
          ) : (
            <OpponentCard
              state={opponentCardState}
              choice={opponentRoundChoice ?? undefined}
            />
          )}
        </div>

        <p
          style={{
            marginTop: 'auto',
            paddingTop: 20,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          {opponentStatusText}
        </p>
      </div>

      {/* Bottom center buttons — shown after result or disconnect */}
      {showResult && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 12,
            zIndex: 10,
          }}
        >
          <button
            onClick={handlePlayAgain}
            disabled={waitingForRestart}
            style={{
              backgroundColor: waitingForRestart
                ? 'rgba(108, 99, 255, 0.5)'
                : 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: waitingForRestart ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background-color 0.15s',
            }}
          >
            {waitingForRestart ? 'Waiting...' : 'Play again'}
          </button>
          <button
            onClick={handleExit}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            To lobby
          </button>
        </div>
      )}
    </div>
  )
}
