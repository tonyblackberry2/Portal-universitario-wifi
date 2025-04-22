import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, collection, addDoc, getDocs, query, where } from '../firebase.js';

let users = [];
let currentUser = null;
let loginLogs = [];

async function loadUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    users = querySnapshot.docs.map(doc => doc.data());
}

async function saveLogs() {
    const logCollection = collection(db, "loginLogs");
    loginLogs.forEach(async (log) => {
        await addDoc(logCollection, log);
    });
}

function switchTab(tab, element) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    document.getElementById(tab + 'Form').classList.add('active');
}

async function startFaceID() {
    // Código atual do Face ID, você pode manter ele como está.
}

function isValidBirthdate(birthdate) {
    const today = new Date();
    const age = today.getFullYear() - new Date(birthdate).getFullYear();
    return age <= 70 && new Date(birthdate) <= today;
}

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    // Cadastro
    document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm-password').value;
        const birthdate = document.getElementById('register-birthdate').value;
        const secretQuestion = document.getElementById('register-secret-question').value;
        const secretAnswer = document.getElementById('register-secret-answer').value;

        if (password !== confirm) {
            alert('As senhas não coincidem!');
            return;
        }

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
    document.getElementById('loginFormElement').addEventListener('submit', (e) => {
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
    document.getElementById('forgotPasswordFormElement').addEventListener('submit', (e) => {
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
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
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
