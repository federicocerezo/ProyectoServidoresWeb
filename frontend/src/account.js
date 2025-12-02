const API_ACC = "http://localhost:5000/api";
const token = sessionStorage.getItem("token");
const currentUser = sessionStorage.getItem("user");

if(!token) window.location.href="index.html";

// Función global para eliminar favorito
window.removeFavorite = async (id) => {
    if(!confirm("¿Seguro que quieres eliminar este favorito?")) return;

    try {
        // La lógica del backend hace "toggle": si ya existe, lo borra.
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_ACC}/auth/update`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                // Enviamos el token por buena práctica, aunque este endpoint usa el username del body
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                username: currentUser, 
                favoriteId: id.toString() 
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Recargamos la lista para reflejar el cambio
            loadProfile();
        } else {
            alert("Error al actualizar favoritos.");
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión con el servidor.");
    }
};

async function loadProfile() {
    try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_ACC}/auth/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const user = await res.json();
        
        document.getElementById("acc-username").innerText = user.username;
        const favContainer = document.getElementById("favorites-list");
        
        if (user.favorites && user.favorites.length > 0) {
            // Pedimos los detalles de los restaurantes favoritos
            const resRest = await fetch(`${API_ACC}/restaurants?ids=${user.favorites.join(',')}`);
            const myFavs = await resRest.json();
            
            // Renderizamos la lista con el botón de eliminar
            favContainer.innerHTML = myFavs.map(r => `
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; padding:10px; background:#f9fafb; border-radius:8px; border: 1px solid #eee;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${r.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                        <div>
                            <b style="color: var(--text-main);">${r.name}</b><br>
                            <small style="color: #666;">${r.type}</small>
                        </div>
                    </div>
                    <button onclick="window.removeFavorite('${r.id}')" 
                            style="background:none; border:none; cursor:pointer; font-size:1.2rem; padding: 5px;" 
                            title="Quitar de favoritos">
                        ❌
                    </button>
                </div>
            `).join("");
        } else {
            favContainer.innerHTML = "<p style='color:#888; font-style:italic;'>No tienes favoritos guardados.</p>";
        }
    } catch (e) {
        console.error(e);
        favContainer.innerHTML = "<p>Error cargando favoritos.</p>";
    }
}

loadProfile();