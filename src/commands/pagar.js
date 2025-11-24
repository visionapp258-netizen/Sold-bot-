const { load, save } = require('../database/db');
module.exports = async (sock, msg, from, user, text) => {
  const compras = load('compras.json');
  compras.push({
    id: compras.length + 1,
    user,
    text,
    timestamp: Date.now()
  });
  save('compras.json', compras);
  await sock.sendMessage(from, { text: 'Comprovativo recebido. Obrigado.' });
};