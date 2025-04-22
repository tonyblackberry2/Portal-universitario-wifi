// Importe o SDK do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    query,
    where,
    orderBy,
    limit 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Configuração do Firebase
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta as funções e variáveis necessárias
export {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit
};

// Função de Login
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const matricula = document.getElementById('login-matricula').value;
  const password = document.getElementById('login-password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, matricula, password);
    console.log("Usuário logado:", userCredential.user);
    alert("Login bem-sucedido");
  } catch (error) {
    console.error("Erro no login:", error.message);
    alert("Erro no login");
  }
});

// Função de Cadastro
document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
  e.preventDefault();

  const matricula = document.getElementById('register-matricula').value;
  const name = document.getElementById('register-name').value;
  const birthdate = document.getElementById('register-birthdate').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const secretAnswer = document.getElementById('register-secret-answer').value;

  if (password !== confirmPassword) {
    alert("As senhas não coincidem");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, matricula, password);
    console.log("Usuário registrado:", userCredential.user);
    // Salvar dados no Firestore (por exemplo)
    await addDoc(collection(db, "users"), {
      matricula,
      name,
      birthdate,
      secretAnswer
    });
    alert("Cadastro bem-sucedido!");
  } catch (error) {
    console.error("Erro no cadastro:", error.message);
    alert("Erro no cadastro");
  }
});
