import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import { APIGatewayProxyEvent } from "aws-lambda";

dotenv.config();

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL || "3600", 10) }); // Default TTL of 1 hour

interface CityData {
    city: string;
    [key: string]: any;
}

// Environment variables
const MOCK_API_BASE = process.env.MOCK_API_BASE!;
const USERNAME = process.env.API_USERNAME!;
const PASSWORD = process.env.API_PASSWORD!;

// Common CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // or restrict to Netlify domain
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
};

let authToken: string | null = null;
let refreshToken: string | null = null;

async function authenticate() {
    try {
        const res = await axios.post(`${MOCK_API_BASE}/auth/login`, {
            username: USERNAME,
            password: PASSWORD
        });
        authToken = res.data.token;
        refreshToken = res.data.refreshToken;
        return authToken;
    } catch (err) {
        console.error("Authentication error:", err);
        throw err;
    }
}

async function refreshAuthToken() {
    if (!refreshToken) {
        return authenticate();
    }
    try {
        const res = await axios.post(`${MOCK_API_BASE}/auth/refresh`, { refreshToken });
        authToken = res.data.token;
        return authToken;
    } catch (err) {
        console.error("Token refresh error:", err);
        return authenticate();
    }
}

function isValidCity(entry: string | undefined): boolean {
    if (!entry || typeof entry !== "string") return false;
    const invalidPatterns = [/[^a-zA-Z\s\-]/, /^\s*$/, /^\d+$/];
    return !invalidPatterns.some(pattern => pattern.test(entry));
}

// Fetch pollution data with token
async function fetchPollutionData(country = "PL", page = 1, limit = 100): Promise<CityData[]> {
    try {
        if (!authToken) await authenticate();
        const res = await axios.get(`${MOCK_API_BASE}/pollution`, {
            params: { country, page, limit },
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return res.data.results || [];
    } catch (err: any) {
        // if 401, try refresh token
        if (err.response && err.response.status === 401) {
            await refreshAuthToken();
            return fetchPollutionData(country, page, limit);
        }
        console.error("Pollution API error:", err.message);
        return [];
    }
}

// Fetch city description from Wikipedia
async function fetchCityDescription(cityName: string): Promise<{ description: string; thumbnail: string | null }> {
    const cached = cache.get<{ description: string; thumbnail: string | null }>(cityName);
    if (cached) return cached;

    try {
        const res = await axios.get(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`
        );
        const desc = res.data.extract || "No description available";
        const thumbnail = res.data.thumbnail?.source || null;

        const result = { description: desc, thumbnail };
        cache.set(cityName, result);
        return result;
    } catch {
        return { description: "No description available", thumbnail: null };
    }
}

export const getCities = async (event: APIGatewayProxyEvent) => {
    try {
        const country = event.queryStringParameters?.country || "PL";
        const page = parseInt(event.queryStringParameters?.page || "1", 10);
        const limit = parseInt(event.queryStringParameters?.limit || "100", 10);

        const data = await fetchPollutionData(country, page, limit);

        console.log(data);


        // Normalize and filter city names
        const cities = data
            .map((e) => e.name.trim())
            .filter(name =>
                isValidCity(name) &&
                !/district/i.test(name) &&
                !/station/i.test(name) &&
                !/powerplant/i.test(name)
            );
        const uniqueCities = Array.from(new Set(cities.map(name =>
            name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        )));

        const citiesData = [];

        // Process in batches to handle Wikipedia rate limits
        const batchSize = 5;
        for (let i = 0; i < uniqueCities.length; i += batchSize) {
            const batch = uniqueCities.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(async (cityName) => {
                    const original = data.find(d => d.name.trim().toLowerCase() === cityName.toLowerCase());
                    const wikiData = await fetchCityDescription(cityName);
                    return {
                        name: cityName,
                        country: country,
                        pollution: original?.pollution || null,
                        description: wikiData.description,
                        thumbnail: wikiData.thumbnail
                    };
                })
            );
            citiesData.push(...batchResults);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                page,
                limit,
                total: data.length,
                validCityCount: uniqueCities.length,
                totalPages: Math.ceil(data.length / limit),
                cities: citiesData
            }),
            headers: { "Content-Type": "application/json", ...corsHeaders },
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
            headers: { "Content-Type": "application/json", ...corsHeaders },
        };
    }
};