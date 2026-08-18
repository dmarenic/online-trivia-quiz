import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './auth.types';

// Izvlači korisnika kojeg je JwtAuthGuard prethodno stavio na request.
// Koristi se isključivo na rutama zaštićenim JwtAuthGuardom — bez njega
// request.user ne postoji.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();

    return request.user;
  },
);
