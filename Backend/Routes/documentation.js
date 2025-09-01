// routes/documentation.js
router.get('/enrolled-plans', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, email, enrolled_date, package, enrollment_fee, offer_letter, first_year, status
      FROM enrolled_clients
      WHERE status = 'Approved'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
