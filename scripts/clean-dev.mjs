import { rmSync, existsSync } from "fs";
import { spawn, execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = join(root, ".next");

function killDevServers() {
  const isWin = process.platform === "win32";
  try {
    if (isWin) {
      execSync(
        `powershell -NoProfile -Command "` +
          `$ports = 3000,3001,3002; foreach ($port in $ports) { ` +
          `Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ` +
          `ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }; ` +
          `Get-CimInstance Win32_Process -Filter \\"Name='node.exe'\\" | ` +
          `Where-Object { $_.CommandLine -match 'next dev' } | ` +
          `ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
        { stdio: "ignore" }
      );
    } else {
      execSync("lsof -ti:3000 | xargs kill -9 2>/dev/null || true", {
        stdio: "ignore",
        shell: true,
      });
    }
  } catch {
    // No running server — fine
  }
}

killDevServers();

if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
}

console.log("Starting dev server...");
const child = spawn("npm", ["run", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
