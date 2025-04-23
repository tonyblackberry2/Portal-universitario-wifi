import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore,
    collection, 
    getDocs,
    query,
    orderBy,
    limit,
    doc,
    getDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAS_VkKisuxVUhA8TlHPDYqIgEDfSCI46M",
    authDomain: "portal-universitario-wifi.firebaseapp.com",
    projectId: "portal-universitario-wifi",
    storageBucket: "portal-universitario-wifi.appspot.com",
    messagingSenderId: "23877160613",
    appId: "1:23877160613:web:022cac1e5024e7ec1c074c",
    measurementId: "G-00EZJMJ0KB"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos do DOM
const usersList = document.getElementById('usersList');
const activityLogs = document.getElementById('activityLogs');
const logoutBtn = document.getElementById('logoutBtn');

// Verificar autenticação e permissões
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verificar se o usuário é admin
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            // Carregar dados
            loadUsers();
            loadActivityLogs();
        } else {
            // Redirecionar se não for admin
            window.location.href = '/index.html';
        }
    } else {
        // Redirecionar se não estiver logado
        window.location.href = '/auth.html';
    }
});

// Carregar usuários
async function loadUsers() {
    try {
        const usersSnapshot = await getDocs(collection(db, "usuarios"));
        usersList.innerHTML = '';
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <div class="user-info">
                    <span class="user-email">${userData.email}</span>
                    <span class="user-role">${userData.role || 'user'}</span>
                </div>
                <div class="user-actions">
                    <button onclick="toggleUserRole('${doc.id}', '${userData.role || 'user'}')" class="btn btn-small">
                        ${userData.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                </div>
            `;
            usersList.appendChild(userElement);
        });
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        showMessage("Erro ao carregar lista de usuários", "error");
    }
}

// Carregar logs de atividade
async function loadActivityLogs() {
    try {
        const logsQuery = query(
            collection(db, "loginLogs"),
            orderBy("timestamp", "desc"),
            limit(50)
        );
        
        const logsSnapshot = await getDocs(logsQuery);
        activityLogs.innerHTML = '';
        
        logsSnapshot.forEach(doc => {
            const logData = doc.data();
            const logElement = document.createElement('div');
            logElement.className = 'log-item';
            logElement.innerHTML = `
                <div class="log-info">
                    <span class="log-name">${logData.name}</span>
                    <span class="log-action">${logData.via}</span>
                    <span class="log-date">${logData.date}</span>
                </div>
            `;
            activityLogs.appendChild(logElement);
        });
    } catch (error) {
        console.error("Erro ao carregar logs:", error);
        showMessage("Erro ao carregar logs de atividade", "error");
    }
}

// Alternar papel do usuário (admin/user)
async function toggleUserRole(userId, currentRole) {
    try {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        await updateDoc(doc(db, "usuarios", userId), {
            role: newRole
        });
        
        showMessage(`Papel do usuário alterado para ${newRole}`, "success");
        loadUsers(); // Recarregar lista
    } catch (error) {
        console.error("Erro ao alterar papel do usuário:", error);
        showMessage("Erro ao alterar papel do usuário", "error");
    }
}

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '/auth.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showMessage("Erro ao fazer logout", "error");
    }
});

// Função auxiliar para mostrar mensagens
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => {
            messageDiv.remove();
        }, 500);
    }, 5000);
}

// Expor função toggleUserRole globalmente
window.toggleUserRole = toggleUserRole; 