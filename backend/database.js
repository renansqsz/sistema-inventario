const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'inventory.db');
const defaultEmployees = [
  { nome: 'Ana Clara Souza', escritorio: 'CampSoft' },
  { nome: 'Bruno Almeida', escritorio: 'CampSoft' },
  { nome: 'Camila Ferreira', escritorio: 'CampSoft' },
  { nome: 'Daniel Martins', escritorio: 'CampSoft' },
  { nome: 'Eduarda Lima', escritorio: 'CampSoft' },
  { nome: 'Felipe Rocha', escritorio: 'CampSoft' },
  { nome: 'Gabriela Santos', escritorio: 'CampSoft' },
  { nome: 'Henrique Costa', escritorio: 'CampSoft' },
  { nome: 'Isabela Ribeiro', escritorio: 'CampSoft' },
  { nome: 'Joao Pedro Gomes', escritorio: 'CampSoft' },
  { nome: 'Karina Araujo', escritorio: 'CampSoft' },
  { nome: 'Lucas Barbosa', escritorio: 'CampSoft' },
  { nome: 'Mariana Duarte', escritorio: 'CampSoft' },
  { nome: 'Nicolas Teixeira', escritorio: 'CampSoft' },
  { nome: 'Priscila Moura', escritorio: 'CampSoft' },
  { nome: 'Rafael Carvalho', escritorio: 'Tocalivros' },
  { nome: 'Sabrina Mendes', escritorio: 'Tocalivros' },
  { nome: 'Thiago Oliveira', escritorio: 'Tocalivros' },
  { nome: 'Ursula Silva', escritorio: 'Tocalivros' },
  { nome: 'Vinicius Lopes', escritorio: 'Tocalivros' },
  { nome: 'Wellington Nunes', escritorio: 'Tocalivros' },
  { nome: 'Yasmin Castro', escritorio: 'Tocalivros' },
  { nome: 'Andre Farias', escritorio: 'Tocalivros' },
  { nome: 'Bianca Rezende', escritorio: 'Tocalivros' },
  { nome: 'Caio Batista', escritorio: 'Tocalivros' },
  { nome: 'Debora Matos', escritorio: 'Tocalivros' },
  { nome: 'Erica Pires', escritorio: 'Tocalivros' },
  { nome: 'Gustavo Melo', escritorio: 'Tocalivros' },
  { nome: 'Helena Cardoso', escritorio: 'Tocalivros' },
  { nome: 'Igor Freitas', escritorio: 'Tocalivros' }
];

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `);

    const bcrypt = require('bcrypt');
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
      if (err) {
        console.error('Erro ao verificar usuario padrao:', err.message);
        return;
      }

      if (!row) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO users (username, password) VALUES ('admin', ?)", [hash]);
        console.log('Usuario padrao criado: admin / admin123');
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS equipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        serialNumber TEXT,
        totalQuantity INTEGER NOT NULL,
        availableQuantity INTEGER NOT NULL,
        location TEXT,
        entryDate TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS notebooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        serialNumber TEXT,
        processor TEXT,
        gpu TEXT,
        screenSize TEXT,
        ramTotal INTEGER NOT NULL,
        ramSticks INTEGER,
        storageType TEXT,
        storageCapacity TEXT,
        condition TEXT,
        location TEXT,
        status TEXT NOT NULL,
        entryDate TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Funcionarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        escritorio TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS equipment_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipmentId INTEGER NOT NULL,
        equipmentName TEXT NOT NULL,
        employeeId INTEGER NOT NULL,
        employeeName TEXT NOT NULL,
        office TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        movementType TEXT NOT NULL DEFAULT 'Atribuicao',
        createdAt TEXT NOT NULL
      )
    `);

    db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
      if (err) {
        console.error('Erro ao verificar categorias:', err.message);
        return;
      }

      if (row && row.count === 0) {
        const defaultCategories = ['Mouse', 'Teclado', 'Notebook', 'Monitor', 'Webcam', 'TV', 'Impressora', 'Outros'];
        const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
        defaultCategories.forEach((category) => {
          stmt.run(category);
        });
        stmt.finalize();
        console.log('Categorias padrao criadas.');
      }
    });

    db.get('SELECT COUNT(*) as count FROM Funcionarios', (err, row) => {
      if (err) {
        console.error('Erro ao verificar funcionarios:', err.message);
        return;
      }

      if (row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO Funcionarios (nome, escritorio) VALUES (?, ?)');
        defaultEmployees.forEach(({ nome, escritorio }) => {
          stmt.run(nome, escritorio);
        });
        stmt.finalize();
        console.log('Funcionarios padrao criados.');
      }
    });
  });
}

module.exports = db;
