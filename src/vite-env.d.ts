/// <reference types="vite/client" />
declare const SB_API_KEY: string;

VITE_SB_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6Y2dwdGpwdnFkeGZwbWh1ZnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjUxODMsImV4cCI6MjA2NzEwMTE4M30.HvaiVA5-34mRYjJNksulPQJ1693NXU1gXIZudImCkUk";
VITE_SB_PROJECT_ENDPOINT = "https://bzcgptjpvqdxfpmhufvh.supabase.co";

export const apiKey = import.meta.env.VITE_SB_API_KEY;
export const projectEndpoint = import.meta.env.VITE_SB_PROJECT_ENDPOINT;
