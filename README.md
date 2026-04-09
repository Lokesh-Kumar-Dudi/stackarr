# Media Server Stack — Setup Guide

## Architecture
Each service runs on its own port. No reverse proxy.

```
:7575  → Homarr      (dashboard)
:8080  → qBittorrent (downloads)
:9696  → Prowlarr    (indexers)
:8989  → Sonarr      (TV shows)
:7878  → Radarr      (movies)
:8096  → Jellyfin    (streaming)
:9443  → Portainer   (container management)
```

## Repo Structure
```
/Users/raven/dev/personal/stackarr/
├── docker-compose.yml    # Full stack definition
├── .env                  # Secrets & config (NOT committed)
├── .env.example          # Template for .env
├── servers.md            # Quick service URL reference
└── docs.md               # This guide
```

**Key design:** Secrets (VPN keys, passwords) live in `.env` which is gitignored.
Homarr config is persisted in `~/media/config/homarr` (Docker volume).

## Quick Start (clone and run)
```bash
# 1. Clone the repo
git clone <your-repo-url> && cd stackarr

# 2. Create .env with your secrets
cp .env.example .env   # then edit with your values

# 3. Create media directories
mkdir -p ~/media/{config,downloads,movies,tv}

# 4. Start the stack
docker compose --profile no-vpn up -d
# or with VPN:
docker compose --profile vpn up -d

# 5. Open dashboard
open http://localhost:7575
```

## Services & Ports

| Service      | Port  | URL                          |
|--------------|-------|------------------------------|
| Homarr       | 7575  | http://localhost:7575        |
| qBittorrent  | 8080  | http://localhost:8080        |
| Prowlarr     | 9696  | http://localhost:9696        |
| Sonarr       | 8989  | http://localhost:8989        |
| Radarr       | 7878  | http://localhost:7878        |
| Jellyfin     | 8096  | http://localhost:8096        |
| Portainer    | 9443  | https://localhost:9443       |

## Storage Layout (~/media)
- `~/media/downloads` — qBittorrent downloads
- `~/media/movies` — Radarr-managed movies
- `~/media/tv` — Sonarr-managed TV shows
- `~/media/config/{service}` — persistent config per service

## Jellyfin Library Paths (inside container)
- Movies → `/data/movies`
- TV Shows → `/data/tv`

## Container Networking (IMPORTANT)
Services must reference each other by **container/service name**, NOT `localhost`:
- qBittorrent from Radarr/Sonarr: `qbittorrent:8080` (no-vpn) or `gluetun:8080` (vpn)
- Sonarr from Prowlarr: `http://sonarr:8989`
- Radarr from Prowlarr: `http://radarr:7878`
- Prowlarr from Sonarr/Radarr: `http://prowlarr:9696`

## .env Variables
```bash
# VPN — ProtonVPN WireGuard credentials
# Get your WireGuard key from: https://account.proton.me/u/0/vpn/WireGuard
VPN_WIREGUARD_KEY=your_protonvpn_wireguard_private_key
VPN_COUNTRY=United States

# File permissions (match your local user)
PUID=501
PGID=20

# Storage
MEDIA_PATH=/Users/raven/media
```

## qBittorrent Auth
- Username: `admin`
- Password changes on every restart if not set permanently
- Check latest password: `docker logs qbittorrent 2>&1 | grep "temporary password"`
- **Set a permanent password** in Tools → Options → Web UI to avoid this
- Too many failed logins = IP ban; fix with `docker restart qbittorrent`

## Recommended Indexers (for Indian content)
Add in Prowlarr → Indexers:
- **1337x** — general, good Bollywood
- **TorrentGalaxy** — good Indian content
- **YTS** — movies, small files
- **EZTV** — TV shows
- **TamilMV / TamilBlasters** — South Indian regional content

---

## Step-by-Step Setup Guide

### Step 1: Prerequisites
- Docker Desktop installed and running on Mac
- Create media directories:
  ```bash
  mkdir -p ~/media/{config,downloads,movies,tv}
  ```

### Step 2: Configure VPN (optional)
- Go to https://account.proton.me/u/0/vpn/WireGuard
- Generate a WireGuard key pair and copy the **Private Key**
- Edit `.env` and fill in `VPN_WIREGUARD_KEY` and `VPN_COUNTRY`

### Step 3: Start the Stack
```bash
cd /Users/raven/dev/personal/stackarr

# Without VPN:
docker compose --profile no-vpn up -d

# With VPN:
docker compose --profile vpn up -d
```

### Step 4: Set Up Portainer — Container Management (localhost:9443)
1. Visit `https://localhost:9443` (accept the self-signed cert)
2. Create an admin username and password
3. Select **"Get Started"** to connect to your local Docker environment
4. You can now start/stop/restart any container from the Portainer UI

### Step 5: Set Up qBittorrent (localhost:8080)
1. Get the temporary password:
   ```bash
   docker logs qbittorrent 2>&1 | grep "temporary password"
   ```
2. Log in with username `admin` and the temp password
3. Go to **Tools → Options → Web UI** and set a **permanent password** immediately
4. This prevents the password from changing on every restart

