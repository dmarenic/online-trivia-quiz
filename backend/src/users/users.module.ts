import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';

// PrismaService dolazi iz globalnog PrismaModulea, pa ga moduli više ne
// registriraju sami.
@Module({
  controllers: [UsersController],
})
export class UsersModule {}
