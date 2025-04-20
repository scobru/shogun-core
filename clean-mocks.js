const fs = require("fs");
const path = require("path");

/**
 * Script per rimuovere i mock duplicati nella directory dist
 */
function cleanDistMocks() {
  const distMocksPath = path.join(__dirname, "dist", "__mocks__");
  const cjsMocksPath = path.join(__dirname, "dist", "cjs", "__mocks__");

  console.log("Rimozione dei mock duplicati...");

  // Rimuove la directory mocks nella build dist se esiste
  if (fs.existsSync(distMocksPath)) {
    console.log(`Rimozione mock in: ${distMocksPath}`);
    deleteDirectory(distMocksPath);
  }

  // Rimuove la directory mocks nella build cjs se esiste
  if (fs.existsSync(cjsMocksPath)) {
    console.log(`Rimozione mock in: ${cjsMocksPath}`);
    deleteDirectory(cjsMocksPath);
  }

  console.log("Operazione completata!");
}

/**
 * Elimina una directory e il suo contenuto
 */
function deleteDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const currentPath = path.join(directoryPath, file);
      if (fs.lstatSync(currentPath).isDirectory()) {
        deleteDirectory(currentPath);
      } else {
        fs.unlinkSync(currentPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

// Esegui la pulizia
cleanDistMocks();
