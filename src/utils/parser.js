function extractText(msg){
  return msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    '';
}
module.exports = { extractText };