/**
 * Meu-bot - entrypoint
 * Author: Dev Titos
 */
require('dotenv').config();
const start = require('./src/start');
start().catch(err=>{
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});