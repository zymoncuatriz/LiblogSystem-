import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://tdpolqrssmypjylxhihv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__tjdFhXnh7bQlV42VHj6QA_9jWxNXZr";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    redirectTo: window.location.origin + "/index.html",
  },
});
