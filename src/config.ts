import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import type { MCPClient } from "./clients"

export interface MCPServerConfig {
  type: "stdio"
  command: string
  args: string[]
  env?: Record<string, string>
}

function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function readJSON(filePath: string): any {
  if (!existsSync(filePath)) {
    return null
  }
  try {
    const content = readFileSync(filePath, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${error}`)
  }
}

function writeJSON(filePath: string, data: any): void {
  ensureDirectoryExists(filePath)
  const content = JSON.stringify(data, null, 2)
  writeFileSync(filePath, content, "utf-8")
}

export function addServerToConfig(client: MCPClient, serverName: string, config: MCPServerConfig): void {
  let data = readJSON(client.configPath)

  // Initialize config if it doesn't exist
  if (!data) {
    data = {}
  }

  // Handle different client config structures
  switch (client.name) {
    case "claude-desktop":
    case "claude-code":
      // Format: { "mcpServers": { "serverName": config } }
      if (!data.mcpServers) {
        data.mcpServers = {}
      }
      data.mcpServers[serverName] = config
      break

    case "continue":
      // Format: { "mcpServers": [{ "name": "serverName", ...config }] }
      if (!data.mcpServers) {
        data.mcpServers = []
      }
      // Remove existing entry with same name
      data.mcpServers = data.mcpServers.filter((s: any) => s.name !== serverName)
      data.mcpServers.push({ name: serverName, ...config })
      break

    case "zed":
      // Format: { "assistant": { "mcpServers": { "serverName": config } } }
      if (!data.assistant) {
        data.assistant = {}
      }
      if (!data.assistant.mcpServers) {
        data.assistant.mcpServers = {}
      }
      data.assistant.mcpServers[serverName] = config
      break

    default:
      throw new Error(`Unsupported client: ${client.name}`)
  }

  writeJSON(client.configPath, data)
}

export function removeServerFromConfig(client: MCPClient, serverName: string): void {
  const data = readJSON(client.configPath)

  if (!data) {
    return // Config doesn't exist, nothing to remove
  }

  // Handle different client config structures
  switch (client.name) {
    case "claude-desktop":
    case "claude-code":
      if (data.mcpServers?.[serverName]) {
        delete data.mcpServers[serverName]
      }
      break

    case "continue":
      if (data.mcpServers) {
        data.mcpServers = data.mcpServers.filter((s: any) => s.name !== serverName)
      }
      break

    case "zed":
      if (data.assistant?.mcpServers?.[serverName]) {
        delete data.assistant.mcpServers[serverName]
      }
      break

    default:
      throw new Error(`Unsupported client: ${client.name}`)
  }

  writeJSON(client.configPath, data)
}

export function listServersInConfig(client: MCPClient): string[] {
  const data = readJSON(client.configPath)

  if (!data) {
    return []
  }

  // Handle different client config structures
  switch (client.name) {
    case "claude-desktop":
    case "claude-code":
      return data.mcpServers ? Object.keys(data.mcpServers) : []

    case "continue":
      return data.mcpServers ? data.mcpServers.map((s: any) => s.name) : []

    case "zed":
      return data.assistant?.mcpServers ? Object.keys(data.assistant.mcpServers) : []

    default:
      return []
  }
}
