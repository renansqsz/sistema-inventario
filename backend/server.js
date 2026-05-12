const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const exceljs = require('exceljs');
const db = require('./database');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-inventario';
const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;
const NEWS_FEEDS = [
  {
    type: 'IA',
    url: 'https://news.google.com/rss/search?q=inteligencia+artificial&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'
  }
];
let newsCache = {
  items: [],
  updatedAt: 0
};
const TECH_BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80'
];

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API do Sistema de Inventario rodando! Acesse o frontend na porta 5173.');
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token nao fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalido' });
    }

    req.user = user;
    next();
  });
};

const calculateStatus = (availableQty) => {
  return Number(availableQty) > 0 ? 'Em estoque' : 'Em falta';
};

const rollbackTransaction = (res, statusCode, message, err) => {
  if (err) {
    console.error(message, err.message);
  }

  db.run('ROLLBACK', (rollbackErr) => {
    if (rollbackErr) {
      console.error('Erro no rollback da atribuicao:', rollbackErr.message);
    }

    res.status(statusCode).json({ error: message });
  });
};

const HTML_ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&apos;': "'",
  '&mdash;': '-',
  '&ndash;': '-',
  '&hellip;': '...'
};

const decodeXmlEntities = (value = '') => {
  let decoded = String(value).replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');

  for (let index = 0; index < 3; index += 1) {
    let nextValue = decoded;

    Object.entries(HTML_ENTITY_MAP).forEach(([entity, replacement]) => {
      nextValue = nextValue.replace(new RegExp(entity, 'gi'), replacement);
    });

    nextValue = nextValue
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

    if (nextValue === decoded) {
      break;
    }

    decoded = nextValue;
  }

  return decoded.trim();
};

const stripHtml = (value = '') =>
  decodeXmlEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/&lt;\/?[^&]+&gt;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s-\s(?:Google News|UOL|G1|Canaltech|Tecnoblog|Exame|Olhar Digital)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const extractTagValue = (source, tagName) => {
  const match = source.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? match[1] : '';
};

const parseRssItems = (xml, type) => {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return itemMatches.map((item, index) => {
    const title = stripHtml(extractTagValue(item, 'title'));
    const link = decodeXmlEntities(extractTagValue(item, 'link'));
    const description = stripHtml(extractTagValue(item, 'description'));
    const pubDate = stripHtml(extractTagValue(item, 'pubDate'));
    const image = TECH_BANNER_IMAGES[index % TECH_BANNER_IMAGES.length];

    return {
      title,
      link,
      description: description || 'Leia a cobertura completa para acompanhar a atualizacao.',
      pubDate,
      category: type,
      image
    };
  });
};

const fetchNewsFeed = async ({ type, url, image }) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'inventory-system-news-bot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar feed ${type}: ${response.status}`);
  }

  const xml = await response.text();
  return parseRssItems(xml, type, image);
};

const getFreshNews = async () => {
  const now = Date.now();
  if (newsCache.items.length > 0 && now - newsCache.updatedAt < NEWS_CACHE_TTL_MS) {
    return newsCache;
  }

  const feedResults = await Promise.all(NEWS_FEEDS.map(fetchNewsFeed));
  const items = feedResults
    .flat()
    .filter((item) => item.title && item.link)
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
    .slice(0, 3);

  newsCache = {
    items,
    updatedAt: now
  };

  return newsCache;
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuario nao encontrado' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username });
  });
});

