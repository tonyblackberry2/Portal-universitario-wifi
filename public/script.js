// Função para alternar entre as abas
function switchTab(tab, element) {
    // Verificar se o elemento existe
    if (!element) {
        console.error('Elemento da aba não fornecido');
        return;
    }
    
    try {
        // Remover a classe "active" das abas
        const tabs = document.querySelectorAll('.tab');
        if (tabs && tabs.length > 0) {
            tabs.forEach(t => t.classList.remove('active'));
            element.classList.add('active');
        }

        // Remover a classe "active" dos formulários
        const forms = document.querySelectorAll('.form-container');
        if (forms && forms.length > 0) {
            forms.forEach(f => f.classList.remove('active'));
        }
        
        // Casos especiais para IDs de formulários
        let formId = tab + 'Form';
        if (tab === 'faceid') {
            formId = 'faceIdForm';
        } else if (tab === 'forgotPassword') {
            formId = 'forgotPasswordForm';
        }
        
        const formElement = document.getElementById(formId);
        if (formElement) {
            formElement.classList.add('active');
        } else {
            console.error(`Formulário com ID "${formId}" não encontrado.`);
        }
    } catch (error) {
        console.error('Erro ao alternar abas:', error);
    }
}

// Expor a função switchTab globalmente
window.switchTab = switchTab;

// Variáveis globais
let users = [];
let currentUser = null;
let loginLogs = [];

// Variáveis globais para o reconhecimento facial
let isFaceDetectionRunning = false;

async function loadUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    users = querySnapshot.docs.map(doc => doc.data());
}

async function saveLogs() {
    const logCollection = collection(db, "loginLogs");
    for (const log of loginLogs) {
        await addDoc(logCollection, log);
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
                stopFaceDetection();
            }, 2000);
        } else {
            faceIdStatus.textContent = 'Nenhum rosto detectado. Tente novamente.';
        }
    } catch (error) {
        console.error('Erro ao detectar rosto:', error);
        faceIdStatus.textContent = 'Erro ao detectar rosto. Tente novamente.';
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

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    // Cadastro
    document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm-password').value;
        const birthdate = document.getElementById('register-birthdate').value;
        const secretQuestion = document.getElementById('register-secret-question').value;
        const secretAnswer = document.getElementById('register-secret-answer').value;

        // Verifica se as senhas coincidem
        if (password !== confirm) {
            alert('As senhas não coincidem!');
            return;
        }

        // Verifica se a data de nascimento é válida
        if (!isValidBirthdate(birthdate)) {
            alert('Data de nascimento inválida!');
            return;
        }

        const matricula = document.getElementById('register-matricula').value;
        if (users.find(u => u.matricula === matricula)) {
            alert('Essa matrícula já está cadastrada!');
            return;
        }

        // Cadastro no Firebase Auth
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, matricula, password);
            const user = userCredential.user;

            // Salvar no Firestore
            await addDoc(collection(db, "users"), {
                matricula,
                name: document.getElementById('register-name').value,
                birthdate,
                secretQuestion,
                secretAnswer
            });

            alert('Cadastro realizado com sucesso!');
            e.target.reset();
        } catch (error) {
            console.error("Erro ao cadastrar:", error.message);
            alert("Erro ao cadastrar");
        }
    });

    // Login
    document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const matricula = document.getElementById('login-matricula').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, matricula, password)
            .then(async (userCredential) => {
                currentUser = userCredential.user;
                loginLogs.push({ name: currentUser.displayName, date: new Date().toLocaleString(), via: 'Login' });
                await saveLogs();
                alert('Login realizado com sucesso!');
                e.target.reset();
            })
            .catch((error) => {
                console.error('Erro no login:', error);
                alert('Matrícula ou senha incorretos!');
            });
    });

    // Recuperação de Senha
    document.getElementById('forgotPasswordFormElement')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('forgot-name').value;
        const matricula = document.getElementById('forgot-matricula').value;
        const birthdate = document.getElementById('forgot-birthdate').value;
        const secretQuestion = document.getElementById('forgot-secret-question').value;
        const secretAnswer = document.getElementById('forgot-secret-answer').value;

        const user = users.find(u => u.name === name && u.matricula === matricula && u.birthdate === birthdate);

        if (user && user.secretQuestion === secretQuestion && user.secretAnswer === secretAnswer) {
            alert('Perguntas respondidas corretamente! Você pode redefinir sua senha.');
        } else {
            alert('Alguma resposta está incorreta. Tente novamente.');
        }
    });

    // Admin Login
    document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-password').value;

        if (user === 'adm123' && pass === 'admlogin123') {
            alert('Login administrativo bem-sucedido!');
            const panel = document.getElementById('adminPanel');
            const logList = document.getElementById('activityLog');
            logList.innerHTML = '';

            if (loginLogs.length === 0) {
                logList.innerHTML = '<li>Nenhuma atividade registrada.</li>';
            } else {
                loginLogs.forEach(log => {
                    const item = document.createElement('li');
                    item.textContent = `${log.date} - ${log.name} (${log.via})`;
                    logList.appendChild(item);
                });
            }

            panel.style.display = 'block';
        } else {
            alert('Usuário ou senha administrativa incorretos!');
        }
    });
});