### Step 6: Set Up Prowlarr — Indexers (localhost:9696)
1. Go to **Indexers → Add Indexer**
2. Search and add indexers (e.g. 1337x, TorrentGalaxy, YTS, EZTV)
3. Test each one after adding — if test fails, your ISP may be blocking it (try VPN)

### Step 7: Connect Prowlarr to Sonarr & Radarr
In Prowlarr → **Settings → Apps**:

**Add Sonarr:**
- Prowlarr Server: `http://prowlarr:9696`
- Sonarr Server: `http://sonarr:8989`
- API Key: get from Sonarr → Settings → General → API Key

**Add Radarr:**
- Prowlarr Server: `http://prowlarr:9696`
- Radarr Server: `http://radarr:7878`
- API Key: get from Radarr → Settings → General → API Key

### Step 8: Set Up Sonarr — TV Shows (localhost:8989)
1. Go to **Settings → Download Clients → Add → qBittorrent**
   - Host: `qbittorrent` (no-vpn) or `gluetun` (vpn)
   - Port: `8080`
   - Username: `admin`
   - Password: your permanent qBittorrent password
2. Go to **Settings → Media Management → Root Folders → Add** → `/tv`
3. To add a show: **Add New** → search → select → set root folder to `/tv` → pick quality profile → enable "Start search for missing episodes" → Add Series

### Step 9: Set Up Radarr — Movies (localhost:7878)
1. Go to **Settings → Download Clients → Add → qBittorrent**
   - Host: `qbittorrent` (no-vpn) or `gluetun` (vpn)
   - Port: `8080`
   - Username: `admin`
   - Password: your permanent qBittorrent password
2. Go to **Settings → Media Management → Root Folders → Add** → `/movies`
3. To add a movie: **Add New** → search → select → set root folder to `/movies` → pick quality profile → Add Movie

### Step 10: Set Up Jellyfin — Streaming (localhost:8096)
1. Complete the setup wizard:
   - Set language
   - Create admin username/password
   - Add library: **Movies** → content type "Movies" → folder `/data/movies`
   - Add library: **TV Shows** → content type "Shows" → folder `/data/tv`
   - **Enable "Allow remote connections to this server"**
   - Finish wizard
2. If accessing from other devices on your network, use `http://<your-mac-ip>:8096`

### Step 11: Improve Jellyfin Metadata & Thumbnails
1. **Dashboard → Libraries** → edit each library:
   - Enable **TheMovieDb** under Metadata downloaders
   - Enable **TheMovieDb** and **FanArt** under Image fetchers
2. **Dashboard → Plugins → Catalog** → install **Fanart** plugin → restart Jellyfin
3. **Dashboard → Playback → Trickplay** → enable trickplay generation (timeline preview thumbnails)
4. **Dashboard → Libraries** → three dots on each library → **Scan Library**
5. Optional: install **Open Subtitles** plugin for automatic subtitles

### Step 12: Set Up Homarr — Dashboard (localhost:7575)
1. Visit `http://localhost:7575`
2. Complete the initial setup (create admin account)
3. Add service tiles by clicking **Edit mode → Add tile**
4. Homarr can auto-detect running Docker containers via the mounted Docker socket

### Step 13: Searching & Downloading
**TV Shows (Sonarr):**
- Add New → search for show → add with desired quality
- To download a specific season: click the show → expand the season → click search icon next to the season header
- To download specific episodes: click search icon next to individual episodes

**Movies (Radarr):**
- Add New → search for movie → add with desired quality
- Radarr will automatically search indexers and send to qBittorrent

### Step 14: Watching
- Open Jellyfin at `http://localhost:8096` (or `http://<your-mac-ip>:8096` from other devices)
- Libraries auto-detect new downloads after Sonarr/Radarr organize them
- Use Jellyfin apps on phone/TV/browser to stream

---

## Files Reference
| File | Purpose | Committed? |
|------|---------|-----------|
| `docker-compose.yml` | Full stack definition | Yes |
| `.env` | Secrets & config | **No** (gitignored) |
| `.env.example` | Template for .env | Yes |
| `servers.md` | Quick service URL reference | Yes |
| `docs.md` | This guide | Yes |

## Troubleshooting
- **Sonarr "restart required" banner**: often cosmetic, test API key with curl to verify it works
- **Indexer connection failures**: may be ISP blocking — test with `docker exec prowlarr curl -s <indexer_url>`
- **Deleting a show in Sonarr** doesn't cancel active qBittorrent downloads — remove manually in qBittorrent
- **Jellyfin "server not available"**: remote access may be disabled — run:
  ```bash
  docker exec jellyfin sed -i 's|<EnableRemoteAccess>false|<EnableRemoteAccess>true|' /config/config/network.xml && docker restart jellyfin
  ```
- **To fully reset Jellyfin**: `docker stop jellyfin && rm -rf ~/media/config/jellyfin && docker start jellyfin`
- **qBittorrent IP ban** from failed logins: `docker restart qbittorrent`
- **Portainer**: uses HTTPS on port 9443 — accept the self-signed certificate warning
- **VPN not connecting**: verify `VPN_WIREGUARD_KEY` in `.env` is the WireGuard private key from ProtonVPN (not the public key)
