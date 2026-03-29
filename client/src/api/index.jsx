import axios from "axios"

// Judge0 CE — free, open, no API key needed on the community instance
// Docs: https://ce.judge0.com
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com"
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || ""

// We always use the community endpoint (no key needed).
// If the user supplies a RapidAPI key via .env, we use the faster hosted version.
const useRapidAPI = Boolean(RAPIDAPI_KEY)

export const judge0 = axios.create({
    baseURL: useRapidAPI ? JUDGE0_URL : "https://ce.judge0.com",
    headers: {
        "Content-Type": "application/json",
        ...(useRapidAPI && {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        }),
    },
})

export default judge0
