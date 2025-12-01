const params = new URLSearchParams(window.location.search);
const roomCode = params.get("code");
const isHost = params.get("isHost") === "true";
const API = "http://localhost:5000/api";

// CAMBIO: Leer usuario de sessionStorage
const currentUser = sessionStorage.getItem("user");

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
    // CAMBIO: Leer token de sessionStorage
    const token = sessionStorage.getItem("token");
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

// ... (El bloque de POLLING se mantiene igual, omitido por brevedad) ...
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
        document.getElementById("participants-list").innerHTML = data.users.map(u => `<li>${u}</li>`).join("");
        const isLobbyHidden = document.getElementById("view-lobby").classList.contains("hidden");
        if (data.status === 'voting' && !isLobbyHidden) {
            startGameLogic(data);
        }
        if (data.matches && data.matches.length > 0) {
            showMatch(data.matches[0]);
            clearInterval(pollInterval); 
        }
        if (data.gameOver) {
            showNoMatch();
            clearInterval(pollInterval);
        }
    } catch (e) { console.error("Error polling:", e); }
}, 3000);

const Game = {
    startVoting: async () => {
        // Recuperamos el token
        const token = sessionStorage.getItem("token");
        
        await fetch(`${API}/start-game`, {
            method: "POST", 
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // <--- IMPORTANTE: Enviar el Token
            },
            body: JSON.stringify({ code: roomCode })
        });
    },

    // Busca el objeto const Game = { ... } y actualiza su método vote:

    vote: async (liked) => {
        const rest = restaurants[currentIndex];
        const token = sessionStorage.getItem("token");

        if (liked) {
            try {
                // 1. Esperamos la respuesta del servidor
                const res = await fetch(`${API}/vote`, {
                    method: "POST", 
                    headers: {
                        "Content-Type": "application/json" ,
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ code: roomCode, restaurantId: rest.id })
                });
                
                const data = await res.json();

                // 2. Si el servidor nos dice que hay match, lo mostramos YA
                if (data.success && data.match) {
                    showMatch(data.restaurantId);
                    return; // IMPORTANTE: Detenemos la función para NO pasar de carta
                }
            } catch (e) {
                console.error("Error al enviar voto:", e);
            }
        }
        
        // 3. Solo si no hubo match (o el voto fue 'No'), pasamos al siguiente
        nextCard();
    },

    toggleFlip: () => {
        isFlipped = !isFlipped;
        document.getElementById("card-inner").classList.toggle("flipped", isFlipped);
    },

    toggleFavorite: async () => {
        const rest = restaurants[currentIndex];
        // CAMBIO: Leer token de sessionStorage
        const token = sessionStorage.getItem("token");
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
    },

    finishGame: async () => {
        const token = sessionStorage.getItem("token"); // <--- Recuperar token

        if (isHost) {
            try {
                console.log("🧹 Borrando sala...");
                await fetch(`${API}/delete-room`, {
                    method: "POST", 
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // <--- Añadir header
                    },
                    body: JSON.stringify({ code: roomCode })
                });
            } catch(e) { 
                console.error("Error eliminando la sala", e); 
            }
        }
        window.location.href = "home.html";
    }
};

// ... (Resto de funciones: startGameLogic, renderCard, nextCard, showMatch, showNoMatch se mantienen igual) ...
async function startGameLogic(data) {
    document.getElementById("view-lobby").classList.add("hidden");
    document.getElementById("view-swipe").classList.remove("hidden");

    let url = `${API}/restaurants?`;

    if (data.allowedIds && data.allowedIds.length > 0) {
        url += `ids=${data.allowedIds.join(',')}`;
    } 
    else if (data.filters) {
        if(data.filters.type && data.filters.type !== 'Any') {
            url += `type=${data.filters.type}&`;
        }
        if(data.filters.maxPrice && data.filters.maxPrice !== 'Any') {
            url += `maxPrice=${data.filters.maxPrice}&`;
        }
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
    
    document.getElementById("card-tags").innerHTML = `
        <span class="tag ${r.type}">${r.type}</span>
        <span class="tag">${r.price}</span>
        <span class="tag">⭐ ${r.rating}</span>
    `;

    const query = encodeURIComponent(r.name + " " + (r.address || "Madrid"));
    document.getElementById("card-map-frame").src =
        `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

async function nextCard() {
    currentIndex++;
    if(currentIndex < restaurants.length) {
        renderCard();
    } else {
        document.getElementById("view-swipe").innerHTML = `
            <div class="card-panel">
                <h2>✅ Votación completada</h2>
                <p>Esperando al resto de participantes...</p>
                <div class="spinner"></div> 
            </div>
        `;
        
        const token = sessionStorage.getItem("token");

        try {
            await fetch(`${API}/finish-voting`, {
                method: "POST", 
                headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ code: roomCode, username: currentUser })
            });
        } catch (e) {
            console.error("Error al finalizar votación:", e);
        }
    }
}

async function showMatch(matchId) {
    let match = restaurants.find(r => r.id === matchId);

    if (!match) {
        try {
            console.log("Recuperando detalles del match desde el servidor...");
            const res = await fetch(`${API}/restaurants?ids=${matchId}`);
            const data = await res.json();
            if (data && data.length > 0) {
                match = data[0];
            }
        } catch (e) {
            console.error("Error buscando el match:", e);
        }
    }

    match = match || { name: "Restaurante", image: "", type: "", price: "???" };

    document.getElementById("view-swipe").classList.add("hidden");
    document.getElementById("view-match").classList.remove("hidden");
    
    document.getElementById("match-result").innerHTML = `
        <h1 style="color: var(--primary); font-size: 3rem; margin-bottom: 10px;">¡MATCH!</h1>
        <p class="text-muted">¡Todos queréis ir aquí!</p>
        <img src="${match.image}" class="match-img-small">
        <h2 style="margin: 10px 0;">${match.name}</h2>
        <p style="color: #666;">${match.type} • ${match.price}</p>
        <p><i>${match.address || ""}</i></p>
    `;

    const token = sessionStorage.getItem("token");

    // Guardar en historial
    if (token) {
        fetch(`${API}/auth/update`, {
            method: "POST", 
            headers: { 
                "Content-Type": "application/json" ,
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                username: currentUser, 
                historyItem: { name: match.name } 
            })
        }).catch(e => console.error("Error guardando historial:", e));
    }
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