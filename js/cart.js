(function () {
    "use strict";

    const tbody = document.getElementById("cart-tbody");

    function renderCart() {
        const items = Shop.cart();
        const empty = document.getElementById("cart-empty");
        const summary = document.getElementById("cart-summary");
        const table = document.getElementById("cart-table");

        Shop.updateCartCounts();

        if (!items.length) {
            table.style.display = "none";
            summary.style.display = "none";
            empty.style.display = "";
            return;
        }

        table.style.display = "";
        summary.style.display = "";
        empty.style.display = "none";

        let total = 0;
        tbody.innerHTML = items.map(function (item) {
            const o = item.offer;
            const unit = Shop.effectivePrice(o);
            const line = unit * item.qty;
            total += line;
            return "<tr><td>" + Shop.escapeHtml(o.emoji) + " " + Shop.escapeHtml(o.title) + "</td>" +
                "<td>" + Shop.escapeHtml(o.category) + "</td>" +
                "<td>" + Shop.priceDisplay(unit) + "</td>" +
                '<td class="qty-controls">' +
                '<button class="btn btn-small" data-qty="' + o.id + '" data-delta="-1">−</button> ' +
                "<strong>" + item.qty + "</strong> " +
                '<button class="btn btn-small" data-qty="' + o.id + '" data-delta="1">＋</button>' +
                "</td>" +
                "<td>" + Shop.priceDisplay(line) + "</td>" +
                '<td><button class="btn btn-small btn-danger" data-remove="' + o.id + '">Entfernen</button></td></tr>';
        }).join("");

        document.getElementById("cart-total").textContent = Shop.priceDisplay(total);
    }

    tbody.addEventListener("click", function (e) {
        const qtyBtn = e.target.closest("[data-qty]");
        const rmBtn = e.target.closest("[data-remove]");
        if (qtyBtn) {
            const id = parseInt(qtyBtn.getAttribute("data-qty"), 10);
            const delta = parseInt(qtyBtn.getAttribute("data-delta"), 10);
            const items = Shop.cart();
            const item = items.find(function (i) { return i.id === id; });
            if (item) {
                Shop.setCartQty(id, item.qty + delta);
                renderCart();
            }
        } else if (rmBtn) {
            const id = parseInt(rmBtn.getAttribute("data-remove"), 10);
            Shop.setCartQty(id, 0);
            renderCart();
        }
    });

    document.getElementById("checkout-btn").addEventListener("click", function () {
        alert("🧾 Die Kasse ist in der reinen HTML-Version eine Demo – Zahlungsanbieter werden nicht direkt angebunden.\\n\\n" +
            "Eine Schritt-für-Schritt-Anleitung zur Anbindung (PayPal, Stripe, Mollie, Überweisung) findest du in docs/ZAHLUNGSANBIETER.md.");
    });

    renderCart();
})();