app.get('/api/equipments', authenticateToken, (req, res) => {
  db.all('SELECT * FROM equipments ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

app.post('/api/equipments', authenticateToken, (req, res) => {
  const {
    name,
    category,
    brand,
    model,
    serialNumber,
    totalQuantity,
    availableQuantity,
    location,
    entryDate
  } = req.body;

  const status = calculateStatus(availableQuantity);
  const query = `
    INSERT INTO equipments (
      name,
      category,
      brand,
      model,
      serialNumber,
      totalQuantity,
      availableQuantity,
      location,
      entryDate,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      name,
      category,
      brand,
      model,
      serialNumber,
      totalQuantity,
      availableQuantity,
      location,
      entryDate,
      status
    ],
    function insertEquipment(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, ...req.body, status });
    }
  );
});

app.put('/api/equipments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    brand,
    model,
    serialNumber,
    totalQuantity,
    availableQuantity,
    location,
    entryDate
  } = req.body;

  const status = calculateStatus(availableQuantity);
  const query = `
    UPDATE equipments
    SET
      name = ?,
      category = ?,
      brand = ?,
      model = ?,
      serialNumber = ?,
      totalQuantity = ?,
      availableQuantity = ?,
      location = ?,
      entryDate = ?,
      status = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [
      name,
      category,
      brand,
      model,
      serialNumber,
      totalQuantity,
      availableQuantity,
      location,
      entryDate,
      status,
      id
    ],
    function updateEquipment(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Equipamento nao encontrado' });
      }

      res.json({ id: Number(id), ...req.body, status });
    }
  );
});

app.delete('/api/equipments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM equipments WHERE id = ?', [id], function deleteEquipment(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Equipamento nao encontrado' });
    }

    res.json({ message: 'Equipamento deletado com sucesso' });
  });
});

app.get('/api/employees', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, nome, escritorio FROM Funcionarios ORDER BY escritorio ASC, nome ASC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

app.post('/api/employees', authenticateToken, (req, res) => {
  const { nome, escritorio } = req.body;

  if (!nome || !escritorio) {
    return res.status(400).json({ error: 'Nome e escritorio sao obrigatorios' });
  }

  db.run(
    'INSERT INTO Funcionarios (nome, escritorio) VALUES (?, ?)',
    [nome, escritorio],
    function insertEmployee(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, nome, escritorio });
    }
  );
});

app.put('/api/employees/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { nome, escritorio } = req.body;

  if (!nome || !escritorio) {
    return res.status(400).json({ error: 'Nome e escritorio sao obrigatorios' });
  }

  db.run(
    'UPDATE Funcionarios SET nome = ?, escritorio = ? WHERE id = ?',
    [nome, escritorio, id],
    function updateEmployee(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Funcionario nao encontrado' });
      }

      res.json({ id: Number(id), nome, escritorio });
    }
  );
});

app.delete('/api/employees/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM Funcionarios WHERE id = ?', [id], function deleteEmployee(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Funcionario nao encontrado' });
    }

    res.json({ message: 'Funcionario deletado com sucesso' });
  });
});

app.get('/api/offices', authenticateToken, (req, res) => {
  db.all(
    'SELECT DISTINCT escritorio FROM Funcionarios ORDER BY escritorio ASC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows.map((row) => row.escritorio));
    }
  );
});



app.get('/api/employees/with-assignments', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      f.id as employeeId, 
      f.nome, 
      f.escritorio,
      ea.id as assignmentId,
      ea.equipmentId,
      ea.equipmentName,
      ea.quantity,
      ea.movementType
    FROM Funcionarios f
    LEFT JOIN equipment_assignments ea ON f.id = ea.employeeId
    ORDER BY f.escritorio ASC, f.nome ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const employeesMap = {};
    rows.forEach((row) => {
      if (!employeesMap[row.employeeId]) {
        employeesMap[row.employeeId] = {
          id: row.employeeId,
          nome: row.nome,
          escritorio: row.escritorio,
          items: []
        };
      }
      if (row.equipmentName) {
        employeesMap[row.employeeId].items.push({
          assignmentId: row.assignmentId,
          equipmentId: row.equipmentId,
          name: row.equipmentName,
          quantity: row.quantity,
          type: row.movementType
        });
      }
    });

    res.json(Object.values(employeesMap));
  });
});

