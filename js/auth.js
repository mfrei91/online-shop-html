(function () {
    "use strict";

    function showError(id, msg) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = msg;
            el.style.display = "";
        }
    }

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const user = Shop.checkCredentials(
                document.getElementById("username").value.trim(),
                document.getElementById("password").value
            );
            if (!user) {
                showError("login-error", "Benutzername oder Passwort ist falsch.");
                return;
            }
            if (user.twofa && user.totpSecret) {
                const code = prompt("🔐 2FA: Bitte gib den 6-stelligen Code aus deiner Authenticator-App ein:");
                const ok = code !== null && await Shop.verifyTotp(user.totpSecret, code);
                if (!ok) {
                    showError("login-error", "Der 2FA-Code ist falsch oder abgelaufen.");
                    return;
                }
            }
            Shop.createSession(user);
            window.location.href = user.role === "admin" ? "admin.html" : "index.html";
        });
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim().toLowerCase();
            const password = document.getElementById("password").value;
            const pwError = Shop.validatePassword(password);
            if (pwError) {
                showError("register-error", pwError);
                return;
            }
            const result = Shop.register(username, email, password);
            if (result.error) {
                showError("register-error", result.error);
            } else {
                window.location.href = "index.html";
            }
        });
    }
})();
