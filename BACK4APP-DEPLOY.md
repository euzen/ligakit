# Nasazení LigaKit na Back4App

Tento návod popisuje kroky pro nasazení aplikace LigaKit na platformu Back4App pomocí Docker kontejnerů.

## Předpoklady

1. Účet na [Back4App](https://www.back4app.com/)
2. Git repozitář s projektem na GitHub/GitLab/Bitbucket
3. Vygenerovaný NEXTAUTH_SECRET (viz níže)

## Kroky nasazení

### 1. Příprava lokálně

#### Vygeneruj NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

Ulož si tento klíč — budeš ho potřebovat v Back4App.

#### Ověř, že máš všechny soubory:
- `Dockerfile` ✓
- `.dockerignore` ✓
- `back4app.yml` ✓
- `next.config.ts` (s `output: 'standalone'`) ✓

### 2. Push na GitHub

```bash
git add .
git commit -m "Prepare for Back4App deployment"
git push origin main
```

### 3. Vytvoření aplikace v Back4App

1. Jdi na [Back4App Dashboard](https://dashboard.back4app.com/)
2. Klikni na **"+ New App"**
3. Vyber **"Containers"**
4. Vyber **"GitHub"** (nebo jiný provider) a propoj repozitář
5. Back4App automaticky detekuje `Dockerfile`

### 4. Konfigurace environment variables

V Back4App dashboard → App → Settings → Environment Variables přidej:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXTAUTH_SECRET` | `tvůj-vygenerovaný-klíč` | Pro autentizaci (vygeneruj: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://tvoje-app.back4app.io` | URL aplikace (Back4App ti dá) |
| `DATABASE_URL` | `file:/app/data/dev.db` | SQLite databáze (persistentní) |
| `NODE_ENV` | `production` | Mód aplikace |
| `PORT` | `3000` | Port (nastaven v Dockerfile) |

### 5. Konfigurace volumes (důležité!)

Aby se data neztratila při restartu, musíš nastavit **Persistent Volumes**:

V Back4App dashboard → App → Settings → Volumes přidej:

1. **Data volume (SQLite):**
   - Mount Path: `/app/data`
   - Size: 1GB

2. **Uploads volume (pro obrázky):**
   - Mount Path: `/app/public/uploads`
   - Size: 1GB

### 6. Deploy

1. Klikni na **"Deploy"** v Back4App dashboard
2. Počkej na build (trvá ~2-5 minut)
3. Back4App ti dá URL (např. `https://ligakit-xxxx.back4app.io`)

### 7. První inicializace databáze

Po prvním deploy musíš spustit migrace. V Back4App:

1. Jdi do **"Logs"** → **"Container Logs"**
2. Zkontroluj, že aplikace běží
3. Pokud je potřeba spustit migrace ručně, použij **"Console"** v dashboardu:

```bash
# V Back4App console:
npx prisma migrate deploy
```

Nebo můžeš migrace spustit lokálně s produkční databází (pokud máš přístup).

### 8. Vytvoření admin uživatele

Po prvním deploy vytvoř admina:

**Způsob A:** Lokálně s připojením na produkční DB
```bash
# Připoj se na Back4App console a spusť:
npm run seed:admin
```

**Způsob B:** Přímo přes registraci
1. Otevři aplikaci na Back4App URL
2. Zaregistruj se jako běžný uživatel
3. V Back4App console změň roli na ADMINISTRATOR:
```bash
# V Back4App console, v /app adresáři:
npx prisma db execute --stdin <<EOF
UPDATE User SET role = 'ADMINISTRATOR' WHERE email = 'tvůj@email.cz';
EOF
```

## Řešení problémů

### Aplikace nenaběhne

Zkontroluj logy v Back4App Dashboard → Logs → Container Logs.

### Databáze se neinicializuje

Ujisti se, že máš správně nastavený volume na `/app/data`.

### Missing environment variables

Back4App vyžaduje všechny env variables nastavené před prvním deploy.

### Build failuje

Zkontroluj, že máš:
- `output: 'standalone'` v `next.config.ts`
- Správně vygenerovaný Prisma client
- Všechny dependencies v `package.json`

## Aktualizace aplikace

Pro nový deploy stačí:

```bash
# Lokálně:
git add .
git commit -m "Update features"
git push origin main
```

Back4App automaticky detekuje změny a nabídne redeploy.

## Custom domain (volitelné)

V Back4App Dashboard → App → Settings → Domains:
1. Klikni **"Add Custom Domain"**
2. Zadej tvou doménu (např. `tvujturnaj.cz`)
3. Nastav DNS podle instrukcí (CNAME záznam)
4. Aktualizuj `NEXTAUTH_URL` na novou doménu
5. Redeploy aplikaci

## Alternativa: Deploy přes CLI

Back4App nabízí CLI pro pokročilejší použití:

```bash
# Instalace Back4App CLI
npm install -g back4app

# Login
back4app login

# Deploy
back4app deploy
```

## Další zdroje

- [Back4App Containers Docs](https://www.back4app.com/docs-containers)
- [Back4App Next.js Guide](https://www.back4app.com/docs-containers/run-a-nextjs-container-app)
- [Back4App Environment Variables](https://www.back4app.com/docs-containers/environment-variables)
