# Research Assistant

A comprehensive AI-powered assistant platform for researchers that provides media translation, document analysis, and website knowledge extraction capabilities.

## Features

- **Media Translation**: Upload audio/video files for transcription and translation with playback capabilities
- **Document Chat**: Upload and analyze documents, then chat with their content
- **Website Knowledge**: Index websites and chat with their content
- **General Chat**: Ask questions and get AI-powered research assistance

## Requirements

- Node.js 18.x or higher
- npm or yarn
- OpenAI API key (for AI functionality)
- Neon PostgreSQL database (for storing data)

## 📚 Research Assistant Setup Guide
# Step 1: Download the Project
Download the zip file from GitHub (automatically saves in Downloads).

Extract the zip file.

Move the extracted folder to your Desktop.

# Step 2: Install VS Code
Download VS Code from: https://code.visualstudio.com/download

Install it according to your system (Windows / Mac / Linux).

# Step 3: Install Node.js
Download Node.js from: https://nodejs.org/en/download

Open the downloaded .msi file.

Install by clicking:

Next → Next → Accept → Install

Important: Check "Add to PATH" during installation.

After installation, a PowerShell window might open automatically and install additional dependencies (can take up to 1 hour depending on your processor).

# Step 4: Get Your OpenAI API Key
Create an API Key at: https://platform.openai.com/api-keys

Save the key immediately (you cannot view it again later).

Add credits (e.g., €5 is enough for 2-3 months).

# Step 5: Setup Project in VS Code
Open VS Code from the Start Menu.

Open the extracted project folder: RESEARCH-ASSISTANT-MAIN.

In the Explorer panel (left side), right-click → New File → name it .env.local.

Paste the following content inside .env.local:

DATABASE_URL=postgresql://neondb_owner:npg_twh9XVmCD8GL@ep-broad-king-a2vvv7gl-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_twh9XVmCD8GL@ep-broad-king-a2vvv7gl.eu-central-1.aws.neon.tech/neondb?sslmode=require


PGHOST=ep-broad-king-a2vvv7gl-pooler.eu-central-1.aws.neon.tech
PGHOST_UNPOOLED=ep-broad-king-a2vvv7gl.eu-central-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_twh9XVmCD8GL


POSTGRES_URL=postgres://neondb_owner:npg_twh9XVmCD8GL@ep-broad-king-a2vvv7gl-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_twh9XVmCD8GL@ep-broad-king-a2vvv7gl.eu-central-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-broad-king-a2vvv7gl-pooler.eu-central-1.aws.neon.tech
POSTGRES_PASSWORD=npg_twh9XVmCD8GL
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgres://neondb_owner:npg_twh9XVmCD8GL@ep-broad-king-a2vvv7gl-pooler.eu-central-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_twh9XVmCD8GL@ep-broad-king-a2vvv7gl-pooler.eu-central-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require


OPENAI_API_KEY="your-openai-api-key-here"


NODE_ENV="development"



# ⚡ Important:
At the line OPENAI_API_KEY, paste your real OpenAI secret key.

# Step 6: Save and Reboot
Save the .env.local file.

Reboot your computer once (recommended).

# Step 7: Open VS Code and Terminal
Open VS Code → Open your project again.

Click Terminal → New Terminal.

Terminal will open at bottom.

# Step 8: Install Node.js and PNPM
In the terminal: node -v
(should show version like v22.15.0)

If node is showing version correctly, now install pnpm:  npm install -g pnpm

# Step 9: Install Project Dependencies
Run this inside terminal:  pnpm install

# Step 10: Run the Project
Finally, to start your app, run:  pnpm dev

# You will see output like:
▲ Next.js 15.2.4
- Local:        http://localhost:3000
- Network:      http://192.168.0.109:3000
- Environments: .env.local

✓ Starting...
Step 11: Open Your App
Open browser

# Visit: http://localhost:3000

If you see any error, refresh the browser once.

### File Upload Issues

If you encounter issues with file uploads:
1. Check that the file size is within the allowed limit (100MB)
2. Ensure the file format is supported
3. Try a different browser if the issue persists

### Audio Playback Issues

If audio playback doesn't work:
1. Make sure your browser supports the Web Speech API
2. Check that your browser allows audio playback
3. Try a different browser if the issue persists

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
