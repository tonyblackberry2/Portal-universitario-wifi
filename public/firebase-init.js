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
  // Remove caracteres não numéricos da matrícula
  const cleanMatricula = matricula.replace(/\D/g, '');
  return `${cleanMatricula}@portalwifi.edu`;
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