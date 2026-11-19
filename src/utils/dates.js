// Datas: o banco guarda "AAAA-MM-DD" (ISO); a interface mostra "DD/MM/AAAA".
export function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function isoToBr(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Retorna null quando a data não existe (ex.: 31/02/2026).
export function brToIso(br) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br || '').trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const valid =
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d);
  return valid ? `${y}-${m}-${d}` : null;
}

// Máscara enquanto digita: 18112026 → 18/11/2026
export function maskDateBr(text) {
  const digits = String(text || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
