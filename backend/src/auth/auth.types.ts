// Oblik korisnika koji JwtStrategy.validate vraća i koji Passport zatim stavlja
// na request.user. Isti objekt @CurrentUser() prosljeđuje kontrolerima, pa je
// ovo jedini izvor istine o tome što ruta dobiva o prijavljenom korisniku.
export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
};

// Sadržaj JWT-a koji potpisuje AuthService.createToken. `sub` je standardni
// JWT claim za identifikator subjekta (ovdje User.id).
export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};
