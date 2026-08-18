// Tailwind klase koje su se doslovno ponavljale u svakoj stranici. Ovdje su
// samo one koje su bile identične na svim mjestima — stranice koje trebaju
// dodatna stanja (npr. disabled) i dalje drže vlastitu varijantu lokalno, da
// izdvajanje ne bi nehotice promijenilo izgled tih ekrana.

export const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

export const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

export const inputClass =
  'w-full rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/70 px-4 py-3 text-[#E0E1DD] outline-none transition placeholder:text-[#778DA9] focus:border-[#778DA9]/55 focus:ring-4 focus:ring-[#778DA9]/10';

export const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

export const successButtonClass =
  'rounded-2xl bg-[#388E3C] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

export const dangerButtonClass =
  'rounded-2xl bg-[#C62828] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D32F2F] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';
