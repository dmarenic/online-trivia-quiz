const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Središnji omotač oko fetcha za sve REST pozive prema backendu. Postoji da se
// bazni URL i Authorization zaglavlje ne ponavljaju po stranicama: token se
// čita iz localStoragea i dodaje samo ako postoji, pa isti poziv radi i za
// prijavljenog korisnika i za gosta. Provjera `typeof window` nužna je jer se
// komponente App Routera izvršavaju i na poslužitelju, gdje localStorage ne
// postoji. Neuspješan odgovor postaje iznimka kako bi pozivatelj mogao
// koristiti try/catch umjesto da svaki put provjerava res.ok.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'API greška.');
  }

  return res.json();
}
