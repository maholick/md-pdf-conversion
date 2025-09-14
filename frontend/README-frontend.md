# Markdown to PDF Converter - Frontend

A modern web interface for converting Markdown files to beautifully formatted PDFs using Docker, Pandoc, and the Eisvogel LaTeX template.

## Features

- **Drag & Drop File Upload**: Easy file upload with drag-and-drop support
- **File Management**: Reorder files by dragging, remove individual files
- **Live Configuration**: Edit Pandoc and Eisvogel settings in real-time
- **Progress Tracking**: Visual feedback during conversion
- **Error Handling**: Clear error messages and success notifications
- **Instant Download**: Automatic PDF download after conversion

## Prerequisites

- Node.js 18+ and npm
- **Docker must be installed and running** (required for PDF conversion)
  - Start Docker Desktop on macOS/Windows
  - Or run `sudo systemctl start docker` on Linux
- The parent directory must contain the `templates` folder with PDF backgrounds
- The `pandoc/extra:3.1.1.0` Docker image (will be pulled automatically on first use)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## How to Use

1. **Upload Files**: Drag and drop your `.md` files or click to browse
2. **Reorder Files**: Drag files to rearrange their order in the final PDF
3. **Configure Settings**: 
   - Adjust Pandoc settings (TOC, numbering, syntax highlighting)
   - Set document metadata (title, author, date, etc.)
4. **Convert**: Click "Convert to PDF" to generate your document
5. **Download**: The PDF will automatically download when ready

## API Endpoints

- `POST /api/convert`: Accepts markdown files and configuration, returns PDF

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── convert/      # PDF conversion API
│   └── page.tsx          # Main application page
├── components/
│   ├── file-upload.tsx   # Drag-and-drop upload
│   ├── file-list.tsx     # File management with DnD
│   ├── sortable-file-item.tsx
│   └── config-editor.tsx # Settings editor
└── components/ui/        # shadcn/ui components
```

## Configuration Options

### Pandoc Settings
- Output filename
- Table of contents
- Section numbering
- Syntax highlighting
- Reference-style links

### Document Metadata
- Title and subtitle
- Author
- Date
- Subject
- Keywords
- Language
- Font size
- Title page

## Troubleshooting

- **Docker not found**: Ensure Docker is installed and running
- **Permission errors**: The API needs permission to create temp directories
- **PDF not downloading**: Check browser download settings
- **Conversion fails**: Verify markdown file format and Docker image availability