# Sistema de Autenticação

Este é um sistema de autenticação web que oferece múltiplas formas de login, incluindo autenticação por email/senha e reconhecimento facial.

## Funcionalidades

- Login com email e senha
- Registro de novos usuários
- Autenticação por reconhecimento facial (Face ID)
- Log de atividades dos usuários
- Interface moderna e responsiva

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore
- Web APIs (MediaDevices para câmera)

## Configuração

1. Clone o repositório
2. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Substitua as configurações no arquivo `firebase.js` com as suas credenciais
3. Abra o arquivo `index.html` em um servidor web local

## Estrutura do Projeto

```
test/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── firebase.js
└── README.md
```

## Como Usar

1. **Login com Email/Senha**
   - Digite seu email e senha
   - Clique em "Entrar"

2. **Registro de Novo Usuário**
   - Preencha nome, email e senha
   - Clique em "Registrar"

3. **Face ID**
   - Clique na aba "Face ID"
   - Permita o acesso à câmera
   - Aguarde o reconhecimento facial

## Segurança

- Todas as senhas são criptografadas pelo Firebase
- Os dados são armazenados de forma segura no Firestore
- O acesso à câmera é solicitado apenas quando necessário

## Contribuição

Sinta-se à vontade para contribuir com o projeto. Abra uma issue ou envie um pull request.

## Licença

Este projeto está sob a licença MIT. 