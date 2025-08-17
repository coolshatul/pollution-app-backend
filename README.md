# Pollution Cities Backend

A **Serverless Framework** backend written in **TypeScript** that integrates with an external pollution data API, cleans and normalizes the data, enriches it with Wikipedia information, and exposes it via a REST API.

---

## 📤 Submission Details

Thank you for the opportunity to complete the technical exercise. Please find my submission details below:

- **Frontend App (Deployed):** https://pollutionapp.netlify.app/
- **Backend Endpoint (Deployed):** https://vw1balhw7e.execute-api.ap-south-1.amazonaws.com/cities
- **Frontend GitHub Repo:** https://github.com/coolshatul/pollution-app-frontend
- **Backend GitHub Repo:** https://github.com/coolshatul/pollution-app-backend

---

## 🚀 Features

- **Serverless Architecture**: AWS Lambda + API Gateway for scalable, cost-effective deployment
- **Type Safety**: Written in TypeScript for better code quality and maintainability
- **Data Integration**: Fetches pollution data from a mock API with authentication
- **Automatic Token Management**: Handles token refresh automatically
- **Data Cleaning**: Normalizes and filters out invalid/non-city entries
- **Data Enrichment**: Enriches each city with Wikipedia description and thumbnail
- **Caching**: In-memory caching to reduce external API calls and improve performance
- **CORS Support**: Properly configured CORS headers for frontend integration
- **Pagination**: Built-in pagination support for efficient data retrieval

---

## 🛠 Tech Stack

- **Node.js + TypeScript**
- **Serverless Framework**
- **AWS Lambda / API Gateway** (target environment)
- **Axios** for API requests
- **Node-cache** for caching
- **Dotenv** for environment management

---

## 📁 Project Structure

```
backend/
├── src/
│   └── handler.ts      # Main Lambda function implementation
├── utils/
├── package.json        # Dependencies and scripts
├── serverless.yml      # Serverless Framework configuration
├── environment.yml     # Environment variables configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

---

## 📋 Prerequisites

- Node.js >= 20
- npm or yarn
- Serverless Framework installed globally (`npm install -g serverless`)
- AWS credentials (if deploying to AWS)

---

## ⚙️ Installation

```bash
cd backend
npm install
```

### Build Project

```bash
npm run build
```

This compiles TypeScript files to JavaScript in the `dist/` directory.

---

## 🔑 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
API_USERNAME=testuser
API_PASSWORD=testpass
MOCK_API_BASE=https://api.mockurl.com
CACHE_TTL=3600
REGION=ap-south-1
```

### Variable Descriptions

| Variable | Description | Default |
|----------|-------------|---------|
| `API_USERNAME` | Username for mock API authentication | *Required* |
| `API_PASSWORD` | Password for mock API authentication | *Required* |
| `MOCK_API_BASE` | Base URL for the mock API | *Required* |
| `CACHE_TTL` | Cache time-to-live in seconds | `3600` (1 hour) |
| `REGION` | AWS region for deployment | `ap-south-1` |

---

## 🏃 Running Locally

Start the service with Serverless Offline:

```bash
npm run dev
```
or
```bash
sls offline
```

The API will be available at [http://localhost:3000/cities](http://localhost:3000/cities).

### Example Requests

```bash
# Get cities in Poland (default)
curl "http://localhost:3000/cities?country=PL"

# Get cities with pagination
curl "http://localhost:3000/cities?country=PL&page=2&limit=5"

# Get cities in Germany
curl "http://localhost:3000/cities?country=DE"
```

---

## 🧪 Testing

To test the API locally, you can use the curl commands above or use a tool like Postman.

The service includes error handling for:
- Authentication failures
- API request errors
- Invalid parameters
- Missing environment variables

---

## 🌐 API Endpoint

### `GET /cities`

Query Parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `country` | string | Yes | - | ISO country code (e.g., `PL`, `DE`, `FR`) |
| `page` | number | No | `1` | Pagination page number |
| `limit` | number | No | `100` | Items per page (max 100) |

### Success Response

```json
{
  "page": 1,
  "limit": 100,
  "total": 200,
  "validCityCount": 45,
  "totalPages": 2,
  "cities": [
    {
      "name": "Berlin",
      "country": "PL",
      "pollution": 51.3,
      "description": "Berlin is the capital and largest city of Germany...",
      "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/.../Berlin.jpg/320px-Berlin.jpg"
    }
  ]
}
```

### Error Responses

```json
// 400 Bad Request - Invalid parameters
{
  "message": "Country parameter is required"
}

// 401 Unauthorized - Authentication failed
{
  "message": "Authentication failed"
}

// 500 Internal Server Error
{
  "message": "Internal server error"
}
```

---

## 📎 Data Processing

### City Filtering Logic

Cities are filtered using the following rules:
1. Names are trimmed and normalized
2. Entries with non-alphabetic characters (except spaces and hyphens) are removed
3. Empty or numeric-only entries are removed
4. Entries containing these keywords are filtered out:
   - `district` (case insensitive)
   - `station` (case insensitive)
   - `powerplant` (case insensitive)
5. Duplicate city names are deduplicated
6. City names are properly capitalized

### Wikipedia Enrichment

Each city is enriched with:
- **Description**: Fetched from Wikipedia's REST API
- **Thumbnail**: Optional image URL from Wikipedia

If Wikipedia data is not available, default values are used.

### Caching Strategy

- Wikipedia API responses are cached in memory to reduce rate limiting
- Cache TTL is configurable via `CACHE_TTL` environment variable (default: 1 hour)
- Caching is per Lambda instance (not distributed)

---

## 🌍 Deployment

To deploy to AWS Lambda:

```bash
sls deploy
```

### Deployment Stages

You can deploy to different stages by specifying the stage option:

```bash
# Deploy to dev stage (default)
sls deploy

# Deploy to production stage
sls deploy --stage prod
```

---

## ⚠️ Limitations & Assumptions

### Filtering Limitations
- The filtering logic is heuristic-based; some valid small towns or unusual names might be filtered out accidentally
- Some non-city entities might still slip through if they don't contain the excluded keywords
- The filtering rules may need adjustment based on the actual data characteristics

### Wikipedia Data Limitations
- Wikipedia summaries or thumbnails may not always exist for a given city
- Wikipedia content may describe a broader region instead of the specific city
- Language is limited to English Wikipedia

### Caching Limitations
- In-memory caching works only for a single running instance and resets on restart
- Not suitable for distributed caching across multiple Lambda instances
- For production use, consider implementing Redis or another distributed cache

### Performance Considerations
- Wikipedia API calls are batched (5 at a time) to handle rate limits
- For large datasets, response times may be affected by Wikipedia API latency
- Consider implementing a more robust queuing mechanism for high-volume requests
