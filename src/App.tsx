import { useState, useEffect } from "react";
import "./App.scss";
import quotesData from "./quotes.json";
import "@mantine/core/styles.css";

import { Button, MantineProvider, Title, Text, Flex } from "@mantine/core";

type Quote = {
  quote: string;
  author: string;
  context: string;
};

function App() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [index, setIndex] = useState(0);
  const [showAuthor, setShowAuthor] = useState(false);
  const maxBackgrounds = 5;
  const backgroundImages = Array.from(
    { length: maxBackgrounds },
    (_, i) => `/backgrounds/background${i + 1}.jpg`
  );
  const [bgIndex, setBgIndex] = useState(0);

  // Mélange le tableau des citations au démarrage
  useEffect(() => {
    resetQuotes();
  }, []);

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
  }, [backgroundImages.length]);

  if (quotes.length === 0) return <p>Chargement...</p>;

  const current = quotes[index];

  return (
    <MantineProvider>
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
    </MantineProvider>
  );
}

export default App;
