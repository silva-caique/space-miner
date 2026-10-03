// Gera a versão de produção em dist/: um único game.js minificado, um style.css e os JSON de config.
// Uso: npm install   (uma vez)   e depois   npm run build
import { build, transform } from 'esbuild';
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });

await build({ entryPoints: [path.join(root, 'js/main.js')], bundle: true, minify: true, format: 'esm', target: 'es2020', outfile: path.join(out, 'game.js'), legalComments: 'none', logLevel: 'warning' });

const css = ['main', 'menu', 'hud', 'inventory'].map(n => fs.readFileSync(path.join(root, 'css', n + '.css'), 'utf8')).join('\n');
fs.writeFileSync(path.join(out, 'style.css'), (await transform(css, { loader: 'css', minify: true })).code);

fs.mkdirSync(path.join(out, 'config'));
for (const f of fs.readdirSync(path.join(root, 'config'))) fs.writeFileSync(path.join(out, 'config', f), JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, 'config', f), 'utf8'))));

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, '').replace('</head>', '<link rel="stylesheet" href="style.css">\n</head>').replace('<script type="module" src="js/main.js"></script>', '<script type="module" src="game.js"></script>');
fs.writeFileSync(path.join(out, 'index.html'), html);

// Relatório de tamanho contra os limites do CrazyGames
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(out);
let raw = 0, gz = 0; for (const f of files) { const b = fs.readFileSync(f); raw += b.length; gz += zlib.gzipSync(b).length; }
console.log(`dist/: ${files.length} arquivos | ${(raw / 1e6).toFixed(2)} MB brutos | ${(gz / 1e6).toFixed(2)} MB com gzip`);
console.log('Limites do CrazyGames: 50 MB de download inicial (20 MB para a home mobile), 250 MB no total, 1500 arquivos.');
if (raw > 50e6 || files.length > 1500) { console.error('ERRO: acima dos limites do CrazyGames'); process.exit(1); }
