# Guia de Sprites — Arenas Regionais

Coloque os PNGs em `assets/arena_tiles/`. Tamanho recomendado: **64x64 px** ou **128x128 px**, sempre quadrado.

Se algum arquivo ainda não existir, o jogo usa uma cor temática de fallback — então você pode desenhar aos poucos.

## Região → tema
- **Abismo de Nox** → `umbral`
- **Arquipélago Celeste** → `celeste`
- **Baía Coralina** → `agua`
- **Bosque de Elyr** → `floresta`
- **Bosque Luminescente** → `eter`
- **Campos da Aurora** → `gelo`
- **Campos Nebulosos** → `astral`
- **Cavernas de Éter** → `eter`
- **Costa de Maris** → `agua`
- **Cratera de Halo** → `halo`
- **Deserto de Karesh** → `deserto`
- **Fenda de Umbra** → `umbral`
- **Floresta de Nym** → `floresta`
- **Fortaleza Colossal** → `terra`
- **Jardim Vital** → `floresta`
- **Lago Espelhado** → `agua`
- **Mar de Cristal** → `agua`
- **Montanhas Cinzentas** → `terra`
- **Montanhas de Lúmen** → `halo`
- **Oásis Lumen** → `deserto`
- **Observatório Astral** → `astral`
- **Pântano de Morgh** → `pantano`
- **Penhascos de Zephyr** → `tempestade`
- **Pico Boreal** → `gelo`
- **Planícies de Solen** → `halo`
- **Ruínas Azuis** → `eter`
- **Ruínas de Arkhos** → `terra`
- **Serra Rubra** → `fogo`
- **Torre dos Ecos** → `eter`
- **Vale de Aster** → `astral`
- **Vale de Lúmen** → `halo`
- **Vale Tempestuoso** → `tempestade`
- **Vulcão Ignivar** → `fogo`

## Nomes exatos dos sprites

### Agua
- Chão: `arena_agua_chao_01.png`, `arena_agua_chao_02.png`, `arena_agua_chao_03.png`
- Detalhe: `arena_agua_raso_01.png`, `arena_agua_raso_02.png`, `arena_agua_raso_03.png`
- Detalhe: `arena_coral_01.png`, `arena_coral_02.png`, `arena_coral_03.png`
- Obstáculo: `arena_rocha_molhada_01.png`
- Energia: `arena_cristal_azul_01.png`

### Fogo
- Chão: `arena_fogo_chao_01.png`, `arena_fogo_chao_02.png`, `arena_fogo_chao_03.png`
- Detalhe: `arena_lava_01.png`, `arena_lava_02.png`, `arena_lava_03.png`
- Detalhe: `arena_cinzas_01.png`, `arena_cinzas_02.png`, `arena_cinzas_03.png`
- Obstáculo: `arena_rocha_vulcanica_01.png`
- Energia: `arena_cristal_igneo_01.png`

### Terra
- Chão: `arena_terra_chao_01.png`, `arena_terra_chao_02.png`, `arena_terra_chao_03.png`
- Detalhe: `arena_terra_seca_01.png`, `arena_terra_seca_02.png`, `arena_terra_seca_03.png`
- Detalhe: `arena_cascalho_01.png`, `arena_cascalho_02.png`, `arena_cascalho_03.png`
- Obstáculo: `arena_rocha_01.png`
- Energia: `arena_cristal_terra_01.png`

### Floresta
- Chão: `arena_floresta_chao_01.png`, `arena_floresta_chao_02.png`, `arena_floresta_chao_03.png`
- Detalhe: `arena_grama_01.png`, `arena_grama_02.png`, `arena_grama_03.png`
- Detalhe: `arena_flores_01.png`, `arena_flores_02.png`, `arena_flores_03.png`
- Obstáculo: `arena_tronco_01.png`
- Energia: `arena_cristal_vital_01.png`

### Gelo
- Chão: `arena_gelo_chao_01.png`, `arena_gelo_chao_02.png`, `arena_gelo_chao_03.png`
- Detalhe: `arena_neve_01.png`, `arena_neve_02.png`, `arena_neve_03.png`
- Detalhe: `arena_gelo_rachado_01.png`, `arena_gelo_rachado_02.png`, `arena_gelo_rachado_03.png`
- Obstáculo: `arena_rocha_gelada_01.png`
- Energia: `arena_cristal_gelo_01.png`

