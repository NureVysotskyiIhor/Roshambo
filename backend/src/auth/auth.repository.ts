import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.constants.js';
import { users } from '../db/schema.js';
import type { Database, UserInsert, UserRecord } from '../db/types.js';

export type { UserRecord };

type CreateUserData = Pick<
  UserInsert,
  'username' | 'password' | 'avatarUrl'
> & {
  email?: string;
  role?: 'guest' | 'registered';
};

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByUsername(username: string): Promise<UserRecord | null> {
    return this.db.query.users
      .findFirst({ where: eq(users.username, username) })
      .then((row) => row ?? null);
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.db.query.users
      .findFirst({ where: eq(users.id, id) })
      .then((row) => row ?? null);
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    const [row] = await this.db
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
