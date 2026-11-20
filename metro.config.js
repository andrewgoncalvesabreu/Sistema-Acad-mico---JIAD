const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O expo-sqlite na web usa um arquivo .wasm
config.resolver.assetExts.push('wasm');

// A versão web do SQLite usa SharedArrayBuffer, que exige estes cabeçalhos
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;