export const EVENTS = {
  ROOM: {
    JOIN: 'room:join',
    JOINED: 'room:joined',
    PLAYER_JOINED: 'room:player_joined',
    LEFT: 'room:left',
    OPPONENT_LEFT: 'room:opponent_left',
    CLOSED: 'room:closed',
  },
  GAME: {
    CHOICE: 'game:choice',
    OPPONENT_CHOSE: 'game:opponent_chose',
    ROUND_RESULT: 'game:round_result',
    SCORE_UPDATED: 'game:score_updated',
    RESTART: 'game:restart',
    RESTART_REQUESTED: 'game:restart_requested',
    STARTED: 'game:started',
  },
  ERROR: 'error',
} as const;
