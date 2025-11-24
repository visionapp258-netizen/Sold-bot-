const { extractText } = require('../utils/parser');
const { load, save } = require('../database/db');
const tabela = require('../commands/tabela');
const comprar = require('../commands/comprar');
const pagar = require('../commands/pagar');
const info = require('../commands/info');

module.exports = (sock) => {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if(!msg || !msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const user = msg.key.participant || msg.key.remoteJid;
    const text = extractText(msg).toLowerCase().trim();

    // Registro automático de usuário
    try {
      const users = load('users.json');
      const exists = users.find(u => u.id === user);
      if(!exists){
        const newUser = {
          id: user,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          pushname: msg.pushName || null,
          isGroup: from.endsWith('@g.us')
        };
        users.push(newUser);
        save('users.json', users);
        console.log('Novo usuário registrado:', newUser.id);
      } else {
        exists.lastSeen = Date.now();
        save('users.json', users);
      }
    } catch(e){
      console.error('Erro registro user', e);
    }

    // Comandos simples
    if(text === 'tabela') return tabela(sock, from);
    if(text === 'comprar') return comprar(sock, from);
    if(text === 'info') return info(sock, from, user);

    const hasImage = !!msg?.message?.imageMessage;
    if(hasImage || text.includes('comprovativo') || text.includes('comprovante')){
      return pagar(sock, msg, from, user, text);
    }

    // Mensagem padrão curta
    if(!from.endsWith('@g.us')) { // privado
      await sock.sendMessage(from, { text: 'Comando não reconhecido. Digite *tabela* para ver opções.' });
    }
  });
};