import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminDashboard from './components/AdminDashboard';
import CartDialog from './components/CartDialog';
import FoodCard from './components/FoodCard';
import Modal from './components/Modal';
import MyOrder from './components/MyOrder';
import ShareDialog from './components/ShareDialog';
import { ITEMS_BY_ID, MENU } from './data/menu';
import { backendMode, checkAdminSession, deleteOrder, loginAdmin, logoutAdmin, saveOrder, subscribeOrders } from './lib/backend';
import { currency, itemCount, orderTotal } from './lib/orders';
import { createOrderId, getMine, getSession, setMine, setSession as persistSession, slugify } from './lib/storage';
import type { Cart, Order, OrderData, OrderMode, Session, SharedDish } from './types';

interface InitialState {
  session: Session | null;
  order: OrderData | null;
}

function loadInitialState(): InitialState {
  const session = getSession();
  return { session, order: session?.role === 'p' ? getMine(session.slug)?.order ?? null : null };
}

function errorMessage(error: unknown): string {
  const detail = error as { code?: string; message?: string };
  switch (detail.code) {
    case 'permission-denied': return 'Sem permissão para acessar o Firebase. Verifique as regras do Firestore.';
    case 'unavailable': return 'Servidor indisponível. Verifique a internet e tente novamente.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email': return 'Usuário ou senha incorretos.';
    case 'timeout': return 'Sem resposta do servidor. Verifique a conexão e tente novamente.';
  }
  if (detail.message === 'invalid-credentials') return 'Usuário ou senha incorretos.';
  return `Não foi possível concluir a operação${detail.code ? ` (${detail.code})` : ''}. Tente novamente.`;
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject({ code: 'timeout' }), milliseconds);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function App() {
  const [initial] = useState(loadInitialState);
  const [session, setSession] = useState<Session | null>(initial.session);
  const [adminReady, setAdminReady] = useState(false);
  const [adminScreen, setAdminScreen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [entryName, setEntryName] = useState(initial.session?.role === 'p' ? initial.session.name : '');
  const [entryMode, setEntryMode] = useState<OrderMode>('ind');
  const [groupMode, setGroupMode] = useState(initial.order?.mode === 'grp');
  const [members, setMembers] = useState<string[]>(initial.order?.members?.length ? [...initial.order.members] : ['']);
  const [cart, setCart] = useState<Cart>(initial.order ? { ...initial.order.items } : {});
  const [shared, setShared] = useState<SharedDish[]>(initial.order?.shared ? [...initial.order.shared] : []);
  const [note, setNote] = useState(initial.order?.note ?? '');
  const [sent, setSent] = useState<OrderData | null>(initial.order);
  const [tab, setTab] = useState<'menu' | 'mine'>(initial.order ? 'mine' : 'menu');
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [bagOpen, setBagOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<'sent' | 'updated' | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [bagError, setBagError] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const participant = session?.role === 'p' ? session : null;
  const orderCount = itemCount(cart);
  const activeMembers = members.map((name) => name.trim()).filter(Boolean);
  const changedSinceSend = Boolean(sent && JSON.stringify([cart, note, shared, groupMode, members]) !==
    JSON.stringify([sent.items, sent.note, sent.shared, sent.mode === 'grp', sent.members]));

  useEffect(() => {
    persistSession(session);
  }, [session]);

  useEffect(() => {
    if (session?.role !== 'a') { setAdminReady(false); return; }
    let live = true;
    void checkAdminSession().then((authenticated) => {
      if (!live) return;
      if (authenticated) setAdminReady(true);
      else {
        setSession(null);
        setAdminScreen(true);
        setError('Sua sessão expirou. Entre novamente.');
      }
    });
    return () => { live = false; };
  }, [session]);

  useEffect(() => {
    if (session?.role !== 'a' || !adminReady) return;
    const stop = subscribeOrders(
      (incoming) => { setOrders(incoming); setError(''); },
      (err) => setError(`Não foi possível ler os pedidos. ${errorMessage(err)}`),
    );
    return stop;
  }, [session, adminReady]);

  function startParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = entryName.trim();
    if (!name) { setError('Digite seu nome.'); return; }
    const slug = slugify(name);
    if (!slug) { setError('Digite um nome válido.'); return; }
    const saved = getMine(slug);
    const restored = saved?.order ?? null;
    const nextSession: Session = { role: 'p', slug, name, id: saved?.id || createOrderId(slug) };
    setSession(nextSession);
    setSent(restored);
    setGroupMode(restored ? restored.mode === 'grp' : entryMode === 'grp');
    setMembers(restored?.members?.length ? [...restored.members] : entryMode === 'grp' ? [name, ''] : ['']);
    setCart(restored ? { ...restored.items } : {});
    setShared(restored?.shared ? [...restored.shared] : []);
    setNote(restored?.note ?? '');
    setTab(restored ? 'mine' : 'menu');
    setCategoryIndex(0);
    setError('');
    setBagError('');
    setBagOpen(false);
    setConfirmation(null);
    window.scrollTo(0, 0);
  }

  async function signInAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminUsername.trim() || !adminPassword) { setError('Informe usuário e senha.'); return; }
    setAdminBusy(true);
    setError('');
    try {
      await loginAdmin(adminUsername.trim(), adminPassword);
      setSession({ role: 'a' });
      setAdminReady(true);
      setAdminPassword('');
      setOrders([]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAdminBusy(false);
    }
  }

  async function exitSession() {
    if (participant && !sent && orderCount > 0 &&
      !window.confirm('Sua sacola ainda não foi enviada. Sair mesmo assim?')) return;
    if (session?.role === 'a') {
      try { await logoutAdmin(); }
      catch (err) { setError(errorMessage(err)); return; }
    }
    setSession(null);
    setAdminReady(false);
    setAdminScreen(false);
    setAdminUsername('');
    setEntryName('');
    setEntryMode('ind');
    setGroupMode(false);
    setMembers(['']);
    setCart({});
    setShared([]);
    setNote('');
    setSent(null);
    setTab('menu');
    setCategoryIndex(0);
    setBagOpen(false);
    setShareId(null);
    setConfirmation(null);
    setOrders([]);
    setError('');
    setBagError('');
    window.scrollTo(0, 0);
  }

  function adjustQuantity(id: string, delta: number) {
    setCart((previous) => {
      const minimum = shared.filter((dish) => dish.id === id).length;
      const nextQuantity = Math.max(minimum, (previous[id] ?? 0) + delta);
      const next = { ...previous };
      if (nextQuantity === 0) delete next[id];
      else next[id] = nextQuantity;
      return next;
    });
    setBagError('');
  }

  function removeShared(index: number) {
    const dish = shared[index];
    if (!dish) return;
    setShared((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    setCart((previous) => {
      const next = { ...previous };
      next[dish.id] = (next[dish.id] ?? 1) - 1;
      if (next[dish.id] <= 0) delete next[dish.id];
      return next;
    });
  }

  function switchToSolo() {
    if (!groupMode) return;
    if (shared.length && !window.confirm('Os pratos divididos serão removidos da sacola. Continuar?')) return;
    setCart((previous) => {
      const next = { ...previous };
      for (const dish of shared) {
        next[dish.id] = Math.max(0, (next[dish.id] ?? 0) - 1);
        if (!next[dish.id]) delete next[dish.id];
      }
      return next;
    });
    setShared([]);
    setGroupMode(false);
    setError('');
  }

  function switchToGroup() {
    setGroupMode(true);
    if (!members.some((member) => member.trim()) && participant) setMembers([participant.name, '']);
    setError('');
  }

  async function submitOrder() {
    if (!participant || sendingRef.current) return;
    if (orderCount <= 0) { setBagError('Adicione ao menos um prato.'); return; }
    if (groupMode && activeMembers.length === 0) {
      setBagError('Informe quem participa do grupo.'); return;
    }
    if (groupMode && shared.some((dish) => dish.members.some((name) => !activeMembers.includes(name)))) {
      setBagError('Os integrantes mudaram. Remova e refaça a divisão dos pratos antes de enviar.');
      return;
    }
    const order: OrderData = {
      name: participant.name,
      mode: groupMode ? 'grp' : 'ind',
      title: '',
      members: groupMode ? [...activeMembers] : [],
      items: { ...cart },
      shared: shared.map((dish) => ({ id: dish.id, members: [...dish.members], holder: dish.holder })),
      note: note.trim(),
      at: Date.now(),
    };
    sendingRef.current = true;
    setSending(true);
    setBagError('');
    try {
      await withTimeout(saveOrder(participant.id, order), 15_000);
      setMine(participant.slug, participant.id, order);
      setSent(order);
      setConfirmation(sent ? 'updated' : 'sent');
      setBagOpen(false);
      setTab('mine');
    } catch (err) {
      setBagError(errorMessage(err));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function removeAdminOrder(id: string) {
    try { await deleteOrder(id); }
    catch (err) { setError(errorMessage(err)); }
  }

  const header = (
    <header className="top-header">
      <strong>🍽️ {session?.role === 'a' ? 'Painel do administrador' : participant ? `Olá, ${participant.name}` : 'Almoço no Tonho'}</strong>
      {session ? (
        <button type="button" onClick={() => void exitSession()}>{session.role === 'a' ? 'Sair' : 'Início'}</button>
      ) : (
        <button type="button" onClick={() => { setAdminScreen((value) => !value); setError(''); }}>
          {adminScreen ? '← Voltar' : 'Administrador'}
        </button>
      )}
    </header>
  );

  if (!session) {
    return (
      <main className="app-shell">
        {header}
        {adminScreen ? (
          <form className="box entry-box" onSubmit={(event) => void signInAdmin(event)}>
            <strong>Administrador</strong>
            <label className="visually-hidden" htmlFor="admin-user">Usuário</label>
            <input id="admin-user" placeholder="Usuário" autoComplete="username" autoCapitalize="none" value={adminUsername} onChange={(event) => setAdminUsername(event.target.value)} />
            <label className="visually-hidden" htmlFor="admin-pass">Senha</label>
            <input id="admin-pass" type="password" placeholder="Senha" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} />
            {error && <p className="error" role="alert">{error}</p>}
            <button type="submit" className="primary full" disabled={adminBusy}>{adminBusy ? 'Entrando…' : 'Entrar'}</button>
          </form>
        ) : (
          <form className="box entry-box" onSubmit={startParticipant}>
            <strong>Como você vai almoçar?</strong>
            <div className="segmented">
              <button type="button" className={`chip ${entryMode === 'ind' ? 'selected' : ''}`} onClick={() => setEntryMode('ind')}>🙋 Individual</button>
              <button type="button" className={`chip ${entryMode === 'grp' ? 'selected' : ''}`} onClick={() => setEntryMode('grp')}>👥 Em grupo</button>
            </div>
            <label className="visually-hidden" htmlFor="participant-name">Nome</label>
            <input id="participant-name" placeholder={entryMode === 'grp' ? 'Nome do responsável pelo grupo' : 'Seu nome'} autoComplete="name" value={entryName} onChange={(event) => setEntryName(event.target.value)} maxLength={79} />
            {error && <p className="error" role="alert">{error}</p>}
            <button type="submit" className="primary full">Ver cardápio</button>
            {backendMode === 'local' && <p className="muted mode-notice">Modo de teste: o pedido fica salvo só neste aparelho.</p>}
          </form>
        )}
      </main>
    );
  }

  if (session.role === 'a') {
    return <main className="app-shell">{header}{adminReady ? <AdminDashboard orders={orders} error={error} onDelete={removeAdminOrder} /> : <div className="box muted">Carregando painel…</div>}</main>;
  }

  const activeParticipant = session;
  const category = MENU[categoryIndex];

  return (
    <main className="app-shell">
      {header}
      <nav className="segmented tabs" aria-label="Navegação do participante">
        <button type="button" className={`chip ${tab === 'menu' ? 'selected' : ''}`} onClick={() => { setTab('menu'); setError(''); window.scrollTo(0, 0); }}>🍽️ Cardápio</button>
        <button type="button" className={`chip ${tab === 'mine' ? 'selected' : ''}`} onClick={() => { setTab('mine'); setError(''); window.scrollTo(0, 0); }}>📋 Meu pedido{sent ? ' ✓' : ''}</button>
      </nav>
      {tab === 'mine' ? (
        <MyOrder order={sent} dirty={changedSinceSend} onEdit={() => { setTab('menu'); setBagOpen(true); }} onBackToMenu={() => setTab('menu')} />
      ) : (
        <>
          <section className="box party-box" aria-label="Como você vai almoçar">
            <strong>Como você vai almoçar?</strong>
            <div className="segmented">
              <button type="button" className={`chip ${!groupMode ? 'selected' : ''}`} onClick={switchToSolo}>🙋 Sozinho</button>
              <button type="button" className={`chip ${groupMode ? 'selected' : ''}`} onClick={switchToGroup}>👥 Em grupo</button>
            </div>
            {groupMode && (
              <>
                <p className="muted">Responsável: <strong>{activeParticipant.name}</strong>. Cadastre abaixo quem vai almoçar (inclua você).</p>
                {members.map((member, index) => (
                  <div className="row member-row" key={index}>
                    <input aria-label={`Nome da pessoa ${index + 1}`} value={member} maxLength={79} placeholder={`Nome da pessoa ${index + 1}`} onChange={(event) => {
                      setMembers((previous) => previous.map((value, currentIndex) => index === currentIndex ? event.target.value : value));
                    }} />
                    {members.length > 1 && <button type="button" aria-label={`Remover pessoa ${index + 1}`} onClick={() => setMembers((previous) => previous.filter((_, currentIndex) => index !== currentIndex))}>✕</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setMembers((previous) => [...previous, ''])}>+ Adicionar pessoa</button>
                <p className="muted">Para dividir um prato entre pessoas do grupo, toque em “Dividir” nele.</p>
              </>
            )}
            {error && <p className="error" role="alert">{error}</p>}
          </section>
          {sent && <p className="success sent-hint">✓ Pedido enviado. Para alterar, mexa na sacola e toque em “Atualizar pedido”.</p>}
          <nav className="category-nav" aria-label="Categorias do cardápio">
            {MENU.map((menuCategory, index) => (
              <button type="button" key={menuCategory.name} className={`chip ${categoryIndex === index ? 'selected' : ''}`} onClick={() => { setCategoryIndex(index); window.scrollTo(0, 0); }}>
                {menuCategory.emoji} {menuCategory.name}
              </button>
            ))}
          </nav>
          <h2 className="category-title">{category.name}</h2>
          <section aria-label={`Pratos: ${category.name}`}>
            {category.items.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                quantity={cart[item.id] ?? 0}
                canShare={groupMode && activeMembers.length > 1}
                onChangeQuantity={(delta) => adjustQuantity(item.id, delta)}
                onShare={() => { setShareId(item.id); setBagError(''); }}
              />
            ))}
          </section>
          {orderCount > 0 && (
            <div className="bottom-bar">
              <button className="primary bottom-action" type="button" onClick={() => setBagOpen(true)}>
                <span>🛍️ Ver sacola ({orderCount})</span><span>{currency(orderTotal(cart))}</span>
              </button>
            </div>
          )}
          {bagOpen && <CartDialog cart={cart} shared={shared} groupMode={groupMode} participantName={activeParticipant.name}
            memberCount={activeMembers.length} note={note} sending={sending} saved={Boolean(sent)} error={bagError}
            onChangeNote={setNote} onChangeQuantity={adjustQuantity} onRemoveShared={removeShared}
            onClose={() => { if (!sending) { setBagOpen(false); setBagError(''); } }} onSend={() => void submitOrder()} />}
          {shareId && ITEMS_BY_ID[shareId] && <ShareDialog itemId={shareId} members={activeMembers} onClose={() => setShareId(null)}
            onAdd={(dish) => {
              setShared((previous) => [...previous, dish]);
              setCart((previous) => ({ ...previous, [dish.id]: (previous[dish.id] ?? 0) + 1 }));
              setShareId(null);
            }} />}
        </>
      )}
      {confirmation && sent && (
        <Modal title="Pedido confirmado" centered onClose={() => { setConfirmation(null); setTab('mine'); window.scrollTo(0, 0); }} className="confirmation">
          <div className="confirmation-icon" aria-hidden="true">✅</div>
          <h2>{confirmation === 'updated' ? 'Pedido atualizado!' : 'Pedido enviado!'}</h2>
          <p>Recebemos seu pedido, <strong>{activeParticipant.name}</strong>.<br />Total: <strong>{currency(orderTotal(sent.items))}</strong></p>
          <p className="muted">Você pode conferir ou alterar na aba “Meu pedido”.</p>
          <button type="button" className="primary full" onClick={() => { setConfirmation(null); setTab('mine'); window.scrollTo(0, 0); }}>OK</button>
        </Modal>
      )}
    </main>
  );
}
