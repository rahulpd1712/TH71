#!/usr/bin/env node
// Online backup for the SQLite database.
// Uses better-sqlite3's backup API, so it is safe to run while the
// server is running (handles WAL mode correctly) and produces a
// consistent snapshot.
//
// Usage:  npm run backup
// Env:    BACKUP_DIR   where backups are written (default: server/data/backups)
//         BACKUP_KEEP  how many backups to keep (default: 7)
const fs = require('fs');
const path = require('path');
const { db } = require('../server/db');

const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'server', 'data', 'backups');
const keep = parseInt(process.env.BACKUP_KEEP || '7', 10);

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHmmss
const dest = path.join(backupDir, `ayush-${stamp}.db`);

db.backup(dest)
  .then(() => {
    console.log(`Backup written: ${dest}`);

    // Rotation: keep only the newest `keep` backups
    const files = fs.readdirSync(backupDir)
      .filter(f => /^ayush-\d{14}\.db$/.test(f))
      .map(f => ({ f, t: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const file of files.slice(keep)) {
      fs.unlinkSync(path.join(backupDir, file.f));
      console.log(`Removed old backup: ${file.f}`);
    }
    console.log(`Kept ${Math.min(files.length, keep)} backup(s) in ${backupDir}`);
  })
  .catch(err => {
    console.error('Backup failed:', err.message);
    process.exit(1);
  });