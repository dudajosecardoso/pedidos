import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { ITEMS_BY_ID } from '../data/menu';
import { buildSummary, currency, orderTitle, orderTotal, peopleCount } from '../lib/orders';
import type { Order } from '../types';
import { backendMode } from '../lib/backend';

interface Props {
  orders: Order[];
  error: string;
  onDelete: (id: string) => Promise<void>;
}

function generatePdf(orders: Order[]): void {
  if (!orders.length) return;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 20;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Almoco no Tonho', 14, y);
  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(new Date().toLocaleString('pt-BR'), 14, y);
  y += 9;
  pdf.setFontSize(11);
  // A fonte embutida do jsPDF é Latin-1: removemos apenas os sinais que ela não suporta.
  const ascii = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[—–]/g, '-');
  for (const line of buildSummary(orders).split('\n')) {
    const bold = line.length > 0 && line === line.toUpperCase() && /[A-Z]/.test(line);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    for (const part of pdf.splitTextToSize(ascii(line || ' '), 182) as string[]) {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(part, 14, y);
      y += 5.5;
    }
  }
  pdf.save('pedido-almoco-tonho.pdf');
}

export default function AdminDashboard({ orders, error, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const sortedOrders = [...orders].sort((a, b) => b.at - a.at);
  const summary = buildSummary(sortedOrders);
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      const pre = document.getElementById('order-summary');
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        setCopied(false);
      }
    }
  };

  return (
    <>
      {backendMode === 'local' && (
        <div className="box"><strong>⚠️ Modo local</strong>
          <p className="muted">O painel mostra somente os pedidos salvos neste navegador. Configure o Firebase (veja o README) para receber pedidos de outros aparelhos.</p>
        </div>
      )}
      {error && <div className="box error" role="alert">{error}</div>}
      <p className="muted admin-hint">Exclua os pedidos que não devem entrar. O resumo e o PDF mostram apenas os pedidos restantes.</p>
      <div className="box"><strong>{orders.length}</strong> pedidos · <strong>{orders.reduce((sum, order) => sum + peopleCount(order), 0)}</strong> pessoas</div>
      <div className="box">
        <strong>Resumo para o restaurante</strong>
        <pre id="order-summary">{summary}</pre>
        <button type="button" onClick={() => void copySummary()}>Copiar resumo</button>
        {copied && <span className="success copy-status">Copiado!</span>}
      </div>
      {sortedOrders.map((order) => (
        <article className="box" key={order.id}>
          <div className="row">
            <strong>{orderTitle(order)}{order.mode === 'grp' ? ` · ${peopleCount(order)} pessoas` : ''}</strong>
            <span>{currency(orderTotal(order.items))}</span>
          </div>
          {order.mode === 'grp' && <p className="muted">Integrantes: {order.members.filter(Boolean).join(', ')}</p>}
          <div className="muted">{Object.entries(order.items).map(([id, quantity]) => `${quantity}x ${ITEMS_BY_ID[id]?.name ?? id}`).join('; ')}</div>
          {order.shared.map((dish, index) => (
            <div className="muted" key={index}>👥 {ITEMS_BY_ID[dish.id]?.name ?? dish.id} — titular: <strong>{dish.members[dish.holder]}</strong> · com {dish.members.join(', ')}</div>
          ))}
          {order.note && <p className="muted">Obs.: {order.note}</p>}
          <button className="danger full" type="button" onClick={() => {
            if (window.confirm('Excluir este pedido?')) void onDelete(order.id);
          }}>🗑️ Excluir pedido</button>
        </article>
      ))}
      {orders.length > 0 && (
        <div className="bottom-bar">
          <button type="button" className="primary bottom-action" onClick={() => generatePdf(sortedOrders)}>
            <span>📄 Gerar PDF</span><span>{orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
          </button>
        </div>
      )}
    </>
  );
}
