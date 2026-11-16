# Sistema Acadêmico JIAD

Aplicação mobile desenvolvida como projeto acadêmico para a disciplina de Desenvolvimento Mobile, utilizando React Native e Expo.

## Sobre o projeto

O **Sistema Acadêmico JIAD** é um projeto voltado ao desenvolvimento de uma aplicação para dispositivos móveis, utilizando tecnologias do ecossistema JavaScript e React Native.

O objetivo do repositório é organizar o desenvolvimento da aplicação, permitindo sua execução em diferentes plataformas.

## Tecnologias utilizadas

- **React Native** — desenvolvimento de interfaces mobile.
- **Expo SDK 54** — ambiente e ferramentas para desenvolvimento.
- **TypeScript** — tipagem estática e maior segurança no desenvolvimento.
- **React 19** — construção de interfaces.
- **Expo Router 6** — estrutura de navegação da aplicação.
- **React Native Web** — suporte à execução no navegador.
- **Node.js e npm** — gerenciamento do ambiente e das dependências.

## Pré-requisitos

Antes de executar o projeto, instale:

- [Node.js](https://nodejs.org/) — preferencialmente a versão LTS.
- [Git](https://git-scm.com/) — para clonar o repositório.
- [Visual Studio Code](https://code.visualstudio.com/) — editor recomendado.
- [Expo Go](https://expo.dev/go) — para executar a aplicação em um dispositivo Android ou iOS.

Para utilizar um emulador Android, também é necessário instalar o Android Studio e configurar um dispositivo virtual.

## Instalação

### 1. Clonar o repositório

Abra o terminal e execute:

```bash
git clone https://github.com/andrewgoncalvesabreu/Sistema-Acad-mico---JIAD.git
```

### 2. Acessar a pasta do projeto

```bash
cd Sistema-Acad-mico---JIAD
```

### 3. Instalar as dependências

```bash
npm ci
```

Esse comando instala as dependências utilizando as versões registradas no arquivo `package-lock.json`.

## Executando a aplicação

### Iniciar o ambiente de desenvolvimento

```bash
npx expo start
```

Após a inicialização, o Expo apresentará um QR Code no terminal.

### Android

1. Instale o aplicativo Expo Go no celular.
2. Conecte o celular e o computador à mesma rede Wi-Fi.
3. Execute `npx expo start`.
4. Abra o Expo Go e escaneie o QR Code apresentado.

### iOS

1. Instale o Expo Go no dispositivo.
2. Execute `npx expo start`.
3. Escaneie o QR Code utilizando a câmera do dispositivo ou o Expo Go.

### Navegador

Para executar a versão web:

```bash
npx expo start --web
```

### Emulador Android

Com o emulador Android aberto e configurado:

```bash
npx expo start --android
```

## Scripts disponíveis

O projeto disponibiliza os seguintes comandos no `package.json`:

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o Expo |
| `npm run android` | Inicia o projeto no Android |
| `npm run ios` | Inicia o projeto no iOS |
| `npm run web` | Inicia o projeto no navegador |

## Estrutura do projeto

A organização identificada no repositório inclui:

```text
Sistema-Academico---JIAD/
│
├── assets/
│   └── images/          # Recursos de imagem
│
├── src/                 # Código-fonte da aplicação
│
├── App.tsx              # Componente principal
├── index.ts             # Registro da aplicação
├── app.json             # Configurações do Expo
├── package.json         # Dependências e scripts
├── package-lock.json    # Controle das versões instaladas
├── tsconfig.json        # Configurações do TypeScript
└── AGENTS.md            # Orientações para desenvolvimento
```

## Desenvolvimento

Para adicionar novas dependências ao projeto, recomenda-se utilizar o comando:

```bash
npx expo install nome-do-pacote
```

Esse comando ajuda a instalar versões compatíveis com a versão do Expo utilizada.

Para iniciar o ambiente de desenvolvimento:

```bash
npx expo start
```

Durante a execução, o Expo permite acompanhar as alterações realizadas no código e visualizar as atualizações no dispositivo ou emulador.

## Considerações

O projeto utiliza Expo SDK 54 e React Native 0.81.5, conforme as dependências declaradas no `package.json`.

A estrutura e as funcionalidades da aplicação podem evoluir conforme o desenvolvimento do Sistema Acadêmico JIAD.

## Repositório

[GitHub — Sistema Acadêmico JIAD](https://github.com/andrewgoncalvesabreu/Sistema-Acad-mico---JIAD)
