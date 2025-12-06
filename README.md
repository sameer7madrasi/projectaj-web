# ProjectAJ

A modern web application for searching handwritten diary entries using AI-powered semantic search. ProjectAJ leverages OpenAI embeddings and Supabase's vector similarity search to help you find and explore your past diary entries through natural language queries.

## Features

- 🔍 **Semantic Search**: Search your diary entries using natural language queries instead of exact keyword matching
- 🤖 **AI-Powered**: Uses OpenAI's text-embedding-3-small model for intelligent search
- 📝 **Diary Management**: Search through handwritten diary pages with metadata (dates, page numbers)
- ⚡ **Fast & Responsive**: Built with Next.js for optimal performance
- 🎨 **Modern UI**: Clean, dark-themed interface built with Tailwind CSS

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL with vector extensions)
- **AI**: OpenAI API (embeddings)
- **UI**: React 19

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account and project
- An OpenAI API key
- A PostgreSQL database with the `pgvector` extension enabled
- A database function `match_diary_pages` for vector similarity search

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Default number of search results (defaults to 5)
PROJECTAJ_DEFAULT_MATCH_COUNT=5
```

### Getting Your API Keys

1. **Supabase**:
   - Go to your [Supabase Dashboard](https://app.supabase.com/)
   - Navigate to Project Settings → API
   - Copy your Project URL and Service Role Key

2. **OpenAI**:
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy and add it to your `.env.local` file

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd projectaj-web
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up your environment variables (see above)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter a natural language query in the search box (e.g., "times I felt anxious about work")
2. Click "Search" or press Enter
3. View the matching diary entries with:
   - Entry date
   - Page number (if available)
   - Similarity score
   - Text snippet (first 300 characters)

## Project Structure

```
projectaj-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── search/
│   │   │       └── route.ts      # Search API endpoint
│   │   ├── page.tsx              # Main homepage with search UI
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── lib/
│   │   └── supabaseServer.ts     # Supabase server client
│   └── components/               # React components (for future use)
├── public/                       # Static assets
├── package.json
└── README.md
```

## API Documentation

### POST `/api/search`

Search diary entries using semantic similarity.

**Request Body:**
```json
{
  "query": "your search query",
  "matchCount": 5  // optional, defaults to 5
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "string",
      "diary_id": "string",
      "page_number": number | null,
      "raw_text": "string | null",
      "clean_text": "string | null",
      "entry_date": "string | null",
      "similarity": number
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Database Setup

This project requires a Supabase PostgreSQL database with:

1. **pgvector extension** enabled for vector similarity search
2. A table storing diary entries with:
   - Text content (raw_text, clean_text)
   - Embedding vectors
   - Metadata (diary_id, page_number, entry_date)
3. A PostgreSQL function `match_diary_pages` that:
   - Accepts `query_embedding` (vector) and `match_count` (integer)
   - Returns matching diary pages ordered by similarity

Example function signature:
```sql
CREATE OR REPLACE FUNCTION match_diary_pages(
  query_embedding vector(1536),
  match_count int
)
RETURNS TABLE (
  id text,
  diary_id text,
  page_number int,
  raw_text text,
  clean_text text,
  entry_date date,
  similarity float
)
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your environment variables in Vercel's dashboard
4. Deploy!

For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on the repository.
