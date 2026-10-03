# SPACE MINER

Jogo 3D de exploração espacial, mineração, combate e progressão para navegador (Three.js), pronto para publicação no **CrazyGames**.

**Fluxo do jogo:** explorar, minerar, encontrar, combater, coletar, vender, melhorar e explorar mais fundo (6 camadas de Mars, do deserto ao Núcleo, com chefe).

## Tecnologias
HTML5, CSS3, JavaScript (módulos ES), Three.js r128 (WebGL), LocalStorage + CrazyGames Data (save), CrazyGames SDK v3. O build de produção usa esbuild (só em desenvolvimento).

## Como executar (passo a passo)
O jogo usa módulos ES e arquivos JSON, por isso **não abre com duplo clique no `index.html`**. É preciso um servidor local:

**Windows:** extraia o ZIP, dê duplo clique em `iniciar-servidor.bat` (precisa de Python ou Node.js) e abra `http://localhost:8000`.
**Mac / Linux:** no terminal, dentro da pasta, rode `./iniciar-servidor.sh` e abra `http://localhost:8000`.
**Alternativa:** `npx serve .` ou `python3 -m http.server 8000`.

## Controles
| Ação | Tecla |
|---|---|
| Mover / correr | WASD / Shift |
| Câmera | mover o mouse (clique na tela para capturar o mouse; setas também giram) |
| Zoom | roda do mouse |
| **Atirar** | **botão esquerdo** (nunca há tiro automático) |
| Minerar | botão direito (segure) ou Espaço |
| Trocar de arma | 1 a 6 |
| Interagir (nave, portais, baús) | E |
| Escudo / Esquiva / Pulso | V / Z / F |
| Scanner / Retorno à nave / Mascote | Q / R (segure) / P |
| Mochila / Coleção | I / C |
| Pausar | Esc |
| Painel de desempenho | F3 |

## Sistemas
- **Mineração:** 6 raridades, minérios enterrados (revelados pelo scanner), veios ricos, combo de mineração, baús guardados por criaturas e o mascote Bolt (que minera, marca alvos, dá bônus de venda e evolui até o nível 10).
- **Combate manual:** mira pela retícula, 6 armas com 5 níveis (`config/weapons.json`), crítico, escudo de energia, esquiva com invulnerabilidade e pulso em área. A arma inicial é fraca de propósito.
- **Inimigos:** IA por estados (`IDLE`, `PATROL`, `ALERT`, `CHASE`, `ATTACK`, `HURT`, `RETREAT`, `DEAD`) com percepção por distância, cone de visão, linha de visão contra o terreno e ruído; ataques com preparação visível e golpes especiais; grupos que se alertam; drops. Ficam maiores, mais rápidos, mais fortes e mais ameaçadores a cada camada. IA com custo reduzido por distância (inativa a mais de 90 m). Sem gore (conteúdo 12+).
- **Progressão:** XP, 30 conquistas, 12 missões, Coleção (minerais, criaturas, planetas) e lojas de armas e equipamentos.

## Balanceamento (tempo para derrotar, acertando todos os tiros)
```text
Tempo (s) para derrotar, acertando tudo.  Arma inicial = Blaster nível 1

criatura (camada)            vida  blaster1  blaster3  blaster5  plasma3  rail3  cannon3
Alien Crab (0)                 36     1.2     0.4     0.2     0.3     0.1     0.1
Alien Slime (0)                24     0.8     0.3     0.1     0.2     0.1     0.1
Alien Crab (1)                 65     2.2     0.8     0.3     0.5     0.3     0.2
Rock Creature (2)             210     7.0     2.5     1.0     1.7     0.9     0.7
Alien Crab (3)                180     6.0     2.2     0.9     1.5     0.8     0.6
Rock Creature (3)             350    11.7     4.2     1.7     2.8     1.5     1.2
Acid Spitter (4)              280     9.3     3.3     1.4     2.3     1.2     0.9
Rock Creature (5)             700    23.3     8.4     3.4     5.7     2.9     2.3
Guardião do Núcleo (5)       5000   166.7    59.8    24.2    40.6    20.8    16.4
```
Rode `node tools/balance.mjs` depois de alterar os JSON para reconferir.

