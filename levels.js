export const levels = {
  1: {
    background: {
      gradientColors: ['#1a0533', '#2d1b69', '#1e3a5f', '#0d1b2a'],
      gradientLocations: [0, 0.3, 0.6, 1],
      nebulaClouds: [
        { x: '0%', y: '75%', color: '#ff6090', opacity: 0.25, size: 300 },
        { x: '20%', y: '85%', color: '#ff8844', opacity: 0.2, size: 250 },
        { x: '85%', y: '15%', color: '#aa44ff', opacity: 0.15, size: 200 },
        { x: '50%', y: '45%', color: '#6688ff', opacity: 0.12, size: 350 },
        { x: '70%', y: '70%', color: '#4466aa', opacity: 0.1, size: 280 },
      ],
      stars: {
        count: 150,
        colors: [
          '#ffffff',
          '#ffaa66',
          '#ff6688',
          '#ff44aa',
          '#aaaaff',
          '#66ffff',
        ],
        minSize: 1,
        maxSize: 4,
        minOpacity: 0.3,
        maxOpacity: 1,
      },
    },
  },
};

export const getCurrentLevel = (levelNumber) => {
  return levels[levelNumber] || levels[1];
};
