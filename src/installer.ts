import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { detectClients, getAvailableClients, getClient, type MCPClient } from "./clients"
import { addServerToConfig, listServersInConfig, removeServerFromConfig } from "./config"

function getBinaryInstallPath(): string {
  // Install to ~/.local/bin/wrapmcp
  const installDir = join(homedir(), ".local", "bin")
  return join(installDir, "wrapmcp")
}

function getCurrentBinaryPath(): string {
  // Get the path of the currently running binary
  // For Bun compiled binaries, process.execPath points to the actual binary
  // process.argv[1] might be a virtual bunfs path
  const execPath = process.execPath

  // If execPath ends with our binary name or is a real file, use it
  if (existsSync(execPath) && !execPath.includes("/bun")) {
    return resolve(execPath)
  }

  // Otherwise fall back to argv[1]
  return resolve(process.argv[1])
}

function ensureBinaryInstalled(): string {
  const currentPath = getCurrentBinaryPath()
  const installPath = getBinaryInstallPath()

  // If we're already running from the install location, just return it
  if (currentPath === installPath) {
    return installPath
  }

  // Otherwise, copy the binary to the install location
  const installDir = join(homedir(), ".local", "bin")
  if (!existsSync(installDir)) {
    mkdirSync(installDir, { recursive: true })
  }

  try {
    copyFileSync(currentPath, installPath)
    // Make it executable on Unix systems
    if (process.platform !== "win32") {
      Bun.spawnSync(["chmod", "+x", installPath])
    }
    console.log(`📦 Installed wrapmcp to ${installPath}`)
    return installPath
  } catch (error) {
    console.error(`Failed to copy binary: ${error}`)
    // Fall back to current path
    console.log(`⚠️  Using current binary location: ${currentPath}`)
    return currentPath
  }
}

export function install(toolName: string, targetClient?: string): void {
  console.log(`🔧 Installing MCP server for '${toolName}'...\n`)

  // Ensure binary is installed to a stable location
  const binaryPath = ensureBinaryInstalled()

  // Get target clients
  let clients: MCPClient[]
  if (targetClient) {
    const client = getClient(targetClient)
    if (!client) {
      console.error(`❌ Unknown client: ${targetClient}`)
      console.log(
        `\nAvailable clients: ${detectClients()
          .map(c => c.name)
          .join(", ")}`
      )
      process.exit(1)
    }
    clients = [client]
  } else {
    // Install to all available clients
    clients = getAvailableClients()
    if (clients.length === 0) {
      console.log("⚠️  No MCP clients found.")
      console.log("\nSearched for:")
      detectClients().forEach(c => {
        console.log(`  - ${c.displayName}: ${c.configPath}`)
      })
      process.exit(1)
    }
  }

  // Install to each client
  let successCount = 0
  for (const client of clients) {
    try {
      addServerToConfig(client, toolName, {
        type: "stdio",
        command: binaryPath,
        args: [toolName],
        env: {}
      })
      console.log(`✅ Installed to ${client.displayName}`)
      console.log(`   Config: ${client.configPath}`)
      successCount++
    } catch (error) {
      console.error(`❌ Failed to install to ${client.displayName}: ${error}`)
    }
  }

  if (successCount > 0) {
    console.log(`\n🎉 Successfully installed '${toolName}' MCP server to ${successCount} client(s)!`)
    console.log(`\nRestart your MCP client(s) to use the new server.`)
  } else {
    console.error(`\n❌ Failed to install to any clients.`)
    process.exit(1)
  }
}

export function uninstall(toolName: string, targetClient?: string): void {
  console.log(`🗑️  Uninstalling MCP server for '${toolName}'...\n`)

  // Get target clients
  let clients: MCPClient[]
  if (targetClient) {
    const client = getClient(targetClient)
    if (!client) {
      console.error(`❌ Unknown client: ${targetClient}`)
      process.exit(1)
    }
    clients = [client]
  } else {
    // Uninstall from all available clients
    clients = getAvailableClients()
  }

  // Uninstall from each client
  let successCount = 0
  for (const client of clients) {
    try {
      const servers = listServersInConfig(client)
      if (servers.includes(toolName)) {
        removeServerFromConfig(client, toolName)
        console.log(`✅ Removed from ${client.displayName}`)
        successCount++
      } else {
        console.log(`⚠️  Not found in ${client.displayName}`)
      }
    } catch (error) {
      console.error(`❌ Failed to uninstall from ${client.displayName}: ${error}`)
    }
  }

  if (successCount > 0) {
    console.log(`\n🎉 Successfully uninstalled '${toolName}' from ${successCount} client(s)!`)
  } else {
    console.log(`\n⚠️  '${toolName}' was not installed in any clients.`)
  }
}

export function list(): void {
  console.log("📋 Installed MCP Servers:\n")

  const clients = getAvailableClients()

  if (clients.length === 0) {
    console.log("⚠️  No MCP clients found.")
    return
  }

  for (const client of clients) {
    const servers = listServersInConfig(client)
    console.log(`${client.displayName} (${client.type}):`)
    if (servers.length === 0) {
      console.log("  (none)")
    } else {
      servers.forEach(server => {
        console.log(`  - ${server}`)
      })
    }
    console.log()
  }
}