## CrazyGames
- `js/crazygames/CrazyGamesService.js` é a **única** camada que fala com o SDK v3 (carregado no `<head>`). Sem o SDK (rodando local ou no GitHub Pages) tudo funciona em modo local seguro.
- Estados `LOADING`, `MENU`, `GAMEPLAY`, `PAUSED`, `GAME_OVER` (`js/core/GameState.js`). O `gameplayStart` só é enviado quando o jogador está jogando de verdade; menu, pausa, loja, anúncio, game over e aba em segundo plano enviam `gameplayStop`. `loadingStart/Stop` marcam o carregamento e `happytime` é enviado em marcos (chefe, item lendário, nível múltiplo de 5).
- A roda do mouse, as setas e o espaço não rolam a página; o áudio respeita o `muteAudio` da plataforma e fica mudo durante anúncios. O nome do usuário do CrazyGames, quando disponível, aparece no menu.
- **Anúncios** (`js/crazygames/AdManager.js`): o intersticial só aparece ao voltar ao menu ou continuar depois de um game over, com no mínimo 3 minutos desde o último anúncio e 2 minutos de jogo, nunca em combate ou mineração. Os recompensados são sempre opcionais: *Vender com +50%*, *Vida e energia cheias* e *Turbo de mineração x2 por 5 min* (na nave) e *Recuperar a carga* (game over). Se o anúncio falhar, nada quebra e nenhuma recompensa é dada. Em modo local o recompensado vira um anúncio de teste de 3 s.
- **Save** (`js/save/SaveManager.js`): LocalStorage imediato + módulo `data` do CrazyGames (a cada 10 s no máximo e ao pausar), valendo o mais recente. Saves antigos são migrados.
- Fullscreen: o jogo usa o da plataforma; a interface se adapta a qualquer tamanho de janela.

## Configuração (sem mexer no código)
Tudo em `config/`:
- `weapons.json`: armas (dano, cadência, alcance, dispersão, custo, requisitos, energia, som, cor) e chance de crítico. **Nova arma = nova entrada.**
- `enemies.json`: vida, dano, velocidade relativa, percepção, cone de visão, ataques especiais, loot e tamanho de cada criatura.
- `planets.json`: catálogo de planetas e as camadas de cada um (visual, inimigos, perigos e `difficulty`: vida, velocidade, dano, percepção, tamanho, tempo de reação, memória e cadência). **Novo planeta = nova entrada em `planets`.**
- `resources.json`: raridades, valor, dureza, chance de aparecer e XP. **Novo recurso = nova entrada.**
- `upgrades.json`: níveis, valores e custos das melhorias.

## Qualidade e desempenho
Configurações, aba Gráficos: BAIXO / MÉDIO / ALTO (sombras, brilho, partículas, distância de renderização, resolução). Se o FPS ficar abaixo de 28 por 5 segundos, o jogo reduz a qualidade sozinho. **F3** mostra FPS, chamadas de desenho, triângulos, texturas e criaturas ativas. Peças parecidas são mescladas para reduzir chamadas de desenho (cerca de 230 por quadro, incluindo as sombras) e projéteis, itens e partículas usam pool.

## Gerar o build de produção
```text
npm install        (uma vez; instala o esbuild)
npm run build      (gera a pasta dist/)
```
`dist/` contém `index.html`, `game.js` (minificado), `style.css` e `config/`: 8 arquivos, 0,73 MB (0,20 MB com gzip).

## Limites do CrazyGames
Download inicial até 50 MB (20 MB na página inicial mobile), total até 250 MB e no máximo 1.500 arquivos. O build tem 8 arquivos e 0,73 MB, sem texturas, modelos ou áudio em arquivo (tudo é gerado por código).

## Publicar
**CrazyGames:** use `SPACE-MINER-CrazyGames.zip` (ou o conteúdo de `dist/`, com o `index.html` na raiz) no CrazyGames Developer Portal: crie o jogo, envie o ZIP, preencha título, descrição, categorias e imagens, teste pelo preview do portal (SDK, anúncios, fullscreen, pausa e save) e envie para revisão. O jogo é para **desktop** (teclado e mouse).
**GitHub (código e página de teste):** crie um repositório, envie esta pasta (o `.gitignore` já ignora `node_modules`, `dist` e ZIPs), vá em *Settings, Pages, Source: GitHub Actions*. O fluxo `.github/workflows/pages.yml` faz o build e publica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Estrutura
```text
index.html              página, loading e HUD
config/                 JSON de balanceamento
css/                    estilos
js/main.js              inicialização com etapas de carregamento
js/core/                Game, GameState, InputManager, Config, Loader, SaveData, Audio, PerformanceManager, Tex, Toon
js/crazygames/          CrazyGamesService, AdManager, CrazyGamesSave
js/save/                SaveManager, LocalSave
js/combat/              CombatManager, WeaponManager, Weapon, Projectile (pool), DamageSystem
js/enemies/             Enemy, EnemyAI, EnemyConfig, EnemySpawner, EnemyManager (+ perigos)
js/player, mining, planets, inventory, economy, upgrades, missions, codex, pet, ui
js/lib/three/           Three.js r128 (módulos ES) e pós-processamento
tools/                  build.mjs (produção) e balance.mjs (relatório)
dist/                   build pronto para enviar (gerado)
```
