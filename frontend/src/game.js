const params = new URLSearchParams(window.location.search);
const roomCode = params.get("code");
const isHost = params.get("isHost") === "true";
const currentUser = localStorage.getItem("user");
const API = "http://localhost:5000/api";

// Variables globales
let restaurants = []; 
let currentIndex = 0;
let isFlipped = false;
let userFavorites = new Set(); 

if (!currentUser) window.location.href = "index.html";

document.getElementById("room-code-display").innerText = roomCode;
if (isHost) document.getElementById("host-controls").classList.remove("hidden");
else document.getElementById("waiting-msg").classList.remove("hidden");

// Cargar favoritos del usuario
async function loadFavorites() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/auth/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.favorites) {
            userFavorites = new Set(data.favorites.map(String)); 
        }
    } catch(e) { console.error("Error cargando favoritos", e); }
}
loadFavorites();

// POLLING (Comprobar estado de la sala cada 3s)
const pollInterval = setInterval(async () => {
    try {
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

        // 2. Iniciar Juego si cambia el estado
        const isLobbyHidden = document.getElementById("view-lobby").classList.contains("hidden");
        
        if (data.status === 'voting' && !isLobbyHidden) {
            startGameLogic(data);
        }

        // 3. Detectar Match
        if (data.matches && data.matches.length > 0) {
            showMatch(data.matches[0]);
            clearInterval(pollInterval); 
        }

        // 4. Game Over
        if (data.gameOver) {
            showNoMatch();
            clearInterval(pollInterval);
        }
    } catch (e) { console.error("Error polling:", e); }

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

    toggleFlip: () => {
        isFlipped = !isFlipped;
        document.getElementById("card-inner").classList.toggle("flipped", isFlipped);
    },

    toggleFavorite: async () => {
        const rest = restaurants[currentIndex];
        const token = localStorage.getItem("token");
        const btn = document.getElementById("btn-fav");
        
        const isNowFav = !btn.classList.contains("active");
        btn.classList.toggle("active", isNowFav);

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

// --- LÓGICA PRINCIPAL MODIFICADA ---
async function startGameLogic(data) {
    document.getElementById("view-lobby").classList.add("hidden");
    document.getElementById("view-swipe").classList.remove("hidden");

    let url = `${API}/restaurants?`;

    // CASO A: Sala de Favoritos (lista de IDs)
    if (data.allowedIds && data.allowedIds.length > 0) {
        url += `ids=${data.allowedIds.join(',')}`;
    } 
    // CASO B: Sala Normal con Filtros
    else if (data.filters) {
        // Filtro Tipo
        if(data.filters.type && data.filters.type !== 'Any') {
            url += `type=${data.filters.type}&`;
        }
        // MODIFICADO: Usamos 'maxPrice' en lugar de 'price'
        if(data.filters.maxPrice && data.filters.maxPrice !== 'Any') {
            url += `maxPrice=${data.filters.maxPrice}&`;
        }
        // NUEVO: Añadimos el límite de tarjetas
        if(data.filters.limit) {
            url += `limit=${data.filters.limit}&`;
        }
    }

    try {
        const res = await fetch(url);
        restaurants = await res.json();
        
        if (restaurants.length === 0) {
            alert("No hay restaurantes que coincidan con los filtros. Intenta ser menos estricto.");
            window.location.href = "home.html";
            return;
        }

        renderCard();
    } catch (e) { console.error(e); }
}

function renderCard() {
    if (currentIndex >= restaurants.length) return;

    const r = restaurants[currentIndex];

    isFlipped = false;
    document.getElementById("card-inner").classList.remove("flipped");

    const btnFav = document.getElementById("btn-fav");
    if (userFavorites.has(String(r.id))) {
        btnFav.classList.add("active");
    } else {
        btnFav.classList.remove("active");
    }

    document.getElementById("card-image").src = r.image;
    document.getElementById("card-name").innerText = r.name;
    
    // MODIFICADO: Mostrar averagePrice + €
    document.getElementById("card-tags").innerHTML = `
        <span class="tag ${r.type}">${r.type}</span>
        <span class="tag">${r.averagePrice}€</span>
        <span class="tag">⭐ ${r.rating}</span>
    `;

    // MODIFICADO: Usar dirección real para el mapa si existe
    const query = encodeURIComponent(r.name + " " + (r.address || "Madrid"));
    document.getElementById("card-map-frame").src =
        `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

async function nextCard() {
    currentIndex++;
    if(currentIndex < restaurants.length) {
        renderCard();
    } else {
        // Mostrar mensaje de espera
        document.getElementById("view-swipe").innerHTML = `
            <div class="card-panel">
                <h2>✅ Votación completada</h2>
                <p>Esperando al resto de participantes...</p>
                <div class="spinner"></div> 
            </div>
        `;
        
        // Avisar al servidor
        try {
            await fetch(`${API}/finish-voting`, {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: roomCode, username: currentUser })
            });
            // El polling (setInterval) se encargará de detectar cuando gameOver sea true
        } catch (e) {
            console.error("Error al finalizar votación:", e);
        }
    }
}

function showMatch(matchId) {
    // Buscar match en la lista cargada o crear objeto dummy si no está
    const match = restaurants.find(r => r.id === matchId) || { name: "Restaurante", image: "", type: "", averagePrice: "?" };
    
    document.getElementById("view-swipe").classList.add("hidden");
    document.getElementById("view-match").classList.remove("hidden");
    
    // MODIFICADO: Mostrar precio correctamente
    document.getElementById("match-result").innerHTML = `
        <img src="${match.image}" class="match-img-small">
        <h2 style="margin: 10px 0;">${match.name}</h2>
        <p style="color: #666;">${match.type} • ${match.averagePrice}€</p>
        <p><i>${match.address || ""}</i></p>
    `;

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