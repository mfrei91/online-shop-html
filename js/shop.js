(function () {
    "use strict";

    const DEFAULT_OFFERS = [
        { id: 1, title: "Liebes-Tarot", description: "Drei-Karten-Legung zu Liebe & Partnerschaft als PDF-Download.", price: 9.99, category: "Kartenlegungen", emoji: "🃏", popular: true, active: true },
        { id: 2, title: "Jahreslegung", description: "12 Karten für deine 12 Monate – ausführliche Deutung.", price: 19.99, category: "Kartenlegungen", emoji: "🎴", popular: true, active: true },
        { id: 3, title: "Keltenkreuz", description: "Die klassische Großlegung für tiefe Fragen.", price: 14.99, category: "Kartenlegungen", emoji: "🌙", popular: false, active: true },
        { id: 4, title: "Glückszauber", description: "Anleitung & Zutatenliste für dein eigenes Glücksamulett.", price: 7.99, category: "Zauber", emoji: "✨", popular: true, active: true },
        { id: 5, title: "Schutzritual", description: "Kraftvolles Schutzritual für Zuhause, mit Anleitung.", price: 12.99, category: "Rituale", emoji: "🕯️", popular: true, active: true },
        { id: 6, title: "Vollmond-Ritual", description: "Manifestationsritual zum nächsten Vollmond.", price: 11.99, category: "Rituale", emoji: "🌕", popular: false, active: true },
        { id: 7, title: "Reinigungszauber", description: "Aura-Reinigung mit Salbei & Klangschale – Schritt-für-Schritt.", price: 8.99, category: "Zauber", emoji: "🧿", popular: false, active: true }
    ];

    const CATEGORIES = ["Kartenlegungen", "Zauber", "Rituale"];
    const LS_USERS = "karmakiosk.users";
    const LS_OFFERS = "karmakiosk.offers";
    const LS_SESSION = "karmakiosk.session";

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function hashPassword(password) {
        let h = 5381;
        for (let i = 0; i < password.length; i++) {
            h = ((h << 5) + h + password.charCodeAt(i)) >>> 0;
        }
        return "k" + h.toString(16);
    }

    function seed() {
        if (!localStorage.getItem(LS_USERS)) {
            write(LS_USERS, [
                { id: 1, username: "admin", email: "admin@karmakiosk.shop", password: hashPassword("karmakiosk123"), role: "admin" }
            ]);
        }
        if (!localStorage.getItem(LS_OFFERS)) {
            write(LS_OFFERS, DEFAULT_OFFERS);
        }
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function priceDisplay(p) {
        return p.toFixed(2).replace(".", ",") + " €";
    }

    function offers() {
        return read(LS_OFFERS, DEFAULT_OFFERS);
    }

    function saveOffers(list) {
        write(LS_OFFERS, list);
    }

    function users() {
        return read(LS_USERS, []);
    }

    function saveUsers(list) {
        write(LS_USERS, list);
    }

    function session() {
        return read(LS_SESSION, null);
    }

    function currentUser() {
        const s = session();
        if (!s) return null;
        return users().find(function (u) { return u.id === s.id; }) || null;
    }

    function login(username, password) {
        const user = users().find(function (u) { return u.username === username; });
        if (!user || user.password !== hashPassword(password)) return null;
        write(LS_SESSION, { id: user.id, username: user.username });
        return user;
    }

    function register(username, email, password) {
        const list = users();
        if (list.some(function (u) { return u.username === username || u.email === email; })) {
            return { error: "Benutzername oder E-Mail ist bereits vergeben." };
        }
        const user = {
            id: list.reduce(function (m, u) { return Math.max(m, u.id); }, 0) + 1,
            username: username,
            email: email,
            password: hashPassword(password),
            role: "user"
        };
        list.push(user);
        saveUsers(list);
        write(LS_SESSION, { id: user.id, username: user.username });
        return { user: user };
    }

    function logout() {
        localStorage.removeItem(LS_SESSION);
        window.location.href = "index.html";
    }

    function updateNav() {
        const user = currentUser();
        const navLogin = document.getElementById("nav-login");
        const navRegister = document.getElementById("nav-register");
        const navAdmin = document.getElementById("nav-admin");
        const navUser = document.getElementById("nav-user");
        const navLogout = document.getElementById("nav-logout");
        if (!navLogin) return;
        if (user) {
            navLogin.style.display = "none";
            navRegister.style.display = "none";
            navUser.style.display = "";
            navUser.textContent = "👤 " + user.username;
            navLogout.style.display = "";
            if (user.role === "admin") navAdmin.style.display = "";
        } else {
            navLogin.style.display = "";
            navRegister.style.display = "";
        }
    }

    function offerCard(offer) {
        return '<article class="offer-card">' +
            '<div class="offer-image offer-image--' + offer.category + '">' + escapeHtml(offer.emoji) + "</div>" +
            '<div class="offer-body">' +
            '<span class="offer-category">' + escapeHtml(offer.category) + "</span>" +
            "<h3>" + escapeHtml(offer.title) + "</h3>" +
            "<p>" + escapeHtml(offer.description) + "</p>" +
            '<div class="offer-footer">' +
            '<span class="price">' + priceDisplay(offer.price) + "</span>" +
            '<a class="btn btn-small" href="#">In den Warenkorb 🧺</a>' +
            "</div></div></article>";
    }

    function renderIndex() {
        const grid = document.getElementById("offer-grid");
        const popularGrid = document.getElementById("popular-grid");
        if (!grid) return;

        const activeTab = document.querySelector("#category-tabs .tab.active");
        const cat = activeTab ? activeTab.getAttribute("data-cat") : "";
        const all = offers().filter(function (o) { return o.active; });
        const list = cat ? all.filter(function (o) { return o.category === cat; }) : all;

        document.getElementById("offer-heading").textContent = cat || "Alle Angebote";
        grid.innerHTML = list.map(offerCard).join("");
        document.getElementById("offer-empty").style.display = list.length ? "none" : "";

        const popular = all.filter(function (o) { return o.popular; });
        document.getElementById("popular-section").style.display = popular.length ? "" : "none";
        popularGrid.innerHTML = popular.map(offerCard).join("");
    }

    function initIndex() {
        const tabs = document.getElementById("category-tabs");
        if (tabs) {
            tabs.addEventListener("click", function (e) {
                const a = e.target.closest(".tab");
                if (!a) return;
                e.preventDefault();
                tabs.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
                a.classList.add("active");
                renderIndex();
            });
        }
        renderIndex();
    }

    seed();

    window.Shop = {
        CATEGORIES: CATEGORIES,
        offers: offers,
        saveOffers: saveOffers,
        users: users,
        saveUsers: saveUsers,
        currentUser: currentUser,
        login: login,
        register: register,
        logout: logout,
        hashPassword: hashPassword,
        updateNav: updateNav,
        renderIndex: renderIndex,
        initIndex: initIndex,
        escapeHtml: escapeHtml,
        priceDisplay: priceDisplay
    };

    updateNav();
    initIndex();
})();
