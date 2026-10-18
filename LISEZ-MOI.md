# Interface interactive d'animation

Les participants scannent un QR code avec leur téléphone et envoient **une phrase** (post-it), **un mot** (nuage de mots) ou **une photo**. Tout apparaît en direct sur un tableau projeté, où l'on peut zoomer et se déplacer.

## Les trois adresses

| Adresse | Pour qui | Rôle |
|---|---|---|
| `/` | Participants | Trois boutons en bas : Phrase, Mot, Photo. **C'est cette adresse qu'on met dans le QR code.** |
| `/tableau` | Public (projection) | Le tableau, sans aucun bouton. |
| `/tableau?code=TON_CODE` | Animateur | Le même tableau, avec la barre de contrôle (changer de vue, recentrer, exporter en PDF, vider) et la croix de suppression au survol de chaque élément. |

Raccourcis : `1` mots, `2` post-it, `3` photos, `Échap` vue d'ensemble, `0` recentrer, `Q` grand QR code. Clic sur une zone = zoom dessus ; clic dans le vide = retour à la vue d'ensemble.
Zoom : molette ou pincement. Déplacement : glisser.

## Essayer chez soi (sur l'ordinateur)

```bash
cd ~/Développement/interface-interactive-animation
npm install
npm start
```

Puis ouvrir `http://localhost:3000/tableau?code=animateur`.
(Les téléphones ne peuvent pas y accéder : pour eux, il faut la mise en ligne ci-dessous.)

## Mise en ligne (nécessaire pour l'université)

Le Wi-Fi d'une université isole souvent les appareils entre eux : un serveur sur ton ordinateur ne serait pas joignable par les téléphones. On met donc le serveur sur Internet, avec une adresse fixe, donc **un QR code qu'on peut imprimer à l'avance**.

Option simple et gratuite : **Render** (render.com).

1. Mettre le dossier sur GitHub (GitHub Desktop → « Publish repository »).
2. Sur render.com : *New → Web Service* → choisir le dépôt.
3. Réglages : *Build command* `npm install`, *Start command* `npm start`.
4. Dans *Environment*, ajouter la variable **`CODE_ANIMATEUR`** avec le code secret de ton choix.
5. Render donne une adresse du type `https://xxx.onrender.com`. C'est elle qu'on met dans le QR code (InDesign).

À savoir :
- Le plan gratuit **s'endort après 15 min sans visite** et met ~50 s à se réveiller : ouvre l'adresse 5 minutes avant la séance.
- Le tableau est **gardé en mémoire** : si le serveur redémarre, il est vidé. D'où l'export PDF.
- La page du tableau interroge le serveur toutes les 4 minutes (`/sante`) pour l'empêcher de s'endormir : **garde cette page ouverte pendant toute la séance**, et empêche l'ordinateur de se mettre en veille.
- **Ne pousse aucune modification sur GitHub pendant une séance** : Render redémarre alors le serveur et le tableau est vidé.
- Par prudence, fais un export (PDF ou Image) en milieu de séance, puis à la fin.

## Exports (barre animateur)

Fonctionnent dans Chrome comme dans Safari : les fichiers sont fabriqués par la page elle-même, sans passer par la fenêtre d'impression.

- **PDF** : tout le tableau (les trois zones) sur **une seule grande page**, texte et formes en vectoriel (net à tout zoom).
- **Image** : le même tableau en PNG très grande taille (jusqu'à 8000 px de côté).
- **Idées (tableur)** : fichier `.csv` (s'ouvre dans Excel, Numbers…), une ligne par idée, **sans aucun nom** : les mots avec leur nombre de répétitions, puis les phrases. Pratique pour le renvoyer aux participants.

## Le QR code

Le fichier est dans `QRCODE/`, et une copie sert au tableau (`public/qr.svg`) : un petit QR est affiché en bas à gauche. Clic dessus (ou touche `Q`) pour l'afficher en grand. Si l'adresse du site change, remplacer ce fichier.

## Limites actuelles

- Pensé pour moins de 50 personnes.
- Aucune modération préalable : tout s'affiche tout de suite, l'animateur supprime après coup.
- Pas de sauvegarde automatique : exporter le PDF avant de fermer.
