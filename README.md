# Supedo Discord Bot

A Discord bot designed for role management and t6. **Build the project**:
   ```bash
   npm run build
   ```

7. **Deploy slash commands**:
   ```bash
   npm run deploy
   ```

8. **Start the bot**:ms, built specifically for single-server use.

## Features

### 🎭 Role Management System
- **`/role`** - Request any role from the server
- **`/rolegroup`** - Manage role groups with specific approval permissions
- Approval workflow with button interactions
- Automatic DM notifications for request status
- Permission-based role assignment

### 🎫 Ticket System
- **`/setup`** - Create customizable ticket creation messages
- Multiple button types with custom labels, colors, and categories
- Automatic ticket channel creation with proper permissions
- Persistent close buttons with confirmation dialogs
- Category-based ticket organization

## Setup Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- MySQL 8.0 or higher
- A Discord application with bot token
- Discord server with appropriate permissions

### Installation

1. **Install Node.js** (if not already installed):
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Install and setup MySQL**:
   - Download from [mysql.com](https://www.mysql.com/downloads/)
   - Create a database for the bot: `CREATE DATABASE supedo_bot;`
   - Create a user with appropriate permissions

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Discord Bot Setup**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application or select your existing bot
   - Go to the "Bot" section and copy your bot token
   - **Important**: Enable the following intents in the Bot section:
     - ✅ **Server Members Intent** (required for role management)
     - ✅ **Message Content Intent** (required for message processing)
     - ✅ **All other intents** (recommended for full functionality)
   - Go to OAuth2 > URL Generator and select:
     - **Scopes**: `bot`, `applications.commands`  
     - **Bot Permissions**: `Manage Roles`, `Manage Channels`, `Send Messages`, `Use Slash Commands`, `Embed Links`, `Read Message History`
   - Use the generated URL to invite your bot to your server

5. **Environment Configuration**:
   - Copy `.env.example` to `.env`
   - Fill in your Discord bot credentials and MySQL database details:
     ```env
     DISCORD_TOKEN=your_bot_token_here
     CLIENT_ID=your_client_id_here
     GUILD_ID=your_guild_id_here
     
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=supedo_bot
     DB_USER=your_db_username
     DB_PASSWORD=your_db_password
     DB_SSL=false
     ```

6. **Build the project**:
   ```bash
   npm run build
   ```

7. **Deploy slash commands**:
   ```bash
   npm run deploy
   ```

8. **Start the bot**:
   ```bash
   npm start
   ```

   The bot will automatically create the necessary database tables on first run.

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## Bot Permissions Required

The bot needs the following permissions in your Discord server:
- **Manage Roles** - For role assignment
- **Manage Channels** - For ticket system
- **Send Messages** - For responses and notifications
- **Use Slash Commands** - For command execution
- **Embed Links** - For rich message formatting
- **Read Message History** - For button interactions

## Usage

### Role Management

1. Use `/role <role_name>` to request a role
2. Moderators will see the request with approve/deny buttons
3. Users receive DM notifications about request status

### Role Groups

1. Use `/rolegroup create` to create role groups
2. Specify which roles can approve requests for the group
3. Manage permissions at a group level

### Ticket System

1. Use `/setup` in a channel to create the ticket panel
2. Customize the embed title, description, and color
3. Users click buttons to create tickets in appropriate categories
4. Tickets auto-create with proper permissions and close buttons

## Configuration

### Ticket Categories
By default, the bot creates three ticket types:
- **General Support** (Primary button, 🎫)
- **Technical Issue** (Secondary button, ⚙️)
- **Billing** (Success button, 💳)

### Role Request Channels
The bot looks for these channels to send role requests:
- `#role-requests`
- `#mod-log`

Create one of these channels or modify the code to use your preferred channel.

## Project Structure

```
src/
├── index.ts              # Main bot entry point
├── deploy.ts            # Command deployment script
├── commands/            # Slash commands
│   ├── role.ts         # Role request command
│   ├── rolegroup.ts    # Role group management
│   └── setup.ts        # Ticket system setup
├── events/             # Discord event handlers
│   ├── ready.ts        # Bot ready event
│   └── interactionCreate.ts # Command/button interactions
└── utils/              # Utility functions
    ├── database.ts     # Simple in-memory database
    └── buttonHandler.ts # Button interaction handlers
```

## Database

The bot uses MySQL with TypeORM for data persistence. The following tables are automatically created:

- **role_requests** - Stores role request data with approval workflow
- **ticket_setups** - Stores ticket system configuration per guild
- **tickets** - Stores individual ticket information
- **role_groups** - Stores role group configurations

Database tables are automatically created and synchronized when the bot starts. In production, set `synchronize: false` in the DataSource configuration and use migrations instead.

## Customization

### Adding New Ticket Types
1. Modify the button creation in `src/commands/setup.ts`
2. Update the button handler in `src/utils/buttonHandler.ts`
3. Add new button IDs to the interaction handler

### Custom Role Request Channels
Update the channel finding logic in `src/commands/role.ts`:
```typescript
const logChannel = guild.channels.cache.find((c: any) => 
  c.name === 'your-custom-channel-name'
);
```

### Permission Customization
Modify permission checks in button handlers and commands to match your server's role structure.

## Troubleshooting

### Commands Not Appearing
- Ensure `CLIENT_ID` and `GUILD_ID` are correct in `.env`
- Run `npm run deploy` after any command changes
- Check bot permissions in Discord server settings

### Role Assignment Failures
- Verify bot has `Manage Roles` permission
- Ensure bot's role is higher than the roles it's trying to assign
- Check that target roles are not managed by integrations

### Ticket Creation Issues
- Confirm bot has `Manage Channels` permission
- Verify category limits haven't been exceeded (50 channels per category)
- Check if channel name conflicts exist

## License

MIT License - Feel free to modify and adapt for your server's needs.
