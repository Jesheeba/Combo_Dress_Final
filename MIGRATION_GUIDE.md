# Supabase Migration Guide

Follow these steps to move your application from Local Discovery to a Live Supabase Backend.

## 1. Supabase Project Setup
1.  Go to [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2.  In the **SQL Editor**, click "New Query", paste the contents of `DATABASE_SETUP.sql`, and click **Run**.
3.  In **Storage**, create a new bucket named `clothes`.
    - Set it to **Public**.
    - Add a policy allowing "Public Read" and "Full Access" for simplicity (or refine for production).

## 2. Environment Variables
1.  In your project root, create a file named `.env`.
2.  Copy the following from your Supabase Project Settings (API Section):
    ```env
    VITE_SUPABASE_URL=your-project-url.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-public-key
    ```
3.  Restart your development server (`npm run dev`).

## 3. Data Migration (Optional)
Once connected, the app will automatically start using the Supabase tables. 
- If you have existing data in your browser you want to keep, use the **CSV Export** in the Staff Dashboard and then contact support for import, or manually re-enter designs using the **Design Editor**.

## 4. Verification Check
- Go to the **Design Editor** and upload a test image.
- Refresh the page and ensure the design persists.
- If images or designs don't show up, check the browser console for connection errors.
