<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<script>
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
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const analytics = firebase.analytics();

  // Função para criar email fictício a partir da matrícula
  function createFakeEmail(matricula) {
    return `${matricula}@universidade.com`;
  }

  // Função para mostrar mensagens
  function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;

    const activeForm = document.querySelector('.form-container.active');
    if (activeForm) {
      activeForm.insertBefore(messageDiv, activeForm.firstChild);
    } else {
      document.body.appendChild(messageDiv);
    }

    setTimeout(() => {
      messageDiv.classList.add('fade-out');
      setTimeout(() => {
        messageDiv.remove();
      }, 500);
    }, 5000);
  }

  // Função para obter mensagem de erro amigável
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

  // Login
  document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const matricula = document.getElementById('login-matricula').value;
        const password = document.getElementById('login-password').value;
        
        // Criar e-mail fictício a partir da matrícula
        const fakeEmail = createFakeEmail(matricula);

        auth.signInWithEmailAndPassword(fakeEmail, password)
          .then((userCredential) => {
            console.log("Usuário logado:", userCredential.user);
            showMessage("Login bem-sucedido");
          })
          .catch((error) => {
            console.error("Erro no login:", error.message);
            showMessage(getErrorMessage(error.code), 'error');
          });
      });
    }

    // Cadastro
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
      registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const matricula = document.getElementById('register-matricula').value;
        const name = document.getElementById('register-name').value;
        const birthdate = document.getElementById('register-birthdate').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const secretAnswer = document.getElementById('register-secret-answer').value;
        
        // Criar e-mail fictício a partir da matrícula
        const fakeEmail = createFakeEmail(matricula);

        if (password !== confirmPassword) {
          showMessage("As senhas não coincidem", 'error');
          return;
        }

        auth.createUserWithEmailAndPassword(fakeEmail, password)
          .then((userCredential) => {
            console.log("Usuário registrado:", userCredential.user);
            return db.collection("users").add({
              matricula,
              name,
              birthdate,
              secretAnswer,
              email: fakeEmail,
              role: 'user', // Por padrão, todos os usuários são 'user'
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          })
          .then(() => {
            showMessage("Cadastro bem-sucedido!");
          })
          .catch((error) => {
            console.error("Erro no cadastro:", error.message);
            showMessage(getErrorMessage(error.code), 'error');
          });
      });
    }
  });
</script>
