import type { DotenvConfigOutput } from 'dotenv'

/** Absolute path to the `.env.test` this run should read (worktree-aware). */
export declare const resolveEnvFile: (cwd?: string) => string

/** Load that file. Never overrides an already-set variable. */
export declare const loadTestEnv: (cwd?: string) => DotenvConfigOutput
