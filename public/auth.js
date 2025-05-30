import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore,
    collection, 
    addDoc,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
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
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const recoveryForm = document.getElementById('recoveryForm');
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form-container');

// Gerenciar tabs
tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        // Remover classes ativas
        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));
        
        // Adicionar classes ativas
        tab.classList.add('active');
        forms[index].classList.add('active');
    });
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const matricula = loginForm.email.value;
    const password = loginForm.password.value;
    
    // Criar e-mail fictício a partir da matrícula
    const fakeEmail = createFakeEmail(matricula);

    try {
        // Verificar se o Firebase está configurado corretamente
        if (!auth) {
            showMessage('Erro de configuração do Firebase. Verifique a chave de API.', 'error');
            return;
        }
        
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, password);
        const user = userCredential.user;
        
        // Verificar se o usuário é admin
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Registrar atividade de login
            await addDoc(collection(db, "loginLogs"), {
                name: matricula,
                date: new Date().toLocaleString(),
                via: 'Login',
                role: userData.role || 'user',
                timestamp: serverTimestamp()
            });
            
            showMessage('Login realizado com sucesso! Bem-vindo!', 'success');
            
            // Redirecionar baseado no papel do usuário
            if (userData.role === 'admin') {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/index.html';
            }
        } else {
            showMessage('Erro ao verificar permissões do usuário.', 'error');
        }
    } catch (error) {
        showMessage(getErrorMessage(error.code), 'error');
    }
});

// Registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const matricula = registerForm.email.value;
    const password = registerForm.password.value;
    const confirmPassword = registerForm.confirmPassword.value;
    
    // Criar e-mail fictício a partir da matrícula
    const fakeEmail = createFakeEmail(matricula);

    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem!', 'error');
        return;
    }

    try {
        // Verificar se o Firebase está configurado corretamente
        if (!auth) {
            showMessage('Erro de configuração do Firebase. Verifique a chave de API.', 'error');
            return;
        }
        
        // Usando a abordagem sugerida, adaptada para Firebase v9
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        const uid = userCredential.user.uid;
        
        // Salvar dados do usuário no Firestore
        await setDoc(doc(db, "usuarios", uid), {
            matricula: matricula,
            email: fakeEmail,
            role: 'user', // Por padrão, todos os usuários são 'user'
            createdAt: serverTimestamp()
        });
        
        // Registrar atividade de cadastro
        await addDoc(collection(db, "loginLogs"), {
            name: matricula,
            date: new Date().toLocaleString(),
            via: 'Cadastro',
            role: 'user',
            timestamp: serverTimestamp()
        });
        
        showMessage('Conta criada com sucesso! Você já pode fazer login.', 'success');
        // Redirecionar para a página principal após registro
        window.location.href = '/index.html';
    } catch (error) {
        showMessage(getErrorMessage(error.code), 'error');
    }
});

// Recuperação de senha
recoveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const matricula = recoveryForm.email.value;
    
    // Criar e-mail fictício a partir da matrícula
    const fakeEmail = createFakeEmail(matricula);

    try {
        // Verificar se o Firebase está configurado corretamente
        if (!auth) {
            showMessage('Erro de configuração do Firebase. Verifique a chave de API.', 'error');
            return;
        }
        
        await sendPasswordResetEmail(auth, fakeEmail);
        
        // Registrar atividade de recuperação de senha
        await addDoc(collection(db, "loginLogs"), {
            name: matricula,
            date: new Date().toLocaleString(),
            via: 'Recuperação de Senha',
            timestamp: serverTimestamp()
        });
        
        showMessage('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
    } catch (error) {
        showMessage(getErrorMessage(error.code), 'error');
    }
});

// Funções auxiliares
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;

    const activeForm = document.querySelector('.form-container.active');
    activeForm.insertBefore(messageDiv, activeForm.firstChild);

    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => {
            messageDiv.remove();
        }, 500);
    }, 5000);
}

function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'Usuário não encontrado.';
        case 'auth/wrong-password':
            return 'Senha incorreta.';
        case 'auth/email-already-in-use':
            return 'Este email já está em uso.';
        case 'auth/weak-password':
            return 'A senha deve ter pelo menos 6 caracteres.';
        case 'auth/invalid-email':
            return 'Email inválido.';
        case 'auth/api-key-not-valid':
            return 'Erro de configuração do Firebase. Verifique a chave de API.';
        default:
            return 'Ocorreu um erro. Tente novamente.';
    }
}

// Função para criar email fictício a partir da matrícula
function createFakeEmail(matricula) {
  // Remove caracteres não numéricos da matrícula
  const cleanMatricula = matricula.replace(/\D/g, '');
  return `${cleanMatricula}@portalwifi.edu`;
} 