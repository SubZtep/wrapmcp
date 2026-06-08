> :suspect: Work/Test/Docs in Progress

# wrapmcp

**Wrap any CLI tool with MCP** - Universal MCP server for well-documented CLI apps

Turn any command-line tool into an MCP server in seconds. No code required.

## Why?

Modern CLI tools have excellent help systems and well-documented commands. `wrapmcp` makes them instantly available to AI assistants through the Model Context Protocol (MCP).

Instead of writing custom MCP servers for each tool, just wrap them:

```bash
wrapmcp install gh      # GitHub CLI → MCP
wrapmcp install disco   # Disco → MCP
wrapmcp install docker  # Docker → MCP
wrapmcp install kubectl # Kubernetes → MCP
```

## Installation

Download the latest binary for your platform from [releases](https://github.com/yourusername/wrapmcp/releases):

```bash
# Linux/macOS
curl -L https://github.com/yourusername/wrapmcp/releases/latest/download/wrapmcp-linux -o wrapmcp
chmod +x wrapmcp

# Install it
./wrapmcp install <your-favorite-cli-tool>
```

The binary will automatically copy itself to `~/.local/bin/wrapmcp` and configure your MCP clients.

## Usage

### Install MCP server for a CLI tool

```bash
wrapmcp install disco
```

This will:
1. Copy `wrapmcp` to a stable location (`~/.local/bin/`)
2. Auto-detect your MCP clients (Claude Desktop, Claude Code, Continue, Zed)
3. Add the tool to all detected clients
4. You're done! Restart your AI assistant.

### Target specific client

```bash
wrapmcp install gh --client=claude-desktop
wrapmcp install docker --client=claude-code
```

### List installed servers

```bash
wrapmcp list
```

### Uninstall

```bash
wrapmcp uninstall disco
```

## Supported Clients

`wrapmcp` automatically detects and configures:

- **Claude Desktop** - Global installation
- **Claude Code** - Project-based (`.mcp.json`)
- **Continue** - VS Code extension
- **Zed** - Editor integration

## How it works

When you run `wrapmcp install disco`, it creates an MCP server that:

1. Registers a `run_cli` tool in your AI assistant
2. When called, executes `disco <args>` and returns the output
3. The AI can explore commands using `--help` flags
4. Well-documented CLIs become instantly accessible

## Examples

After installing, your AI assistant can do things like:

```
You: "List my disco projects"
AI: uses mcp__disco__run_cli with args "projects:list"

You: "Deploy my app to production"
AI: uses mcp__gh__run_cli to check status, then confirms with you

You: "Show running containers"
AI: uses mcp__docker__run_cli with args "ps"
```

## Requirements

- The CLI tool must be installed and available in your `PATH`
- MCP client (Claude Desktop, Claude Code, Continue, or Zed)

## Building from source

```bash
# Clone the repo
git clone https://github.com/yourusername/wrapmcp.git
cd wrapmcp

# Install dependencies
bun install

# Build
bun run build

# Use it
./wrapmcp install <tool>
```

## License

MIT

## Contributing

Issues and PRs welcome! This was built as a personal tool but happy to make it better.

---

**wrapmcp** - Because every great CLI deserves to be MCP-enabled ✨
