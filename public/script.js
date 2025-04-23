// Função para alternar entre as abas
function switchTab(tab, element) {
    // Remover a classe "active" das abas
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    // Remover a classe "active" dos formulários
    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    
    // Caso especial para a aba "faceid"
    let formId = tab + 'Form';
    if (tab === 'faceid') {
        formId = 'faceIdForm';
    }
    
    const formElement = document.getElementById(formId);
    if (formElement) {
        formElement.classList.add('active');
    } else {
        console.error(`Formulário com ID "${formId}" não encontrado.`);
    }
}

// Expor a função switchTab globalmente
window.switchTab = switchTab;

// Importações do Firebase usando CDN oficial
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getFirestore,
    collection, 
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAS_VkKisuxVUhA8TlHPDYqIgEDfSCI46M",
  authDomain: "portal-universitario-wifi.firebaseapp.com",
  projectId: "portal-universitario-wifi",
  storageBucket: "portal-universitario-wifi.firebasestorage.app",
  messagingSenderId: "23877160613",
  appId: "1:23877160613:web:022cac1e5024e7ec1c074c",
  measurementId: "G-00EZJMJ0KB"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let users = [];
let currentUser = null;
let loginLogs = [];

// Variáveis globais para o reconhecimento facial
let isFaceDetectionRunning = false;

// Função para exibir mensagens de sucesso
function showSuccessMessage(message, duration = 3000) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'success-message';
    messageContainer.textContent = message;
    document.body.appendChild(messageContainer);
    
    setTimeout(() => {
        messageContainer.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(messageContainer);
        }, 500);
    }, duration);
}

// Função para exibir mensagens de erro
function showErrorMessage(message, duration = 3000) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'error-message';
    messageContainer.textContent = message;
    document.body.appendChild(messageContainer);
    
    setTimeout(() => {
        messageContainer.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(messageContainer);
        }, 500);
    }, duration);
}

async function loadUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        users = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        console.log("Usuários carregados com sucesso:", users.length);
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        showErrorMessage("Erro ao carregar usuários do banco de dados");
    }
}

async function saveLogs() {
    try {
        const logCollection = collection(db, "loginLogs");
        for (const log of loginLogs) {
            await addDoc(logCollection, {
                ...log,
                timestamp: serverTimestamp()
            });
        }
        console.log("Logs salvos com sucesso:", loginLogs.length);
    } catch (error) {
        console.error("Erro ao salvar logs:", error);
        showErrorMessage("Erro ao salvar logs de atividade");
    }
}

