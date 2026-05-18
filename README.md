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
- Protected access for authenticated users only

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

DropPilot combines two types of signals:

1. Prediction-based score  
   Used when a product has no sales yet.

2. Performance-based score  
   Used when the product has sales history.

This allows new products to be evaluated before real data exists, while also allowing proven products to rise based on actual performance.

The current scoring system uses:

- AI score
- number of sales
- total revenue
- weighted market simulation

## Authentication and Security

The dashboard requires login through Supabase Auth.

Database access is restricted to authenticated users.

Public anonymous access is disabled for the main tables.

The market reset feature is handled through a Supabase RPC function instead of direct frontend deletion.

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://msympbajofipaqnrysvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zeW1wYmFqb2ZpcGFxbnJ5c3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDc5MDYsImV4cCI6MjA5MzYyMzkwNn0.FXgyZ--wejB-yss2J7THVLFYMk4GylTTbPjLyDdwsPg