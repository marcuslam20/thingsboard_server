# Tuya UI Migration Progress

> Branch: `feature/tuya-ui` (tach tu `feature/smart-home`)
> Ngay bat dau: 2026-02-24
> Muc tieu: Redesign admin-ui giong Tuya IoT Platform (platform.tuya.com)

---

## Nguyen tac chinh

1. **UI truoc, features sau** — Thay doi giao dien voi tinh nang hien co truoc, bo sung tinh nang moi sau
2. **Khong can Figma luc nay** — Screenshots trong `docs/tuya-platform-design/` du de Claude Code doc truc tiep
3. **Figma MCP sau** — Khi can chinh pixel-perfect, design tokens, hoac nhieu nguoi cung lam UI

---

## Screenshots da thu thap

Luu tai: `docs/tuya-platform-design/`

| File | Noi dung | Da phan tich |
|------|---------|-------------|
| `01-home-dashboard.png` | Trang chu Tuya Platform — welcome banner, tutorial steps, developer console cards, My Space sidebar | YES |
| `02-ai-products.png` | Product Development — danh sach products (= Device Profiles), table voi status, tag filter | YES |
| `ai-products-tab.png` | Sidebar expanded — All Products, Sold Devices, Device Logs, Firmware Update, Voice Integration | YES |
| `04-device-details.png` | Devices page — summary cards (total/online), advanced filters, device table | YES |
| `05-devices-debug.png` | Device Debug — product selector, real device debug, virtual device list | YES |

### Can chup them:
- [ ] Product Detail page (DP definitions, function definitions)
- [ ] Cloud > Projects page
- [ ] Cloud > API Explorer
- [ ] Data > Analytics page
- [ ] Operation > Settings
- [ ] Login page cua Tuya Platform
- [ ] App > OEM App page

---

## Mapping Tuya Platform → ThingsBoard

### Khai niem co ban

| Tuya | ThingsBoard | Ghi chu |
|------|-------------|---------|
| Product | Device Profile | Khuon mau thiet bi, dinh nghia DPs |
| Device | Device | Thiet bi vat ly cu the |
| Company (dang ky platform) | Tenant | Cong ty/to chuc |
| Company employee | TENANT_ADMIN | Nhan vien quan ly |
| End user (Tuya Smart app) | CUSTOMER_USER | Nguoi dung cuoi, chi dung mobile app |
| Tuya system admin | SYS_ADMIN | Quan ly tat ca tenants |

### Sidebar module mapping

```
Tuya Module    → ThingsBoard Pages            → Route hien tai
────────────────────────────────────────────────────────────
Overview       → Home Dashboard                → /home
AI Product     → Device Profiles + Devices     → /profiles/deviceProfiles, /entities/devices
  All Products → Device Profiles list          → /profiles/deviceProfiles
  Devices      → Devices list                  → /entities/devices
  Device Logs  → Audit Logs                    → /security-settings/auditLogs
  Firmware     → OTA Updates                   → /otaUpdates
  Voice        → Entity Views (placeholder)    → /entities/entityViews
App            → Dashboards + Widgets          → /dashboards, /widgets-bundles
  Dashboards   → Dashboards                    → /dashboards
  Widgets      → Widget Library                → /widgets-bundles
Cloud          → Rule Engine + Edge            → /ruleChains, /edgeManagement/edges
  Rule Chains  → Rule Chains                   → /ruleChains
  Edges        → Edge Management               → /edgeManagement/edges
  Gateways     → Gateways                      → /gateways
AI Agent       → Assets                        → /entities/assets
  Assets       → Assets                        → /entities/assets
  Asset Prof.  → Asset Profiles                → /profiles/assetProfiles
Data           → Alarms + Analytics            → /alarms, /usage
  Alarms       → Alarms                        → /alarms
  API Usage    → API Usage                     → /usage
Operation      → Admin + Security + Users      → /settings/*, /security-settings/*
  Settings     → Admin Settings                → /settings/general
  Security     → Security Settings             → /security-settings/general
  Customers    → Customers                     → /customers
  Users        → Users                         → /users
  Tenants      → Tenants (SYS_ADMIN)           → /tenants
  Queues       → Queues (SYS_ADMIN)            → /queues
  Notifications→ Notifications                 → /notifications
  Resources    → Resources                     → /resources
Purchase       → API Usage (placeholder)       → /usage
VAS            → Resources (placeholder)       → /resources
```

---

## Da hoan thanh (2026-02-24)

### 1. Theme — Tuya color scheme
**File:** `src/theme/theme.ts`

- Primary: `#FF6A00` (Tuya orange) thay cho `#305680` (ThingsBoard blue)
- Background: `#F5F7FA` (light gray) thay cho `#eeeeee`
- Sidebar: white background voi orange active state
- Typography: clean, smaller font sizes, `textTransform: 'none'` cho buttons
- Components: rounded borders (8px), subtle shadows, orange focus states
- Exported `tuyaColors` object cho reuse across components

### 2. Sidebar — Icon-based module groups
**File:** `src/components/layout/Sidebar.tsx`

- Narrow 72px collapsed mode voi icon + label (giong Tuya left sidebar)
- 9 module groups: Overview, Product, App, Cloud, AI Agent, Data, Operation, Purchase, VAS
- Click module → expand to 240px voi sub-menu items
- Orange highlight cho active module/item
- Authority-based filtering (SYS_ADMIN/TENANT_ADMIN/CUSTOMER_USER)
- Tooltip on hover khi collapsed
- TB logo voi gradient orange

### 3. TopBar — Tuya-style navigation
**File:** `src/components/layout/TopBar.tsx`