app.post('/api/employees/:id/unassign', authenticateToken, (req, res) => {
  const employeeId = Number(req.params.id);
  const { equipmentId, quantity, unassignAll } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    if (unassignAll) {
      // Unassign everything for this employee
      db.all('SELECT equipmentId, quantity FROM equipment_assignments WHERE employeeId = ?', [employeeId], (err, rows) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        if (rows.length === 0) {
          db.run('COMMIT');
          return res.json({ message: 'Nenhum item para desatribuir' });
        }

        // Update each equipment stock
        let completed = 0;
        rows.forEach(row => {
          db.run(
            'UPDATE equipments SET availableQuantity = availableQuantity + ?, status = CASE WHEN availableQuantity + ? > 0 THEN "Em estoque" ELSE status END WHERE id = ?',
            [row.quantity, row.quantity, row.equipmentId],
            () => {
              completed++;
              if (completed === rows.length) {
                db.run('DELETE FROM equipment_assignments WHERE employeeId = ?', [employeeId], (delErr) => {
                  if (delErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: delErr.message });
                  }
                  db.run('COMMIT');
                  res.json({ message: 'Todos os itens foram desatribuidos' });
                });
              }
            }
          );
        });
      });
    } else {
      // Unassign specific item
      if (!equipmentId || !quantity) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'ID do equipamento e quantidade sao obrigatorios' });
      }

      db.all('SELECT id, quantity FROM equipment_assignments WHERE employeeId = ? AND equipmentId = ?', [employeeId, equipmentId], (err, rows) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        const totalAssigned = rows.reduce((sum, r) => sum + r.quantity, 0);
        if (totalAssigned < quantity) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Quantidade informada maior que a possuida' });
        }

        // Logic to reduce quantity: delete or update records
        let remainingToUnassign = quantity;
        rows.forEach(row => {
          if (remainingToUnassign <= 0) return;
          
          if (row.quantity <= remainingToUnassign) {
            remainingToUnassign -= row.quantity;
            db.run('DELETE FROM equipment_assignments WHERE id = ?', [row.id]);
          } else {
            db.run('UPDATE equipment_assignments SET quantity = quantity - ? WHERE id = ?', [remainingToUnassign, row.id]);
            remainingToUnassign = 0;
          }
        });

        db.run(
          'UPDATE equipments SET availableQuantity = availableQuantity + ?, status = "Em estoque" WHERE id = ?',
          [quantity, equipmentId],
          (upErr) => {
            if (upErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: upErr.message });
            }
            db.run('COMMIT');
            res.json({ message: 'Item desatribuido com sucesso' });
          }
        );
      });
    }
  });
});

