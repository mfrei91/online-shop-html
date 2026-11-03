(function () {
    "use strict";

    const LS_CONSENT = "karmakiosk.consent";

    function consentGiven() {
        try {
            return localStorage.getItem(LS_CONSENT) === "ok";
        } catch (e) {
            return true;
        }
    }

    function setConsent(value) {
        try {
            localStorage.setItem(LS_CONSENT, value);
        } catch (e) { /* Speicher blockiert */ }
    }

    function createBanner() {
        const banner = document.createElement("div");
        banner.className = "cookie-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-label", "Hinweis zu Cookies und lokalem Speicher");
        banner.innerHTML =
            "<p>🌙 Wir nutzen <strong>keine Tracking-Cookies</strong> – nur den lokalen Speicher deines Browsers " +
            "für Warenkorb &amp; Anmeldung. Details: <a href=\"cookies.html\">Cookie-Richtlinie</a>.</p>" +
            '<div class="cookie-actions">' +
            '<button class="btn btn-small" id="cookie-ok">Verstanden</button>' +
            '<button class="btn btn-small btn-outline" id="cookie-more">Mehr erfahren</button>' +
            "</div>";
        document.body.appendChild(banner);

        banner.querySelector("#cookie-ok").addEventListener("click", function () {
            setConsent("ok");
            banner.remove();
        });
        banner.querySelector("#cookie-more").addEventListener("click", function () {
            window.location.href = "cookies.html";
        });
    }

    function initClearButton() {
        const btn = document.getElementById("btn-clear-storage");
        if (!btn) return;
        btn.addEventListener("click", function () {
            if (!confirm("Wirklich alle auf diesem Gerät gespeicherten Shop-Daten löschen (Warenkorb, Anmeldung, Demo-Konten und Angebote)?")) return;
            try {
                Object.keys(localStorage)
                    .filter(function (k) { return k.indexOf("karmakiosk.") === 0; })
                    .forEach(function (k) { localStorage.removeItem(k); });
            } catch (e) { /* ignore */ }
            window.location.href = "index.html";
        });
    }

    if (!consentGiven()) {
        createBanner();
    }
    initClearButton();
})();
