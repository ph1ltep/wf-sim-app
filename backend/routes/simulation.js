const express = require('express');
const router = express.Router();
const { runSimulation } = require('../simulation/monte_carlo');

router.post('/', (req, res) => {
    const params = req.body;
    const results = runSimulation(params);
    res.json(results);
});

module.exports = router;