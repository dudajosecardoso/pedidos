export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
}

export interface MenuCategory {
  emoji: string;
  name: string;
  items: MenuItem[];
}

export type OrderMode = 'ind' | 'grp';
export type Cart = Record<string, number>;

export interface SharedDish {
  id: string;
  members: string[];
  holder: number;
}

/** Campos preservados para compatibilidade com os pedidos da v3 no Firestore. */
export interface OrderData {
  name: string;
  mode: OrderMode;
  title: string;
  members: string[];
  items: Cart;
  shared: SharedDish[];
  note: string;
  at: number;
}

export interface Order extends OrderData {
  id: string;
}

export type Session =
  | { role: 'p'; name: string; slug: string; id: string }
  | { role: 'a' };

export interface StoredMine {
  id: string;
  order: OrderData;
}
