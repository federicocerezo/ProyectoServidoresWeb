const API_ROOM = "http://localhost:5000/api";
const user = localStorage.getItem("user");
const token = localStorage.getItem("token");

// Validación de sesión
if (!user || !token) {
    console.warn("No hay usuario o token, redirigiendo...");
    window.location.href = "index.html";
}

if(document.getElementById("username-display")) {
    document.getElementById("username-display").innerText = user;
}

const Home = {
    createRoom: async (btn) => {
        console.log("➡️ Intento de crear sala...");
        
        // 1. Obtener valores con protección
        const typeSelect = document.getElementById("filter-type");
        const priceSelect = document.getElementById("filter-price");
        // --- CAMBIO AQUÍ: Capturar el elemento del límite ---
        const limitSelect = document.getElementById("filter-limit");
        
        const type = typeSelect ? typeSelect.value : "Any";
        const price = priceSelect ? priceSelect.value : "Any";
        // --- CAMBIO AQUÍ: Obtener el valor (default a 20 si no existe) ---
        const limit = limitSelect ? limitSelect.value : "20";
        
        console.log(`Filtros seleccionados: Tipo=${type}, Precio=${price}, Limite=${limit}`);

        // 2. Manejo visual del botón...
        let originalText = "Crear Nueva Sala";
        if (btn && btn.innerText) {
            originalText = btn.innerText;
            btn.innerText = "Creando...";
            btn.disabled = true;
        }

        try {
            console.log("📡 Enviando petición al backend...");
            const res = await fetch(`${API_ROOM}/create-room`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    username: user, 
                    // --- CAMBIO AQUÍ: Añadir limit al objeto filters ---
                    filters: { type, price, limit } 
                })
            });
            
            // ... resto del código igual ...
            const data = await res.json();
            console.log("Respuesta servidor:", data);
            
            if (data.success) {
                console.log("✅ Sala creada. Redirigiendo...");
                window.location.href = `game.html?code=${data.roomCode}&isHost=true`;
            } else {
                alert("Error al crear la sala: " + (data.error || "Desconocido"));
                if(btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        } catch (e) {
            console.error("❌ Error CRÍTICO:", e);
            alert("Error de conexión. Revisa la consola (F12).");
            if(btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    },

    createFavoritesRoom: async (btn) => {
        console.log("➡️ Intento de crear sala favoritos...");
        let originalText = "Sala Favoritos";
        if (btn) {
            originalText = btn.innerText;
            btn.innerText = "Cargando...";
            btn.disabled = true;
        }

        try {
            const resUser = await fetch(`${API_ROOM}/auth/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profile = await resUser.json();

            if (!profile.favorites || profile.favorites.length === 0) {
                if(btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
                return alert("⚠️ No tienes favoritos guardados. ¡Juega una partida y da 'Like' a alguno!");
            }

            const res = await fetch(`${API_ROOM}/create-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: user, 
                    allowedIds: profile.favorites.map(Number) 
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                window.location.href = `game.html?code=${data.roomCode}&isHost=true`;
            } else {
                 alert("Error creando sala");
                 if(btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                 }
            }

        } catch (e) {
            console.error(e);
            alert("Error al acceder a tus favoritos");
            if(btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    },

    joinRoom: async (btn) => {
        const codeInput = document.getElementById("room-code");
        const code = codeInput.value.trim().toUpperCase();

        if (!code) return alert("Introduce un código de sala");
        
        let originalText = "Entrar";
        if (btn) {
            originalText = btn.innerText;
            btn.innerText = "Entrando...";
            btn.disabled = true;
        }

        try {
            const res = await fetch(`${API_ROOM}/join-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user, code })
            });

            const data = await res.json();
            
            if (data.success) {
                window.location.href = `game.html?code=${code}&isHost=false`;
            } else {
                alert(data.error || "No se pudo entrar a la sala");
                if (btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
            if (btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    }
};