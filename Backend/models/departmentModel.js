const db = require('../db');

// Table creation
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
    if (err) console.error('❌ Error creating adddepartment table:', err.message);
    else console.log('✅ adddepartment table ready');
  });
};

// Insert query
const Department = {
  getAll: (callback) => {
    db.query('SELECT * FROM adddepartment ORDER BY sequence ASC', callback);
  },

  create: (name, callback) => {
    // Get the max sequence value
    db.query('SELECT MAX(sequence) AS maxSeq FROM adddepartment', (err, result) => {
      if (err) return callback(err);

      const nextSeq = (result[0].maxSeq || 0) + 1;
      db.query(
        'INSERT INTO adddepartment (department_name, sequence) VALUES (?, ?)',
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
          'UPDATE adddepartment SET sequence = ? WHERE id = ?',
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
};


module.exports = {Department ,createDepartmentTable} ;
