import { useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  Flex,
  Paper,
  PasswordInput,
  Text,
  Title,
} from "@mantine/core";
import { backgroundImages } from "./backgrounds";
import { decryptQuotes } from "./crypto";
import type { Quote } from "./types";
import "./Login.scss";

type LoginProps = {
  onSuccess: (quotes: Quote[]) => void;
};

function Login({ onSuccess }: LoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [background] = useState(
    () => backgroundImages[Math.floor(Math.random() * backgroundImages.length)]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/quotes.enc.json");
      if (!response.ok) throw new Error("quotes.enc.json fetch failed");
      const payload = await response.json();
      const quotes = await decryptQuotes(password, payload);
      onSuccess(quotes);
    } catch {
      setError(true);
      setSubmitting(false);
    }
  };

  return (
    <Flex
      justify="center"
      align="center"
      className="login-container"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        p="xl"
        radius="md"
        withBorder
        className="login-card"
      >
        <Title order={3} ta="center" mb="lg" className="kaushan-font">
          citationsinspirantes.com
        </Title>
        <PasswordInput
          label="Mot de passe"
          value={password}
          onChange={(event) => {
            setError(false);
            setPassword(event.currentTarget.value);
          }}
          autoComplete="current-password"
          autoFocus
          mb="md"
        />
        {error && (
          <Text c="red" size="sm" mb="sm">
            Mot de passe incorrect
          </Text>
        )}
        <Button type="submit" fullWidth color="teal" loading={submitting}>
          Se connecter
        </Button>
      </Paper>
    </Flex>
  );
}

export default Login;
