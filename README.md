# Almoço no Tonho — React + Vite + TypeScript

Migração do projeto `Almoco_no_Tonho_v3.zip` para uma aplicação React com TypeScript e Vite.

## Como iniciar

É necessário ter **Node.js 20.19+ ou 22.12+** e npm.

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (normalmente `http://localhost:5173`).

Para preparar a publicação:

```bash
npm run build
npm run preview
```

A versão de produção será gerada em `dist/`.

## O que foi preservado

- Cardápio com **7 categorias, 33 pratos e os mesmos preços/descrições**.
- **31 fotografias** originais; `i4` e `i5` continuam sem foto e exibem o ícone de imagem.
- Entrada sem login de cliente, individual ou em grupo, com responsável e participantes.
- Quantidades, sacola, observações, pratos compartilhados e seleção do titular.
- Enviar/atualizar o próprio pedido, confirmação e aba **Meu pedido**.
- Identificador único por pedido, para evitar colisões entre pessoas de mesmo nome.
- Painel do administrador, resumo, exclusão de pedidos e **geração de PDF** via jsPDF.
- Modo local para testes e Firebase opcional para pedidos compartilhados.

## Modo local (padrão)

Sem configurar Firebase, os pedidos ficam somente no `localStorage` do navegador. O painel de outro aparelho **não** verá esses pedidos. O modo local conserva o formato do armazenamento usado na v3 (`tonho:orders/...`, `tonho:idx:orders`, `tonho:mine:...`).

Para testar o painel localmente:

- **Usuário:** `admin`
- **Senha:** `admin123`

O código também aceita as credenciais **locais** existentes na v3, caso você já as utilize. **A autenticação local é apenas demonstrativa e não oferece segurança para dados na internet.**

## Ativar o Firebase (produção)

1. Crie seu projeto em https://console.firebase.google.com/.
2. Ative **Firestore Database**.
3. Em **Authentication → Sign-in method**, ative **E-mail/senha**.
4. Em **Authentication → Users**, crie a conta do administrador (ex.: `augusto@almocotonho.app`). O login aceita o nome `augusto` ou o e-mail completo.
5. Registre um aplicativo **Web** no Firebase.
6. Copie `.env.example` para `.env.local` e preencha os valores a partir da configuração do seu aplicativo:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

7. **Configure regras apropriadas no Firestore.** Há também um arquivo `firestore.rules` pronto para copiar (altere o e-mail do administrador). Estas regras seguem a estrutura de dados da v3 (gravação de pedidos sem login, listagem/exclusão apenas para administrador):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{id} {
      function isAdmin() {
        return request.auth != null
          && request.auth.token.email == 'augusto@almocotonho.app';
      }
      function validOrder() {
        return request.resource.data.keys().hasOnly([
            'name', 'mode', 'title', 'members', 'items', 'shared', 'note', 'at'
          ])
          && request.resource.data.keys().hasAll([
            'name', 'mode', 'title', 'members', 'items', 'shared', 'note', 'at'
          ])
          && request.resource.data.name is string
          && request.resource.data.name.size() < 80
          && request.resource.data.note is string
          && request.resource.data.note.size() < 500
          && request.resource.data.mode in ['ind', 'grp'];
      }
      allow create, update: if validOrder();
      allow get, list, delete: if isAdmin();
    }
  }
}
```

**Atenção à segurança:** como os participantes não têm autenticação no servidor, as regras acima **não conseguem comprovar o dono de um pedido** no momento da atualização. São adequadas como compatibilidade funcional com a v3, mas não representam uma solução de controle de autoria. Para um ambiente público que exija proteção contra alterações maliciosas, recomenda-se migrar para Firebase Authentication anônimo com regras por UID, ou usar uma API própria para validar as alterações. A leitura do painel está limitada à conta do administrador configurada nas regras; **troque o e-mail do exemplo pelo da sua conta**.

8. Em Authentication → Settings → Authorized domains, autorize o domínio da sua hospedagem.
9. Reinicie o servidor do Vite após alterar `.env.local`.

As configurações `VITE_*` ficam disponíveis no código do navegador por definição do Vite; **não coloque senhas ou segredos de servidor nelas**. A segurança do Firebase depende das regras e da autenticação, não do sigilo da configuração pública.

## Publicação

Envie os arquivos gerados em **`dist/`** para sua hospedagem estática. Não publique somente `src/` nem `index.html` de desenvolvimento. Para GitHub Pages em repositório com subcaminho, ajuste `base` no `vite.config.ts` (por exemplo, `base: '/meu-repositorio/'`), execute `npm run build` e publique `dist/`.

> As fotos são resolvidas com `import.meta.env.BASE_URL`, por isso também funcionam quando o `base` do Vite é configurado para um subcaminho.

## Estrutura

```text
src/
  App.tsx                   Fluxos de cliente, grupo, sacola, pedidos e administração
  components/
    AdminDashboard.tsx      Painel administrativo, resumo, PDF e exclusão
    CartDialog.tsx          Sacola e edição de quantidades
    FoodCard.tsx            Pratos e fotos
    Modal.tsx               Janela acessível, com fechamento por Escape
    MyOrder.tsx             Conferência e alteração do pedido
    ShareDialog.tsx         Divisão de pratos e titular
  data/menu.ts              Categorias e cardápio tipado
  lib/backend.ts            Firestore / localStorage e autenticação do gestor
  lib/orders.ts             Totalizadores e texto-resumo
  lib/storage.ts            Sessão, ID e pedido local do participante
  types.ts                  Interfaces e tipos TypeScript
  main.tsx                  Entrada React
  styles.css                Estilos responsivos
public/img/                  As 31 fotos originais
.env.example                Modelo de configuração Firebase
```

**Observação da entrega:** o ZIP inclui o código-fonte. Os pacotes externos não foram incorporados ao ZIP; são instalados por `npm install` no ambiente de desenvolvimento com acesso à internet.
