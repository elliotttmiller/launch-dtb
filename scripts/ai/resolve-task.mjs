#!/usr/bin/env node
import { parseArgs, resolveTask } from './lib/routing.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.intent || !args.domain) {
  console.error('Usage: node scripts/ai/resolve-task.mjs --intent <intent> --domain <domain> [--flags a,b] [--risk low|medium|high|critical]');
  process.exit(2);
}

try {
  const resolved = resolveTask({
    intent: args.intent,
    domain: args.domain,
    flags: args.flags || [],
    risk: args.risk || 'low',
  });
  process.stdout.write(`${JSON.stringify(resolved, null, 2)}\n`);
} catch (error) {
  console.error(`DTB AI task resolution failed: ${error.message}`);
  process.exit(1);
}
