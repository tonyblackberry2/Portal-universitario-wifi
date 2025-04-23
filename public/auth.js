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
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBUcqTVfqHZIHc3MShV2UzCRKanI7EWSGE",
    authDomain: "portal-universitario-wi-fi.firebaseapp.com",
    projectId: "portal-universitario-wi-fi",
    storageBucket: "portal-universitario-wi-fi.appspot.com",
    messagingSenderId: "23877160613",
    appId: "1:23877160613:web:022cac1e5024e7ec1c074c",
    measurementId: "G-NDY1LQ18VC"
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
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Registrar atividade de login
        await addDoc(collection(db, "loginLogs"), {
            name: user.email,
            date: new Date().toLocaleString(),
            via: 'Login',
            timestamp: serverTimestamp()
        });
        
        showMessage('Login realizado com sucesso! Bem-vindo!', 'success');
        // Redirecionar para a página principal após login
        window.location.href = '/index.html';
    } catch (error) {
        showMessage(getErrorMessage(error.code), 'error');
    }
});

// Registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm.email.value;
    const password = registerForm.password.value;
    const confirmPassword = registerForm.confirmPassword.value;

    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem!', 'error');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Registrar atividade de cadastro
        await addDoc(collection(db, "loginLogs"), {
            name: user.email,
            date: new Date().toLocaleString(),
            via: 'Cadastro',
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
    const email = recoveryForm.email.value;

    try {
        await sendPasswordResetEmail(auth, email);
        
        // Registrar atividade de recuperação de senha
        await addDoc(collection(db, "loginLogs"), {
            name: email,
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
        default:
            return 'Ocorreu um erro. Tente novamente.';
    }
} 