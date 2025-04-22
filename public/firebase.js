// Importe o SDK do Firebase
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBUcqTVfqHZIHc3MShV2UzCRKanI7EWSGE",
  authDomain: "portal-universitario-wi-fi.firebaseapp.com",
  projectId: "portal-universitario-wi-fi",
  storageBucket: "portal-universitario-wi-fi.appspot.com",
  messagingSenderId: "816666104369",
  appId: "1:816666104369:web:1ac26020c805496ee07b10",
  measurementId: "G-NDY1LQ18VC"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

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
