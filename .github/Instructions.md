<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Discord bot project built with Discord.js v14 and TypeScript. The bot has two main features:

1. **Role Management System**: Users can request roles using `/role` command, and moderators can approve/deny requests via button interactions.
2. **Ticket System**: Users can create support tickets through a customizable embed with buttons, and tickets can be managed with proper permissions.

## Project Structure
- `src/index.ts` - Main bot entry point
- `src/commands/` - Slash commands
- `src/events/` - Discord event handlers
- `src/utils/` - Utility functions and database helpers

## Key Features
- Role request system with approval workflow
- Role group management for batch permissions
- Customizable ticket creation system
- Button-based interactions
- Permission-based command access

When working on this project, ensure:
- All commands use slash command builders
- Button interactions are properly handled
- Permissions are checked before sensitive operations
- Error handling is implemented for all async operations
- Database operations use the provided SimpleDB utility
