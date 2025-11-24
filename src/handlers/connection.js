module.exports = (sock, saveCreds) => {
  sock.ev.on('connection.update', (update)=>{
    const { connection, lastDisconnect } = update;
    if(connection === 'close'){
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== require('@whiskeysockets/baileys').DisconnectReason.loggedOut;
      console.log('Conexão fechada. Reconnect?', shouldReconnect);
      if(shouldReconnect){
        setTimeout(()=>require('../start')(),2000);
      }
    } else if(connection === 'open'){
      console.log('>>> BOT CONECTADO COM SUCESSO <<<');
    }
  });

  sock.ev.on('creds.update', saveCreds);
};