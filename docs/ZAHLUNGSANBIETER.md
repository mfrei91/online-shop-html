# 💳 Zahlungsanbieter anbinden – Anleitung

> Die reine HTML-Version des Shops läuft **ohne Server**. Eine echte, sichere
> Zahlungsabwicklung ist deshalb hier nicht direkt möglich: Zahlungen erfordern
> immer ein **Backend** (Server), das Geheimnisse (API-Keys) verwahrt, die
> Zahlung beim Anbieter erzeugt und das Ergebnis verlässlich prüft.
> **API-Keys gehören niemals in den Browser-Code** – jeder könnte sie auslesen.

Diese Anleitung zeigt drei Wege, von „am schnellsten“ bis „professionell“.

---

## Weg 1: Zahlung per E-Mail / Überweisung (ohne Backend, sofort machbar)

Der Kunde legt Artikel in den Warenkorb und sendet die Bestellung ab – die
Bezahlung läuft per Banküberweisung oder PayPal-Geldanfrage.

1. In `js/cart.js` die `checkout`-Funktion anpassen: statt des Demo-Alerts
   eine E-Mail an deine Adresse öffnen:
   ```js
   document.getElementById("checkout-btn").addEventListener("click", function () {
       const items = Shop.cart();
       let total = 0;
       const lines = items.map(function (i) {
           total += i.offer.price * i.qty;
           return "- " + i.offer.title + " x" + i.qty + " (" + Shop.priceDisplay(i.offer.price * i.qty) + ")";
       });
       const body = "Neue Bestellung:%0D%0A" + lines.join("%0D%0A") +
           "%0D%0AGesamtsumme: " + Shop.priceDisplay(total);
       window.location.href = "mailto:bestellungen@karmakiosk.example?subject=Neue%20Bestellung&body=" + body;
   });
   ```
2. In `impressum.html` deine Bankverbindung bzw. PayPal-Adresse ergänzen.
3. Versand der Download-Links erfolgt dann manuell per E-Mail.

✅ Sofort nutzbar, ❌ keine Automatisierung, kein Kartenzahlungs-Anbieter.

---

## Weg 2: PayPal-Kaufen-Buttons pro Angebot (ohne eigenes Backend)

PayPal bietet statische Buttons für einzelne Artikel – für den Start am einfachsten.

1. Bei PayPal ein Geschäftskonto anlegen: https://www.paypal.com/de/business
2. Für jedes Angebot unter *Zahlungsbuttons* einen „Kaufen“-Button erstellen
   (Artikelname + Preis eintragen).
3. Den erzeugten HTML-Snippet (ein `<form>` mit dem Button) in `templates` /
   `index.html` bzw. in die Angebotskarte einbauen – z. B. in `js/shop.js`
   in der Funktion `offerCard()` unter dem Preis ergänzen.
4. Der Kunde klickt auf „Kaufen“ → PayPal übernimmt Zahlung und Adresse.

✅ Echte Zahlungen ohne Server, ❌ nur Einzelpreise (kein ganzer Warenkorb
auf einmal), keine Download-Automatik.

---

## Weg 3: Checkout-API (Stripe, PayPal, Mollie) mit Backend – der professionelle Weg

Voraussetzung: die **Flask-Version** des Shops
([online-shop](https://github.com/mfrei91/online-shop)) auf einem Server
(z. B. Raspberry Pi, VPS, Render, Railway).

### 3.1 Anbieter wählen

| Anbieter | Gut für | Gebühren (ca.) | Link |
|---|---|---|---|
| **Stripe** | Karten, Apple/Google Pay, viele Währungen | 1,5 % + 0,25 € | https://stripe.com/de |
| **PayPal Commerce** | PayPal, Karten, Rechnung (Klarna etc.) | ~2 % variabel | https://developer.paypal.com |
| **Mollie** | EU-Starter, SEPA, Giropay, Klarna | 0,25 €–2 % | https://www.mollie.com/de |
| **Braintree / Adyen** | größere Shops | verhandelbar | https://www.braintreepayments.com |

### 3.2 Grundsätzlicher Ablauf (am Beispiel Stripe Checkout)

```
Browser                      Dein Flask-Server                Stripe
   │  „Zur Kasse“ ─────────────►│
   │                            │  Session mit Warenkorb anlegen ──►│
   │                            │  ◄── URL zur Bezahlseite
   │  ◄── Weiterleitung zur Bezahlseite
   │────────── Kunde zahlt bei Stripe ───────────────────────►│
   │                            │  ◄── Webhook „payment.succeeded“
   │                            │  Download-Freischaltung / E-Mail
```

1. **Konto + Schlüssel:** Beim Anbieter Konto anlegen, API-Key holen
   (Test-Key zuerst). Key als Umgebungsvariable setzen, z. B.:
   ```bash
   export STRIPE_SECRET_KEY="sk_test_..."
   ```
   **Nie fest in den Code schreiben, nie in Git committen.**
2. **Server-Bibliothek installieren:**
   ```bash
   pip install stripe
   ```
3. **Route für den Checkout** (Flask, stark vereinfacht):
   ```python
   import stripe, os
   from flask import request

   stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

   @app.route("/checkout", methods=["POST"])
   def checkout():
       items = [...]  # Warenkorb aus der Session lesen
       session = stripe.checkout.Session.create(
           mode="payment",
           line_items=[{
               "price_data": {
                   "currency": "eur",
                   "product_data": {"name": item["title"]},
                   "unit_amount": int(item["price"] * 100),
               },
               "quantity": item["qty"],
           } for item in items],
           success_url="https://dein-shop.example/erfolg",
           cancel_url="https://dein-shop.example/abbruch",
       )
       return redirect(session.url)
   ```
4. **Webhook für die Bestätigung** einrichten (nie dem Browser vertrauen –
   nur der Webhook bestätigt verlässlich, dass bezahlt wurde). Beim Empfang
   die Downloads freischalten und die Bestellung speichern.
5. **Umfeld beachten:** Impressum, AGB/Widerrufsbelehrung (Download-Artikel
   ggf. vom Widerruf ausgenommen – Klausel nötig), Datenschutzerklärung um
   Zahlungsdaten-Verarbeitung ergänzen, ggf. Kleinunternehmerregelung prüfen.

---

## Zusammenfassung

| Ziel | Empfohlener Weg |
|---|---|
| Schnell starten, wenige Artikel | Weg 2 (PayPal-Buttons) oder Weg 1 (E-Mail/Überweisung) |
| Ganzer Warenkorb, Karten, Automatik | Weg 3 – Flask-Version + Stripe/Mollie/PayPal-API |

Für Weg 3 steht mit der Flask-Version bereits die Basis bereit; Warenkorb,
Nutzerkonten und Admin-Oberfläche müssen dann serverseitig erweitert werden.