async function loadLogs() {
    try {
        const logCollection = collection(db, "loginLogs");
        const q = query(logCollection, orderBy("timestamp", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        loginLogs = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        console.log("Logs carregados com sucesso:", loginLogs.length);
        return loginLogs;
    } catch (error) {
        console.error("Erro ao carregar logs:", error);
        showErrorMessage("Erro ao carregar logs de atividade");
        return [];
    }
}

async function startFaceID() {
    const videoElement = document.getElementById('videoElement');
    const cameraContainer = document.getElementById('cameraContainer');
    const faceIdStatus = document.getElementById('faceIdStatus');
    
    if (isFaceDetectionRunning) {
        // Parar a detecção se já estiver rodando
        stopFaceDetection();
        return;
    }
    
    try {
        // Carregar modelos
        faceIdStatus.textContent = 'Carregando modelos de reconhecimento facial...';
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        
        // Solicitar acesso à câmera
        faceIdStatus.textContent = 'Iniciando câmera...';
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        // Mostrar o vídeo
        videoElement.srcObject = stream;
        cameraContainer.style.display = 'block';
        faceIdStatus.textContent = 'Posicione seu rosto na frente da câmera e clique em "Verificar Rosto"';
        
        // Adicionar botão de verificação
        const verifyButton = document.createElement('button');
        verifyButton.className = 'btn';
        verifyButton.textContent = 'Verificar Rosto';
        verifyButton.onclick = scanFace;
        faceIdStatus.appendChild(document.createElement('br'));
        faceIdStatus.appendChild(verifyButton);
        
        isFaceDetectionRunning = true;
        
    } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        faceIdStatus.textContent = 'Erro ao acessar a câmera. Verifique as permissões.';
        showErrorMessage('Erro ao acessar a câmera. Verifique as permissões.');
        isFaceDetectionRunning = false;
    }
}

// Função para verificar o rosto
async function scanFace() {
    const videoElement = document.getElementById('videoElement');
    const faceIdStatus = document.getElementById('faceIdStatus');
    
    try {
        faceIdStatus.textContent = 'Analisando rosto...';
        
        const detection = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (detection) {
            faceIdStatus.textContent = 'Rosto detectado com sucesso!';
            console.log('Descriptor:', detection.descriptor);
            
            // Aqui você pode adicionar a lógica para verificar a identidade
            // Por exemplo, comparar com um banco de dados de rostos conhecidos
            
            // Simulação de verificação bem-sucedida
            setTimeout(() => {
                faceIdStatus.textContent = 'Rosto reconhecido! Você pode fazer login.';
                showSuccessMessage('Reconhecimento facial bem-sucedido!');
                
                // Registrar atividade de login via Face ID
                loginLogs.push({ 
                    name: 'Usuário via Face ID', 
                    date: new Date().toLocaleString(), 
                    via: 'Face ID' 
                });
                saveLogs();
                
                stopFaceDetection();
            }, 2000);
        } else {
            faceIdStatus.textContent = 'Nenhum rosto detectado. Tente novamente.';
            showErrorMessage('Nenhum rosto detectado. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao detectar rosto:', error);
        faceIdStatus.textContent = 'Erro ao detectar rosto. Tente novamente.';
        showErrorMessage('Erro ao detectar rosto. Tente novamente.');
    }
}

function stopFaceDetection() {
    const videoElement = document.getElementById('videoElement');
    const cameraContainer = document.getElementById('cameraContainer');
    const faceIdStatus = document.getElementById('faceIdStatus');
    
    if (videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
    }
    
    cameraContainer.style.display = 'none';
    faceIdStatus.textContent = 'Clique para iniciar o reconhecimento facial';
    isFaceDetectionRunning = false;
}

// Expor as funções globalmente
window.startFaceID = startFaceID;
window.stopFaceDetection = stopFaceDetection;
window.scanFace = scanFace;

function isValidBirthdate(birthdate) {
    const today = new Date();
    const age = today.getFullYear() - new Date(birthdate).getFullYear();
    return age <= 70 && new Date(birthdate) <= today;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    await loadLogs();

    // Cadastro
    document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const matricula = document.getElementById('register-matricula').value;
        const name = document.getElementById('register-name').value;
        const birthdate = document.getElementById('register-birthdate').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm-password').value;
        const secretQuestion = document.getElementById('register-secret-question').value;
        const secretAnswer = document.getElementById('register-secret-answer').value;
        
        // Criar e-mail fictício a partir da matrícula
        const fakeEmail = `${matricula}@universidade.com`;

        // Verifica se as senhas coincidem
        if (password !== confirm) {
            showErrorMessage('As senhas não coincidem!');
            return;
        }

        // Verifica se a data de nascimento é válida
        if (!isValidBirthdate(birthdate)) {
            showErrorMessage('Data de nascimento inválida!');
            return;
        }

        if (users.find(u => u.matricula === matricula)) {
            showErrorMessage('Essa matrícula já está cadastrada!');
            return;
        }

        // Cadastro no Firebase Auth
        try {
            // Verificar se o Firebase está configurado corretamente
            if (!auth) {
                showErrorMessage('Erro de configuração do Firebase. Verifique a chave de API.');
                return;
            }
            
            const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
            const user = userCredential.user;

            // Salvar no Firestore
            const userData = {
                matricula,
                name,
                birthdate,
                secretQuestion,
                secretAnswer,
                email: fakeEmail,
                createdAt: serverTimestamp()
            };
            
            await addDoc(collection(db, "users"), userData);
            
            // Registrar atividade de cadastro
            loginLogs.push({ 
                name: name, 
                date: new Date().toLocaleString(), 
                via: 'Cadastro' 
            });
            await saveLogs();
            
            showSuccessMessage('Cadastro realizado com sucesso!');
            e.target.reset();
            
            // Alternar para a aba de login após o cadastro
            const loginTab = document.querySelector('.tab:nth-child(1)');
            if (loginTab) {
                switchTab('login', loginTab);
            }
        } catch (error) {
            console.error("Erro ao cadastrar:", error.message);
            showErrorMessage(`Erro ao cadastrar: ${error.message}`);
        }
    });

    // Login
    document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const matricula = document.getElementById('login-matricula').value;
        const password = document.getElementById('login-password').value;
        
        // Criar e-mail fictício a partir da matrícula
        const fakeEmail = `${matricula}@universidade.com`;

        try {
            // Verificar se o Firebase está configurado corretamente
            if (!auth) {
                showErrorMessage('Erro de configuração do Firebase. Verifique a chave de API.');
                return;
            }
            
            const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, password);
            currentUser = userCredential.user;
            
            // Buscar nome do usuário no Firestore
            const userQuery = query(collection(db, "users"), where("matricula", "==", matricula));
            const userSnapshot = await getDocs(userQuery);
            const userName = userSnapshot.docs[0]?.data()?.name || 'Usuário';
            
            // Registrar atividade de login
            loginLogs.push({ 
                name: userName, 
                date: new Date().toLocaleString(), 
                via: 'Login' 
            });
            await saveLogs();
            
            showSuccessMessage(`Login realizado com sucesso! Bem-vindo, ${userName}!`);
            e.target.reset();
        } catch (error) {
            console.error('Erro no login:', error);
            showErrorMessage('Matrícula ou senha incorretos!');
        }
    });

    // Recuperação de Senha
    document.getElementById('forgotPasswordFormElement')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('forgot-name').value;
        const matricula = document.getElementById('forgot-matricula').value;
        const birthdate = document.getElementById('forgot-birthdate').value;
        const secretQuestion = document.getElementById('forgot-secret-question').value;
        const secretAnswer = document.getElementById('forgot-secret-answer').value;

        const user = users.find(u => u.name === name && u.matricula === matricula && u.birthdate === birthdate);

        if (user && user.secretQuestion === secretQuestion && user.secretAnswer === secretAnswer) {
            showSuccessMessage('Perguntas respondidas corretamente! Você pode redefinir sua senha.');
            
            // Registrar atividade de recuperação de senha
            loginLogs.push({ 
                name: name, 
                date: new Date().toLocaleString(), 
                via: 'Recuperação de Senha' 
            });
            await saveLogs();
        } else {
            showErrorMessage('Alguma resposta está incorreta. Tente novamente.');
        }
    });

    // Admin Login
    document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-password').value;

        if (user === 'adm123' && pass === 'admlogin123') {
            showSuccessMessage('Login administrativo bem-sucedido!');
            
            // Registrar atividade de login administrativo
            loginLogs.push({ 
                name: 'Administrador', 
                date: new Date().toLocaleString(), 
                via: 'Login Admin' 
            });
            await saveLogs();
            
            const panel = document.getElementById('adminPanel');
            const logList = document.getElementById('activityLog');
            logList.innerHTML = '';

            // Carregar logs do Firestore
            const logs = await loadLogs();
            
            if (logs.length === 0) {
                logList.innerHTML = '<li>Nenhuma atividade registrada.</li>';
            } else {
                logs.forEach(log => {
                    const item = document.createElement('li');
                    item.textContent = `${log.date} - ${log.name} (${log.via})`;
                    logList.appendChild(item);
                });
            }

            panel.style.display = 'block';
        } else {
            showErrorMessage('Usuário ou senha administrativa incorretos!');
        }
    });
});
