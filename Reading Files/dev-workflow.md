# Errolian Club Development Workflow

## Quick Setup (Choose One Method)

### Method 1: Windows Terminal Multi-Tab
1. Open Windows Terminal
2. Create new WSL tab: `Ctrl+Shift+T`
3. **Tab 1**: Run `./start-dev.sh` (keep running)
4. **Tab 2**: Continue with Claude Code commands

### Method 2: VS Code Split Terminal
1. Open VS Code in project folder
2. Open terminal: `Ctrl+` ` 
3. Split terminal: Click split icon
4. **Terminal 1**: `./start-dev.sh`
5. **Terminal 2**: Claude Code commands

### Method 3: Two Separate WSL Windows
1. **Window 1**: `cd /home/andrew/errolian-club && ./start-dev.sh`
2. **Window 2**: `cd /home/andrew/errolian-club` (for Claude Code)

## Dev Server URLs
- Primary: http://localhost:3001/
- Backup: http://10.255.255.254:3001/
- Backup: http://172.28.90.86:3001/

## Hot Reload
- The dev server watches for file changes
- Browser will auto-refresh when you make updates
- Keep both terminals open for best experience