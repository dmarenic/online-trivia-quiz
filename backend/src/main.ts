// Mora biti prvi import: puni process.env iz .env prije nego što se
// evaluiraju dekoratori (npr. CORS origin u @WebSocketGateway).
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { validateEnv } from './config/validate-env';
import compression from 'compression';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  // Globalna validacija svih REST zahtjeva prema DTO-ima:
  //  - whitelist: polja koja DTO ne deklarira se odbacuju,
  //  - forbidNonWhitelisted: takav zahtjev se čak i odbija (HTTP 400), pa
  //    klijent ne može "prošvercati" polje kojim bi utjecao na zapis u bazi
  //    (npr. mode na /daily-challenge/submit),
  //  - transform: tijelo zahtjeva se pretvara u instancu DTO klase, što je
  //    nužno da dekoratori iz class-validatora uopće rade nad ugniježđenim
  //    objektima.
  // Socket eventi ovo NE prolaze — oni se validiraju ručno u game.gateway.ts.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
