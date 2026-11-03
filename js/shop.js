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
    const LS_CART = "karmakiosk.cart";

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

    function validatePassword(pw) {
        if (!pw || pw.length < 12) return "Das Passwort muss mindestens 12 Zeichen haben.";
        if (!/[A-Z]/.test(pw)) return "Das Passwort muss mindestens 1 Großbuchstaben enthalten.";
        if (!/[^A-Za-z0-9]/.test(pw)) return "Das Passwort muss mindestens 1 Sonderzeichen enthalten (z. B. ! ? # $ %).";
        return null;
    }

    function effectivePrice(offer) {
        const d = Math.max(0, Math.min(100, Number(offer.discount) || 0));
        if (d <= 0) return offer.price;
        return Math.round(offer.price * (100 - d)) / 100;
    }

    const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    function base32Decode(str) {
        const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, "");
        let bits = "";
        for (let i = 0; i < clean.length; i++) {
            bits += B32.indexOf(clean[i]).toString(2).padStart(5, "0");
        }
        const out = [];
        for (let i = 0; i + 8 <= bits.length; i += 8) {
            out.push(parseInt(bits.substr(i, 8), 2));
        }
        return new Uint8Array(out);
    }

    function base32Encode(bytes) {
        let bits = "";
        for (let i = 0; i < bytes.length; i++) {
            bits += bytes[i].toString(2).padStart(8, "0");
        }
        let out = "";
        for (let i = 0; i + 5 <= bits.length; i += 5) {
            out += B32[parseInt(bits.substr(i, 5), 2)];
        }
        return out;
    }

    function generateTotpSecret() {
        const bytes = new Uint8Array(20);
        crypto.getRandomValues(bytes);
        return base32Encode(bytes);
    }

    async function totpCode(secret, stepOffset) {
        const step = Math.floor(Date.now() / 30000) + (stepOffset || 0);
        const msg = new Uint8Array(8);
        let c = step;
        for (let i = 7; i >= 0; i--) {
            msg[i] = c & 0xff;
            c = Math.floor(c / 256);
        }
        const key = await crypto.subtle.importKey(
            "raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
        );
        const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
        const off = sig[sig.length - 1] & 0x0f;
        const bin = ((sig[off] & 0x7f) << 24) | (sig[off + 1] << 16) | (sig[off + 2] << 8) | sig[off + 3];
        return String(bin % 1000000).padStart(6, "0");
    }

    async function verifyTotp(secret, code) {
        const entered = String(code).replace(/[\s-]/g, "");
        if (!/^\d{6}$/.test(entered)) return false;
        for (const w of [0, -1, 1]) {
            if (await totpCode(secret, w) === entered) return true;
        }
        return false;
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

    function cart() {
        const stored = read(LS_CART, []);
        const all = offers();
        return stored
            .map(function (entry) {
                const offer = all.find(function (o) { return o.id === entry.id; });
                return { id: entry.id, qty: entry.qty, offer: offer || null };
            })
            .filter(function (entry) { return entry.offer && entry.offer.active; });
    }

    function saveCartIds(list) {
        write(LS_CART, list.map(function (entry) { return { id: entry.id, qty: entry.qty }; }));
    }

    function addToCart(offerId) {
        const stored = read(LS_CART, []);
        const entry = stored.find(function (e) { return e.id === offerId; });
        if (entry) {
            entry.qty += 1;
        } else {
            stored.push({ id: offerId, qty: 1 });
        }
        write(LS_CART, stored);
        updateCartCounts();
    }

    function setCartQty(offerId, qty) {
        let stored = read(LS_CART, []);
        const entry = stored.find(function (e) { return e.id === offerId; });
        if (!entry) return;
        if (qty <= 0) {
            stored = stored.filter(function (e) { return e.id !== offerId; });
        } else {
            entry.qty = qty;
        }
        write(LS_CART, stored);
    }

    function cartCount() {
        return cart().reduce(function (sum, e) { return sum + e.qty; }, 0);
    }

    function updateCartCounts() {
        document.querySelectorAll(".cart-count").forEach(function (el) {
            el.textContent = cartCount();
        });
    }

    function checkCredentials(username, password) {
        const user = users().find(function (u) { return u.username === username; });
        if (!user || user.password !== hashPassword(password)) return null;
        return user;
    }

    function createSession(user) {
        write(LS_SESSION, { id: user.id, username: user.username });
    }

    function login(username, password) {
        const user = checkCredentials(username, password);
        if (!user) return null;
        createSession(user);
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
        if (navLogout && !navLogout.dataset.bound) {
            navLogout.dataset.bound = "1";
            navLogout.addEventListener("click", logout);
        }
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

    function priceHtml(offer) {
        const discount = Math.max(0, Math.min(100, Number(offer.discount) || 0));
        if (discount > 0) {
            return '<div class="price-block">' +
                '<span class="discount-line">-' + discount + '% <s>' + priceDisplay(offer.price) + "</s></span>" +
                '<span class="price">' + priceDisplay(effectivePrice(offer)) + "</span>" +
                "</div>";
        }
        return '<span class="price">' + priceDisplay(effectivePrice(offer)) + "</span>";
    }

    function offerCard(offer) {
        const imageHtml = offer.image
            ? '<div class="offer-image"><img src="' + offer.image + '" alt="' + escapeHtml(offer.title) + '"></div>'
            : '<div class="offer-image offer-image--' + offer.category + '">' + escapeHtml(offer.emoji) + "</div>";
        return '<article class="offer-card">' +
            imageHtml +
            '<div class="offer-body">' +
            '<span class="offer-category">' + escapeHtml(offer.category) + "</span>" +
            "<h3>" + escapeHtml(offer.title) + "</h3>" +
            "<p>" + escapeHtml(offer.description) + "</p>" +
            '<div class="offer-footer">' +
            priceHtml(offer) +
            '<button class="btn btn-small" data-add="' + offer.id + '">In den Warenkorb 🧺</button>' +
            "</div></div></article>";
    }

    function renderIndex() {
        const grid = document.getElementById("offer-grid");
        const popularGrid = document.getElementById("popular-grid");
        if (!grid) return;

        const activeTab = document.querySelector(".karmakiosk-navigation a.active");
        const cat = activeTab ? (activeTab.getAttribute("data-cat") || "") : "";
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
        const nav = document.querySelector(".karmakiosk-navigation");
        if (nav) {
            nav.addEventListener("click", function (e) {
                const a = e.target.closest("a");
                if (!a) return;
                e.preventDefault();
                nav.querySelectorAll("a").forEach(function (t) { t.classList.remove("active"); });
                a.classList.add("active");
                renderIndex();
            });
        }
        const grid = document.getElementById("offer-grid");
        const popularGrid = document.getElementById("popular-grid");
        [grid, popularGrid].forEach(function (container) {
            if (!container) return;
            container.addEventListener("click", function (e) {
                const btn = e.target.closest("[data-add]");
                if (!btn) return;
                addToCart(parseInt(btn.getAttribute("data-add"), 10));
                btn.textContent = "Hinzugefügt ✓";
                setTimeout(function () { btn.textContent = "In den Warenkorb 🧺"; }, 1200);
            });
        });
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
        checkCredentials: checkCredentials,
        createSession: createSession,
        register: register,
        logout: logout,
        hashPassword: hashPassword,
        validatePassword: validatePassword,
        effectivePrice: effectivePrice,
        priceHtml: priceHtml,
        generateTotpSecret: generateTotpSecret,
        verifyTotp: verifyTotp,
        cart: cart,
        addToCart: addToCart,
        setCartQty: setCartQty,
        cartCount: cartCount,
        updateCartCounts: updateCartCounts,
        updateNav: updateNav,
        renderIndex: renderIndex,
        initIndex: initIndex,
        escapeHtml: escapeHtml,
        priceDisplay: priceDisplay
    };

    updateNav();
    updateCartCounts();
    initIndex();
})();
