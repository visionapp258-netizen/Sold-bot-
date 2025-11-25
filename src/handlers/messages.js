const { extractText } = require('../utils/parser');
const { load, save } = require('../database/db');
const tabela = require('../commands/tabela');
const comprar = require('../commands/comprar');
const pagar = require('../commands/pagar');
const info = require('../commands/info');
const { OWNER_NUMBER } = require('../config');

/**
 * Helper: check if participant is admin in the group
 * returns true if participant is admin or owner in group
 */
async function isParticipantAdmin(sock, groupId, participant) {
  try {
    const meta = await sock.groupMetadata(groupId);
    if(!meta || !meta.participants) return false;
    const p = meta.participants.find(x => x.id === participant);
    if(!p) return false;
    return !!(p.admin || p.isAdmin || p.isSuperAdmin || p.admin === 'superadmin' || p.admin === 'admin');
  } catch(e){
    return false;
  }
}

/**
 * Save client triggers to clients/<owner>.json
 */
function ensureClientFile(owner){
  const dir = './clients';
  const fp = `${dir}/${owner}.json`;
  const fs = require('fs');
  if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  if(!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify({ triggers: {} }, null, 2));
  return fp;
}

function loadClient(owner){
  const fs = require('fs');
  const fp = ensureClientFile(owner);
  return JSON.parse(fs.readFileSync(fp));
}

function saveClient(owner, data){
  const fs = require('fs');
  const fp = ensureClientFile(owner);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

module.exports = (sock) => {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if(!msg || !msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const user = msg.key.participant || msg.key.remoteJid;
    const textRaw = extractText(msg);
    const text = textRaw.toLowerCase().trim();

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

    // Comandos padrões
    if(text === 'tabela') return tabela(sock, from);
    if(text === 'comprar') return comprar(sock, from);
    if(text === 'info') return info(sock, from, user);

    const hasImage = !!msg?.message?.imageMessage;
    if(hasImage || text.includes('comprovativo') || text.includes('comprovante')){
      return pagar(sock, msg, from, user, text);
    }

    // ENSINAR comando: somente em grupos e quem ensina precisa ser admin
    // Sintaxe: .ensinar gatilho::resposta
    if(text.startsWith('.ensinar ')) {
      if(!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: 'Ensinar só é permitido em grupos e apenas por admins.'});
      }
      const sender = msg.key.participant || msg.key.remoteJid;
      const parts = textRaw.substr(9).split('::');
      if(parts.length < 2) return sock.sendMessage(from, { text: 'Formato inválido. Use: .ensinar gatilho::resposta' });
      const trigger = parts[0].trim().toLowerCase();
      const response = parts.slice(1).join('::').trim();
      // check admin status of sender
      const ok = await isParticipantAdmin(sock, from, sender);
      if(!ok) return sock.sendMessage(from, { text: 'Apenas administradores do grupo podem ensinar comandos.' });
      // treat sender as owner for their client file (owner number = sender without @...)
      const ownerNumber = sender.includes('@') ? sender.split('@')[0] : sender;
      const client = loadClient(ownerNumber);
      client.triggers[trigger] = response;
      saveClient(ownerNumber, client);
      await sock.sendMessage(from, { text: `Gatilho "${trigger}" salvo para o cliente ${ownerNumber}. Será executado apenas em grupos onde esse cliente é admin.`});
      return;
    }

    // Verifica triggers de todos os clientes; se houver match, só responde se o cliente dono do gatilho for admin neste grupo
    const fs = require('fs');
    const path = require('path');
    const clientsDir = path.join('.', 'clients');
    if(fs.existsSync(clientsDir)){
      const files = fs.readdirSync(clientsDir).filter(f=>f.endsWith('.json'));
      for(const f of files){
        try{
          const owner = f.replace('.json','');
          const data = JSON.parse(fs.readFileSync(path.join(clientsDir,f)));
          const triggers = data.triggers || {};
          for(const [trigger, resp] of Object.entries(triggers)){
            if(trigger === text){
              // check if owner is admin in this group
              const ownerJid = owner.includes('@') ? owner : (owner + '@s.whatsapp.net');
              const ownerIsAdmin = await isParticipantAdmin(sock, from, ownerJid);
              if(ownerIsAdmin){
                await sock.sendMessage(from, { text: resp });
                return;
              }
            }
          }
        } catch(e){}
      }
    }

    // Resposta padrão curta para privado
    if(!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: 'Comando não reconhecido. Digite *tabela* para ver opções.' });
    }
  });
};