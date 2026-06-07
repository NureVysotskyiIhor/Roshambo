import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authStore } from '../store/auth.store';
import { roomStore } from '../store/room.store';
import { gameStore } from '../store/game.store';
import { roomsApi } from '../api/rooms.api';
import { roomKeys } from '../queries/rooms.queries';
import { Loader } from '../components/ui/loader.component';
import { PATHS } from '../routes/paths';
import { PlayerColumn } from '../components/game/player-column.component';
import { ChoicePicker } from '../components/game/choice-picker.component';
import { OpponentCard } from '../components/game/opponent-card.component';
import { ScoreCircle } from '../components/game/score-circle.component';
import { PostRoundActions } from '../components/game/post-round-actions.component';
import { useGameSocket } from '../hooks/use-game-socket.hook';
import { useGameState } from '../hooks/use-game-state.hook';
import { useGameActions } from '../hooks/use-game-actions.hook';

export function RoomPage() {
  const navigate = useNavigate();
  const { code } = useParams({ from: '/rooms/$code' });

  const myUser = authStore((s) => s.user);
  const myId = myUser?.id;

  const storeRoom = roomStore((s) => s.room);
  const { data: fetchedRoom, isLoading } = useQuery({
    queryKey: roomKeys.my(),
    queryFn: roomsApi.getMyRoom,
    enabled: !storeRoom,
  });
  const room = storeRoom ?? fetchedRoom ?? null;

  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const {
    opponentUsername,
    opponentAvatarUrl,
    myChoice,
    opponentChose,
    myScore,
    opponentScore,
    roundNumber,
    myRoundChoice,
    opponentRoundChoice,
    resultLabel,
    myBadgeVariant,
    myBadgeText,
    opponentBadgeVariant,
    opponentBadgeText,
    opponentCardState,
    circleGameState,
    myStatusText,
    opponentStatusText,
    showCards,
    showResult,
  } = useGameState({ myId, room, opponentDisconnected });

  const { handleChoice, handlePlayAgain, handleExit, waitingForRestart, setWaitingForRestart } =
    useGameActions({
      roomCode: room?.code,
      navigate,
    });

  useGameSocket({
    roomCode: code,
    myId,
    navigate,
    onOpponentDisconnected: () => setOpponentDisconnected(true),
    onOpponentReconnected: () => setOpponentDisconnected(false),
    onWaitingForRestart: setWaitingForRestart,
  });

  // Always fetch participants on mount to ensure fresh, accurate data
  useEffect(() => {
    if (!room) return;
    roomsApi
      .getParticipants(room.id)
      .then((fetched) => {
        roomStore.getState().setParticipants(fetched);
        const historical: { [userId: string]: number } = {};
        fetched.forEach((p) => {
          historical[p.userId] = p.score;
        });
        gameStore.getState().setHistoricalScores(historical);
      })
      .catch(() => {
        toast.error('Failed to load participants');
      });
  }, [room?.id]);

  // When room loads and game is in_progress but status is still idle (creator flow:
  // game:started was emitted before room.page mounted), initialize to 'choosing'
  useEffect(() => {
    if (room?.status === 'in_progress' && gameStore.getState().status === 'idle') {
      gameStore.getState().setStatus('choosing');
    }
  }, [room?.status]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Loader size="lg" />
      </div>
    );
  }

  if (!room) {
    void navigate({ to: PATHS.ROOMS_NEW });
    return null;
  }

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
          <ChoicePicker
            myChoice={myChoice}
            myRoundChoice={myRoundChoice}
            showResult={showResult}
            showCards={showCards}
            onChoose={handleChoice}
            disabled={opponentChose}
          />
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

        <div
          style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {opponentDisconnected ? (
            <span style={{ fontSize: 32, color: 'var(--color-text-muted)' }}>—</span>
          ) : (
            <OpponentCard state={opponentCardState} choice={opponentRoundChoice ?? undefined} />
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
        <PostRoundActions
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
          waitingForRestart={waitingForRestart}
        />
      )}
    </div>
  );
}
