# KarmaKiosk 🌙 (Statische HTML-Version)

Onlineshop für digitale Downloads (Kartenlegungen • Zauber • Rituale) als reine HTML/CSS/JS-Website – ganz ohne Server. Design und Aufbau orientieren sich am Screenshot: warme Holz-/Erdtöne, Angebote als Rechteck-Kacheln.

> Die Flask-Vollstack-Version mit echter Server-Logik liegt in einem separaten Repository: [online-shop](https://github.com/mfrei91/online-shop)

## Funktionen

- **Warenkorb (`warenkorb.html`):** Artikel mit Mengen-Steuerung, Summen und Gesamtsumme; live mit den Angeboten verknüpft (neue Angebote erscheinen sofort, entfernte/inaktive werden automatisch ausgeblendet)
- **Zahlungsanbieter:** in der reinen HTML-Version nicht direkt angebunden – Schritt-für-Schritt-Anleitung in `docs/ZAHLUNGSANBIETER.md` (PayPal-Buttons, E-Mail/Überweisung, Stripe/Mollie mit Backend)
- **Cheat Sheet Forgejo-Upload:** `docs/FORGEJO-CHEATSHEET.md`
- **Rechtstexte (Österreich/EU, Mustertexte – vor Veröffentlichung ersetzen und prüfen lassen):**
  - `impressum.html` – Offenlegung gemäß § 5 ECG (Firmenbuch, UID, WKÖ, ODR-Plattform)
  - `datenschutz.html` – DSGVO + österreichisches DSG, Beschwerderecht bei der Datenschutzbehörde (DSB)
  - `agb.html` – Muster-AGB für digitale Downloads (FAGG-Rücktrittsrecht 14 Tage, Verlust bei Download-Zustimmung nach § 18 Abs. 1 Z 8 FAGG, Gewährleistung ABGB, österreichisches Recht, VKI-Schlichtung)
  - `cookies.html` – Cookie- & Speicher-Richtlinie (keine Tracking-Cookies, localStorage-Zweckbindung, Lösch-Möglichkeit) **inkl. Cookie-Hinweis-Banner** auf allen Seiten
- **Shop (`index.html`):** Angebote als Rechteck-Kacheln, Kategorien-Filter (Kartenlegungen, Zauber, Rituale), „Beliebte Artikel"
- **Login (`login.html`) / Registrierung (`register.html`):** clientseitig simuliert, Daten liegen im `localStorage` des Browsers
  - **Passwort-Mindestanforderungen:** 12 Zeichen, mind. 1 Großbuchstabe, mind. 1 Sonderzeichen (bei Registrierung und Admin-Passwort-Reset)
  - **2FA (TOTP, RFC 6238):** im Admin-Bereich pro Benutzer einrichtbar; Login verlangt dann den 6-stelligen App-Code. Kompatibel mit Google Authenticator, Microsoft Authenticator, FreeOTP, Aegis und Authy (Standard-TOTP). Die Twilio-Authy-API selbst ist proprietär und ohne eigenes Backend nicht angebunden – Standard-TOTP ist die funktionsgleiche Alternative.
- **Admin-Bereich (`admin.html`):** nur für die Rolle „admin" sichtbar
  - **Angebote:** hinzufügen, bearbeiten, entfernen, „beliebt" markieren, aktiv/inaktiv schalten
  - **Benutzer:** auflisten, Rollen (user/admin) ändern, löschen (Selbstschutz für das eigene Konto) und **Passwörter zurücksetzen** (keine Passwort-Anzeige; Admin vergibt ein neues Passwort)
- Änderungen im Admin-Bereich erscheinen sofort im Shop; alle Daten bleiben im Browser gespeichert

## Nutzung

Einfach `index.html` im Browser öffnen (Doppelklick genügt). Kein Build, keine Abhängigkeiten.

## Projektstruktur

```
index.html      # Shop mit Kacheln, Kategorien, „Beliebte Artikel"
login.html      # Anmeldung
register.html   # Registrierung
admin.html      # Admin-Bereich (Angebote + Benutzerverwaltung)
css/style.css   # Holz-/Erdton-Design
js/shop.js      # Datenhaltung (localStorage), Rendering, Auth-Logik
js/auth.js      # Login-/Registrierungsformulare
js/admin.js     # Admin-Oberfläche (Angebote & Benutzer)
```

## Hinweis

Da es kein Backend gibt, sind Login und Verwaltung eine **Demonstration im Browser**: Daten und Passwörter liegen offen im `localStorage` (Passwörter nur einfach gehasht). Für einen echten Shop mit sicherer Authentifizierung die Flask-Version ([online-shop](https://github.com/mfrei91/online-shop)) verwenden.
