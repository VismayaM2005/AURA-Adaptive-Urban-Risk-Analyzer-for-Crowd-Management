const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'aura.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )
`);

// Create sessions table
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create notifications table
db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    zone TEXT,
    priority TEXT DEFAULT 'medium',
    read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create incidents table
db.run(`
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
// Table for mobile notifications log
db.run(`
  CREATE TABLE IF NOT EXISTS mobile_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER NOT NULL,
    zone_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES alerts(alert_id),
    FOREIGN KEY (zone_id) REFERENCES zones(zone_id)
  )
`);
module.exports = db;