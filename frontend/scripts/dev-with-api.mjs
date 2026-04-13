/**
 * Starts CleanApp.API, waits until Kestrel logs "Now listening", then starts Vite.
 * Stops the API when Vite exits or on Ctrl+C.
 *
 * - Forces DOTNET_ROLL_FORWARD=LatestPatch for dotnet so machine-wide Disable
 *   does not require an exact Microsoft.NETCore.App 8.0.0 folder.
 * - Waits on log text, not TCP :5147, so a stale process on 5147 cannot start Vite early.
 * - Before starting, frees the API port (matches launchSettings "http" profile) so a
 *   leftover CleanApp.API does not cause "address already in use".
 */
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const csproj = path.resolve(frontendRoot, "../backend/CleanApp.API/CleanApp.API.csproj");
const isWin = process.platform === "win32";

/** Must match Properties/launchSettings.json profile "http" applicationUrl port. */
const API_PORT = 5147;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Best-effort: stop whatever is listening on `port` (dev convenience). */
async function freeListenPort(port) {
  console.error(`[dev] Ensuring port ${port} is free for the API…`);
  try {
    if (isWin) {
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `$pids = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ` +
            `Select-Object -ExpandProperty OwningProcess -Unique); ` +
            `foreach ($procId in $pids) { if ($procId -and $procId -ne $PID) { ` +
            `Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } }`,
        ],
        { stdio: "ignore", timeout: 20_000 },
      );
    } else {
      execFileSync(
        "/bin/sh",
        [
          "-c",
          `p=$(lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null); [ -n "$p" ] && kill -9 $p 2>/dev/null; exit 0`,
        ],
        { stdio: "ignore", timeout: 20_000 },
      );
    }
  } catch {
    // ignore — port may already be free or tooling unavailable
  }
  await sleep(600);
}

function exitHintFromLogs() {
  const t = combined;
  if (t.includes("address already in use") || t.includes("AddressInUseException")) {
    return (
      `Port ${API_PORT} is still in use after cleanup. Close the other terminal running the API, ` +
      `or in PowerShell: Get-NetTCPConnection -LocalPort ${API_PORT} | Select OwningProcess`
    );
  }
  if (t.includes("You must install or update .NET") || (t.includes("Framework") && t.includes("was not found"))) {
    return "Install the .NET 8 ASP.NET Core runtime (x64) or fix DOTNET_ROLL_FORWARD=Disable on the machine.";
  }
  return (
    "Check PostgreSQL, appsettings, and the dotnet output above. " +
    "If you saw a framework/version error, remove machine-wide DOTNET_ROLL_FORWARD=Disable."
  );
}

await freeListenPort(API_PORT);

const dotnetEnv = {
  ...process.env,
  DOTNET_ROLL_FORWARD: "LatestPatch",
};

const dotnet = spawn(
  "dotnet",
  ["run", "--project", csproj, "--launch-profile", "http"],
  {
    cwd: frontendRoot,
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    env: dotnetEnv,
  },
);

let shuttingDown = false;
let combined = "";

const stopApi = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  if (dotnet.exitCode === null) {
    dotnet.kill(isWin ? undefined : "SIGTERM");
  }
};

const onSig = () => {
  stopApi();
  process.exit(0);
};
process.on("SIGINT", onSig);
process.on("SIGTERM", onSig);

function waitForApiListening() {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(tid);
      dotnet.off("exit", onExit);
      fn(arg);
    };

    const tid = setTimeout(() => {
      finish(reject, new Error(
        'Timed out waiting for "Now listening" from the API. Check PostgreSQL, appsettings, and that nothing else is blocking startup.',
      ));
    }, 120_000);

    const onChunk = (chunk, stream) => {
      stream.write(chunk);
      combined += chunk.toString();
      if (combined.includes("Now listening")) {
        finish(resolve);
      }
    };

    dotnet.stdout.on("data", (c) => onChunk(c, process.stdout));
    dotnet.stderr.on("data", (c) => onChunk(c, process.stderr));

    const onExit = (code, signal) => {
      if (signal) {
        finish(reject, new Error(`dotnet stopped (${signal}) before the API was ready.`));
      } else {
        finish(
          reject,
          new Error(`dotnet exited (${code}) before the API was ready. ${exitHintFromLogs()}`),
        );
      }
    };
    dotnet.once("exit", onExit);
  });
}

try {
  await waitForApiListening();
} catch (e) {
  console.error(`\n[dev] ${e.message}\n`);
  stopApi();
  process.exit(1);
}

const viteCli = path.join(frontendRoot, "node_modules", "vite", "bin", "vite.js");
const vite = spawn(process.execPath, [viteCli], {
  cwd: frontendRoot,
  stdio: "inherit",
  shell: false,
  env: process.env,
});

vite.on("exit", (code) => {
  stopApi();
  process.exit(code ?? 0);
});

dotnet.on("exit", (code, signal) => {
  if (shuttingDown) return;
  if (vite.exitCode === null) {
    console.error(
      signal
        ? `\n[dev] dotnet stopped (${signal}). Restart with: bun run dev\n`
        : `\n[dev] dotnet exited (${code}). Restart with: bun run dev\n`,
    );
    vite.kill(isWin ? undefined : "SIGTERM");
  }
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
