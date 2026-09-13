import { useState, useEffect } from "react";
import "./App.scss";
import { backgroundImages } from "./backgrounds";
import type { Quote } from "./types";

import { Button, Title, Text, Flex } from "@mantine/core";

type AppProps = {
  quotes: Quote[];
};

function App({ quotes: quotesData }: AppProps) {
  const [quotes, setQuotes] = useState<Quote[]>(() =>
    [...quotesData].sort(() => Math.random() - 0.5)
  );
  const [index, setIndex] = useState(0);
  const [showAuthor, setShowAuthor] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  const resetQuotes = () => {
    const shuffled = [...quotesData].sort(() => Math.random() - 0.5);
    setQuotes(shuffled);
    setIndex(0);
    setShowAuthor(false);
  };

  const handleNext = () => {
    setShowAuthor(false);
    if (index + 1 < quotes.length) {
      setIndex(index + 1);
    } else {
      resetQuotes(); // toutes passées, on recommence
    }
  };

  // Change l'image toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (quotes.length === 0) return <p>Chargement...</p>;

  const current = quotes[index];

  return (
    <Flex
      direction="column"
      justify="space-between"
      className="app-container"
      style={{
        backgroundImage: `url(${backgroundImages[bgIndex]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: -1,
      }}
    >
      <header className="app-header">
        {/* <Image src={logo} alt="Logo" className="logo" /> */}
        <Title className="kaushan-font " order={3}>
          citationsinspirantes.com
        </Title>
        <Text className="app-header-subtitle" size="sm">
          Devinez l'auteur de la citation !
        </Text>
      </header>

      <main className="app-main">
        {/* <Flex
          direction="column"
          justify={"center"}
          align="center"
          // style={{ minHeight: "60vh" }}
        > */}
        <div style={{ textAlign: "center" }} className="quote">
          <Title className="kaushan-font quote-text" order={3}>
            “{current.quote}”
          </Title>
          <Text
            fw={500}
            className="quote-context"
            style={{
              minHeight: "1.5em", // hauteur minimale pour éviter le décalage
              visibility: showAuthor ? "visible" : "hidden",
            }}
          >
            — {current.author} {current.context}
          </Text>
        </div>
        {/* </Flex> */}
      </main>

      <footer
        className="app-footer"
        style={{ fontFamily: "Montserrat, sans-serif", marginBottom: "2rem" }}
      >
        {!showAuthor ? (
          <Button
            onClick={() => setShowAuthor(true)}
            variant="outline"
            color="white"
            size="lg"
            style={{ backgroundColor: "rgba(0,0,0,0.5" }}
          >
            Afficher l'auteur
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="outline"
            color="white"
            size="lg"
            style={{ backgroundColor: "rgba(0,0,0,0.5" }}
          >
            Citation suivante
          </Button>
        )}
      </footer>
    </Flex>
  );
}

export default App;