app.post('/api/equipments/:id/assignments', authenticateToken, (req, res) => {
  const equipmentId = Number(req.params.id);
  const employeeId = Number(req.body.employeeId);
  const quantity = Number(req.body.quantity);
  const office = String(req.body.office || '').trim();

  if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
    return res.status(400).json({ error: 'Equipamento invalido' });
  }

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ error: 'Funcionario invalido' });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantidade invalida' });
  }

  if (!office) {
    return res.status(400).json({ error: 'Escritorio obrigatorio' });
  }

  db.get(
    'SELECT id, name, availableQuantity FROM equipments WHERE id = ?',
    [equipmentId],
    (equipmentErr, equipment) => {
      if (equipmentErr) {
        return res.status(500).json({ error: equipmentErr.message });
      }

      if (!equipment) {
        return res.status(404).json({ error: 'Equipamento nao encontrado' });
      }

      db.get(
        'SELECT id, nome, escritorio FROM Funcionarios WHERE id = ?',
        [employeeId],
        (employeeErr, employee) => {
          if (employeeErr) {
            return res.status(500).json({ error: employeeErr.message });
          }

          if (!employee) {
            return res.status(404).json({ error: 'Funcionario nao encontrado' });
          }

          if (employee.escritorio !== office) {
            return res.status(400).json({
              error: 'O escritorio selecionado nao corresponde ao funcionario informado'
            });
          }

          if (Number(equipment.availableQuantity) < quantity) {
            return res.status(400).json({
              error: 'Quantidade indisponivel para atribuicao'
            });
          }

          const nextAvailableQuantity = Number(equipment.availableQuantity) - quantity;
          const nextStatus = calculateStatus(nextAvailableQuantity);
          const createdAt = new Date().toISOString();

          db.run('BEGIN TRANSACTION', (beginErr) => {
            if (beginErr) {
              return res.status(500).json({ error: beginErr.message });
            }

            db.run(
              'UPDATE equipments SET availableQuantity = ?, status = ? WHERE id = ?',
              [nextAvailableQuantity, nextStatus, equipmentId],
              function updateAvailability(updateErr) {
                if (updateErr) {
                  return rollbackTransaction(
                    res,
                    500,
                    'Erro ao atualizar estoque do equipamento',
                    updateErr
                  );
                }

                db.run(
                  `
                    INSERT INTO equipment_assignments (
                      equipmentId,
                      equipmentName,
                      employeeId,
                      employeeName,
                      office,
                      quantity,
                      movementType,
                      createdAt
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  `,
                  [
                    equipment.id,
                    equipment.name,
                    employee.id,
                    employee.nome,
                    office,
                    quantity,
                    'Atribuicao',
                    createdAt
                  ],
                  function insertAssignment(insertErr) {
                    if (insertErr) {
                      return rollbackTransaction(
                        res,
                        500,
                        'Erro ao registrar atribuicao do equipamento',
                        insertErr
                      );
                    }

                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        return rollbackTransaction(
                          res,
                          500,
                          'Erro ao concluir atribuicao do equipamento',
                          commitErr
                        );
                      }

                      res.status(201).json({
                        id: this.lastID,
                        equipmentId: equipment.id,
                        equipmentName: equipment.name,
                        employeeId: employee.id,
                        employeeName: employee.nome,
                        office,
                        quantity,
                        movementType: 'Atribuicao',
                        createdAt,
                        remainingQuantity: nextAvailableQuantity,
                        status: nextStatus
                      });
                    });
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

app.get('/api/equipments/:id/history', authenticateToken, (req, res) => {
  const equipmentId = Number(req.params.id);

  if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
    return res.status(400).json({ error: 'Equipamento invalido' });
  }

  db.all(
    `
      SELECT
        id,
        equipmentId,
        equipmentName,
        employeeId,
        employeeName,
        office,
        quantity,
        movementType,
        createdAt
      FROM equipment_assignments
      WHERE equipmentId = ?
      ORDER BY createdAt DESC, id DESC
    `,
    [equipmentId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

app.get('/api/notebooks', authenticateToken, (req, res) => {
  db.all('SELECT * FROM notebooks ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

app.post('/api/notebooks', authenticateToken, (req, res) => {
  const {
    brand,
    model,
    serialNumber,
    processor,
    gpu,
    screenSize,
    ramTotal,
    ramSticks,
    storageType,
    storageCapacity,
    condition,
    location,
    entryDate,
    status
  } = req.body;

  const query = `
    INSERT INTO notebooks (
      brand,
      model,
      serialNumber,
      processor,
      gpu,
      screenSize,
      ramTotal,
      ramSticks,
      storageType,
      storageCapacity,
      condition,
      location,
      entryDate,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      brand,
      model,
      serialNumber,
      processor,
      gpu,
      screenSize,
      ramTotal,
      ramSticks,
      storageType,
      storageCapacity,
      condition,
      location,
      entryDate,
      status
    ],
    function insertNotebook(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, ...req.body });
    }
  );
});

app.put('/api/notebooks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    brand,
    model,
    serialNumber,
    processor,
    gpu,
    screenSize,
    ramTotal,
    ramSticks,
    storageType,
    storageCapacity,
    condition,
    location,
    entryDate,
    status
  } = req.body;

  const query = `
    UPDATE notebooks
    SET
      brand = ?,
      model = ?,
      serialNumber = ?,
      processor = ?,
      gpu = ?,
      screenSize = ?,
      ramTotal = ?,
      ramSticks = ?,
      storageType = ?,
      storageCapacity = ?,
      condition = ?,
      location = ?,
      entryDate = ?,
      status = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [
      brand,
      model,
      serialNumber,
      processor,
      gpu,
      screenSize,
      ramTotal,
      ramSticks,
      storageType,
      storageCapacity,
      condition,
      location,
      entryDate,
      status,
      id
    ],
    function updateNotebook(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notebook nao encontrado' });
      }

      res.json({ id: Number(id), ...req.body });
    }
  );
});

app.delete('/api/notebooks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM notebooks WHERE id = ?', [id], function deleteNotebook(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Notebook nao encontrado' });
    }

    res.json({ message: 'Notebook deletado com sucesso' });
  });
});

app.get('/api/reports/excel', authenticateToken, async (req, res) => {
  db.all('SELECT * FROM equipments ORDER BY category, name', [], async (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Inventario de TI');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome do Produto', key: 'name', width: 30 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Marca', key: 'brand', width: 20 },
      { header: 'Modelo', key: 'model', width: 20 },
      { header: 'Numero de Serie', key: 'serialNumber', width: 20 },
      { header: 'Qtd Total', key: 'totalQuantity', width: 15 },
      { header: 'Qtd Disponivel', key: 'availableQuantity', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Localizacao', key: 'location', width: 20 },
      { header: 'Data de Entrada', key: 'entryDate', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0052CC' }
    };

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=inventario_ti.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  });
});

app.get('/api/reports/notebooks/excel', authenticateToken, async (req, res) => {
  db.all('SELECT * FROM notebooks ORDER BY brand, model', [], async (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Inventario de Notebooks');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Marca', key: 'brand', width: 20 },
      { header: 'Modelo', key: 'model', width: 20 },
      { header: 'Numero de Serie', key: 'serialNumber', width: 20 },
      { header: 'Processador', key: 'processor', width: 30 },
      { header: 'Placa de Video', key: 'gpu', width: 25 },
      { header: 'Tela', key: 'screenSize', width: 15 },
      { header: 'RAM Total (GB)', key: 'ramTotal', width: 15 },
      { header: 'Pentes RAM', key: 'ramSticks', width: 15 },
      { header: 'Armazenamento', key: 'storageType', width: 15 },
      { header: 'Capacidade', key: 'storageCapacity', width: 15 },
      { header: 'Condicao', key: 'condition', width: 15 },
      { header: 'Localizacao', key: 'location', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Data de Entrada', key: 'entryDate', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0052CC' }
    };

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=inventario_notebooks.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  });
});

app.get('/api/reports/employees/excel', authenticateToken, async (req, res) => {
  db.all('SELECT * FROM Funcionarios ORDER BY escritorio, nome', [], async (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Lista de Colaboradores');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome', key: 'nome', width: 40 },
      { header: 'Escritorio', key: 'escritorio', width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0052CC' }
    };

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=colaboradores.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  });
});

app.get('/api/categories', authenticateToken, (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

app.get('/api/news', authenticateToken, async (req, res) => {
  try {
    const payload = await getFreshNews();
    res.json(payload);
  } catch (error) {
    console.error('Erro ao buscar noticias externas:', error.message);

    if (newsCache.items.length > 0) {
      return res.json(newsCache);
    }

    res.status(502).json({ error: 'Nao foi possivel carregar informativos externos' });
  }
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const name = String(req.body.name || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Nome da categoria e obrigatorio' });
  }

  db.run('INSERT INTO categories (name) VALUES (?)', [name], function insertCategory(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Categoria ja existe' });
      }

      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({ id: this.lastID, name });
  });
});

app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM categories WHERE id = ?', [id], function deleteCategory(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoria nao encontrada' });
    }

    res.json({ message: 'Categoria deletada com sucesso' });
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
