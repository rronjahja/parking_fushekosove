# 🅿️ Parking System – Fushë Kosovë

Sistem i plotë për monitorimin, rezervimin, pagesën dhe navigimin e parkingjeve publike në kohë reale.
Ndërtuar sipas specifikimit funksional e teknik, me hartë satelitore interaktive të qendruar në
**Fushë Kosovë (42.640711, 21.101119)** dhe ndërfaqe tërësisht në gjuhën shqipe.

---

## 1. Si ta hapësh dhe ta nisësh në VS Code

### Kërkesat paraprake
| Vegla | Versioni | Pse |
|---|---|---|
| **Node.js** | **18 ose më i ri** (çdo version) | Drejtuesi `mysql2` është 100% JavaScript — s'kërkon Node 22 dhe s'kompilon asgjë |
| **MySQL / MariaDB** | 5.7+/10.3+ | Baza e të dhënave. XAMPP, MySQL Server, ose MariaDB — çdonjëri punon |
| npm | vjen me Node | Menaxhimi i paketave |
| VS Code | çfarëdo versioni | Editori |

> Kontrollo Node: `node -v`. Nuk ka më kufizim versioni — problemi i mëparshëm me `node:sqlite` u zgjidh duke kaluar te MySQL.

### Baza e të dhënave (MySQL) — konfigurim i shpejtë
1. Sigurohu që serveri MySQL/MariaDB është duke punuar (në **XAMPP**: hap panelin → **Start** te MySQL).
2. Kopjo `server/.env.example` → `server/.env` dhe vendos kredencialet e tua:
   ```
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=          # bosh për XAMPP-in e paracaktuar
   MYSQL_DATABASE=parking_system
   ```
   Nuk ke nevojë ta krijosh bazën vetë — aplikacioni krijon bazën `parking_system` dhe të gjitha
   tabelat automatikisht në nisjen e parë.
3. Për të kontrolluar lidhjen para nisjes: `npm run doctor`.

> Nëse MySQL-i yt lidhet vetëm përmes socket-i (jo TCP), shto te `.env`:
> `MYSQL_SOCKET=/rruga/te/mysql.sock` (p.sh. `/var/run/mysqld/mysqld.sock` ose `/tmp/mysql.sock`).

### Hapat (5 minuta)

```bash
# 1. Hape dosjen e projektit në VS Code
#    File → Open Folder... → zgjidh dosjen "parking-system"

# 2. Hap terminalin e integruar (Ctrl + ` ose View → Terminal)

# 3. Instalo të gjitha varësitë (root + server + client) me një komandë:
npm run setup

