const db = require('../db');

// Get all departments sorted by sequence_number
exports.getAllDepartments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM adddepartment ORDER BY sequence_number ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new department with correct sequence_number
exports.createDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;
    if (!department_name) return res.status(400).json({ error: 'Department name required' });

    const [maxRows] = await db.query('SELECT MAX(sequence_number) as maxSeq FROM adddepartment');
    const newSeq = (maxRows[0].maxSeq || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO adddepartment (department_name, sequence_number) VALUES (?, ?)',
      [department_name, newSeq]
    );

    const [newDept] = await db.query('SELECT * FROM adddepartment WHERE id = ?', [result.insertId]);
    res.status(201).json(newDept[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
// Update department name
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // check duplicate
    const [existing] = await db.query(
      'SELECT * FROM adddepartment WHERE LOWER(department_name) = LOWER(?) AND id != ?',
      [name, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Department already exists.' });
    }

    await db.query('UPDATE adddepartment SET department_name = ? WHERE id = ?', [name, id]);
    res.json({ message: 'Department updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM adddepartment WHERE id = ?', [id]);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update sequence order
exports.updateSequence = async (req, res) => {
  try {
    const { order } = req.body; // array of ids
    const queries = order.map((id, index) =>
      db.query('UPDATE adddepartment SET sequence_number = ? WHERE id = ?', [index + 1, id])
    );
    await Promise.all(queries);
    res.json({ message: 'Sequence updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
