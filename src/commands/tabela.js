const { PAY_NUMBER } = require('../config');
module.exports = async(sock, from) => {
  const tabelaPrecos = `
*TABELA DE MEGAS - MOVITEL/VODACOM* 🇲🇿

📦 *Pacotes Diários:*
• 100MB - 10 MT
• 500MB - 25 MT

📦 *Pacotes Semanais:*
• 1GB - 80 MT
• 2GB - 150 MT

📦 *Pacotes Mensais:*
• 5GB - 350 MT
• 10GB - 600 MT

💳 *Pagamento:* M-Pesa / e-Mola: *${PAY_NUMBER}*
_Responda com "comprar" para prosseguir._
  `;
  await sock.sendMessage(from, { text: tabelaPrecos });
};