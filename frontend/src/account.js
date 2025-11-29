const API_ACC = "http://localhost:5000/api";
const token = localStorage.getItem("token");

if(!token) window.location.href="index.html";

// Cargar perfil real del backend
async function loadProfile() {
    const res = await fetch(`${API_ACC}/auth/profile`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const user = await res.json();
    
    document.getElementById("acc-username").innerText = user.username;
    
    const favContainer = document.getElementById("favorites-list");
    
    if (user.favorites && user.favorites.length > 0) {
        // Cruzamos los IDs con el Model local para sacar nombres e imágenes
        // (Asegúrate de que model.js esté importado en el HTML)
        const myFavs = Model.restaurants.filter(r => user.favorites.includes(String(r.id)));
        
        favContainer.innerHTML = myFavs.map(r => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:10px; background:#f9fafb; border-radius:8px;">
                <img src="${r.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                <div>
                    <b>${r.name}</b><br>
                    <small>${r.type}</small>
                </div>
            </div>
        `).join("");
    } else {
        favContainer.innerHTML = "<p>No tienes favoritos guardados.</p>";
    }
}

loadProfile();