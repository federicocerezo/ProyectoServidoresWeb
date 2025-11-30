const params = new URLSearchParams(window.location.search);
const roomCode = params.get("code");
const isHost = params.get("isHost") === "true";
const currentUser = localStorage.getItem("user");
const API = "http://localhost:5000/api";

// Variables globales
let restaurants = []; 
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
    
    document.getElementById("participants-list").innerHTML = data.users.map(u => `<li>${u}</li>`).join("");

    // Si empieza la votación y sigo en el lobby, cargo el juego
    if (data.status === 'voting' && document.getElementById("view-lobby").classList.contains("hidden") === false) {
        startGameLogic(data);
    }

    if (data.matches && data.matches.length > 0) {
        showMatch(data.matches[0]);
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
        btn.classList.add("active");

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

// MODIFICADO: Fetch inteligente al backend
async function startGameLogic(data) {
    document.getElementById("view-lobby").classList.add("hidden");
    document.getElementById("view-swipe").classList.remove("hidden");

    let url = `${API}/restaurants?`;

    // CASO 1: Sala de Favoritos (tiene allowedIds)
    if (data.allowedIds && data.allowedIds.length > 0) {
        url += `ids=${data.allowedIds.join(',')}`;
    } 
    // CASO 2: Sala Normal con Filtros
    else if (data.filters) {
        if(data.filters.type !== 'Any') url += `type=${data.filters.type}&`;
        if(data.filters.price !== 'Any') url += `price=${data.filters.price}&`;
    }

    try {
        console.log("Fetching restaurants from:", url);
        const res = await fetch(url);
        restaurants = await res.json();
        
        // Guardamos en el modelo global por si acaso
        Model.restaurants = restaurants;

        if (restaurants.length === 0) {
            alert("No hay restaurantes que coincidan con los filtros.");
            window.location.href = "home.html";
            return;
        }

        renderCard();
    } catch (e) {
        console.error("Error fetching restaurants:", e);
    }
}

function renderCard() {
    if (currentIndex >= restaurants.length) return;

    isFlipped = false;
    document.getElementById("card-inner").classList.remove("flipped");
    document.getElementById("btn-fav").classList.remove("active");

    const r = restaurants[currentIndex];
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

function nextCard() {
    currentIndex++;
    if(currentIndex < restaurants.length) {
        renderCard();
    } else {
        document.getElementById("view-swipe").innerHTML = "<h2>Esperando resultados...</h2>";
    }
}

function showMatch(matchId) {
    // Buscar en los restaurantes cargados
    const match = restaurants.find(r => r.id === matchId);
    
    // Si el match no está en la lista filtrada actual (raro, pero posible), no mostramos error
    if (!match) return; 

    document.getElementById("view-swipe").classList.add("hidden");
    document.getElementById("view-match").classList.remove("hidden");
    
    document.getElementById("match-result").innerHTML = `
        <img src="${match.image}" class="match-img-small">
        <h2 style="margin: 10px 0;">${match.name}</h2>
        <p style="color: #666;">${match.type} • ${match.price}</p>
    `;
    
    // Guardar en historial
    fetch(`${API}/auth/update`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, historyItem: { name: match.name } })
    });
}