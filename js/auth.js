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
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const user = Shop.login(
                document.getElementById("username").value.trim(),
                document.getElementById("password").value
            );
            if (user) {
                window.location.href = user.role === "admin" ? "admin.html" : "index.html";
            } else {
                showError("login-error", "Benutzername oder Passwort ist falsch.");
            }
        });
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim().toLowerCase();
            const password = document.getElementById("password").value;
            if (password.length < 6) {
                showError("register-error", "Das Passwort muss min. 6 Zeichen haben.");
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
