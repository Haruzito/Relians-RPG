# Correção — Fichas de Relian criadas em História

A causa do bug era simples: fichas de Relian criadas na página Criar Ficha eram salvas em
`storySheets`, enquanto o Banco de Fichas e o seletor de equipe de treinadores leem
`savedRelianSheets`.

Agora:
- salvar uma ficha de história de Relian cria/atualiza automaticamente sua ficha jogável no banco;
- ela aparece no Banco de Fichas;
- ela aparece no seletor de equipe de treinadores;
- editar a ficha atualiza a mesma entrada sem duplicar;
- excluir a ficha remove também a entrada espelhada;
- fichas antigas já existentes são sincronizadas automaticamente ao abrir esta versão;
- nível, HP, ENG, afinidade, atributos, traço, movimentos, itens, coloração e notas são preservados.
