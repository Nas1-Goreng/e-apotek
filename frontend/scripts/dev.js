import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = path.resolve(frontendDir, '..', 'backend', 'public');
const children = [];
let stopping = false;

function findPhp() {
  if (process.env.EAPOTEK_PHP) {
    return { command: process.env.EAPOTEK_PHP, env: process.env };
  }

  if (process.platform === 'win32') {
    const wrapper = path.join(process.env.ProgramData || 'C:\\ProgramData', 'envkit', 'bin', 'php.bat');
    if (existsSync(wrapper)) {
      const contents = readFileSync(wrapper, 'utf8');
      const executable = contents.match(/^"([^"]+\\php\.exe)"\s+%\*/im)?.[1];
      if (executable && existsSync(executable)) {
        const phpEnv = { ...process.env };
        for (const [, name, value] of contents.matchAll(/^set "([^=]+)=(.*)"\s*$/gim)) {
          phpEnv[name] = value;
        }
        return { command: executable, env: phpEnv };
      }
    }

    const result = spawnSync('where.exe', ['php'], { encoding: 'utf8', windowsHide: true });
    const executable = result.stdout?.split(/\r?\n/).find((candidate) => /\.exe$/i.test(candidate));
    if (result.status === 0 && executable) {
      return { command: executable, env: process.env };
    }
  }

  return { command: process.env.PHP_BINARY || 'php', env: process.env };
}

function stopChildren(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
  process.exitCode = exitCode;
}

function start(label, command, args, options) {
  const child = spawn(command, args, { stdio: 'inherit', windowsHide: true, ...options });
  children.push(child);
  child.once('error', (error) => {
    console.error(`${label} failed to start: ${error.message}`);
    stopChildren(1);
  });
  child.once('exit', (code) => {
    if (!stopping) {
      if (code !== 0) console.error(`${label} stopped with exit code ${code ?? 'unknown'}.`);
      stopChildren(code || 0);
    }
  });
  return child;
}

const php = findPhp();
console.log('Starting E-Apotek backend on http://127.0.0.1:8000');
start('Backend', php.command, ['-S', '127.0.0.1:8000', 'router.php'], {
  cwd: backendDir,
  env: php.env,
});

console.log('Starting E-Apotek frontend on http://127.0.0.1:8811');
start('Frontend', process.execPath, [path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', '8811', '--strictPort'], {
  cwd: frontendDir,
});

process.once('SIGINT', () => stopChildren(0));
process.once('SIGTERM', () => stopChildren(0));
