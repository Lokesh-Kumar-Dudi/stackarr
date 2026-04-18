# Media Server Stack — Setup Guide

## Quick Start (clone and run)
```bash
# 1. Clone the repo
git clone <your-repo-url> && cd stackarr

# 2. Create .env with your secrets
cp .env.example .env   # then edit with your values

# 3. Create media directories
mkdir -p ~/media/{config,downloads,movies,tv}

# 4. Start the stack (all traffic routed through Surfshark)
docker compose up -d

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

## Storage Layout (~/media)
- `~/media/downloads` — qBittorrent downloads
- `~/media/movies` — Radarr-managed movies
- `~/media/tv` — Sonarr-managed TV shows
- `~/media/config/{service}` — persistent config per service

## Jellyfin Library Paths (inside container)
- Movies → `/data/movies`
- TV Shows → `/data/tv`

## Container Networking (IMPORTANT)
Services must reference each other by **container/service name**, NOT `localhost`.
qBittorrent and Prowlarr run inside gluetun's network, so use `gluetun` as their host name:
- qBittorrent from Radarr/Sonarr: `gluetun:8080`
- Sonarr from Prowlarr: `http://sonarr:8989`
- Radarr from Prowlarr: `http://radarr:7878`
- Prowlarr from Sonarr/Radarr: `http://gluetun:9696`

## .env Variables
```bash
# Surfshark WireGuard credentials (required)
# Generate at: https://my.surfshark.com/vpn/manual-setup/main/wireguard
# Open the downloaded .conf — copy PrivateKey and Address below.
VPN_WIREGUARD_KEY=your_surfshark_wireguard_private_key
VPN_WIREGUARD_ADDRESSES=10.14.0.2/16

# File permissions (match your local user)
PUID=501
PGID=20

# Storage for macOS/linux
MEDIA_PATH=/Users/raven/media
# On windows
# MEDIA_PATH=C:\Users\raven\media or Z:\media
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

### Step 2: Configure Surfshark (required)
- Go to https://my.surfshark.com/vpn/manual-setup/main/wireguard
- Click **I don't have a key pair** → generate one (give it a name)
- Pick a location, then click **Download .conf** for that server
- Open the `.conf` file — it contains a `[Interface]` block with `PrivateKey = ...` and `Address = ...`
- Edit `.env`:
  - `VPN_WIREGUARD_KEY` = the `PrivateKey` value
  - `VPN_WIREGUARD_ADDRESSES` = the `Address` value (e.g. `10.14.0.2/16`)

gluetun will pick any available Surfshark server. To pin a location, add `SERVER_COUNTRIES=...` (or `SERVER_CITIES=...`) to the `gluetun` service in `docker-compose.yml`.

### Step 3: Start the Stack
```bash
cd /Users/raven/dev/personal/stackarr
docker compose up -d
```

### Step 4: Set Up qBittorrent (localhost:8080)
1. Get the temporary password:
   ```bash
   docker logs qbittorrent 2>&1 | grep "temporary password"
   ```
2. Log in with username `admin` and the temp password
3. Go to **Tools → Options → Web UI** and set a **permanent password** immediately
4. This prevents the password from changing on every restart

### Step 5: Set Up Prowlarr — Indexers (localhost:9696)
1. Go to **Indexers → Add Indexer**
2. Search and add indexers (e.g. 1337x, TorrentGalaxy, YTS, EZTV)
3. Test each one after adding — if test fails, your ISP may be blocking it (try VPN)

### Step 6: Connect Prowlarr to Sonarr & Radarr
In Prowlarr → **Settings → Apps**:

**Add Sonarr:**
- Prowlarr Server: `http://gluetun:9696`
- Sonarr Server: `http://sonarr:8989`
- API Key: get from Sonarr → Settings → General → API Key

**Add Radarr:**
- Prowlarr Server: `http://gluetun:9696`
- Radarr Server: `http://radarr:7878`
- API Key: get from Radarr → Settings → General → API Key

### Step 7: Set Up Sonarr — TV Shows (localhost:8989)
1. Go to **Settings → Download Clients → Add → qBittorrent**
   - Host: `gluetun`
   - Port: `8080`
   - Username: `admin`
   - Password: your permanent qBittorrent password
