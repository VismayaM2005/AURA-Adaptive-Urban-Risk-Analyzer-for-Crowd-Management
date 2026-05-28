const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aura-secret-key-change-in-production';

// Signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
          success: true,
          token,
          user: { id: this.lastID, username, email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
});

// Verify token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({ success: true, user });
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get notifications
router.get('/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(
    'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50',
    [userId],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(notifications);
    }
  );
});

// Mark notification as read
router.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  
  db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

module.exports = router;