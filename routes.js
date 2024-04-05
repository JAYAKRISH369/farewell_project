const express = require('express');
const router = express.Router();
const { BasePay, Snack } = require('./src/models');

// Route to set base pay
router.post('/setBasePay', async (req, res) => {
  try {
    const { amount } = req.body;
    const basePay = await BasePay.create({ amount });
    res.status(201).json(basePay);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to update snacks section
router.put('/updateSnacks', async (req, res) => {
  try{
    const { item } = req.body;
    let snack = await Snack.findOne({ item });
    if (!snack) {
      snack = await Snack.create({ item });
    }
    snack.count += 1;
    await snack.save();
    res.status(200).json(snack);
  }catch (error){
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
