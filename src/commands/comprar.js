module.exports = async(sock, from) => {
  await sock.sendMessage(from, { text: 'Para comprar, envie o valor para o número indicado e envie o comprovativo aqui.' });
};