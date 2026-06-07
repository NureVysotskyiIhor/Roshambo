import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import type { UserInsert, UserRecord } from '../db/types.js';

type UpdateUserData = Partial<
  Pick<UserInsert, 'username' | 'password' | 'email' | 'avatarUrl'>
>;

@Injectable()
export class UsersRepository {
  findById(id: string): Promise<UserRecord | null> {
    return db.query.users
      .findFirst({ where: eq(users.id, id) })
      .then((row) => row ?? null);
  }

  findByUsername(username: string): Promise<UserRecord | null> {
    return db.query.users
      .findFirst({ where: eq(users.username, username) })
      .then((row) => row ?? null);
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}
