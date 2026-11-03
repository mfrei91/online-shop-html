(function () {
    "use strict";

    const user = Shop.currentUser();

    function guard() {
        if (!user || user.role !== "admin") {
            document.getElementById("admin-content").style.display = "none";
            document.getElementById("no-access").style.display = "";
            return false;
        }
        return true;
    }

    let currentImage = null;

    function resizeImage(file, callback) {
        const reader = new FileReader();
        reader.onload = function () {
            const img = new Image();
            img.onload = function () {
                const max = 800;
                let w = img.width, h = img.height;
                if (w > max || h > max) {
                    if (w > h) { h = Math.round(h * max / w); w = max; }
                    else { w = Math.round(w * max / h); h = max; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                callback(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function showImagePreview(dataUrl) {
        const wrap = document.getElementById("image-preview");
        if (dataUrl) {
            document.getElementById("image-preview-img").src = dataUrl;
            wrap.style.display = "";
        } else {
            wrap.style.display = "none";
        }
    }

    function parsePrice(value) {
        const n = parseFloat(String(value).replace(",", ".").replace("€", "").trim());
        return isNaN(n) ? 0 : Math.round(n * 100) / 100;
    }

    function renderOffers() {
        const tbody = document.getElementById("offers-tbody");
        const rows = Shop.offers().map(function (o) {
            const status =
                '<span class="badge ' + (o.active ? "badge-green" : "badge-gray") + '">' + (o.active ? "aktiv" : "inaktiv") + "</span>" +
                (o.popular ? ' <span class="badge badge-orange">beliebt</span>' : "");
            return "<tr><td>" + Shop.escapeHtml(o.emoji) + " " + Shop.escapeHtml(o.title) + (o.image ? " 🖼️" : "") + "</td>" +
                "<td>" + Shop.escapeHtml(o.category) + "</td>" +
                "<td>" + Shop.priceDisplay(o.price) + "</td>" +
                "<td>" + status + "</td>" +
                '<td class="actions"><button class="btn btn-small" data-edit="' + o.id + '">Bearbeiten</button></td></tr>';
        }).join("");
        tbody.innerHTML = rows || '<tr><td colspan="5" class="empty">Noch keine Angebote vorhanden.</td></tr>';
        tbody.querySelectorAll("[data-edit]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                openOfferForm(parseInt(btn.getAttribute("data-edit"), 10));
            });
        });
    }

    function renderUsers() {
        const tbody = document.getElementById("users-tbody");
        const rows = Shop.users().map(function (u) {
            const role = '<span class="badge ' + (u.role === "admin" ? "badge-orange" : "badge-gray") + '">' + u.role + "</span>";
            const self = u.id === user.id;
            const roleBtn = self
                ? '<button class="btn btn-small" disabled title="Du kannst dir nicht selbst die Admin-Rolle entziehen">Rolle</button>'
                : '<button class="btn btn-small" data-role="' + u.id + '">' + (u.role === "admin" ? "Zu Benutzer" : "Zu Admin") + "</button>";
            const delBtn = self
                ? '<button class="btn btn-small btn-danger" disabled title="Du kannst dein eigenes Konto nicht löschen">Löschen</button>'
                : '<button class="btn btn-small btn-danger" data-del="' + u.id + '">Löschen</button>';
            return "<tr><td>" + Shop.escapeHtml(u.username) + "</td>" +
                "<td>" + Shop.escapeHtml(u.email) + "</td>" +
                "<td>" + role + "</td>" +
                '<td class="actions">' + roleBtn + delBtn + "</td></tr>";
        }).join("");
        tbody.innerHTML = rows;
        tbody.querySelectorAll("[data-role]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const id = parseInt(btn.getAttribute("data-role"), 10);
                const list = Shop.users();
                const u = list.find(function (x) { return x.id === id; });
                if (u && confirm("Rolle von „" + u.username + "“ ändern?")) {
                    u.role = u.role === "admin" ? "user" : "admin";
                    Shop.saveUsers(list);
                    renderUsers();
                }
            });
        });
        tbody.querySelectorAll("[data-del]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const id = parseInt(btn.getAttribute("data-del"), 10);
                const list = Shop.users();
                const u = list.find(function (x) { return x.id === id; });
                if (u && confirm("Benutzer „" + u.username + "“ wirklich löschen?")) {
                    Shop.saveUsers(list.filter(function (x) { return x.id !== id; }));
                    renderUsers();
                }
            });
        });
    }

    function openOfferForm(offerId) {
        const form = document.getElementById("offer-form");
        form.reset();
        document.getElementById("offer-id").value = "";
        document.getElementById("offer-delete").style.display = "none";
        document.getElementById("offer-form-title").textContent = "Neues Angebot";
        document.getElementById("offer-emoji").value = "🔮";
        document.getElementById("offer-active").checked = true;
        currentImage = null;
        showImagePreview(null);

        if (offerId) {
            const o = Shop.offers().find(function (x) { return x.id === offerId; });
            if (!o) return;
            document.getElementById("offer-form-title").textContent = "„" + o.title + "“ bearbeiten";
            document.getElementById("offer-id").value = o.id;
            document.getElementById("offer-title").value = o.title;
            document.getElementById("offer-description").value = o.description;
            document.getElementById("offer-price").value = o.price.toFixed(2).replace(".", ",");
            document.getElementById("offer-category").value = o.category;
            document.getElementById("offer-emoji").value = o.emoji;
            document.getElementById("offer-popular").checked = o.popular;
            document.getElementById("offer-active").checked = o.active;
            currentImage = o.image || null;
            showImagePreview(currentImage);
            document.getElementById("offer-delete").style.display = "";
        }
        document.getElementById("offer-form-card").style.display = "";
        document.getElementById("offer-form-card").scrollIntoView({ behavior: "smooth" });
    }

    function saveOffer(e) {
        e.preventDefault();
        const imageInput = document.getElementById("offer-image");
        if (imageInput.files && imageInput.files[0]) {
            resizeImage(imageInput.files[0], function (dataUrl) {
                currentImage = dataUrl;
                imageInput.value = "";
                doSaveOffer();
            });
        } else {
            doSaveOffer();
        }
    }

    function doSaveOffer() {
        e.preventDefault();
        const list = Shop.offers();
        const id = document.getElementById("offer-id").value;
        const data = {
            title: document.getElementById("offer-title").value.trim(),
            description: document.getElementById("offer-description").value.trim(),
            price: parsePrice(document.getElementById("offer-price").value),
            category: document.getElementById("offer-category").value,
            emoji: document.getElementById("offer-emoji").value.trim() || "🔮",
            popular: document.getElementById("offer-popular").checked,
            active: document.getElementById("offer-active").checked,
            image: currentImage
        };
        if (!data.title) {
            alert("Bitte einen Titel angeben.");
            return;
        }
        if (id) {
            const o = list.find(function (x) { return x.id === parseInt(id, 10); });
            Object.assign(o, data);
        } else {
            data.id = list.reduce(function (m, o) { return Math.max(m, o.id); }, 0) + 1;
            list.push(data);
        }
        Shop.saveOffers(list);
        closeOfferForm();
        renderOffers();
        Shop.renderIndex();
    }

    function deleteOffer() {
        const id = parseInt(document.getElementById("offer-id").value, 10);
        if (!id || !confirm("Angebot wirklich entfernen?")) return;
        Shop.saveOffers(Shop.offers().filter(function (o) { return o.id !== id; }));
        closeOfferForm();
        renderOffers();
        Shop.renderIndex();
    }

    function closeOfferForm() {
        document.getElementById("offer-form-card").style.display = "none";
    }

    function initTabs() {
        const tabs = document.querySelectorAll(".tabs .tab[data-tab]");
        tabs.forEach(function (tab) {
            tab.addEventListener("click", function (e) {
                e.preventDefault();
                tabs.forEach(function (t) { t.classList.remove("active"); });
                tab.classList.add("active");
                const name = tab.getAttribute("data-tab");
                document.getElementById("panel-offers").style.display = name === "offers" ? "" : "none";
                document.getElementById("panel-users").style.display = name === "users" ? "" : "none";
            });
        });
    }

    if (!guard()) return;

    document.getElementById("offer-image").addEventListener("change", function () {
        const f = this.files && this.files[0];
        if (!f) return;
        const self = this;
        resizeImage(f, function (dataUrl) {
            currentImage = dataUrl;
            showImagePreview(dataUrl);
            self.value = "";
        });
    });
    document.getElementById("image-remove").addEventListener("click", function () {
        currentImage = null;
        showImagePreview(null);
    });

    document.getElementById("btn-new-offer").addEventListener("click", function () { openOfferForm(null); });
    document.getElementById("offer-form").addEventListener("submit", saveOffer);
    document.getElementById("offer-cancel").addEventListener("click", closeOfferForm);
    document.getElementById("offer-delete").addEventListener("click", deleteOffer);

    initTabs();
    renderOffers();
    renderUsers();
})();
