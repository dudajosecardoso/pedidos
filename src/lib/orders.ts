import { ITEMS_BY_ID } from '../data/menu';
import type { Cart, Order, OrderData } from '../types';

export function currency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function itemCount(cart: Cart): number {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

export function orderTotal(cart: Cart): number {
  return Object.entries(cart).reduce(
    (sum, [id, quantity]) => sum + (ITEMS_BY_ID[id]?.price ?? 0) * quantity,
    0,
  );
}

export function orderTitle(order: OrderData): string {
  return order.title || (order.mode === 'grp' ? `Grupo de ${order.name}` : order.name);
}

export function peopleCount(order: OrderData): number {
  return order.mode === 'grp' ? Math.max(1, order.members.filter((name) => name.trim()).length) : 1;
}

export function buildSummary(orders: Order[]): string {
  const totals: Cart = {};
  for (const order of orders) {
    for (const [id, quantity] of Object.entries(order.items)) {
      totals[id] = (totals[id] ?? 0) + quantity;
    }
  }
  let result = `PEDIDO DE ALMOÇO — ${orders.reduce((sum, order) => sum + peopleCount(order), 0)} pessoas\n\nTOTAL POR ITEM\n`;
  for (const [id, quantity] of Object.entries(totals)) {
    result += `${quantity}x ${ITEMS_BY_ID[id]?.name ?? id}\n`;
  }
  result += '\nPOR PEDIDO\n';
  for (const order of orders) {
    const members = order.mode === 'grp' ? ` (integrantes: ${order.members.filter(Boolean).join(', ')})` : '';
    result += `\n${orderTitle(order)}${members} — ${currency(orderTotal(order.items))}\n`;
    for (const [id, quantity] of Object.entries(order.items)) {
      result += ` - ${quantity}x ${ITEMS_BY_ID[id]?.name ?? id}\n`;
    }
    for (const dish of order.shared || []) {
      const holder = dish.members[dish.holder] || 'Não informado';
      result += ` - EM CONJUNTO: ${ITEMS_BY_ID[dish.id]?.name ?? dish.id} (titular: ${holder}; com ${dish.members.join(', ')})\n`;
    }
    if (order.note) result += ` Obs: ${order.note}\n`;
  }
  return result;
}
