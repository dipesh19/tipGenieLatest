# Trips Genie — Full API MVP (Deploy Ready)

This archive includes full API implementations (cached) for visa, flights, and costs.

## Setup
1. Copy `.env.local.example` to `.env.local` and fill your keys.
2. `npm install`
3. `npm run dev`

## Notes
- Flights: AviationStack is not a price API in free tier; Kiwi (Tequila) is preferred for prices (requires API key).
- Visa: Travel Buddy (RapidAPI) used for visa policy and fees.
- Costs: Teleport urban area details used when available.
- Caching: Firestore collections `visaCache`, `flightCache`, `costCache`.
