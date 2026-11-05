import { ITEMS_BY_ID } from '../data/menu';
import { currency, orderTitle, orderTotal } from '../lib/orders';
import type { OrderData } from '../types';

interface Props {
  order: OrderData | null;
  dirty: boolean;
  onEdit: () => void;
  onBackToMenu: () => void;
}

export default function MyOrder({ order, dirty, onEdit, onBackToMenu }: Props) {
  if (!order) {
    return (
      <div className="box">
        <strong>Você ainda não enviou um pedido.</strong>
        <p className="muted">Escolha seus pratos no cardápio e envie o pedido.</p>
        <button type="button" className="primary full" onClick={onBackToMenu}>Ir para o cardápio</button>
      </div>
    );
  }

  return (
    <div className="box">
      <div className="row"><strong>{orderTitle(order)}</strong><span className="success">✓ Enviado</span></div>
      <div className="muted">{new Date(order.at).toLocaleString('pt-BR')}</div>
      {order.mode === 'grp' && <p className="muted">Integrantes: {order.members.join(', ')}</p>}
      {Object.entries(order.items).map(([id, quantity]) => (
        <div className="row order-item" key={id}>
          <span>{quantity}x {ITEMS_BY_ID[id]?.name || id}</span>
          <span>{currency((ITEMS_BY_ID[id]?.price ?? 0) * quantity)}</span>
        </div>
      ))}
      {order.shared.map((dish, index) => (
        <div className="muted" key={index}>👥 {ITEMS_BY_ID[dish.id]?.name ?? dish.id} dividido entre {dish.members.join(', ')} (titular: {dish.members[dish.holder]})</div>
      ))}
      {order.note && <p className="muted">Obs.: {order.note}</p>}
      <p className="row order-total"><strong>Total</strong><strong>{currency(orderTotal(order.items))}</strong></p>
      {dirty && <p className="error">Você tem alterações que ainda não foram enviadas.</p>}
      <button type="button" className="primary full" onClick={onEdit}>✏️ Alterar pedido</button>
    </div>
  );
}
