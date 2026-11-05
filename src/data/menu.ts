import type { MenuCategory, MenuItem } from '../types';

/** Cardápio e preços preservados da versão 3 enviada. */
const RAW_MENU: MenuCategory[] = [
  {
    "emoji": "🍢",
    "name": "Petiscos",
    "items": [
      {
        "id": "p1",
        "name": "Pão de alho recheado",
        "description": "Baguete com creme de alho e recheio à escolha. A partir de",
        "price": 45,
        "image": "/img/p1.jpg"
      },
      {
        "id": "p2",
        "name": "Vaca Desatolada",
        "description": "Costela bovina desfiada e refogada (100g), aipim frito (150g)",
        "price": 59,
        "image": "/img/p2.jpg"
      },
      {
        "id": "p3",
        "name": "Barrigada",
        "description": "Barriga suína marinada no limão com especiarias, frita",
        "price": 59,
        "image": "/img/p3.jpg"
      },
      {
        "id": "p4",
        "name": "Feijão Amigo",
        "description": "Caldinho de feijoada (copo americano 200ml)",
        "price": 19,
        "image": "/img/p4.jpg"
      },
      {
        "id": "p5",
        "name": "Provoleta",
        "description": "Provolone gratinado com orégano (250g), manjericão e tomate grelhado",
        "price": 49,
        "image": "/img/p5.jpg"
      }
    ]
  },
  {
    "emoji": "🍟",
    "name": "Porções",
    "items": [
      {
        "id": "o1",
        "name": "Alcatra Cream Cheese",
        "description": "Quatro queijos! 250g de alcatra em cubos, refogado na manteiga com alho",
        "price": 75,
        "image": "/img/o1.jpg"
      },
      {
        "id": "o2",
        "name": "Mix Raiz",
        "description": "Aipim, batata rústica, batata palito, torresmo, bacon",
        "price": 65,
        "image": "/img/o2.jpg"
      },
      {
        "id": "o3",
        "name": "Camarão à Milanesa",
        "description": "Camarão grande (250g) empanado no Panko",
        "price": 125,
        "image": "/img/o3.jpg"
      },
      {
        "id": "o4",
        "name": "Isca de Peixe",
        "description": "Pescada amarela à milanesa, empanada no Panko (300g)",
        "price": 79,
        "image": "/img/o4.jpg"
      },
      {
        "id": "o5",
        "name": "Isca de Frango",
        "description": "Peito de frango à milanesa (300g), empanado com flocos de milho",
        "price": 49,
        "image": "/img/o5.jpg"
      },
      {
        "id": "o6",
        "name": "Porções Tradicionais",
        "description": "Batata frita, rústica ou aipim frito (300g) + barbecue de goiabada. A partir de",
        "price": 23,
        "image": "/img/o6.jpg"
      }
    ]
  },
  {
    "emoji": "🧆",
    "name": "Bolinhos",
    "items": [
      {
        "id": "b1",
        "name": "O cupim do boi de mamão",
        "description": "Bolinho de cupim marinado no vinho. Petisco do Comida di Buteco 2024",
        "price": 59,
        "image": "/img/b1.jpg"
      },
      {
        "id": "b2",
        "name": "Suvaco de Sabugo (6 un)",
        "description": "Bolinho de milho verde com parmesão, empanado",
        "price": 47,
        "image": "/img/b2.jpg"
      },
      {
        "id": "b3",
        "name": "Zé Pequeno (6 un)",
        "description": "Dadinho de tapioca com queijo minas e castanha do Pará",
        "price": 44,
        "image": "/img/b3.jpg"
      },
      {
        "id": "b4",
        "name": "Colono (6 un)",
        "description": "Bolinho de linguiça colonial e queijo, vinagrete de abacaxi",
        "price": 39,
        "image": "/img/b4.jpg"
      },
      {
        "id": "b5",
        "name": "Siri (6 un)",
        "description": "Bolinho de siri empanado no panko, maionese de limão siciliano",
        "price": 49,
        "image": "/img/b5.jpg"
      }
    ]
  },
  {
    "emoji": "🍗",
    "name": "Coxinhas",
    "items": [
      {
        "id": "c1",
        "name": "Coxinha de Costela (un)",
        "description": "Costela assada, desfiada, com massa artesanal. Campeã Comida di Buteco 2018",
        "price": 23,
        "image": "/img/c1.jpg"
      },
      {
        "id": "c2",
        "name": "Coxinha de Queijo (un)",
        "description": "Muçarela e provolone, massa artesanal de aipim (150g)",
        "price": 18,
        "image": "/img/c2.jpg"
      }
    ]
  },
  {
    "emoji": "🥟",
    "name": "Pastéis",
    "items": [
      {
        "id": "t1",
        "name": "Pastel de Camarão",
        "description": "Molho vermelho com requeijão, vinagrete de abacaxi",
        "price": 42,
        "image": "/img/t1.jpg"
      },
      {
        "id": "t2",
        "name": "Pastel Costela e Queijo",
        "description": "Costela assada, desfiada e refogada, muçarela e provolone",
        "price": 36,
        "image": "/img/t2.jpg"
      },
      {
        "id": "t3",
        "name": "Pastel Muçarela c/ Parmesão",
        "description": "Muçarela e provolone, vinagrete de abacaxi",
        "price": 27,
        "image": "/img/t3.jpg"
      },
      {
        "id": "t4",
        "name": "Vento Sul (4 pastéis)",
        "description": "4 pastéis recheados de vento, com barbecue de goiabada",
        "price": 15,
        "image": "/img/t4.jpg"
      }
    ]
  },
  {
    "emoji": "🍛",
    "name": "Pratos Individuais",
    "items": [
      {
        "id": "i1",
        "name": "Camarão com Abacaxi",
        "description": "Camarão, alho poró, tomate, cebola, leite de coco, requeijão, açafrão, abacaxi",
        "price": 138,
        "image": "/img/i1.jpg"
      },
      {
        "id": "i2",
        "name": "Baião de Dois",
        "description": "Feijão vermelho, arroz, charque, calabresa, bacon, queijo, cebola, couve, vinagrete",
        "price": 87,
        "image": "/img/i2.jpg"
      },
      {
        "id": "i3",
        "name": "Peixe à Milanesa",
        "description": "Filé de peixe à milanesa, arroz com legumes, lascas de coco e batata frita",
        "price": 109,
        "image": "/img/i3.jpg"
      },
      {
        "id": "i4",
        "name": "Bife a Cavalo",
        "description": "Alcatra acebolada, ovo frito, queijo gratinado, batata rústica, arroz com crispe",
        "price": 94,
        "image": null
      },
      {
        "id": "i5",
        "name": "Frango Parmegiana",
        "description": "Peito de frango recheado com presunto e queijo, molho de tomate, arroz e batata",
        "price": 79,
        "image": null
      }
    ]
  },
  {
    "emoji": "🍽️",
    "name": "Pratos para 2",
    "items": [
      {
        "id": "d1",
        "name": "Peixe ao Molho de Camarão (R$ 165)",
        "description": "Peixe à milanesa com molho de camarão e champignon, arroz com lascas de coco",
        "price": 165,
        "image": "/img/d1.jpg"
      },
      {
        "id": "d2",
        "name": "Costela Assada",
        "description": "Costela bovina assada por 6h (aprox. 600g), arroz e legumes",
        "price": 208,
        "image": "/img/d2.jpg"
      },
      {
        "id": "d3",
        "name": "Peixe ao Molho de Camarão (R$ 239)",
        "description": "Peixe à milanesa com molho de camarão e champignon, arroz com lascas de coco",
        "price": 239,
        "image": "/img/d3.jpg"
      },
      {
        "id": "d4",
        "name": "Parmegiana de Frango Recheado",
        "description": "Peito de frango com presunto e queijo ao molho de tomate, arroz, legumes",
        "price": 149,
        "image": "/img/d4.jpg"
      },
      {
        "id": "d5",
        "name": "Peixe Assado",
        "description": "Tainha assada (~700g) com mix de legumes à grega, arroz, batata",
        "price": 230,
        "image": "/img/d5.jpg"
      },
      {
        "id": "d6",
        "name": "Camarão à Grega",
        "description": "Camarão à milanesa no Panko (250g), arroz à grega, aipim frito e legumes",
        "price": 215,
        "image": "/img/d6.jpg"
      }
    ]
  }
];

// Vite adapta o caminho das imagens para domínio raiz e subpastas (ex.: GitHub Pages).
export const MENU: MenuCategory[] = RAW_MENU.map((category) => ({
  ...category,
  items: category.items.map((item) => ({
    ...item,
    image: item.image ? `${import.meta.env.BASE_URL}${item.image.replace(/^\//, '')}` : null,
  })),
}));

export const ITEMS_BY_ID: Record<string, MenuItem> = Object.fromEntries(
  MENU.flatMap((category) => category.items.map((item) => [item.id, item])),
);
