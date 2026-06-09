# PDF Textract

> A high-performance PDF Batch Processing & Text Extraction Engine designed for scalable data ingestion, enterprise document digitization, and research-focused document analysis.

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Electron](https://img.shields.io/badge/Electron-Desktop-purple)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-teal)

## Overview

PDF Textract is a desktop application built for processing large-scale PDF datasets efficiently. It combines a modern Electron-based user interface with a Python FastAPI backend to provide high-throughput document ingestion, configurable text extraction, and real-time monitoring.

The platform is designed for researchers, analysts, and enterprise users who need to process large document collections while maintaining flexibility over text-cleaning and extraction workflows.

Key capabilities include:

* Bulk PDF and directory processing
* OCR-enabled document extraction
* Real-time processing dashboard
* Metadata extraction
* Full-text search across processed documents
* Native Pause/Resume controls

---

## Features

### Document Processing

* Select individual PDF files or entire directories
* Support for archives exceeding 100GB+
* OCR support for scanned PDFs
* Metadata extraction

### Text Cleaning Pipeline

Users can dynamically enable or disable:

* Header removal
* Footer removal
* Page number removal
* Numeric data removal

### Real-Time Dashboard

Monitor processing in real time:

* Processing velocity
* Total elapsed time
* File-level progress tracking
* Overall batch progress
* Current extraction status
* Pause / Resume processing

### Search & Analysis

* Integrated full-text search
* Instant querying of extracted datasets

### Export

* Export processed results
* Structured output generation
* Metadata export support

---

## Why PDF Textract?

Unlike conventional PDF extraction tools, PDF Textract provides configurable preprocessing options that allow users to remove:

* Headers
* Footers
* Page numbers
* Numerical content

---

## Architecture

```text
┌──────────────────────────┐
│      Electron UI         │
│ React + TypeScript       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      FastAPI Backend     │
│  Local Processing Engine │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│     PDF Processing       │
│ OCR + Extraction         │
│ Transformation           │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Event Stream Updates     │
│ Real-time Progress       │
└──────────────────────────┘
```

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Electron
* Tailwind CSS
* Zustand

### Backend

For detail about backend's tech stack please checkout:
[Backend Repository](https://gitlab.uni-marburg.de/gurung/pdf-extractor)

---

## Installation

This installation guide is only for desktop app.
Please make sure your [backend](https://gitlab.uni-marburg.de/gurung/pdf-extractor) is running.

### Using npm

```bash
npm install
```

### Using yarn

```bash
yarn install
```

### Using pnpm

```bash
pnpm install
```

---

## Development

Start the frontend:

```bash
npm run dev
```

Start Electron in development mode:

```bash
npm run electron:dev
```

---

## Production Build

### Build Web Assets

```bash
npm run build
```

### Build Desktop Applications

#### macOS

```bash
npm run electron:build:mac
```

#### Windows

```bash
npm run electron:build:win
```

#### Linux

```bash
npm run electron:build:linux
```

---


## Use Cases

### Research

* Academic research
* Literature analysis
* Large-scale corpus generation
* NLP dataset preparation

### Enterprise

* Document digitization
* Knowledge extraction
* Compliance archives
* Internal search systems

### Data Engineering

* Structured data extraction
* Text preprocessing pipelines
* Machine learning data preparation

---

## Roadmap

### Planned Features

* LLM Integration
* AI-powered document analysis
* NLP-ready export formats
* Automated report generation
* Advanced semantic search
* Entity extraction pipelines
* Vector database integration

---

## Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Submit a Pull Request

All pull requests are reviewed before merging.

```bash
git checkout -b feature/my-feature
git commit -m "Add new feature"
git push origin feature/my-feature
```

---

## License

This project is licensed under the MIT License.

See the LICENSE file for details.

---

## Authors

Developed and maintained by the PDF Textract team.

Contributions from the open-source community are greatly appreciated.

---

## Future Vision

PDF Textract aims to become a complete document intelligence platform by combining:

* High-performance extraction
* NLP preprocessing
* Semantic search
* LLM-powered document understanding

into a single scalable desktop solution for researchers and enterprises.
