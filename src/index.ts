import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { $ } from "bun"
import { z } from "zod"
import { description, name, version } from "../package.json"
import { parseArgs, printHelp } from "./cli"
import { install, list, uninstall } from "./installer"

// Parse CLI arguments
const command = parseArgs()

// Handle CLI commands
if (command.type === "help") {
  printHelp()
  process.exit(0)
}

if (command.type === "install") {
  install(command.toolName, command.client)
  process.exit(0)
}

if (command.type === "uninstall") {
  uninstall(command.toolName, command.client)
  process.exit(0)
}

if (command.type === "list") {
  list()
  process.exit(0)
}

// MCP Server mode
if (command.type === "mcp-server") {
  const toolName = command.toolName

  const mcpServer = new McpServer({
    name,
    version,
    title: "MCP Server for local CLI apps",
    description,
    websiteUrl: "https://github.com/SubZtep/wrapmcp"
  })

  mcpServer.registerTool(
    "run_cli",
    {
      description: `Execute ${toolName} commands. This is a universal wrapper for the ${toolName} tool. Use --help to explore available commands and subcommands (e.g., '${toolName} --help' or '${toolName} parameter --help'). The tool returns the raw output from ${toolName}.`,
      inputSchema: {
        args: z.string().describe(`Command line arguments to pass to ${toolName} (e.g., '--help', 'deploy --env prod')`)
      }
    },
    async ({ args }) => {
      try {
        const checkResult = await $`which ${toolName}`.quiet()
        if (checkResult.exitCode !== 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${toolName} not found in PATH. Please ensure ${toolName} is installed and available.`
              }
            ]
          }
        }

        const result = await $`${toolName} ${args}`.text()

        return {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${toolName}: ${errorMessage}`
            }
          ]
        }
      }
    }
  )

  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
}
