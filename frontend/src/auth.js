const API_URL = "http://localhost:5000/api/auth";
const API_BASE = "http://localhost:5000/api"; // Base para otras rutas como /restaurants

const Auth = {
    login: async () => {
        const user = document.getElementById("login-user").value;
        const pass = document.getElementById("login-pass").value;

        const res = await fetch(`${API_URL}/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", data.username);
            sessionStorage.setItem("userData", JSON.stringify(data)); 
            window.location.href = "home.html";
        } else {
            alert(data.error);
        }
    },

    register: async () => {
        const user = document.getElementById("reg-user").value;
        const pass = document.getElementById("reg-pass").value;
        
        if (!user || !pass) return alert("Rellena todos los campos");

        const res = await fetch(`${API_URL}/register`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await res.json();

        if (data.success) {
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", data.username);
            sessionStorage.setItem("userData", JSON.stringify(data)); 
            
            window.location.href = "home.html";
        } else {
            alert(data.error || "Error al registrar");
        }
    },

    logout: () => {
        sessionStorage.clear();
        window.location.href = "index.html";
    },

    // --- Funciones del Perfil (Movidas desde account.html) ---

    loadProfile: async () => {
        const token = sessionStorage.getItem("token");
        if(!token) {
            window.location.href = "index.html";
            return;
        }

        try {
            // 1. Obtener datos del usuario
            const res = await fetch(`${API_URL}/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const user = await res.json();
            
            // Pintar nombre de usuario
            const usernameDisplay = document.getElementById("acc-username");
            if (usernameDisplay) usernameDisplay.innerText = user.username;
            
            const favContainer = document.getElementById("favorites-list");
            
            // 2. Obtener y pintar favoritos
            if (favContainer) {
                if (user.favorites && user.favorites.length > 0) {
                    const resRest = await fetch(`${API_BASE}/restaurants?ids=${user.favorites.join(',')}`);
                    const myFavs = await resRest.json();
                    
                    favContainer.innerHTML = myFavs.map(r => `
                        <div class="fav-item">
                            <img src="${r.image}" class="fav-img">
                            <div style="flex: 1;">
                                <b style="font-size: 1rem;">${r.name}</b>
                                <div style="font-size: 0.8rem; color: #666;">${r.type} • ${r.price}</div>
                            </div>
                            <button onclick="Auth.removeFavorite('${r.id}')" style="background:none; border:none; cursor:pointer;">❌</button>
                        </div>
                    `).join("");
                } else {
                    favContainer.innerHTML = "<p class='text-muted'>Aún no tienes favoritos.</p>";
                }
            }
        } catch (e) { console.error("Error cargando perfil:", e); }
    },

    removeFavorite: async (id) => {
        if(!confirm("¿Borrar de favoritos?")) return;
        
        const token = sessionStorage.getItem("token");
        const currentUser = sessionStorage.getItem("user");

        try {
            const res = await fetch(`${API_URL}/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ username: currentUser, favoriteId: id.toString() })
            });
            const data = await res.json();
            if (data.success) {
                Auth.loadProfile(); // Recargar la lista
            }
        } catch (e) { console.error(e); }
    }
};

function showForm(type) {
    const btnLogin = document.getElementById('tab-login');
    const btnReg = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');

    if(type === 'login') {
        formLogin.classList.remove('hidden');
        formReg.classList.add('hidden');
        btnLogin.classList.add('active');
        btnReg.classList.remove('active');
    } else {
        formLogin.classList.add('hidden');
        formReg.classList.remove('hidden');
        btnLogin.classList.remove('active');
        btnReg.classList.add('active');
    }
}

// Inicialización automática si estamos en la página de perfil
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("favorites-list")) {
        Auth.loadProfile();
    }
});