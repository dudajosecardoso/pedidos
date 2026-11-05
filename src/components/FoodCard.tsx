import { useState } from 'react';
import type { MenuItem } from '../types';
import { currency } from '../lib/orders';

interface FoodCardProps {
  item: MenuItem;
  quantity: number;
  canShare: boolean;
  onChangeQuantity: (delta: number) => void;
  onShare: () => void;
}

export default function FoodCard({ item, quantity, canShare, onChangeQuantity, onShare }: FoodCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(item.image) && !imageFailed;

  return (
    <article className="dish">
      <div className="dish-text">
        <div className="dish-name">{item.name}</div>
        <div className="muted">{item.description}</div>
        <div className="dish-price">{currency(item.price)}</div>
        {canShare && <button type="button" className="chip divide" onClick={onShare}>👥 Dividir</button>}
      </div>
      <div className={`dish-picture ${!hasImage ? 'no-photo' : ''}`}>
        {hasImage ? (
          <img src={item.image!} alt={item.name} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        ) : (
          <span role="img" aria-label="Foto não disponível">📷</span>
        )}
        {quantity > 0 ? (
          <div className="quantity-buttons" aria-label={`Quantidade: ${quantity}`}>
            <button type="button" aria-label={`Diminuir ${item.name}`} onClick={() => onChangeQuantity(-1)}>−</button>
            <span>{quantity}</span>
            <button type="button" aria-label={`Aumentar ${item.name}`} onClick={() => onChangeQuantity(1)}>+</button>
          </div>
        ) : (
          <button type="button" className="add-button" aria-label={`Adicionar ${item.name}`} onClick={() => onChangeQuantity(1)}>+</button>
        )}
      </div>
    </article>
  );
}
