const fs = require("fs");
const path = require("path");

const MS2F_KEY = fs.readFileSync(path.join(__dirname, "MS2F/Key"));
const MS2F_IV = fs.readFileSync(path.join(__dirname, "MS2F/IV"));
const MS2F_XOR = fs.readFileSync(path.join(__dirname, "MS2F/XOR"));
const NS2F_KEY = fs.readFileSync(path.join(__dirname, "NS2F/Key"));
const NS2F_IV = fs.readFileSync(path.join(__dirname, "NS2F/IV"));
const NS2F_XOR = fs.readFileSync(path.join(__dirname, "NS2F/XOR"));
const OS2F_KEY = fs.readFileSync(path.join(__dirname, "OS2F/Key"));
const OS2F_IV = fs.readFileSync(path.join(__dirname, "OS2F/IV"));
const OS2F_XOR = fs.readFileSync(path.join(__dirname, "OS2F/XOR"));
const PS2F_KEY = fs.readFileSync(path.join(__dirname, "PS2F/Key"));
const PS2F_IV = fs.readFileSync(path.join(__dirname, "PS2F/IV"));
const PS2F_XOR = fs.readFileSync(path.join(__dirname, "PS2F/XOR"));

// Write the keys to a file as a TypeScript module but with the Buffer type
fs.writeFileSync(
  path.join(__dirname, "MS2F/Key.ts"),
  `export default Buffer.from([${MS2F_KEY.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "MS2F/IV.ts"),
  `export default Buffer.from([${MS2F_IV.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "MS2F/XOR.ts"),
  `export default Buffer.from([${MS2F_XOR.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "NS2F/Key.ts"),
  `export default Buffer.from([${NS2F_KEY.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "NS2F/IV.ts"),
  `export default Buffer.from([${NS2F_IV.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "NS2F/XOR.ts"),
  `export default Buffer.from([${NS2F_XOR.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "OS2F/Key.ts"),
  `export default Buffer.from([${OS2F_KEY.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "OS2F/IV.ts"),
  `export default Buffer.from([${OS2F_IV.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "OS2F/XOR.ts"),
  `export default Buffer.from([${OS2F_XOR.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "PS2F/Key.ts"),
  `export default Buffer.from([${PS2F_KEY.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "PS2F/IV.ts"),
  `export default Buffer.from([${PS2F_IV.toJSON().data}]);`
);
fs.writeFileSync(
  path.join(__dirname, "PS2F/XOR.ts"),
  `export default Buffer.from([${PS2F_XOR.toJSON().data}]);`
);
