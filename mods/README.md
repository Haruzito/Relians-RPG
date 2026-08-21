# Mods do Relians

Cada mod fica em uma pasta própria:

```text
mods/
└── meu-mod/
    ├── mod.json
    ├── relians/
    ├── movimentos/
    ├── tracos/
    ├── regioes/
    ├── biomas/
    └── itens/
```

O gerenciador interno importa somente arquivos JSON dessas categorias. JavaScript externo
não é executado por segurança.

## mod.json

```json
{
  "id": "meu-mod",
  "name": "Meu Mod",
  "version": "1.0.0",
  "author": "Seu Nome",
  "description": "Descrição do mod.",
  "minReliansVersion": "10.3.1"
}
```

IDs repetidos entre mods são permitidos, mas o último mod ativo terá prioridade e o
gerenciador exibirá um aviso de conflito.
