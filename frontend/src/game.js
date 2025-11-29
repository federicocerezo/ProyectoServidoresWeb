const params = new URLSearchParams(window.location.search);
const roomCode = params.get("code");
const isHost = params.get("isHost") === "true";
const currentUser = localStorage.getItem("user");
const API = "http://localhost:5000/api";

// Referencia a Model.restaurants del archivo model.js (asegúrate de que existe)
let restaurants = Model.restaurants; // Inicialmente todos
let currentIndex = 0;
let isFlipped = false;

if (!currentUser) window.location.href = "index.html";

document.getElementById("room-code-display").innerText = roomCode;
if (isHost) document.getElementById("host-controls").classList.remove("hidden");
else document.getElementById("waiting-msg").classList.remove("hidden");

// Polling
setInterval(async () => {
    const res = await fetch(`${API}/room/${roomCode}`);
    if(res.status === 404) { alert("Sala cerrada"); window.location.href="home.html"; return; }
    
    const data = await res.json();
    
    // Actualizar Lobby
    document.getElementById("participants-list").innerHTML = data.users.map(u => `<li>${u}</li>`).join("");

    // Detectar inicio de juego
    if (data.status === 'voting' && document.getElementById("view-lobby").style.display !== 'none') {
        startGameLogic(data.filters);
    }

    // Detectar Match
    if (data.matches && data.matches.length > 0) {
        showMatch(data.matches[0]); // Mostrar el primero
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
    toggleFlip: () => {
        isFlipped = !isFlipped;
        document.getElementById("card-inner").classList.toggle("flipped", isFlipped);
    },
    toggleFavorite: async () => {
        const rest = restaurants[currentIndex];
        const token = localStorage.getItem("token");
        
        const btn = document.getElementById("btn-fav");
        btn.classList.add("active"); // Feedback visual inmediato

        await fetch(`${API}/auth/update`, {
            method: "POST", headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Enviar token si usas middleware en backend
            },
            body: JSON.stringify({ 
                username: currentUser, 
                favoriteId: rest.id.toString() 
            })
        });
    }
};

function startGameLogic(data) { // Recibe data completo de la sala
    document.getElementById("view-lobby").classList.add("hidden");
    document.getElementById("view-swipe").classList.remove("hidden");

    // 1. Filtrar si es sala de favoritos (allowedIds)
    if (data.allowedIds && data.allowedIds.length > 0) {
        restaurants = restaurants.filter(r => data.allowedIds.includes(r.id));
    }
    // 2. Filtrar por tipos (filters)
    else if (data.filters && data.filters.type !== 'Any') {
        restaurants = restaurants.filter(r => r.type === data.filters.type);
    }
    
    if (restaurants.length === 0) {
        alert("No hay restaurantes que coincidan.");
        window.location.href = "home.html";
        return;
    }

    renderCard();
}

function renderCard() {
    if (currentIndex >= restaurants.length) return;

    // Resetear estado visual
    isFlipped = false;
    document.getElementById("card-inner").classList.remove("flipped");
    document.getElementById("btn-fav").classList.remove("active");

    const r = restaurants[currentIndex];
    document.getElementById("card-image").src = r.image;
    document.getElementById("card-name").innerText = r.name;
    
    // Tags con diseño bonito
    document.getElementById("card-tags").innerHTML = `
        <span class="tag ${r.type}">${r.type}</span>
        <span class="tag">${r.price}</span>
        <span class="tag">⭐ ${r.rating}</span>
    `;

    // Mapa
    const query = encodeURIComponent(r.name + " restaurant");
    document.getElementById("card-map-frame").src =
        `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

function nextCard() {
    currentIndex++;
    if(currentIndex < restaurants.length) {
        renderCard();
    } else {
        document.getElementById("view-swipe").innerHTML = "<h2>Esperando resultados...</h2>";
    }
}

function showMatch(matchId) {
    const match = Model.restaurants.find(r => r.id === matchId);
    document.getElementById("view-swipe").classList.add("hidden");
    document.getElementById("view-match").classList.remove("hidden");
    
    // CAMBIO AQUÍ: Usamos la clase 'match-img-small'
    document.getElementById("match-result").innerHTML = `
        <img src="${match.image}" class="match-img-small">
        <h2 style="margin: 10px 0;">${match.name}</h2>
        <p style="color: #666;">${match.type} • ${match.price}</p>
    `;
    
    // Guardar historial en backend
    fetch(`${API}/auth/update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, historyItem: { name: match.name } })
    });
}