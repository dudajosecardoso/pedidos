import { ITEMS_BY_ID } from '../data/menu';
import { currency, orderTotal } from '../lib/orders';
import type { Cart, SharedDish } from '../types';
import Modal from './Modal';

interface Props {
  cart: Cart;
  shared: SharedDish[];
  groupMode: boolean;
  participantName: string;
  memberCount: number;
  note: string;
  sending: boolean;
  saved: boolean;
  error: string;
  onChangeNote: (note: string) => void;
  onChangeQuantity: (id: string, delta: number) => void;
  onRemoveShared: (index: number) => void;
  onClose: () => void;
  onSend: () => void;
}

export default function CartDialog(props: Props) {
  const { cart, shared, groupMode, participantName, memberCount, note, sending, saved, error,
    onChangeNote, onChangeQuantity, onRemoveShared, onClose, onSend } = props;

  return (
    <Modal title="Sua sacola" onClose={onClose}>
      <div className="row modal-heading"><h2>Sua sacola</h2><button type="button" onClick={onClose}>Fechar</button></div>
      {Object.entries(cart).map(([id, totalQuantity]) => {
        const item = ITEMS_BY_ID[id];
        if (!item) return null;
        const quantity = totalQuantity - shared.filter((dish) => dish.id === id).length;
        if (quantity <= 0) return null;
        return (
          <div className="row cart-line" key={id}>
            <div className="cart-item-name">{item.name}<div className="muted">{currency(item.price)}</div></div>
            <div className="row cart-controls">
              <span>{quantity}x</span>
              <button type="button" aria-label={`Remover uma unidade de ${item.name}`} onClick={() => onChangeQuantity(id, -1)}>−</button>
              <button type="button" aria-label={`Adicionar uma unidade de ${item.name}`} onClick={() => onChangeQuantity(id, 1)}>+</button>
            </div>
          </div>
        );
      })}
      {shared.map((dish, index) => {
        const item = ITEMS_BY_ID[dish.id];
        if (!item) return null;
        return (
          <div className="box shared-in-cart" key={index}>
            <div className="row"><strong>👥 {item.name}</strong><button type="button" onClick={() => onRemoveShared(index)}>Remover</button></div>
            <div className="muted">Titular: <strong>{dish.members[dish.holder]}</strong> · Com: {dish.members.join(', ')}</div>
            <div className="muted">{currency(item.price)} ÷ {dish.members.length} = {currency(item.price / dish.members.length)} por pessoa</div>
          </div>
        );
      })}
      {groupMode && <p className="muted group-summary">👥 Grupo de <strong>{participantName}</strong> · {memberCount} pessoas</p>}
      <label className="input-label" htmlFor="order-note">Observações do pedido</label>
      <textarea id="order-note" rows={2} maxLength={490} value={note} onChange={(event) => onChangeNote(event.target.value)} placeholder="Observações (sem cebola, alergias…)" />
      <p className="row order-total"><strong>Total</strong><strong>{currency(orderTotal(cart))}</strong></p>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="primary full" onClick={onSend} disabled={sending || orderTotal(cart) === 0}>
        {sending ? 'Enviando…' : saved ? 'Atualizar pedido' : 'Enviar pedido'}
      </button>
    </Modal>
  );
}
