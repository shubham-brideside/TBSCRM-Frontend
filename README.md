# TBS CRM Frontend

React + TypeScript frontend for the Persons management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on http://localhost:3000

## Features

- **Persons List**: View all persons with filtering options
- **Person Detail**: View detailed information about a person
- **Filters**: Category, Organization, Manager, Wedding Venue, Date Range
- **Search**: Text search across person fields
- **Pagination**: Navigate through pages of results

## API Connection

The frontend connects to the Spring Boot API at `http://localhost:8082/api/persons`.

Make sure the backend is running before starting the frontend.

