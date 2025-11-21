module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: ['last 2 versions', 'not dead'],
      },
      modules: false, // Let Webpack handle module transformation
    }],
    ['@babel/preset-react', {
      runtime: 'automatic',
    }],
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current',
          },
          modules: 'commonjs',
        }],
        ['@babel/preset-react', {
          runtime: 'automatic',
        }],
      ],
    },
  },
};