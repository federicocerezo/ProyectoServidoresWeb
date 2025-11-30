const params = new URLSearchParams(window.location.search);
const roomCode = params.get("code");
const isHost = params.get("isHost") === "true";
const currentUser = localStorage.getItem("user");
const API = "http://localhost:5000/api";

// Variables globales
let restaurants = []; 
let currentIndex = 0;
let isFlipped = false;
let userFavorites = new Set(); // Para guardar favoritos localmente

if (!currentUser) window.location.href = "index.html";

document.getElementById("room-code-display").innerText = roomCode;
if (isHost) document.getElementById("host-controls").classList.remove("hidden");
else document.getElementById("waiting-msg").classList.remove("hidden");

// Cargar favoritos del usuario al iniciar para pintar las estrellas
async function loadFavorites() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/auth/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.favorites) {
            userFavorites = new Set(data.favorites.map(String)); // Guardamos como strings
        }
    } catch(e) { console.error("Error cargando favoritos", e); }
}
loadFavorites();

// POLLING
const pollInterval = setInterval(async () => {
    const res = await fetch(`${API}/room/${roomCode}`);
    if(res.status === 404) { 
        alert("Sala cerrada"); 
        clearInterval(pollInterval);
        window.location.href="home.html"; 
        return; 
    }
    
    const data = await res.json();
    
    // 1. Actualizar lista participantes
    document.getElementById("participants-list").innerHTML = data.users.map(u => `<li>${u}</li>`).join("");

    // 2. CORRECCIÓN BUG RESET: Solo llamar startGameLogic si el lobby aún es visible
    // Usamos classList.contains('hidden') para verificar si ya estamos jugando
    const isLobbyHidden = document.getElementById("view-lobby").classList.contains("hidden");
    
    if (data.status === 'voting' && !isLobbyHidden) {
        // CORRECCIÓN BUG FILTROS: Pasamos 'data' entero, no 'data.filters'
        startGameLogic(data);
    }

    // 3. Detectar Match
    if (data.matches && data.matches.length > 0) {
        showMatch(data.matches[0]);
        clearInterval(pollInterval); // Parar polling
    }

    // 4. NUEVO: Detectar Game Over (Sin matches)
    if (data.gameOver) {
        showNoMatch();
        clearInterval(pollInterval);
    }

}, 3000);

const Game = {
    startVoting: async () => {
        await fetch(`${API}/start-game`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: roomCode })
        });
    },

    vote: async (liked) => {
        const rest = restaurants[currentIndex];
        if (liked) {
             await fetch(`${API}/vote`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: roomCode, restaurantId: rest.id })
            });
        }
        nextCard();
    },

    // CORRECCIÓN BUG VISTA PLANO: toggleFlip ahora solo cambia clase CSS, no recarga
    toggleFlip: () => {
        isFlipped = !isFlipped;
        document.getElementById("card-inner").classList.toggle("flipped", isFlipped);
    },

    toggleFavorite: async () => {
        const rest = restaurants[currentIndex];
        const token = localStorage.getItem("token");
        const btn = document.getElementById("btn-fav");
        
        // Feedback visual inmediato
        const isNowFav = !btn.classList.contains("active");
        btn.classList.toggle("active", isNowFav);

        // Actualizar Set local para persistencia
        if(isNowFav) userFavorites.add(String(rest.id));
        else userFavorites.delete(String(rest.id));

        await fetch(`${API}/auth/update`, {
            method: "POST", headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                username: currentUser, 
                favoriteId: rest.id.toString() 
            })
        });
    }
};

async function startGameLogic(data) {
    document.getElementById("view-lobby").classList.add("hidden");
    document.getElementById("view-swipe").classList.remove("hidden");

    let url = `${API}/restaurants?`;

    // Lógica de filtros corregida
    if (data.allowedIds && data.allowedIds.length > 0) {
        url += `ids=${data.allowedIds.join(',')}`;
    } 
    else if (data.filters) {
        if(data.filters.type !== 'Any') url += `type=${data.filters.type}&`;
        if(data.filters.price !== 'Any') url += `price=${data.filters.price}&`;
    }

    try {
        const res = await fetch(url);
        restaurants = await res.json();
        
        if (restaurants.length === 0) {
            alert("No hay restaurantes que coincidan con los filtros.");
            window.location.href = "home.html";
            return;
        }

        renderCard();
    } catch (e) { console.error(e); }
}

function renderCard() {
    if (currentIndex >= restaurants.length) return;

    const r = restaurants[currentIndex];

    // Resetear estado flip
    isFlipped = false;
    document.getElementById("card-inner").classList.remove("flipped");

    // CORRECCIÓN BUG FAVORITO: Verificar si ya es favorito
    const btnFav = document.getElementById("btn-fav");
    if (userFavorites.has(String(r.id))) {
        btnFav.classList.add("active");
    } else {
        btnFav.classList.remove("active");
    }

    document.getElementById("card-image").src = r.image;
    document.getElementById("card-name").innerText = r.name;
    document.getElementById("card-tags").innerHTML = `
        <span class="tag ${r.type}">${r.type}</span>
        <span class="tag">${r.price}</span>
        <span class="tag">⭐ ${r.rating}</span>
    `;

    const query = encodeURIComponent(r.name + " restaurant");
    document.getElementById("card-map-frame").src =
        `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

async function nextCard() {
    currentIndex++;
    if(currentIndex < restaurants.length) {
        renderCard();
    } else {
        // FIN DE VOTOS
        document.getElementById("view-swipe").innerHTML = `
            <div class="card-panel">
                <h2>✅ Votación completada</h2>
                <p>Esperando al resto de participantes...</p>
                <div class="spinner"></div> 
            </div>
        `;
        
        // Avisar al backend de que este usuario terminó
        await fetch(`${API}/finish-voting`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: roomCode, username: currentUser })
        });
    }
}

function showMatch(matchId) {
    const match = restaurants.find(r => r.id === matchId) || { name: "Restaurante", image: "", type: "", price: "" };
    
    document.getElementById("view-swipe").classList.add("hidden");
    document.getElementById("view-match").classList.remove("hidden");
    
    document.getElementById("match-result").innerHTML = `
        <img src="${match.image}" class="match-img-small">
        <h2 style="margin: 10px 0;">${match.name}</h2>
        <p style="color: #666;">${match.type} • ${match.price}</p>
    `;

    // Guardar match en historial solo si soy parte de la sala
    fetch(`${API}/auth/update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, historyItem: { name: match.name } })
    });
}

function showNoMatch() {
    document.getElementById("view-swipe").classList.add("hidden");
    document.getElementById("view-match").classList.remove("hidden");
    
    document.getElementById("match-result").innerHTML = `
        <div style="font-size: 3rem;">🤷‍♂️</div>
        <h2 style="margin: 10px 0;">Sin Coincidencias</h2>
        <p style="color: #666;">No habéis coincidido en ningún sitio.<br>¡Probad con otros filtros!</p>
    `;
}