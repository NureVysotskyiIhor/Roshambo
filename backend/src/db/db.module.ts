import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DRIZZLE } from './db.constants.js';
import * as schema from './schema.js';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: (config: ConfigService) =>
        drizzle(
          new Pool({ connectionString: config.get<string>('DATABASE_URL') }),
          { schema },
        ),
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