2. Go to **Settings → Media Management → Root Folders → Add** → `/tv`
3. To add a show: **Add New** → search → select → set root folder to `/tv` → pick quality profile → enable "Start search for missing episodes" → Add Series

### Step 8: Set Up Radarr — Movies (localhost:7878)
1. Go to **Settings → Download Clients → Add → qBittorrent**
   - Host: `gluetun`
   - Port: `8080`
   - Username: `admin`
   - Password: your permanent qBittorrent password
2. Go to **Settings → Media Management → Root Folders → Add** → `/movies`
3. To add a movie: **Add New** → search → select → set root folder to `/movies` → pick quality profile → Add Movie

### Step 9: Set Up Jellyfin — Streaming (localhost:8096)
1. Complete the setup wizard:
   - Set language
   - Create admin username/password
   - Add library: **Movies** → content type "Movies" → folder `/data/movies`
   - Add library: **TV Shows** → content type "Shows" → folder `/data/tv`
   - **Enable "Allow remote connections to this server"**
   - Finish wizard
2. If accessing from other devices on your network, use `http://<your-mac-ip>:8096`

### Step 10: Improve Jellyfin Metadata & Thumbnails
1. **Dashboard → Libraries** → edit each library:
   - Enable **TheMovieDb** under Metadata downloaders
   - Enable **TheMovieDb** and **FanArt** under Image fetchers
2. **Dashboard → Plugins → Catalog** → install **Fanart** plugin → restart Jellyfin
3. **Dashboard → Playback → Trickplay** → enable trickplay generation (timeline preview thumbnails)
4. **Dashboard → Libraries** → three dots on each library → **Scan Library**
5. Optional: install **Open Subtitles** plugin for automatic subtitles

### Step 11: Set Up Homarr — Dashboard (localhost:7575)
1. Visit `http://localhost:7575`
2. Complete the initial setup (create admin account)
3. Add service tiles by clicking **Edit mode → Add tile**
4. Homarr can auto-detect running Docker containers via the mounted Docker socket

#### Fixing Homarr status checks
If Homarr can open an app but shows it as offline, the usual cause is that the app URL is set to `localhost`.
Homarr performs pings from inside the `homarr` container, so `localhost` points to Homarr itself, not to Sonarr, Radarr, or the VPN-routed services.

Use these values when creating apps in Homarr:

| Service      | Open URL from browser                         | Ping URL from Homarr container |
|--------------|-----------------------------------------------|--------------------------------|
| Homarr       | `http://localhost:7575`                       | `http://homarr:7575`           |
| qBittorrent  | `http://localhost:8080`                       | `http://gluetun:8080`          |
| Prowlarr     | `http://localhost:9696`                       | `http://gluetun:9696`          |
| Sonarr       | `http://localhost:8989`                       | `http://sonarr:8989`           |
| Radarr       | `http://localhost:7878`                       | `http://radarr:7878`           |
| Jellyfin     | `http://localhost:8096`                       | `http://jellyfin:8096`         |

If you open Homarr from another device on your network, replace `localhost` in the browser URL with your server's LAN IP or hostname.

#### Adding gluetun to Homarr
`gluetun` does not provide a normal web dashboard, so it is best added through Homarr's **Docker** integration instead of as a standard app tile.

1. In Homarr, open **Tools → Docker** and confirm the Docker integration is available.
2. Add the **Docker stats** widget to your board.
3. Use that widget to monitor and control the `gluetun` container alongside the rest of the stack.


### Step 12: Searching & Downloading
**TV Shows (Sonarr):**
- Add New → search for show → add with desired quality
- To download a specific season: click the show → expand the season → click search icon next to the season header
- To download specific episodes: click search icon next to individual episodes

**Movies (Radarr):**
- Add New → search for movie → add with desired quality
- Radarr will automatically search indexers and send to qBittorrent

### Step 13: Watching
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
| `README.md` | This guide | Yes |

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
- **VPN not connecting**: verify `VPN_WIREGUARD_KEY` in `.env` is the WireGuard **PrivateKey** from the Surfshark `.conf` (not the public key), and that `VPN_WIREGUARD_ADDRESSES` matches the `Address` line from the same `.conf`
