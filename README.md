# ⚡ TransactFlow

<p align="center">
  <img src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" alt="TransactFlow Banner" width="100%" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);" />
</p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react" alt="React 19" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite" alt="Vite 6" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS v4" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-NoSQL-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase" /></a>
</p>

---

## 📝 Description

**TransactFlow** is a premium, high-fidelity interactive invoice and financial document generation platform. Built with local-first offline support and seamless cloud synchronization, it empowers freelancers, micro-SMEs, and independent contractors to generate, preview, print, and share professional transactions.

TransactFlow handles complex tax calculations (e.g., standard PPN 11%), multi-tier discounts, down payment adjustments, and final balance settlements in real-time. The application features a print-accurate WYSWYG A4 canvas rendering engine, allowing instant multi-format downloads (PDF & PNG) or direct WhatsApp billing shares with pre-formatted Indonesian templates.

---

## 📸 Preview & Demo

> [!NOTE]
> Below are placeholders for application screenshots. Please replace these URLs with screenshots of your running application on GitHub.

| Dashboard View | Invoice Creator |
|---|---|
| ![Dashboard Placeholder](https://placehold.co/600x400/eaecf0/121212?text=Dashboard+Analytics+View) | ![Form Creator](https://placehold.co/600x400/eaecf0/121212?text=Invoice+Form+%26+Live+A4+Preview) |

| Client & Services Directory | Financial Reports |
|---|---|
| ![Contacts Directory](https://placehold.co/600x400/eaecf0/121212?text=Clients+%26+Products+Catalog) | ![Reports Spreadsheet](https://placehold.co/600x400/eaecf0/121212?text=Excel+%26+CSV+Exports) |

---

## ✨ Key Features

*   **📄 Multi-Document Formulation**: Generate professional **Invoices (Faktur)**, **Quotations (Penawaran Harga)**, **Down Payment invoices (DP)**, **Final Settlements (Pelunasan)**, and **Receipts (Kwitansi)**.
*   **📐 Exact A4 Print Preview**: Features an auto-scaling, print-perfect preview box. What you see is exactly what is printed or saved.
*   **📊 Integrated Reports & Analytics**: Calculate gross ledger volume, realized cash inflow, outstanding receivables, and discounts. Direct spreadsheet exports to **Excel (.xls)** and **CSV**.
*   **☁️ Dual Sync Backend (Hybrid Offline-Online)**:
    *   *Local-First Offline Sandbox*: Real-time updates automatically backed up to browser `localStorage`.
    *   *Supabase Cloud Database*: Fully automated database synchronization with a clean SQL schema, custom authentication listeners, and conflict-merging on startup.
    *   *Firebase Applet Ready*: Complete with Firestore security rules and configuration schema.
*   **💾 Multi-Format Export**: One-click download as high-definition A4 PDF (via `jsPDF` + pixel-ratio scaled `html-to-image`) or PNG images.
*   **📱 Native WhatsApp Billing**: Share pre-formatted billing parameters directly to WhatsApp numbers using localized country codes (e.g., formatting `08xxx` to `628xxx` automatically).
*   **🏢 Complete Brand Identity**: Store company profiles, bank account credentials, customize representative signatures, and upload business logos.

---

## 🛠️ Tech Stack

*   **Frontend Library**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite 6](https://vite.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Animation**: [Motion (Framer Motion)](https://motion.dev/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Database & Auth (Cloud Sync)**: [Supabase](https://supabase.com/) & [Firebase Firestore](https://firebase.google.com/)
*   **Export Helpers**: [jsPDF](https://github.com/parallax/jsPDF) & [html-to-image](https://github.com/bubkoo/html-to-image)

---

## 📁 Project Directory Structure

```text
├── assets/                     # Static media and applet configuration resources
├── dist/                       # Output directory for optimized builds
├── firebase-blueprint.json     # Blueprint structure for Firebase configurations
├── firestore.rules             # Access security rules for Firebase Cloud Firestore
├── index.html                  # Core application mounting page
├── package.json                # Project dependencies and script commands
├── src/                        # Main application logic folder
│   ├── App.tsx                 # Core UI coordinator and tab controller
│   ├── data.ts                 # Initial demo objects and mock templates
│   ├── types.ts                # TypeScript interface declarations
│   ├── utils.ts                # Calculations (PPN, DP, subtotal) & currency formatting
│   ├── index.css               # Styling rules and Tailwind imports
│   ├── components/             # Reusable UI components
│   │   ├── AuthModal.tsx       # Auth portal popup modal
│   │   ├── LoginPage.tsx       # Landing auth showcase page
│   │   ├── DashboardView.tsx   # Dashboard overview with KPI stats
│   │   ├── InvoicesView.tsx    # List and filters for invoices
│   │   ├── InvoiceForm.tsx     # Inputs editor for invoice fields
│   │   ├── InvoicePreview.tsx  # Dynamic WYSIWYG A4 preview sheet
│   │   ├── CustomersView.tsx   # Customer directory manager
│   │   ├── ServicesView.tsx    # Product catalog manager
│   │   ├── ReportsView.tsx     # Revenue stats and spreadsheet exports
│   │   ├── ProfileView.tsx     # User's company bank accounts and branding setup
│   │   └── Header.tsx          # Top bar navbar and synchronization controls
│   └── lib/                    # Configuration clients
│       ├── firebase.ts         # Firestore config initialization
│       └── supabase.ts         # Supabase client credentials mapping
├── tsconfig.json               # Type compiler config parameters
└── vite.config.ts              # Bundle orchestration configurations
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18.x or higher recommended) and `npm`.

### ⚙️ Environment Configuration

Create a `.env` file in the root directory. You can copy the structure from `.env.example`:

```bash
cp .env.example .env
```

Define the following parameters inside your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"

# Gemini AI Credentials (Required if triggering future AI components)
GEMINI_API_KEY="your-gemini-api-key"

# App Location Config
APP_URL="http://localhost:3000"
```

### 💻 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/invoice-creator.git
   cd invoice-creator
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

### 📈 Database Setup (Supabase)

To enable cloud synchronization, navigate to your **Supabase SQL Editor** and execute the following query to initialize the required tables:

```sql
-- Create Customers Catalog Table
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  billing_address TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Services/Products Catalog Table
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_qty NUMERIC DEFAULT 1,
  default_unit TEXT DEFAULT 'Unit',
  default_cost NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Invoices & Documents Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  billing_address TEXT,
  issue_date TEXT,
  due_date TEXT,
  payment_terms TEXT,
  discount NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  document_type TEXT DEFAULT 'invoice',
  dp_percentage NUMERIC DEFAULT 0,
  dp_paid_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'transfer',
  customer_phone TEXT,
  customer_email TEXT,
  signature_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Sender / Company Profile Table
CREATE TABLE IF NOT EXISTS public.sender_info (
  id TEXT PRIMARY KEY, -- Maps to user_id
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  logo_url TEXT,
  signature_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sender_info ENABLE ROW LEVEL SECURITY;

-- Create Policies to isolate user-specific data
CREATE POLICY "Allow authenticated read/write for owners" ON public.customers 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated read/write for owners" ON public.services 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated read/write for owners" ON public.invoices 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated read/write for owners" ON public.sender_info 
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

### ⚡ Running Locally

Run the local development server:

```bash
npm run dev
```

The app will start on port `3000`. Open your browser and navigate to `http://localhost:3000`.

---

## 🛠️ Build & Deployment

### Build Production Bundle

To build the static HTML/JS/CSS assets optimized for production, run:

```bash
npm run build
```

This generates production-ready assets inside the `dist` folder.

### Deployment Options

*   **Vercel / Netlify**: Connect your GitHub repository to Vercel or Netlify. Configure the build command as `npm run build` and output directory as `dist`. Ensure the environment variables matching your `.env` file are set in the provider's dashboard.
*   **Firebase Hosting**: Initialize Hosting in your project folder using Firebase CLI (`firebase init hosting`), configure the public directory to `dist`, and run `firebase deploy`.

---

## 💡 Usage Example

1.  **Set Up Profile**: Go to the **Profile** tab, fill out your organization's name, bank accounts, logo (optional), and custom signature, then save.
2.  **Add Clients & Services**: Populate the directories under **Customers** and **Services** tabs.
3.  **Draft a Document**: Under **Invoices** tab, click **New Invoice**. Select your Document Type (e.g. Quotation or Down Payment).
4.  **Auto-Calculate Math**: Add items. The subtotal, PPN tax (11%), discounts, and totals update immediately.
5.  **Live Preview**: Check the right-hand panel for a print-accurate WYSWYG preview.
6.  **Export & Share**:
    *   Click **Export PDF** to download the A4 document directly.
    *   Click **Share WA** to open WhatsApp Web/API containing pre-populated billing text templates to send directly to your customer's contact.
7.  **Review Ledger**: Open the **Reports** tab to inspect gross collections and export summaries as Excel or CSV sheets.

---

## 🗺️ Future Roadmap

*   [ ] **🤖 AI Studio - Gemini Scan**: Implement automatic receipt & document scanning to instantly draft invoices using the `@google/genai` API SDK.
*   [ ] **💵 Multi-Currency Support**: Switch between IDR, USD, EUR, and SGD with live conversion rates.
*   [ ] **📧 Email Delivery Tracking**: Integrate SMTP/Resend API to track whether customers have opened invoice links.
*   [ ] **🎨 Multiple Layout Templates**: Select from several design presets (Modern Minimalist, Corporate Classic, and Creative Bold).

---

## 🤝 Contributing

Contributions are welcome! Please read the contribution instructions below to get started:

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**. Check [LICENSE](LICENSE) for more details.

---

## ✍️ Author

*   **Indra Arya** - Developer & Maintainer - [@indraarya77](https://github.com/indraarya77)
*   Portfolio: [indraarya.com](https://indraarya.com) (Placeholder)
