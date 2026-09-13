const BACKGROUND_COUNT = 5;

export const backgroundImages = Array.from(
  { length: BACKGROUND_COUNT },
  (_, i) => `/backgrounds/background${i + 1}.jpg`
);
