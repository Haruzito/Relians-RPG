# Relians RPG

**Versão atual: v10.3.0**

Gerador, editor, catálogo e banco de fichas do universo Relians.

## Recursos atuais

- Gerador de encontros e fichas de Relians.
- Catálogo numerado, incluindo variações evolutivas e múltiplas evoluções.
- Banco de fichas de Relians e personagens.
- Personagens com mochila, coleção e equipe de até 7 Relians.
- Editor de movimentos, regiões e biomas.
- Importação, exportação, save local e migração de fichas antigas.
- Interface responsiva para PC e celular.
- Instalação como aplicativo em dispositivos compatíveis (PWA).
- Aba Criadores com acesso ao Relians World e ao Blog oficial.


## Destaques da v10.3.0

- Ranking competitivo de E até S+, baseado em vitórias contra treinadores e outros jogadores.
- Batalha Local entre dois personagens salvos no mesmo dispositivo.
- Carteira do Explorador reorganizada com foco em identidade, Rank, equipe e histórico.
- Central Relian com recuperação, Box, equipe e visualizador detalhado em abas.
- Evolução por nível, item ou evento com confirmação e apresentação visual.
- Venda de Relians, drops de recursos e Mercado de Recursos integrado à Loja.
- Perfis de dificuldade Casual, Normal, Desafiador e Pesadelo, além de personalização.
- Tela final de batalha com resumo do confronto, XP, recompensas e materiais.
- Nova página Jogos para separar os modos jogáveis das ferramentas de criação.

## Destaques da v10.0.0

- Novo Catálogo em estilo bestiário, com imagem ampliada e organização por páginas.
- Alternância entre Basic, Shiny e Special Color diretamente no Catálogo.
- Elementos próprios da Special Color exibidos no Catálogo.
- Evoluções clicáveis para navegar entre Relians relacionados.
- Dados da espécie reorganizados, incluindo HP, ENG, gênero e tamanho.
- Criador de Relians ampliado com informações de habitat e evolução.
- Nova navegação superior com ícones, categorias e submenus.
- Melhorias gerais de responsividade, acessibilidade e experiência mobile.

### Histórico preservado — v9.9.0

A v9.9.0 introduziu a área Criadores/Relians World, página de Novidades e Blog, melhorias no Banco de Fichas, correções de salvamento, reorganização mobile e suporte à instalação como PWA.

## Comunidade

Discord oficial: https://discord.gg/2HkmeKVXjM

As novidades e notas da versão também estão disponíveis em `updates.html`.


## Portal Relians World

A página `index.html` agora funciona como portal principal do universo Relians.

- `generator.html` — Gerador, catálogo e banco de fichas.
- `updates.html` — Blog e novidades.
- `tcg.html` — área inicial do Relians Battle Card.
- Relians World — acesso à comunidade oficial no Discord.

## Relians Battle Card

A página `tcg.html` agora possui a estrutura inicial do card game:
- biblioteca local de cartas;
- cadastro de cartas por tipo;
- coleção preparada;
- registro local de decks;
- área de regras;
- entrada para futuras partidas.

Os dados do Battle Card ficam separados dos dados do RPG e usam armazenamento local próprio.


## Relians Battle Card — Etapa 1/5

- Nome oficial atualizado de Relians TCG para **Relians Battle Card**.
- Área de cartas reorganizada nas categorias **Relian, Movimento, Item, Treinador e Terreno**.
- Filtros rápidos por categoria adicionados à biblioteca.
- A página já apresenta a base de EP, Torpor e classes sem misturar os dados do RPG.
- A próxima etapa implementará o criador visual de cartas Relian, imagem central e até dois elementos por carta.

## Relians Battle Card — Etapa 3/5

Movimentos, Itens, Treinadores e Terrenos agora possuem editores próprios no Battle Card. Movimentos suportam custo NET/elemental, classe, precisão, poder e Torpor; Itens distinguem uso único/equipamento/suporte; Treinadores podem ser de uso único ou permanentes; Terrenos registram geração de EP e alvo do efeito. A página de regras também documenta essas regras já estabelecidas.
