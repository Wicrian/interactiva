// Serveur : sert les pages, reçoit les envois, les diffuse en direct au tableau.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = process.env.PORT || 3000;
// Code de l'animateur : à définir dans l'hébergeur (variable CODE_ANIMATEUR).
const CODE = process.env.CODE_ANIMATEUR || 'animateur';

const MAX_MESSAGE = 200;
const MAX_MOT = 30;
const MAX_PHOTO = 3 * 1024 * 1024;

// État du tableau (en mémoire). vue : 'mots' | 'postit' | 'photos'
const etat = { vue: 'mots', mots: [], messages: [], photos: [] };
const images = new Map(); // id -> { buf, type }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

const serveur = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'POST' && url.pathname === '/photo') {
    const morceaux = []; let taille = 0;
    req.on('data', (c) => { taille += c.length; if (taille > MAX_PHOTO) { res.writeHead(413).end(); req.destroy(); } else morceaux.push(c); });
    req.on('end', () => {
      const type = req.headers['content-type'];
      if (type !== 'image/jpeg' || taille === 0) return res.writeHead(400).end();
      const id = randomUUID();
      images.set(id, { buf: Buffer.concat(morceaux), type });
      const w = Math.min(Number(url.searchParams.get('w')) || 4, 4000);
      const h = Math.min(Number(url.searchParams.get('h')) || 3, 4000);
      etat.photos.push({ id, w, h });
      diffuser();
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true }));
    });
    return;
  }

  if (url.pathname.startsWith('/img/')) {
    const img = images.get(url.pathname.slice(5));
    if (!img) return res.writeHead(404).end();
    return res.writeHead(200, { 'content-type': img.type, 'cache-control': 'public, max-age=86400' }).end(img.buf);
  }

  const pages = { '/': 'index.html', '/tableau': 'tableau.html' };
  const nom = pages[url.pathname] || url.pathname.slice(1);
  const fichier = path.join(DIR, nom);
  if (!fichier.startsWith(DIR) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) return res.writeHead(404).end('Introuvable');
  res.writeHead(200, { 'content-type': TYPES[path.extname(fichier)] || 'application/octet-stream' });
  fs.createReadStream(fichier).pipe(res);
});

const wss = new WebSocketServer({ server: serveur, maxPayload: 10_000 });

function diffuser() {
  const msg = JSON.stringify({ t: 'etat', etat });
  for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ t: 'etat', etat }));
  ws.on('message', (brut) => {
    let m; try { m = JSON.parse(brut); } catch { return; }
    const texte = typeof m.texte === 'string' ? m.texte.trim().replace(/\s+/g, ' ') : '';

    if (m.t === 'mot' && texte) {
      etat.mots.push({ id: randomUUID(), texte: texte.slice(0, MAX_MOT) });
    } else if (m.t === 'message' && texte) {
      etat.messages.push({ id: randomUUID(), texte: texte.slice(0, MAX_MESSAGE) });
    } else if (m.t === 'admin' && m.code !== CODE) {
      ws.send(JSON.stringify({ t: 'refus' }));
      return;
    } else if (m.t === 'admin') {
      if (m.action === 'vue' && ['mots', 'postit', 'photos'].includes(m.vue)) etat.vue = m.vue;
      else if (m.action === 'supprimer') {
        const liste = { mot: 'mots', message: 'messages', photo: 'photos' }[m.type];
        if (liste === 'mots') {
          // Un mot supprimé disparaît pour toutes ses répétitions.
          const cle = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
          const cible = etat.mots.find((x) => x.id === m.id);
          if (cible) etat.mots = etat.mots.filter((x) => cle(x.texte) !== cle(cible.texte));
        } else if (liste) {
          etat[liste] = etat[liste].filter((x) => x.id !== m.id);
          if (liste === 'photos') images.delete(m.id);
        }
      } else if (m.action === 'vider') {
        etat.mots = []; etat.messages = []; etat.photos = []; images.clear();
      } else return;
    } else return;
    diffuser();
  });
});

serveur.listen(PORT, () => console.log(`Prêt : http://localhost:${PORT}   (tableau : /tableau?code=${CODE})`));
