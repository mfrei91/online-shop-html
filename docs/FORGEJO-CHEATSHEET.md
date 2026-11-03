# 📋 Cheat Sheet: Shop auf Forgejo (in Nextcloud) hochladen

> Kurzanleitung, um den KarmaKiosk-Shop von GitHub auf einen eigenen Forgejo-Server zu übertragen.
> Voraussetzung: `git` ist installiert (unter Windows z. B. via https://git-scm.com).

---

## 1. Repository in Forgejo anlegen

1. In Forgejo (in deiner Nextcloud) anmelden
2. **➕ New Repository** (Neues Repository) klicken
3. Name z. B. `online-shop-html` vergeben
4. **Wichtig:** NICHT „Initialize Repository" ankreuzen (keine README/.gitignore erstellen)
5. Auf **Create Repository** klicken → Forgejo zeigt dir die Clone-URL, z. B.:
   ```
   https://cloud.example.com/dein-user/online-shop-html.git
   ```
   Diese URL kopieren – sie wird gleich gebraucht.

---

## 2. Access Token erstellen (für die Anmeldung beim Push)

1. In Forgejo oben rechts auf deinen **Avatar → Einstellungen (Settings)**
2. Links auf **Anwendungen (Applications)** → Abschnitt *Access Tokens*
3. Neuen Token erstellen:
   - **Name:** z. B. `git-push`
   - **Scope:** `repository` (Schreibrechte für Repositories)
4. **Generate Token** klicken → Token **sofort kopieren**
   ⚠️ Der Token wird nur einmal angezeigt! Nicht an Dritte weitergeben und nicht in den Chat schreiben.

---

## 3. Shop von GitHub herunterladen und zu Forgejo pushen

Im Terminal / in der Git-Bash nacheinander ausführen:

```bash
# 1. Repo von GitHub klonen
git clone https://github.com/mfrei91/online-shop-html.git

# 2. In den Ordner wechseln
cd online-shop-html

# 3. Forgejo als zweites "Remote" hinzufügen (URL von Schritt 1 einsetzen)
git remote add forgejo https://cloud.example.com/dein-user/online-shop-html.git

# 4. Auf Forgejo hochladen
git push forgejo main
```

**Anmeldung beim Push:**
- **Username:** dein Forgejo-/Nextcloud-Benutzername
- **Passwort:** der Access Token aus Schritt 2 (nicht das Nextcloud-Passwort!)

> 💡 Damit git den Token nicht jedes Mal abfragt:
> ```bash
> git config --global credential.helper store
> ```
> (speichert den Token nach der ersten Eingabe lokal)

---

## 4. Optional: Flask-Version ebenfalls hochladen

```bash
git clone https://github.com/mfrei91/online-shop.git
cd online-shop
git remote add forgejo https://cloud.example.com/dein-user/online-shop.git
git push forgejo main
```

---

## 5. Prüfen

- Forgejo im Browser öffnen → Repository sollte alle Dateien zeigen
  (`index.html`, `admin.html`, `login.html`, `register.html`, `impressum.html`,
  `datenschutz.html`, `css/`, `js/`)
- Branch: `main`

---

## 🛠️ Häufige Fehler

| Fehlermeldung | Bedeutung / Lösung |
|---|---|
| `Authentication failed` | Benutzername oder Token falsch. Beim Passwort-Feld muss der **Access Token** rein, nicht das Nextcloud-Passwort. |
| `repository not found` | Clone-URL falsch oder Repo in Forgejo noch nicht angelegt → Schritt 1 wiederholen. |
| `non-fast-forward` / `rejected` | Forgejo-Repo ist nicht leer (z. B. mit README initialisiert). Entweder Repo neu anlegen oder: `git pull forgejo main --allow-unrelated-histories` und dann pushen. |
| `remote already exists` | Remote `forgejo` existiert schon → URL ändern mit `git remote set-url forgejo https://…`. |
| SSL-/Zertifikatsfehler | Meist selbstsigniertes Zertifik des Servers. Besser Zertifik erneuern; Notlösung (nicht empfohlen): `git -c http.sslVerify=false push forgejo main`. |

---

## 🔁 Später aktualisieren

Wenn im GitHub-Repo etwas Neues passiert ist:

```bash
git pull origin main        # neuesten Stand von GitHub holen
git push forgejo main       # zu Forgejo hochladen
```

---

## 🌙 Stichwort-Übersicht

```
Forgejo-Repo anlegen (leer!)  →  Access Token (Scope: repository)
       ↓
git clone https://github.com/mfrei91/online-shop-html.git
git remote add forgejo <forgejo-clone-url>
git push forgejo main   (Username + Token)
```
