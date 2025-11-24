const { load } = require('../database/db');
module.exports = async(sock, from, user) => {
  const all = load('compras.json').filter(x => x.user === user);
  await sock.sendMessage(from, { text: `Compras registradas: ${all.length}` });
};