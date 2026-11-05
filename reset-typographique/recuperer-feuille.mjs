// Lit la feuille finale du billet sur la page (non redistribuée ici) et compare son empreinte à SHA256SUMS.
import fs from 'node:fs';
import crypto from 'node:crypto';
const URL_BILLET = 'https://css-tricks.com/taming-typography-modern-css-reset/';
const html = await (await fetch(URL_BILLET)).text();
const blocs = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)].map(m => m[1]);
const brut = blocs.find(b => b.includes('tidy-typography.css'));
if (!brut) { console.error('BLOC ABSENT de la page'); process.exit(1); }
const css = brut.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
fs.mkdirSync('vendor', { recursive: true });
fs.writeFileSync('vendor/tidy-typography.css', css);
const sha = crypto.createHash('sha256').update(css).digest('hex');
const attendu = fs.existsSync('SHA256SUMS') ? fs.readFileSync('SHA256SUMS', 'utf8').split(/\s+/)[0] : null;
console.log('feuille', css.length, 'caractères', sha, attendu === sha ? 'empreinte OK' : `EMPREINTE DIFFÉRENTE (attendu ${attendu})`);
if (attendu && attendu !== sha) process.exit(2);