# 4. Nis DY serverët njëkohësisht (backend + frontend):
npm run dev
```

Kaq! Pas disa sekondash do të shohësh:

```
[SERVER]  🅿️  Parking System API  →  http://localhost:4000/api
[CLIENT]  ➜  Local:   http://localhost:5173/
```

Hap **http://localhost:5173** në shfletues. Baza e të dhënave krijohet dhe mbushet
automatikisht në nisjen e parë (6 zona, 470 vend-parkime rreth qendrës së Fushë Kosovës).

### Komandat e tjera të dobishme
| Komanda | Çfarë bën |
|---|---|
| `npm run dev` | Nis backend (4000) + frontend (5173) së bashku |
| `npm run doctor` | **Diagnostikë**: kontrollon lidhjen me MySQL dhe krijimin e bazës |
| `npm run seed` | Rikrijon bazën nga zeroja (fshin gjithçka) |
| `npm run build` | Ndërton frontend-in për produksion (`client/dist`) |
| `npm start` | Nis vetëm API-në (mënyra produksion) |

### Nëse serveri nuk niset ose klienti tregon "ECONNREFUSED"
Gabimet `http proxy error ... ECONNREFUSED` do të thonë vetëm se **backend-i nuk po punon** —
klienti është në rregull. Shkaku më i shpeshtë është që MySQL nuk është ndezur ose kredencialet
te `server/.env` nuk përputhen. Kontrollo lidhjen me:

```bash
npm run doctor
```

Kjo tregon nëse serveri MySQL përgjigjet dhe nëse baza u krijua. Për të parë gabimin e plotë të
serverit, nise backend-in vetëm: `cd server && npm run dev`.

### Llogaritë demo (ndryshoji në produksion!)
| Roli | Përdoruesi | Fjalëkalimi | Qasja |
|---|---|---|---|
| Administrator | `admin` | `Admin123!` | Paneli i Administratorit |
| **Super Admin** | `superadmin` | `Super123!` | Gjithçka + **Ndërtuesi** drag & drop + Restore i bazës |
| Agjent | `agjenti` | `Agjent123!` | Paneli i bisedave të mbështetjes |

Hyrja e stafit bëhet me **ikonën e çelësit** lart-djathtas (e fshehtë për publikun) → `/hyrje`.
Vizitorët e thjeshtë **nuk** shohin asnjë buton "Visitor"/panel — të dhënat e targave
dhe rezervimeve janë të mbrojtura pas kyçjes, siç u kërkua.

---

## 2. Çfarë përfshin sistemi

### Për qytetarët (pa llogari — sesion anonim automatik)
- **Harta live** satelitore/hibride/rrugore me 470 vende të vizatuara me kënd real mbi imazh Esri,
  të gjelbra = të lira, të kuqe = të zëna, blu ♿ = vende invalidësh, të verdha = të zgjedhura.
- **Rifreskim automatik çdo 2 sekonda** (ndalon kur skeda është e fshehur — kursen rrjetin).
- **6 zona** (P1 Qendra–Dardania, P2 Stacioni i Trenit, P3 Tregu, P4 Shkolla, P5 Komuna, P6 Parku).
- **Zgjedhja e vendit**: klikim në hartë ose me numër ("Parkingu: 6" → Zgjidh) me validime të qarta.
- **Pagesa** me 3 mënyra: **SMS**, **Aparat**, **Kredi** (100 kredi = 1 €).
  Tarifat: 1h = 0.50 € · 2h = 1.00 € · 3h = 1.50 € · 24h = 5.00 €.
- **Kuleta e krediteve** me bilanc live dhe **Rimbush kredi** (2/5/10/20/50 €).
  Çdo vizitor i ri merr 500 kredi demo (konfigurohet te `server/.env` → `DEMO_STARTING_CREDITS`).
- **Rezervimi atomik**: dy persona s'mund ta zënë të njëjtin vend — kontrolli bëhet brenda
  transaksionit në bazë; skadimi lirohet automatikisht (punë sfondi çdo 3 s).
- **Navigimi**: "Nis navigimin" (me lokacionin tënd), "Hap në Google Maps", "Kopjo koordinatat".
- **Gjej veturën time**: shkruaj targën → sistemi të çon te vendi ku është parkuar.
- **Chat i mbështetjes live** me tregues "Agjenti është në linjë / jashtë linje".
- **Temë Errët/Dritë** + dizajn modern responsiv për telefon e desktop.

### Për administratorët (butoni "Administratori" → panel me X për mbyllje)
- **Përmbledhja**: kartela statistikash (të zëna/të lira, rezervime aktive/të skaduara,
  të ardhurat, ndarja sipas mënyrës së pagesës, bisedat) + tabela e zënies sipas zonave.
- **Rezervimet**: tabela e plotë (Zona · Parkingu · Makina · Kohëzgjatja · Skadimi Ora ·
  Skadimi Data · Mënyra · Totali · Statusi · Veprime) me filtra zone/statusi/metode/targe,
  hap-në-hartë dhe kopjo-koordinatat. Rifreskohet çdo 2 s.
- **Sistemi**: statusi i bazës (madhësia, numërimet), **Backup me një klik** (me checksum SHA-256),
  **Restore** (vetëm Super Admin — aplikohet në rinisjen e serverit), statusi i hostingut, audit log.

### Për Super Admin — 🔨 Ndërtuesi (drag & drop)
Vegël vizuale te `/ndertuesi` për konfigurimin e plotë të parkingjeve:
- **Zvarrit** çdo vend mbi imazhin satelitor për ta zhvendosur saktësisht.
- **Shto vende** me klikim në hartë; zgjidh paraprakisht **llojin** (Standard / **Invalid ♿**)
  dhe **këndin** (0–359°).
- **Shto 5 vende në rresht** automatikisht (hapi 2.7 m, paralel me vendin e zgjedhur).
- Ndrysho **numrin, llojin dhe këndin** e çdo vendi ekzistues; fshij vende.
- **Krijo zona të reja** (sugjerohet automatikisht P7, P8…) me qendër aty ku është harta;
  **riemërto** ose **fshij** zona.
- **Rinumëro sipas radhës** (1…N) me një klik.
- Gjithçka ruhet vetëm me **"Ruaj ndryshimet"** — backend-i validon numrat unikë,
  mbron vendet me rezervime aktive dhe e kryen ruajtjen si transaksion atomik.

### Për agjentët — Paneli i Mbështetjes (`/agjenti`)
Lista e bisedave (të hapura/të mbyllura, badge për mesazhe të palexuara), përgjigjja në
kohë reale, mbyllja e bisedës. Vetë prania në panel të shënon "në linjë" për qytetarët.

---

## 3. Struktura e projektit

```
parking-system/
├─ package.json              # skriptet: setup / dev / seed / build / start
├─ server/                   # ─── BACKEND: Node.js + Express + MySQL ───
│  ├─ .env.example           # kopjoje si .env për konfigurim
│  └─ src/
│     ├─ index.js            # nisja e serverit + puna e skadimit
│     ├─ app.js              # Express app: helmet, cors, rate-limit, rrugët
│     ├─ config/             # env, konstante, TARIFAT (burim i vetëm)
│     ├─ db/                 # lidhja me MySQL (pool), schema, seed, doctor
│     ├─ middleware/         # auth JWT + role, gabimet, rate limiters
│     ├─ services/           # rezervimet (transaksioni atomik), kuleta,
│     │                      # statistikat, chat-i, layout-i, backup, audit
│     ├─ payments/           # ★ PLACEHOLDER-ët e integrimeve (shih §4)
│     └─ routes/             # auth / public / reservations / wallet /
│                            # support / admin / layout (REST API)
└─ client/                   # ─── FRONTEND: React 18 + Vite + Tailwind ───
   └─ src/
      ├─ i18n/sq.js          # TË GJITHA tekstet shqip në një vend
      ├─ api/                # klienti HTTP + çdo endpoint
      ├─ context/            # Auth (sesion anonim automatik), Theme, Toast
      ├─ hooks/              # usePolling (2 s), useCountdown
      ├─ utils/              # formatues + gjeometria e vendeve (poligonet)
      ├─ components/
      │  ├─ map/             # harta Leaflet, shtresat, format e vendeve
      │  ├─ zones/           # zgjedhësi i zonave + paneli i zonës
      │  ├─ spot/            # modali: Pagesa / Navigimi, targa, rimbushja
      │  ├─ chat/            # widget-i + dritarja e mbështetjes
      │  ├─ admin/           # paneli: statistika, tabela, sistemi
      │  ├─ builder/         # ★ Ndërtuesi drag & drop (hartë + panel)
      │  └─ layout/, ui/, guards/
      └─ pages/              # Home, Hyrje, Agjenti, Ndërtuesi
