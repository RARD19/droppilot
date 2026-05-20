# DropPilot

DropPilot is a product testing and market simulation dashboard built with Next.js and Supabase.

The goal of the project is to help evaluate potential dropshipping products by tracking product data, simulated sales, revenue, scores, and opportunity ranking.

## Live Demo

Deployed on Vercel:

`https://droppilot.vercel.app/`

## Features

- User authentication with Supabase Auth
- Product creation, editing, and deletion
- Sales registration per product
- Market simulation based on product score
- Market reset using a secure Supabase RPC function
- Dynamic product ranking
- Opportunity labels:
  - 🔥 WINNER
  - 🟢 STRONG
  - 🟡 AVERAGE
  - 🔴 WEAK
- Revenue and sales KPIs
- Product leader detection
- Average score calculation
- Sales chart by product
- Filters by category and opportunity status
- Daily sales chart
- Product sorting by score, profit, sales, margin, and revenue
- Clear filters button
- Protected access for authenticated users only
- Product cost tracking
- Unit profit calculation
- Total profit calculation
- Real margin KPI
- Profit by product chart
- Profit-aware recommendations
- Profit-weighted radar score
- Supplier URL tracking
- Product notes
- Product status tracking
- Product status summary
- Recent sales history
- Recent sale deletion
- Status-aware recommendations
- Quick product status updates from product cards
- Paused and discarded products excluded from market simulation

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
  - Database
  - Auth
  - Row Level Security
  - RPC functions
  - Triggers
- Recharts
- Vercel
- GitHub

## Main Tables

### products

Stores product data such as:

- name
- category
- price
- target country
- AI score
- active status
- estimated cost
- supplier URL
- product notes
- product status

### sales

Stores product sales data:

- product ID
- sale amount in EUR
- sale amount in BRL
- creation date

### product_metrics

Stores aggregated product performance:

- times sold
- total revenue
- updated timestamp

### product_radar

A database view used by the dashboard to calculate:

- total sales
- total revenue
- raw score
- percentile
- opportunity label

## How the Scoring Works

DropPilot combines prediction, performance, and profitability signals.

The score considers:

- AI score
- Number of sales
- Total revenue
- Estimated product cost
- Unit profit
- Total profit
- Profit margin

This means the radar does not only rank products by sales or revenue. It also penalizes products with low margins and rewards products that show stronger profit potential.

A product with many sales but weak margin may be ranked lower than a product with fewer sales but stronger profitability.

## Authentication and Security

The dashboard requires login through Supabase Auth.

Database access is restricted to authenticated users.

Public anonymous access is disabled for the main tables.

The market reset feature is handled through a Supabase RPC function instead of direct frontend deletion.

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit real environment variables to GitHub.

The same variables must also be configured in Vercel under:

Project Settings → Environment Variables

## Project Status

Current version: MVP

Implemented:

- Authentication
- Product CRUD
- Sales tracking
- Market simulation
- Market reset
- Dashboard KPIs
- Sales chart
- Daily sales chart
- Search and filters
- CSV export
- Cost tracking
- Profit metrics
- Real margin KPI
- Profit-aware recommendations
- Profit-weighted radar score
- Profit by product chart
- Supabase security cleanup
- Supplier URL tracking
- Product notes
- Product status tracking
- Product status summary
- Recent sales history
- Recent sale deletion
- Status-aware recommendations
- Quick product status updates
- Simulation excludes paused and discarded products

Possible next improvements:

- Better mobile experience
- Product ownership per user
- More advanced recommendation logic
- Real marketplace data integration
- Sales history by product
- Export reports with charts