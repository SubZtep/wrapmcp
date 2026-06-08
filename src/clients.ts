import { existsSync } from "node:fs"
import { homedir, platform } from "node:os"
import { join } from "node:path"

export interface MCPClient {
  name: string
  displayName: string
  configPath: string
  exists: boolean
  type: "global" | "project"
}

function getClaudeDesktopConfigPath(): string {
  const plat = platform()
  const home = homedir()

  switch (plat) {
    case "darwin":
      return join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    case "win32":
      return join(process.env.APPDATA || join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json")
    default: // linux and others
      return join(home, ".config", "Claude", "claude_desktop_config.json")
  }
}

function getContinueConfigPath(): string {
  return join(homedir(), ".continue", "config.json")
}

function getZedConfigPath(): string {
  const plat = platform()
  const home = homedir()

  switch (plat) {
    case "darwin":
      return join(home, "Library", "Application Support", "Zed", "settings.json")
    default:
      return join(home, ".config", "zed", "settings.json")
  }
}

function getClaudeCodeProjectConfigPath(): string {
  // Look for .mcp.json in current directory or parent directories
  let currentDir = process.cwd()
  const root = platform() === "win32" ? `${currentDir.split("\\")[0]}\\` : "/"

  while (currentDir !== root) {
    const configPath = join(currentDir, ".mcp.json")
    if (existsSync(configPath)) {
      return configPath
    }
    const parentDir = join(currentDir, "..")
    if (parentDir === currentDir) break
    currentDir = parentDir
  }

  // Default to current directory
  return join(process.cwd(), ".mcp.json")
}

export function detectClients(): MCPClient[] {
  const clients: MCPClient[] = []

  // Claude Desktop
  const claudeDesktopPath = getClaudeDesktopConfigPath()
  clients.push({
    name: "claude-desktop",
    displayName: "Claude Desktop",
    configPath: claudeDesktopPath,
    exists: existsSync(claudeDesktopPath),
    type: "global"
  })

  // Claude Code (project-based)
  const claudeCodePath = getClaudeCodeProjectConfigPath()
  clients.push({
    name: "claude-code",
    displayName: "Claude Code",
    configPath: claudeCodePath,
    exists: existsSync(claudeCodePath),
    type: "project"
  })

  // Continue
  const continuePath = getContinueConfigPath()
  clients.push({
    name: "continue",
    displayName: "Continue",
    configPath: continuePath,
    exists: existsSync(continuePath),
    type: "global"
  })

  // Zed
  const zedPath = getZedConfigPath()
  clients.push({
    name: "zed",
    displayName: "Zed",
    configPath: zedPath,
    exists: existsSync(zedPath),
    type: "global"
  })

  return clients
}

export function getClient(clientName: string): MCPClient | null {
  const clients = detectClients()
  return clients.find(c => c.name === clientName) || null
}

export function getAvailableClients(): MCPClient[] {
  return detectClients().filter(c => c.exists)
}
