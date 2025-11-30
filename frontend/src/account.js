const API_ACC = "http://localhost:5000/api";
const token = localStorage.getItem("token");

if(!token) window.location.href="index.html";

async function loadProfile() {
    try {
        const res = await fetch(`${API_ACC}/auth/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const user = await res.json();
        
        document.getElementById("acc-username").innerText = user.username;
        const favContainer = document.getElementById("favorites-list");
        
        if (user.favorites && user.favorites.length > 0) {
            // PEDIR DETALLES DE FAVORITOS AL BACKEND
            const resRest = await fetch(`${API_ACC}/restaurants?ids=${user.favorites.join(',')}`);
            const myFavs = await resRest.json();
            
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
    } catch (e) {
        console.error(e);
        favContainer.innerHTML = "<p>Error cargando favoritos.</p>";
    }
}

loadProfile();