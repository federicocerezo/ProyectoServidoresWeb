const API_ROOM = "http://localhost:5000/api";
const user = localStorage.getItem("user");
const token = localStorage.getItem("token");

if (!user || !token) window.location.href = "index.html";

document.getElementById("username-display").innerText = user;

// Cargar Historial
const userData = JSON.parse(localStorage.getItem("userData") || "{}");
const historyList = document.getElementById("history-list");

if(userData.history && userData.history.length > 0) {
    // Mostramos los últimos primero
    const reversedHistory = [...userData.history].reverse();
    historyList.innerHTML = reversedHistory.map(h => 
        `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
            <span>🍔 <b>${h.name}</b></span>
            <small style="color:#999">${new Date(h.date).toLocaleDateString()}</small>
        </div>`
    ).join("");
} else {
    historyList.innerHTML = "<p style='color:#999; text-align:center;'>No tienes historial reciente.</p>";
}

const Home = {
    createRoom: async () => {
        const type = document.getElementById("filter-type").value;
        const price = document.getElementById("filter-price").value;
        const btn = event.target; // Para efecto visual
        
        btn.innerText = "Creando...";
        btn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/create-room`, {
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
                btn.innerText = "Crear Nueva Sala";
                btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
            btn.disabled = false;
        }
    },

    joinRoom: async () => {
        const codeInput = document.getElementById("room-code");
        const code = codeInput.value.trim().toUpperCase();

        if (!code) return alert("Introduce un código de sala");

        try {
            const res = await fetch(`${API_URL}/join-room`, {
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
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    },
    
    createFavoritesRoom: async () => {
        // Primero obtenemos los favoritos actualizados del usuario
        try {
            const resUser = await fetch(`${API_URL}/auth/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profile = await resUser.json();

            if (!profile.favorites || profile.favorites.length === 0) {
                return alert("⚠️ No tienes favoritos guardados. ¡Juega una partida y da 'Like' a alguno!");
            }

            // Creamos la sala enviando la lista de IDs permitidos
            const res = await fetch(`${API_URL}/create-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: user, 
                    allowedIds: profile.favorites.map(Number) // Aseguramos que son números
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                window.location.href = `game.html?code=${data.roomCode}&isHost=true`;
            }

        } catch (e) {
            console.error(e);
            alert("Error al acceder a tus favoritos");
        }
    }
};