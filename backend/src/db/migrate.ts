// For now, we'll use raw SQL execution until node-pg-migrate is properly configured
import { Pool } from 'pg';
import { logInfo, logError } from '../utils/logger';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * Database migration utility for GASTAT International Dossier System
 */

// Database configuration
const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'intl_dossier',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

// Migration configuration
const migrationConfig = {
  dir: path.join(__dirname, '../../migrations'),
  direction: 'up' as const,
  count: Infinity,
  schema: 'public',
  createSchema: true,
  // Ignore legacy split migrations (001-003) in favor of consolidated 20250926 baseline
  ignorePattern: '^(001_|002_|003_)|\\..*',
  verbose: true,
  log: (message: string) => {
    logInfo(`Migration: ${message}`);
  },
};

/**
 * Run database migrations up
 */
export async function runMigrations(): Promise<void> {
  const pool = new Pool(databaseConfig);

  try {
    logInfo('Starting database migrations...');

    // For now, we'll handle migrations manually
    // TODO: Properly integrate node-pg-migrate
    const client = await pool.connect();

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS pgmigrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    logInfo('Migration system initialized');
  } catch (error) {
    logError('Migration failed:', error as Error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Rollback database migrations
 */
export async function rollbackMigrations(count: number = 1): Promise<void> {
  const pool = new Pool(databaseConfig);

  try {
    logInfo(`Rolling back ${count} migration(s)...`);

    // TODO: Implement proper rollback logic
    const client = await pool.connect();
    const result = await client.query(`
      SELECT * FROM pgmigrations
      ORDER BY run_on DESC
      LIMIT $1
    `, [count]);

    if (result.rows.length > 0) {
      logInfo(`Found ${result.rows.length} migration(s) to rollback`);
      // TODO: Implement actual rollback logic
    } else {
      logInfo('No migrations to rollback');
    }

    client.release();
  } catch (error) {
    logError('Rollback failed:', error as Error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<any[]> {
  const pool = new Pool(databaseConfig);

  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT * FROM pgmigrations
      ORDER BY run_on DESC
    `);
    client.release();

    return result.rows;
  } catch (error) {
    logError('Failed to get migration status:', error as Error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Create a new migration file
 */
export async function createMigration(name: string): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(migrationConfig.dir, filename);

    // Create the migration file with template
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Up migration
BEGIN;

-- Add your migration code here


COMMIT;

-- Down migration (for rollbacks)
-- BEGIN;
--
-- Add rollback code here
--
-- COMMIT;`;

    // Ensure migrations directory exists and write the file
    await fs.mkdir(migrationConfig.dir, { recursive: true });
    await fs.writeFile(filepath, template, 'utf8');

    logInfo(`Created migration file: ${filename}`);
    return filepath;
  } catch (error) {
    logError('Failed to create migration:', error as Error);
    throw error;
  }
}

// CLI interface for running migrations
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'up':
      runMigrations().catch((error) => {
        logError('Migration command failed:', error as Error);
        process.exit(1);
      });
      break;

    case 'down':
      const count = parseInt(process.argv[3]) || 1;
      rollbackMigrations(count).catch((error) => {
        logError('Rollback command failed:', error as Error);
        process.exit(1);
      });
      break;

    case 'status':
      getMigrationStatus()
        .then((migrations) => {
          console.log('Migration Status:');
          console.table(migrations);
        })
        .catch((error) => {
          logError('Status command failed:', error as Error);
          process.exit(1);
        });
      break;

    case 'create':
      const name = process.argv.slice(3).join(' ');
      if (!name) {
        console.error('Usage: npm run migrate create <migration_name>');
        process.exit(1);
      }
      createMigration(name)
        .then((filepath) => {
          console.log(`Migration created: ${filepath}`);
        })
        .catch((error) => {
          logError('Create command failed:', error as Error);
          process.exit(1);
        });
      break;

    default:
      console.log(`
Usage: npm run migrate <command>

Commands:
  up                  Run all pending migrations
  down [count]        Rollback migrations (default: 1)
  status              Show migration status
  create <name>       Create a new migration file

Examples:
  npm run migrate up
  npm run migrate down 2
  npm run migrate status
  npm run migrate create "add users table"
      `);
  }
}
