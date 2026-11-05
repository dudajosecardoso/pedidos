import type { OrderData, Session, StoredMine } from '../types';

export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

function parseJSON<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getMine(slug: string): StoredMine | null {
  try {
    const record = parseJSON<StoredMine>(localStorage.getItem(`tonho:mine:${slug}`));
    if (!record?.id || !record.order?.items) return null;
    return record;
  } catch {
    return null;
  }
}

export function setMine(slug: string, id: string, order: OrderData): void {
  try {
    localStorage.setItem(`tonho:mine:${slug}`, JSON.stringify({ id, order }));
  } catch {
    // Navegação privada pode limitar a gravação no dispositivo.
  }
}

export function getSession(): Session | null {
  try {
    const value = parseJSON<Session & { id?: string }>(sessionStorage.getItem('s'));
    if (value?.role === 'a') return { role: 'a' };
    if (value?.role === 'p' && typeof value.name === 'string' && value.name.trim()) {
      const slug = slugify(value.name);
      return {
        role: 'p',
        name: value.name,
        slug,
        id: getMine(slug)?.id || value.id || createOrderId(slug),
      };
    }
  } catch {
    // Sem sessão restaurável.
  }
  return null;
}

export function setSession(session: Session | null): void {
  try {
    if (session) sessionStorage.setItem('s', JSON.stringify(session));
    else sessionStorage.removeItem('s');
  } catch {
    // A aplicação continua mesmo se sessionStorage estiver bloqueado.
  }
}

export function createOrderId(slug: string): string {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.slice(0, 12);
  return `${slug}-${id}`;
}
