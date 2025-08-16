## Pollution Cities Backend

A **Serverless Framework** backend written in **TypeScript** that integrates with an external pollution data API, cleans and normalizes the data, enriches it with Wikipedia information, and exposes it via a REST API.

---

### 🚀 Features
- Serverless (AWS Lambda + API Gateway).
- Written in TypeScript for better type safety.
- Fetches pollution data from a mock API (with authentication).
- Handles token refresh automatically.
- Normalizes and filters out invalid/non-city entries.
- Enriches each city with Wikipedia **description** and **thumbnail**.
- Simple in-memory caching to reduce external API calls.
- Single endpoint: `/cities`.

---

### 🛠 Tech Stack
- **Node.js + TypeScript**
- **Serverless Framework**
- **AWS Lambda / API Gateway** (target environment)
- **Axios** for API requests
- **Node-cache** for caching

---

### 📋 Prerequisites
- Node.js >= 20
- npm or yarn
- Serverless Framework installed globally (`npm install -g serverless`)
- AWS credentials (if deploying to AWS)

---

### ⚙️ Installation
```bash
cd backend
npm install
```

---

### 🔑 Environment Variables
Create a `.env` file in the backend directory:

```env
API_USERNAME=testuser
API_PASSWORD=testpass
```

- These credentials are required to authenticate with the pollution mock API.

---

### 🏃 Running Locally
Start the service with Serverless Offline:

```bash
npm run dev
```
or
```bash
sls offline
```

The API will be available at [http://localhost:3000/cities](http://localhost:3000/cities).

Example request:
```bash
curl "http://localhost:3000/cities?country=PL&page=1&limit=10"
```

---

### 🌐 Deployment
To deploy to AWS Lambda:

```bash
sls deploy
```

---

### 📌 API Endpoint
#### `GET /cities`

Query Parameters:
- `country` (string, required) → ISO country code (e.g., `PL`).
- `page` (number, optional, default `1`) → Pagination page.
- `limit` (number, optional, default `10`) → Items per page.

Response format:
```json
{
  "page": 1,
  "limit": 10,
  "total": 200,
  "cities": [
    {
      "name": "Berlin",
      "country": "Germany",
      "pollution": 51.3,
      "description": "Berlin is the capital of Germany...",
      "thumbnail": "https://upload.wikimedia.org/..."
    }
  ]
}
```

---

### 📎 Notes
- Invalid or non-city entries are filtered using normalization and simple heuristics.
- Wikipedia API responses are cached in memory to reduce rate limit issues.
- This service is designed for demonstration purposes (production should use a persistent cache like Redis).

---

### 🏙️ How do we determine whether something is a city?
- Entries are normalized (trimmed and lowercased).
- We filter out names containing keywords like `Station`, `District`, `PowerPlant`, `Unknown`, etc.
- Only proper city-like names remain (e.g., "Warsaw", "Kraków").
- Duplicate or near-duplicate names are deduplicated.

---

### ⚠️ Limitations & Assumptions
- The filtering logic is heuristic-based; some valid small towns or unusual names might be filtered out accidentally.
- Some non-city entities might still slip through if they don't contain the excluded keywords.
- Wikipedia summaries or thumbnails may not always exist for a given city, or may describe a broader region instead of the city.
- In-memory caching works only for a single running instance and resets on restart (not distributed).
