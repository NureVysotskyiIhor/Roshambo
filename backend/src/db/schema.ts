import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['guest', 'registered']);
export const roomStatusEnum = pgEnum('room_status', ['waiting', 'in_progress', 'finished']);
export const participantRoleEnum = pgEnum('participant_role', ['player', 'spectator']);
export const choiceEnum = pgEnum('choice', ['rock', 'paper', 'scissors']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  avatarUrl: varchar('avatar_url', { length: 500 }).notNull(),
  role: userRoleEnum('role').notNull().default('registered'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 6 }).notNull().unique(),
  name: varchar('name', { length: 100 }),
  status: roomStatusEnum('status').notNull().default('waiting'),
  isPrivate: boolean('is_private').notNull().default(true),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const roomParticipants = pgTable(
  'room_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: participantRoleEnum('role').notNull().default('player'),
    score: integer('score').notNull().default(0),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    leftAt: timestamp('left_at'),
  },
  (table) => [
    index('room_participants_room_id_idx').on(table.roomId),
    uniqueIndex('room_participants_room_id_user_id_idx').on(table.roomId, table.userId),
  ],
);

export const rounds = pgTable('rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id),
  playerOneId: uuid('player_one_id')
    .notNull()
    .references(() => users.id),
  playerTwoId: uuid('player_two_id')
    .notNull()
    .references(() => users.id),
  playerOneChoice: choiceEnum('player_one_choice').notNull(),
  playerTwoChoice: choiceEnum('player_two_choice').notNull(),
  winnerId: uuid('winner_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  finishedAt: timestamp('finished_at').notNull(),
});
