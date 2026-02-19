# TCGServer - Pokémon TCG Companion Backend

A scalable backend for a Pokémon Trading Card Game companion app with zero surprise infrastructure costs.

## Architecture

- **Frontend**: iOS app (SwiftUI)
- **Backend**: Cloudflare Worker (BFF pattern)
- **Cache**: Cloudflare KV
- **External Data**: Limitless Tournament API
- **Future**: Firebase for Pro features

## Project Structure

```
/
├── src/               # Cloudflare Worker source code
├── tests/             # Test files
├── memory/            # Development memory & notes
└── wrangler.toml      # Cloudflare Worker configuration
```

## Getting Started

See the backend branch for development in progress.

## Public Endpoints

- `GET /v1/meta/top` - Top decks from recent tournaments
- `GET /v1/tournaments/recent` - Recent tournaments

## Development

See ARCHITECTURE.md for full technical details.
