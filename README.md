# Portal XCM Nísia Floresta 2027

Primeira versão responsiva do portal oficial do evento.

## Como abrir

1. Extraia o arquivo ZIP.
2. Abra a pasta no VS Code.
3. Abra `index.html`.
4. Clique com o botão direito e escolha **Open with Live Server**.

## O que já funciona

- Página responsiva para celular e computador.
- Contador regressivo para 02/05/2027.
- Blog com janelas de leitura.
- Hall da Fama 2026.
- Categorias e valores.
- Link oficial do Instagram.
- Formulário com Pix ou cartão.
- Upload visual de comprovante.
- Redirecionamento para WhatsApp no pagamento por cartão.
- Máscaras de CPF e telefone.
- Código provisório de inscrição.

## Alterações obrigatórias antes de publicar

### 1. Chave Pix
No arquivo `index.html`, procure:

INSIRA-AQUI-SUA-CHAVE-PIX

e substitua pela chave real.

### 2. WhatsApp
No arquivo `script.js`, procure:

5584000000000

e substitua pelo número oficial, com DDI e DDD, sem espaços.
Exemplo: 5584999999999

### 3. Inscrições reais
Esta versão é um protótipo frontend. Os dados e o comprovante não são enviados
para um servidor; apenas uma demonstração fica salva no navegador.

Para receber inscrições reais de vários celulares e computadores será necessário:
- banco de dados;
- armazenamento dos comprovantes;
- backend/API;
- painel administrativo;
- autenticação da organização.

Opções futuras: Firebase, Supabase ou backend próprio com Node.js/PostgreSQL.

### 4. Instagram incorporado
Os cartões de Instagram são espaços reservados. Depois, substitua por incorporações
de posts ou Reels específicos.

## Estrutura

- `index.html`
- `style.css`
- `script.js`
- `assets/`
