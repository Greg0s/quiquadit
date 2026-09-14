# Quiquadit ?

Un jeu de devinette basé sur des citations : on affiche une citation, on devine qui l'a dite, puis on révèle l'auteur. L'idée est de le remplir avec les phrases cultes de vos proches, amis ou collègues et d'essayer de deviner qui à dit quoi.

Le jeu est protégé par un mot de passe : vos citations sont chiffrées et ne sont déchiffrées que dans le navigateur de la personne qui doit saisir le bon mot de passe. Vous pouvez donc déployer le site publiquement (par exemple sur GitHub Pages) sans exposer vos citations à n'importe qui.

## Comment ça marche

Vos citations ne sont **jamais commitées en clair**. Le flux est le suivant :

1. Vous écrivez vos citations dans `src/quotes.csv` (fichier local, ignoré par git).
2. Le script `scripts/encrypt-quotes.mjs` chiffre ce CSV avec un mot de passe et produit `public/quotes.enc.json` — c'est ce fichier chiffré qui est commité et déployé.
3. Quand quelqu'un ouvre le site et saisit le mot de passe, le navigateur télécharge `quotes.enc.json` et le déchiffre localement (AES-GCM, clé dérivée du mot de passe via PBKDF2). Le mot de passe n'est jamais envoyé à un serveur.

## Ajouter vos propres citations (format CSV)

Créez un fichier `src/quotes.csv` avec trois colonnes : `quote`, `author`, `context`.

```csv
quote,author,context
"Je manque tellement de sommeil que cette nuit j'ai rêvé que je dormais.","Mon collègue",""
"Vous me suivez ? Parce que moi je me suis plus du tout.","Jeanjean","à Noël pendant le repas"
```

- **quote** : le texte de la citation.
- **author** : le nom de la personne à deviner.
- **context** : optionnel, affiché juste après le nom (une date, une occasion, un rôle...). Laissez la cellule vide si vous n'en avez pas besoin.
- Si un champ contient une virgule, des guillemets ou un retour à la ligne, entourez-le de guillemets doubles `"..."` (pour un guillemet à l'intérieur, doublez-le : `""`). C'est le format CSV standard, donc Excel, Numbers, LibreOffice ou Google Sheets (export CSV) fonctionnent très bien pour le remplir.
- L'ordre des colonnes dans l'en-tête n'a pas d'importance, tant que `quote` et `author` sont présents.

Un exemple prêt à copier est fourni dans [src/quotes.example.csv](src/quotes.example.csv) :

```bash
cp src/quotes.example.csv src/quotes.csv
```

## Définir le mot de passe

Le mot de passe est lu depuis un fichier `.env` à la racine du projet (lui aussi ignoré par git, il ne sera jamais commité).

```bash
cp .env.example .env
```

Puis éditez `.env` :

```
QUOTES_PASSWORD=votre-mot-de-passe
```

C'est ce mot de passe que vous partagerez ensuite avec vos proches pour qu'ils puissent accéder au jeu.

`.env` n'est jamais commité (il est dans `.gitignore`) : votre mot de passe reste uniquement sur votre machine. Sans `QUOTES_PASSWORD` défini, `pnpm run encrypt-quotes` refuse de chiffrer et affiche une erreur.

## Générer votre version chiffrée en local

Une fois `src/quotes.csv` et `.env` en place :

```bash
pnpm install
pnpm run encrypt-quotes
```

Cela régénère `public/quotes.enc.json` à partir de votre CSV et de votre mot de passe. Cette étape est aussi lancée automatiquement par `pnpm run dev` et `pnpm run build`, donc en pratique vous n'avez presque jamais besoin de la lancer à la main : modifiez le CSV ou le mot de passe, puis relancez `pnpm run dev` ou déployez.

## Développement

```bash
pnpm install       # installe les dépendances
pnpm run dev        # lance le serveur de dev (re-chiffre les citations à chaque démarrage)
pnpm run build       # build de prod dans dist/ (re-chiffre les citations)
pnpm run preview      # prévisualise le build de prod
pnpm run lint         # lint le code
```

## Déploiement

Le déploiement se fait via GitHub Actions vers GitHub Pages à chaque push sur `main` (voir [.github/workflows](.github/workflows)). Le CI n'a pas accès à votre `src/quotes.csv` ni à votre `.env` locaux (ils sont ignorés par git) : le fichier `public/quotes.enc.json` déjà commité est donc réutilisé tel quel au build. Pour publier de nouvelles citations, générez `public/quotes.enc.json` en local (voir ci-dessus) et commitez-le.

## Stack technique

React + TypeScript + Vite, UI avec [Mantine](https://mantine.dev/), gestionnaire de paquets [pnpm](https://pnpm.io/).