- Help, Documents, Tech Support buttons (left side)
- Language selector (English/Vietnamese dropdown)
- My Space button
- Notification bell voi badge
- Apps grid icon
- Profile avatar voi dropdown menu (Profile, Security, Logout)
- White background voi bottom border

### 4. MainLayout — New layout structure
**File:** `src/components/layout/MainLayout.tsx`

- Fixed sidebar (72px) + sticky top bar
- Content area voi max-width 1440px, centered
- Background color `#F5F7FA`
- Removed old sidebarOpen toggle (sidebar tu expand/collapse khi click module)

### 5. HomePage — Welcome dashboard
**File:** `src/pages/home/HomePage.tsx`

- Welcome banner voi TB logo + greeting message
- 4-step tutorial Stepper (Create Product → Add Devices → Build Dashboard → Test & Release)
- Get Started + Read Document buttons
- Developer Console: 4 cards (Product Development, App Development, Cloud Development, AI Agent) voi color-coded icons
- My Space right sidebar: Enterprise Info, Authorization, Invoiced, Contract links
- Service Status card
- Quick Actions chips (New Device, New Dashboard, View Alarms)

---

## Chua hoan thanh — Buoc tiep theo

### Quyet dinh can thao luan voi sep:

**Van de: Ai duoc phep login vao web platform?**

| Cach | Mo ta | Uu diem | Nhuoc diem |
|------|-------|---------|------------|
| **Cach 1: Tach rieng** | Web chi cho SYS_ADMIN + TENANT_ADMIN. Block CUSTOMER_USER login web. | Giong Tuya, ro rang | Can mobile app san sang |
| **Cach 2: Giu nguyen** | Tat ca role deu login web, nhung UI khac nhau theo role | Linh hoat, test duoc ngay | Khong giong Tuya 100% |

→ **De xuat: Cach 1** vi mobile app team dang lam rieng, CUSTOMER_USER se dung mobile app

### Cong viec con lai:

#### Priority 1: Cac trang chinh (giong Tuya screenshots)
- [ ] **Product Development page** — Redesign DeviceProfilesPage giong `02-ai-products.png`
  - Table voi columns: Product Info (icon+name+ID), Device Type, Status, Created At
  - Tag filter system
  - Status column (Developing/Completed)
  - "Create Product" button prominent
- [ ] **Devices page** — Redesign DevicesPage giong `04-device-details.png`
  - Summary cards (Total Devices, Online, Offline)
  - Advanced filter bar (name, status, product, activation date)
  - Export data button
- [ ] **Device Debug page** — Them debug tab giong `05-devices-debug.png`
  - Product selector
  - Real Device Debug section (add device by ID)
  - Virtual Device section

#### Priority 2: Page-level redesign
- [ ] Redesign tat ca page headers giong Tuya (title + description + breadcrumbs)
- [ ] Redesign table style giong Tuya (row hover, action buttons, status chips)
- [ ] Redesign form dialogs giong Tuya (clean, rounded, orange accent)
- [ ] Redesign login page giong Tuya (neu co screenshot)

#### Priority 3: Tinh nang moi
- [ ] DP Editor UI (backend Phase 1 da co API)
- [ ] Voice Integration config page
- [ ] Device Health dashboard
- [ ] Product status workflow (Developing → Completed)

#### Priority 4: Polish
- [ ] i18n — Vietnamese translations
- [ ] Dark mode toggle
- [ ] Responsive layout (mobile/tablet)
- [ ] Loading skeletons

---

## Cau truc thu muc hien tai

```
admin-ui/src/
├── api/                    # 26 API services (khong thay doi)
├── components/
│   ├── entity/             # EntityTable, RelationTable, etc. (khong thay doi)
│   ├── layout/
│   │   ├── MainLayout.tsx  # ★ REDESIGNED — narrow sidebar layout
│   │   ├── Sidebar.tsx     # ★ REDESIGNED — icon-based module groups
│   │   └── TopBar.tsx      # ★ REDESIGNED — Tuya-style top nav
│   └── ErrorBoundary.tsx
├── guards/                 # ProtectedRoute (khong thay doi)
├── hooks/                  # useNotification, useTelemetrySubscription
├── i18n/                   # en.json (khong thay doi)
├── models/                 # 11 model files (khong thay doi)
├── pages/
│   ├── home/
│   │   └── HomePage.tsx    # ★ REDESIGNED — Tuya welcome dashboard
│   ├── ... (tat ca pages khac khong thay doi)
├── services/               # websocket.service.ts (khong thay doi)
├── store/                  # Redux store + auth slice (khong thay doi)
└── theme/
    └── theme.ts            # ★ REDESIGNED — Tuya orange color scheme
```

---

## Ky thuat

### Vite config
**File:** `vite.config.ts`
- Backend proxy: `http://192.168.1.14:8080` (thay doi tu localhost)
- WebSocket proxy: `ws://192.168.1.14:8080`
- Build output: `../ui-ngx/target/generated-resources/public/`

### Chay dev server
```bash
cd /home/vietlam/Desktop/TB_SERVER/thingsboard_server/.claude/worktrees/tuya-ui/admin-ui
npm run dev
# → http://localhost:3000
```

### Build production
```bash
npm run build
# → output tai ../ui-ngx/target/generated-resources/public/
```

### TypeScript check
```bash
npx tsc --noEmit
# → 0 errors (verified 2026-02-24)
```

---

## Git log

```
feature/tuya-ui
└── 0e61fd40 feat(admin-ui): Redesign UI framework to match Tuya IoT Platform
    └── a00d03ea docs: Add Angular-to-React UI migration roadmap to CLAUDE.md (from feature/smart-home)
```
