const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🧱 Define Schemas
const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true }
});

const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = model('User', userSchema);
const Transaction = model('Transaction', transactionSchema);

// 🔐 SIGNUP
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ success: false, message: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash });
    await user.save();
    res.json({ success: true, message: 'Account created!' });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🔑 LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ success: false, message: "Invalid password" });

    res.json({ success: true, message: "Login successful", userId: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 📊 GET TRANSACTIONS
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ➕ ADD TRANSACTION
app.post('/api/transactions/:userId', async (req, res) => {
  const { description, amount, type } = req.body;
  if (typeof amount !== 'number' || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid transaction data' });
  }

  try {
    const tx = new Transaction({ userId: req.params.userId, description, amount, type });
    await tx.save();
    res.json({ success: true, transaction: tx });
  } catch (err) {
    console.error("Error adding transaction:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ❌ DELETE TRANSACTION
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://bjacquez_db_user:rscyfniKRYl8yVHF@cluster0.hxbjbzr.mongodb.net/pennypal')
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));