import { useState } from "react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import App from "./App";
import Login from "./Login";
import type { Quote } from "./types";

const QUOTES_STORAGE_KEY = "qqd-quotes";

function readCachedQuotes(): Quote[] | null {
  const cached = localStorage.getItem(QUOTES_STORAGE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as Quote[];
  } catch {
    return null;
  }
}

function AuthGate() {
  const [quotes, setQuotes] = useState<Quote[] | null>(readCachedQuotes);

  return (
    <MantineProvider>
      {quotes ? (
        <App quotes={quotes} />
      ) : (
        <Login
          onSuccess={(decryptedQuotes) => {
            localStorage.setItem(
              QUOTES_STORAGE_KEY,
              JSON.stringify(decryptedQuotes)
            );
            setQuotes(decryptedQuotes);
          }}
        />
      )}
    </MantineProvider>
  );
}

export default AuthGate;
