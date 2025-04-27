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

## Installation

### Mac and Linux

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/research-assistant.git
   cd research-assistant
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Create a `.env.local` file in the root directory with the following variables:
   \`\`\`
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_neon_database_url
   \`\`\`

4. Set up the database:
   \`\`\`bash
   # Run the SQL script to create tables
   npx tsx scripts/setup-db.js
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

6. Open your browser and navigate to `http://localhost:3000`

### Windows

1. Clone the repository using Git Bash or Command Prompt:
   \`\`\`bash
   git clone https://github.com/yourusername/research-assistant.git
   cd research-assistant
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Create a `.env.local` file in the root directory with the following variables:
   \`\`\`
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_neon_database_url
   \`\`\`

4. Set up the database:
   \`\`\`bash
   # Run the SQL script to create tables
   npx tsx scripts/setup-db.js
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

6. Open your browser and navigate to `http://localhost:3000`

## Database Setup

The application requires a PostgreSQL database. We recommend using [Neon](https://neon.tech) for a serverless PostgreSQL database.

Create the necessary tables by running the following SQL script:

\`\`\`sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create media table
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  original_language VARCHAR(10),
  transcription TEXT,
  storage_path VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create media translations table
CREATE TABLE media_translations (
  id SERIAL PRIMARY KEY,
  media_id INTEGER REFERENCES media(id),
  target_language VARCHAR(10) NOT NULL,
  translation TEXT NOT NULL,
  audio_path VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  content_text TEXT,
  storage_path VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create websites table
CREATE TABLE websites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  url VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create website pages table
CREATE TABLE website_pages (
  id SERIAL PRIMARY KEY,
  website_id INTEGER REFERENCES websites(id),
  url VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vector embeddings table
CREATE TABLE vector_embeddings (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL, -- 'document', 'media', or 'website'
  source_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create conversations table
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  role VARCHAR(50) NOT NULL, -- 'user', 'assistant', or 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## Usage

### Media Translation

1. Navigate to the "Media Translation" tab
2. Upload an audio or video file
3. Select the target language for translation
4. Click "Process Media"
5. Once processing is complete, you can:
   - View the transcription and translation
   - Play the audio for both the original and translated content
   - Download the transcription and translation as text files
   - Chat with the content to ask questions about it

### Document Chat

1. Navigate to the "Document Chat" tab
2. Upload one or more documents (PDF, DOCX, TXT, etc.)
3. Click "Process Documents"
4. Once processing is complete, you can ask questions about the document content

### Website Knowledge

1. Navigate to the "Website Knowledge" tab
2. Enter a website URL
3. Click "Index"
4. Once indexing is complete, you can ask questions about the website content

### General Chat

1. Navigate to the "Chat Assistant" tab
2. Ask any research-related questions
3. The AI will provide helpful responses based on its knowledge

## Troubleshooting

### API Key Issues

If you see a warning about the OpenAI API key being missing:
1. Make sure you've added your OpenAI API key to the `.env.local` file
2. Restart the development server
3. Refresh the page

### Database Connection Issues

If you encounter database connection errors:
1. Verify your Neon database URL is correct in the `.env.local` file
2. Check that your IP address is allowed in the Neon database settings
3. Ensure the database tables have been created correctly

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
