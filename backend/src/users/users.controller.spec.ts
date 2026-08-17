import { aggregateAccuracy, matchAccuracy } from './users.controller';

describe('Izračun točnosti (accuracy)', () => {
  describe('matchAccuracy — točnost jednog meča', () => {
    it('normalan meč: 8/10 = 80%', () => {
      expect(matchAccuracy(8, 10)).toBe(80);
    });

    it('prljav red (correctAnswers > totalQuestions) ne prelazi 100%', () => {
      expect(matchAccuracy(12, 5)).toBe(100);
    });

    it('totalQuestions = 0 daje 0, ne NaN', () => {
      const acc = matchAccuracy(7, 0);
      expect(acc).toBe(0);
      expect(Number.isNaN(acc)).toBe(false);
    });
  });

  describe('aggregateAccuracy — ukupna točnost (Definicija A)', () => {
    it('Definicija A: Σ točnih / Σ svih pitanja (8/10 + 1/5 = 9/15 = 60%)', () => {
      expect(
        aggregateAccuracy([
          { correctAnswers: 8, totalQuestions: 10 },
          { correctAnswers: 1, totalQuestions: 5 },
        ]),
      ).toBe(60);
    });

    it('prljav red (totalQuestions = 0) se preskače i ne truje agregat', () => {
      const acc = aggregateAccuracy([
        { correctAnswers: 100, totalQuestions: 0 },
        { correctAnswers: 10, totalQuestions: 14 },
      ]);

      expect(acc).toBeLessThanOrEqual(100);
      expect(acc).toBe(matchAccuracy(10, 14)); // ~71.4%
    });

    it('correctAnswers > totalQuestions se po redu ograničava (≤ 100%)', () => {
      expect(
        aggregateAccuracy([{ correctAnswers: 20, totalQuestions: 10 }]),
      ).toBe(100);
    });

    it('prazan slučaj (korisnik bez partija) daje 0, ne NaN', () => {
      const acc = aggregateAccuracy([]);
      expect(acc).toBe(0);
      expect(Number.isNaN(acc)).toBe(false);
    });
  });
});