### Deserto
- Chão: `arena_deserto_chao_01.png`, `arena_deserto_chao_02.png`, `arena_deserto_chao_03.png`
- Detalhe: `arena_areia_01.png`, `arena_areia_02.png`, `arena_areia_03.png`
- Detalhe: `arena_duna_01.png`, `arena_duna_02.png`, `arena_duna_03.png`
- Obstáculo: `arena_rocha_deserto_01.png`
- Energia: `arena_cristal_solar_01.png`

### Astral
- Chão: `arena_astral_chao_01.png`, `arena_astral_chao_02.png`, `arena_astral_chao_03.png`
- Detalhe: `arena_poeira_astral_01.png`, `arena_poeira_astral_02.png`, `arena_poeira_astral_03.png`
- Detalhe: `arena_runa_astral_01.png`, `arena_runa_astral_02.png`, `arena_runa_astral_03.png`
- Obstáculo: `arena_cristal_astral_01.png`
- Energia: `arena_nucleo_astral_01.png`

### Halo
- Chão: `arena_halo_chao_01.png`, `arena_halo_chao_02.png`, `arena_halo_chao_03.png`
- Detalhe: `arena_luz_01.png`, `arena_luz_02.png`, `arena_luz_03.png`
- Detalhe: `arena_runa_halo_01.png`, `arena_runa_halo_02.png`, `arena_runa_halo_03.png`
- Obstáculo: `arena_rocha_luminosa_01.png`
- Energia: `arena_cristal_halo_01.png`

### Umbral
- Chão: `arena_umbral_chao_01.png`, `arena_umbral_chao_02.png`, `arena_umbral_chao_03.png`
- Detalhe: `arena_sombra_01.png`, `arena_sombra_02.png`, `arena_sombra_03.png`
- Detalhe: `arena_fenda_01.png`, `arena_fenda_02.png`, `arena_fenda_03.png`
- Obstáculo: `arena_rocha_umbral_01.png`
- Energia: `arena_cristal_umbral_01.png`

### Tempestade
- Chão: `arena_tempestade_chao_01.png`, `arena_tempestade_chao_02.png`, `arena_tempestade_chao_03.png`
- Detalhe: `arena_vento_01.png`, `arena_vento_02.png`, `arena_vento_03.png`
- Detalhe: `arena_faisca_01.png`, `arena_faisca_02.png`, `arena_faisca_03.png`
- Obstáculo: `arena_rocha_tempestade_01.png`
- Energia: `arena_cristal_tempestade_01.png`

### Eter
- Chão: `arena_eter_chao_01.png`, `arena_eter_chao_02.png`, `arena_eter_chao_03.png`
- Detalhe: `arena_nevoa_eter_01.png`, `arena_nevoa_eter_02.png`, `arena_nevoa_eter_03.png`
- Detalhe: `arena_runa_eter_01.png`, `arena_runa_eter_02.png`, `arena_runa_eter_03.png`
- Obstáculo: `arena_cristal_eter_01.png`
- Energia: `arena_nucleo_eter_01.png`

### Pantano
- Chão: `arena_pantano_chao_01.png`, `arena_pantano_chao_02.png`, `arena_pantano_chao_03.png`
- Detalhe: `arena_lama_01.png`, `arena_lama_02.png`, `arena_lama_03.png`
- Detalhe: `arena_agua_pantano_01.png`, `arena_agua_pantano_02.png`, `arena_agua_pantano_03.png`
- Obstáculo: `arena_tronco_pantano_01.png`
- Energia: `arena_cristal_pantano_01.png`

### Celeste
- Chão: `arena_celeste_chao_01.png`, `arena_celeste_chao_02.png`, `arena_celeste_chao_03.png`
- Detalhe: `arena_nuvem_01.png`, `arena_nuvem_02.png`, `arena_nuvem_03.png`
- Detalhe: `arena_vento_celeste_01.png`, `arena_vento_celeste_02.png`, `arena_vento_celeste_03.png`
- Obstáculo: `arena_rocha_celeste_01.png`
- Energia: `arena_cristal_celeste_01.png`

**Total planejado: 143 sprites.**

Para testar um tema primeiro, basta desenhar os **3 pisos + obstáculo + energia**. Os detalhes podem vir depois.

As arenas são geradas de forma aleatória a cada batalha: 4–8 obstáculos, 2–4 cristais de ENG e 8–17 detalhes visuais, mantendo as zonas de spawn livres.