import { argv } from "bun"

export type CLICommand =
  | { type: "mcp-server"; toolName: string }
  | { type: "install"; toolName: string; client?: string }
  | { type: "uninstall"; toolName: string; client?: string }
  | { type: "list" }
  | { type: "help" }

export function parseArgs(): CLICommand {
  const args = argv.slice(2) // Remove 'bun' and script path

  if (args.length === 0) {
    return { type: "help" }
  }

  const firstArg = args[0]

  // Handle subcommands
  if (firstArg === "install") {
    const toolName = args[1]
    if (!toolName) {
      console.error("Error: install command requires a tool name")
      console.error("Usage: mcp4cli install <tool-name> [--client=<client-name>]")
      process.exit(1)
    }

    const clientFlag = args.find(arg => arg.startsWith("--client="))
    const client = clientFlag?.split("=")[1]

    return { type: "install", toolName, client }
  }

  if (firstArg === "uninstall") {
    const toolName = args[1]
    if (!toolName) {
      console.error("Error: uninstall command requires a tool name")
      console.error("Usage: mcp4cli uninstall <tool-name> [--client=<client-name>]")
      process.exit(1)
    }

    const clientFlag = args.find(arg => arg.startsWith("--client="))
    const client = clientFlag?.split("=")[1]

    return { type: "uninstall", toolName, client }
  }

  if (firstArg === "list") {
    return { type: "list" }
  }

  if (firstArg === "help" || firstArg === "--help" || firstArg === "-h") {
    return { type: "help" }
  }

  // Default: treat first arg as tool name for MCP server mode
  return { type: "mcp-server", toolName: firstArg }
}

export function printHelp(): void {
  console.log(`
wrapmcp - Wrap any CLI tool with MCP

USAGE:
  wrapmcp <tool-name>              Run as MCP server for <tool-name>
  wrapmcp install <tool-name>      Install MCP server for <tool-name> to detected clients
  wrapmcp uninstall <tool-name>    Remove MCP server for <tool-name> from clients
  wrapmcp list                     List installed MCP servers
  wrapmcp help                     Show this help message

OPTIONS:
  --client=<name>                  Target specific client (claude-desktop, claude-code, etc.)

EXAMPLES:
  wrapmcp disco                    Run MCP server for disco CLI
  wrapmcp install gh               Install GitHub CLI MCP server
  wrapmcp install disco --client=claude-desktop
  wrapmcp list
  wrapmcp uninstall disco

For more information, visit: https://github.com/yourusername/wrapmcp
`)
}
