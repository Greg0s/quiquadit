# Procedure for updating quotes

## Context

The quotes displayed by the application are **not stored in plain text in the repository**. Here's how it works:

- [`src/quotes.json`](../src/quotes.json) is the **source** file, containing the quotes in plain text. It is listed in [`.gitignore`](../.gitignore) and is therefore **never versioned**.
- [`scripts/encrypt-quotes.mjs`](../scripts/encrypt-quotes.mjs) reads this source file, encrypts it (AES-GCM, key derived via PBKDF2), and writes the result to [`public/quotes.enc.json`](../public/quotes.enc.json).
- It is **`public/quotes.enc.json`** that is versioned in git and deployed to GitHub Pages; it's the one the application loads and decrypts client-side (see [`src/crypto.ts`](../src/crypto.ts)).

The encryption script runs automatically before `dev` and `build` (see [`package.json`](../package.json)):

```json
"dev": "pnpm run encrypt-quotes && vite",
"build": "pnpm run encrypt-quotes && tsc -b && vite build",
```

⚠️ Since `src/quotes.json` is not versioned, the GitHub Actions CI doesn't have it. The script detects its absence and **reuses `public/quotes.enc.json` as-is** if it already exists — CI therefore cannot regenerate the quotes itself. This must be done **locally**, then the resulting encrypted file must be committed.

## Expected format

`src/quotes.json` must be an array of objects matching the [`Quote`](../src/types.ts) type:

```json
[
  {
    "quote": "Quote text",
    "author": "Author name",
    "context": "Context or source of the quote"
  }
]
```

## Steps

1. **Check out an up-to-date branch** (optional but recommended):

   ```bash
   git checkout main
   git pull
   ```

2. **Create or edit `src/quotes.json`** at the project root, next to `src/types.ts`. Add, modify, or remove entries according to the format above.

   - If the file doesn't exist yet locally, create it manually (it's never present after a `git clone`, since it's ignored).
   - Make sure the JSON is valid (the script fails if parsing fails).

3. **Regenerate the encrypted file**:

   ```bash
   pnpm install
   pnpm run encrypt-quotes
   ```

   This updates `public/quotes.enc.json` with a new salt, a new IV, and the encrypted content of the quotes.

4. **Verify locally** (optional):

   ```bash
   pnpm run dev
   ```

   Open the application and confirm the new quotes display correctly after authentication.

5. **Commit only the encrypted file** (never `src/quotes.json`, which stays local and private):

   ```bash
   git add public/quotes.enc.json
   git commit -m "Update quotes"
   ```

6. **Push and deploy**:

   ```bash
   git push
   ```

   A push to `main` automatically triggers the GitHub Actions workflow [`deploy.yml`](../.github/workflows/deploy.yml), which builds and publishes the site to GitHub Pages. CI will reuse `public/quotes.enc.json` as just committed.

## Points to watch

- **Never commit `src/quotes.json`**: it contains the quotes in plain text and is deliberately excluded from the repository.
- **Always regenerate `public/quotes.enc.json` after modifying the source file**: otherwise, changes will be neither tested locally nor deployed.
- The decryption password (`PASSWORD` in `scripts/encrypt-quotes.mjs`) must stay in sync with [`src/crypto.ts`](../src/crypto.ts); don't change it without updating both files together.
- If `public/quotes.enc.json` is missing locally and `src/quotes.json` is too, the script fails with an explicit error: `src/quotes.json` must be created before running `encrypt-quotes`.
