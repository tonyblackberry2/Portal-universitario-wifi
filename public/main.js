import { 
    auth, 
    db, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from './firebase.js';

// Elementos do DOM
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form-container');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const faceIdForm = document.getElementById('faceIdForm');
const videoElement = document.getElementById('videoElement');
const faceIdStatus = document.getElementById('faceIdStatus');
const activityLog = document.getElementById('activityLog');

// Gerenciamento de abas
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetForm = tab.dataset.tab;
        
        // Atualizar abas ativas
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Mostrar formulário correspondente
        forms.forEach(form => {
            form.classList.remove('active');
            if (form.id === targetForm) {
                form.classList.add('active');
            }
        });
    });
});

// Login com email e senha
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        addActivityLog('Login realizado com sucesso');
    } catch (error) {
        console.error('Erro no login:', error);
        addActivityLog('Erro no login: ' + error.message);
    }
});

// Registro de novo usuário
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm.email.value;
    const password = registerForm.password.value;
    const name = registerForm.name.value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            name: name,
            email: email,
            createdAt: new Date()
        });
        addActivityLog('Usuário registrado com sucesso');
    } catch (error) {
        console.error('Erro no registro:', error);
        addActivityLog('Erro no registro: ' + error.message);
    }
});

// Face ID
let stream = null;

async function startFaceId() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        faceIdStatus.textContent = 'Camera iniciada. Aguardando reconhecimento facial...';
    } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        faceIdStatus.textContent = 'Erro ao acessar a câmera: ' + error.message;
    }
}

function stopFaceId() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        faceIdStatus.textContent = 'Camera desativada';
    }
}

// Iniciar Face ID quando a aba for selecionada
document.querySelector('[data-tab="faceIdForm"]').addEventListener('click', startFaceId);

// Parar Face ID quando mudar de aba
tabs.forEach(tab => {
    if (tab.dataset.tab !== 'faceIdForm') {
        tab.addEventListener('click', stopFaceId);
    }
});

// Log de atividades
async function addActivityLog(message) {
    const timestamp = new Date().toLocaleString();
    const logEntry = document.createElement('li');
    logEntry.textContent = `${timestamp} - ${message}`;
    activityLog.insertBefore(logEntry, activityLog.firstChild);
    
    // Salvar no Firestore
    try {
        await addDoc(collection(db, 'activities'), {
            message,
            timestamp: new Date(),
            userId: auth.currentUser?.uid || 'anonymous'
        });
    } catch (error) {
        console.error('Erro ao salvar atividade:', error);
    }
}

// Carregar histórico de atividades
async function loadActivityLog() {
    try {
        const q = query(
            collection(db, 'activities'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        activityLog.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp.toDate().toLocaleString();
            const logEntry = document.createElement('li');
            logEntry.textContent = `${timestamp} - ${data.message}`;
            activityLog.appendChild(logEntry);
        });
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
    }
}

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        addActivityLog(`Usuário ${user.email} está online`);
    } else {
        addActivityLog('Usuário desconectado');
    }
});

// Carregar histórico inicial
loadActivityLog(); 