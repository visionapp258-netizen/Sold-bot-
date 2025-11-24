const fs = require('fs');
const path = require('path');

const ensure = (file)=>{
  const fp = path.join(__dirname, file);
  if(!fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
  return fp;
}

const load = (file) => {
  const fp = ensure(file);
  try {
    return JSON.parse(fs.readFileSync(fp));
  } catch(e){
    return [];
  }
};

const save = (file, data) => {
  const fp = ensure(file);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
};

module.exports = { load, save };