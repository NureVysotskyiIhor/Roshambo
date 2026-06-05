import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { UserRecord } from '../db/types.js';

export type { UserRecord };

type CreateUserData = {
  username: string;
  password: string;
  email?: string;
  avatarUrl: string;
  role?: 'guest' | 'registered';
};

@Injectable()
export class AuthRepository {
  findByUsername(username: string): Promise<UserRecord | null> {
    return db.query.users
      .findFirst({ where: eq(users.username, username) })
      .then((row) => row ?? null);
  }

  findById(id: string): Promise<UserRecord | null> {
    return db.query.users
      .findFirst({ where: eq(users.id, id) })
      .then((row) => row ?? null);
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    const [row] = await db
      .insert(users)
      .values({
        username: data.username,
        password: data.password,
        email: data.email,
        avatarUrl: data.avatarUrl,
        role: data.role ?? 'registered',
      })
      .returning();
    return row;
  }
}
