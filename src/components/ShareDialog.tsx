import { useState } from 'react';
import { ITEMS_BY_ID } from '../data/menu';
import { currency } from '../lib/orders';
import type { SharedDish } from '../types';
import Modal from './Modal';

interface Props {
  itemId: string;
  members: string[];
  onClose: () => void;
  onAdd: (dish: SharedDish) => void;
}

export default function ShareDialog({ itemId, members, onClose, onAdd }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [holder, setHolder] = useState<number | null>(null);
  const [error, setError] = useState('');
  const item = ITEMS_BY_ID[itemId];
  if (!item) return null;

  const toggle = (index: number) => {
    const next = selected.includes(index) ? selected.filter((value) => value !== index) : [...selected, index];
    setSelected(next);
    if (holder !== null && !next.includes(holder)) setHolder(next[0] ?? null);
    setError('');
  };
  const add = () => {
    const picked = [...selected].sort((a, b) => a - b);
    if (picked.length < 2) { setError('Marque ao menos 2 pessoas.'); return; }
    if (holder === null || !picked.includes(holder)) { setError('Escolha o titular.'); return; }
    onAdd({ id: item.id, members: picked.map((index) => members[index]), holder: picked.indexOf(holder) });
  };

  return (
    <Modal title="Dividir prato" onClose={onClose}>
      <div className="row modal-heading"><h2>Dividir prato</h2><button type="button" onClick={onClose}>Cancelar</button></div>
      <p><strong>{item.name}</strong> · {currency(item.price)}</p>
      <p className="muted">Marque quem vai dividir e escolha o titular (responsável pelo prato).</p>
      {members.map((member, index) => (
        <div className="row share-person" key={`${index}-${member}`}>
          <label><input type="checkbox" checked={selected.includes(index)} onChange={() => toggle(index)} /> {member}</label>
          {selected.includes(index) && (
            <label className="muted"><input type="radio" name="dish-owner" checked={holder === index} onChange={() => setHolder(index)} /> Titular</label>
          )}
        </div>
      ))}
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="primary full" onClick={add}>Adicionar à sacola</button>
    </Modal>
  );
}
