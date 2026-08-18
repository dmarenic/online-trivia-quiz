import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global znači da se PrismaService registrira jednom i vidljiv je svim
// modulima bez ponovnog navođenja u njihovim providers listama. Ranije je
// svaki modul imao vlastiti provider, pa je Nest stvarao zasebnu PrismaClient
// instancu — a svaka od njih otvara vlastiti connection pool prema bazi.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
