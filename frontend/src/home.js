const API_ROOM = "http://localhost:5000/api";
const user = localStorage.getItem("user");
const token = localStorage.getItem("token");

if (!user || !token) window.location.href = "index.html";

document.getElementById("username-display").innerText = user;

const Home = {
    // CORRECCIÓN: Recibimos 'btn' como argumento
    createRoom: async (btn) => {
        const type = document.getElementById("filter-type").value;
        const price = document.getElementById("filter-price").value;
        
        // Efecto visual de carga
        const originalText = btn.innerText;
        btn.innerText = "Creando...";
        btn.disabled = true;

        try {
            const res = await fetch(`${API_ROOM}/create-room`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    username: user, 
                    filters: { type, price } 
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                // Redirigir como anfitrión
                window.location.href = `game.html?code=${data.roomCode}&isHost=true`;
            } else {
                alert("Error al crear la sala");
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    createFavoritesRoom: async (btn) => {
        const originalText = btn.innerText;
        btn.innerText = "Cargando...";
        btn.disabled = true;

        try {
            const resUser = await fetch(`${API_ROOM}/auth/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profile = await resUser.json();

            if (!profile.favorites || profile.favorites.length === 0) {
                btn.innerText = originalText;
                btn.disabled = false;
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
                 btn.innerText = originalText;
                 btn.disabled = false;
            }

        } catch (e) {
            console.error(e);
            alert("Error al acceder a tus favoritos");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    joinRoom: async (btn) => {
        const codeInput = document.getElementById("room-code");
        const code = codeInput.value.trim().toUpperCase();

        if (!code) return alert("Introduce un código de sala");
        
        const originalText = btn.innerText;
        btn.innerText = "Entrando...";
        btn.disabled = true;

        try {
            const res = await fetch(`${API_ROOM}/join-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user, code })
            });

            const data = await res.json();
            
            if (data.success) {
                // Redirigir como invitado (isHost=false)
                window.location.href = `game.html?code=${code}&isHost=false`;
            } else {
                alert(data.error || "No se pudo entrar a la sala");
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
};