```

Asnjë skedar nuk i kalon ~350 rreshta — çdo pjesë ka përgjegjësi të vetme.

---

## 4. Integrimet e pagesave (të gatshme, por TË PALIDHURA)

Siç u kërkua, pagesat funksionojnë në mënyrë **demo** dhe janë të strukturuara që lidhja
reale të bëhet duke ndryshuar **vetëm një skedar** për secilën mënyrë:

| Mënyra | Skedari placeholder | Çfarë duhet lidhur më vonë |
|---|---|---|
| SMS | `server/src/payments/sms.gateway.js` | API i operatorit mobil (Vala/IPKO) |
| Aparat | `server/src/payments/terminal.gateway.js` | Rrjeti i aparateve fizike |
| Kartelë (rimbushja) | `server/src/payments/card.gateway.js` | Procesuesi i kartelave (Stripe/bankë) |

Çdo skedar ka kontratë të qartë (`charge(...)` → `{ ok, reference }`) dhe shënime
`TODO(INTEGRIM)`. Sot kthejnë sukses të simuluar; logjika e rezervimit nuk preket fare
kur t'i zëvendësosh. Forma e kartelës në UI nuk dërgon të dhëna askund.

---

## 5. Siguria & baza e të dhënave

- **JWT** për çdo identitet (edhe sesionet anonime), rolet GUEST/AGENT/ADMIN/SUPERADMIN
  të kontrolluara në çdo rrugë administrative.
- **Fjalëkalimet** me bcrypt; **rate limiting** global + i veçantë për login/pagesa/chat;
  **helmet** + CORS i kufizuar; të gjitha kërkesat me `prepared statements` (pa SQL injection).
- **Transaksione atomike** për pagesë+rezervim (pamundëson rezervimin e dyfishtë).
- **Audit log** për çdo veprim të rëndësishëm (rezervime, pagesa, ndryshime layouti, backup).
- **Backup**: "logical dump" i të gjitha tabelave në një skedar `.sql` te `server/backups/`
  + checksum SHA-256, i regjistruar në `backup_logs`. **Restore** ekzekuton përsëri atë skedar
  (aplikohet menjëherë, pa rinisje). Nuk kërkohen mjete të jashtme si `mysqldump`.
- Baza ruhet në serverin tënd MySQL (baza `parking_system`); krijohet automatikisht.

## 6. Shënime për produksion

1. Kopjo `server/.env.example` → `server/.env` dhe vendos `JWT_SECRET` të fortë.
2. Ndrysho fjalëkalimet e llogarive demo (ose fshiji nga `server/src/db/seed.js`).
3. `npm run build` → servo `client/dist` me nginx/caddy dhe kaloja `/api` te porti 4000.
4. Lidh gateway-t e pagesave (§4) dhe hiq `DEMO_STARTING_CREDITS` (vëre 0).
