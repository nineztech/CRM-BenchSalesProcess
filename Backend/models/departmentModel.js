const db = require('../db');

// Table creation
const createDepartmentTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS adddepartment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      department_name VARCHAR(100) NOT NULL UNIQUE,
      sequence_number INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sequence (sequence_number)
    )
  `;
  db.query(sql, (err) => {
    if (err) console.error('❌ Error creating adddepartment table:', err.message);
    else console.log('✅ adddepartment table ready');
  });
};
 
class Department {
  // Get all departments ordered by sequence_number
  static async getAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM adddepartment ORDER BY sequence_number ASC, created_at ASC';
      db.query(query, (err, results) => {
        if (err) {
          reject(new Error(`Error fetching departments: ${err.message}`));
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get department by ID
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM adddepartment WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(new Error(`Error fetching department: ${err.message}`));
        } else {
          resolve(results[0] || null);
        }
      });
    });
  }

  // Create new department
  static async create(departmentData) {
    return new Promise((resolve, reject) => {
      // First get the next sequence number
      const countQuery = 'SELECT MAX(sequence_number) as maxSeq FROM adddepartment';
      db.query(countQuery, (err, countResult) => {
        if (err) {
          reject(new Error(`Error getting max sequence: ${err.message}`));
          return;
        }

        const nextSequence = (countResult[0].maxSeq || 0) + 1;
        const insertQuery = 'INSERT INTO adddepartment (department_name, sequence_number) VALUES (?, ?)';
        
        db.query(insertQuery, [departmentData.department_name, nextSequence], (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              reject(new Error('Department name already exists'));
            } else {
              reject(new Error(`Error creating department: ${err.message}`));
            }
          } else {
            // Return the created department
            this.getById(result.insertId).then(resolve).catch(reject);
          }
        });
      });
    });
  }

  // Update department
  static async update(id, departmentData) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE adddepartment SET department_name = ? WHERE id = ?';
      db.query(query, [departmentData.department_name, id], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            reject(new Error('Department name already exists'));
          } else {
            reject(new Error(`Error updating department: ${err.message}`));
          }
        } else if (result.affectedRows === 0) {
          reject(new Error('Department not found'));
        } else {
          this.getById(id).then(resolve).catch(reject);
        }
      });
    });
  }

  // Delete department
  static async delete(id) {
    return new Promise((resolve, reject) => {
      // First get the department to be deleted
      this.getById(id).then(departmentToDelete => {
        if (!departmentToDelete) {
          reject(new Error('Department not found'));
          return;
        }

        // Start transaction
        db.beginTransaction((transErr) => {
          if (transErr) {
            reject(new Error(`Transaction error: ${transErr.message}`));
            return;
          }

          // Delete the department
          const deleteQuery = 'DELETE FROM adddepartment WHERE id = ?';
          db.query(deleteQuery, [id], (err, result) => {
            if (err) {
              db.rollback(() => {
                reject(new Error(`Error deleting department: ${err.message}`));
              });
            } else if (result.affectedRows === 0) {
              db.rollback(() => {
                reject(new Error('Department not found'));
              });
            } else {
              // Update sequence numbers for remaining departments
              const updateQuery = 'UPDATE adddepartment SET sequence_number = sequence_number - 1 WHERE sequence_number > ?';
              db.query(updateQuery, [departmentToDelete.sequence_number], (updateErr) => {
                if (updateErr) {
                  db.rollback(() => {
                    reject(new Error(`Error updating sequences: ${updateErr.message}`));
                  });
                } else {
                  db.commit((commitErr) => {
                    if (commitErr) {
                      db.rollback(() => {
                        reject(new Error(`Commit error: ${commitErr.message}`));
                      });
                    } else {
                      resolve({ success: true, message: 'Department deleted successfully' });
                    }
                  });
                }
              });
            };
          });
        });
      }).catch(reject);
    });
  }

  // Update sequence order
  static async updateSequence(orderData) {
    return new Promise((resolve, reject) => {
      if (!orderData || orderData.length === 0) {
        resolve({ success: true, message: 'No data to update' });
        return;
      }

      db.beginTransaction((err) => {
        if (err) {
          reject(new Error(`Transaction error: ${err.message}`));
          return;
        }

        // Create a promise for each update
        const updatePromises = orderData.map((item) => {
          return new Promise((resolveUpdate, rejectUpdate) => {
            const updateQuery = 'UPDATE adddepartment SET sequence_number = ? WHERE id = ?';
            db.query(updateQuery, [item.sequence_number, item.id], (updateErr, result) => {
              if (updateErr) {
                rejectUpdate(updateErr);
              } else if (result.affectedRows === 0) {
                rejectUpdate(new Error(`Department with ID ${item.id} not found`));
              } else {
                resolveUpdate();
              }
            });
          });
        });

        // Execute all updates
        Promise.all(updatePromises)
          .then(() => {
            db.commit((commitErr) => {
              if (commitErr) {
                db.rollback(() => {
                  reject(new Error(`Commit error: ${commitErr.message}`));
                });
              } else {
                resolve({ success: true, message: 'Sequence updated successfully' });
              }
            });
          })
          .catch((updateErr) => {
            db.rollback(() => {
              reject(new Error(`Error updating sequence: ${updateErr.message}`));
            });
          });
      });
    });
  }

  // Check if department name already exists (for validation)
  static async checkDuplicateName(name, excludeId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id FROM adddepartment WHERE LOWER(TRIM(department_name)) = LOWER(TRIM(?))';
      let params = [name];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      db.query(query, params, (err, results) => {
        if (err) {
          reject(new Error(`Error checking duplicate name: ${err.message}`));
        } else {
          resolve(results.length > 0);
        }
      });
    });
  }
}

module.exports = { Department, createDepartmentTable };