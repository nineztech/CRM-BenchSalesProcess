const db = require('../db');

const createDepartmentTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS adddepartment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      department_name VARCHAR(100),
      sequence_number INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(sql, (err) => {
    if (err) console.error('❌ Error creating table:', err.message);
    else console.log('✅ adddepartment table ready');
  });
};

const Department = {
  getAll: (callback) => {
    db.query('SELECT * FROM adddepartment ORDER BY sequence_number ASC', callback);
  },

  create: (name, callback) => {
    db.query('SELECT MAX(sequence_number) AS maxSeq FROM adddepartment', (err, result) => {
      if (err) return callback(err);
      const nextSeq = (result[0].maxSeq || 0) + 1;
      db.query(
        'INSERT INTO adddepartment (department_name, sequence_number) VALUES (?, ?)',
        [name, nextSeq],
        callback
      );
    });
  },

  deleteById: (id, callback) => {
    db.query('DELETE FROM adddepartment WHERE id = ?', [id], callback);
  },

  reorder: (orderedIds, callback) => {
    const queries = orderedIds.map((id, index) => {
      return new Promise((resolve, reject) => {
        db.query(
          'UPDATE adddepartment SET sequence_number = ? WHERE id = ?',
          [index + 1, id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });

    Promise.all(queries)
      .then(() => callback(null))
      .catch(callback);
  },

  update: (id, name, callback) => {
    db.query(
      'UPDATE adddepartment SET department_name = ? WHERE id = ?',
      [name, id],
      callback
    );
  },
};

module.exports = { Department, createDepartmentTable };
