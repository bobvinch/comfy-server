module.exports = {
  apps: [
    {
      name: 'comfy-server',
      script: './dist/main.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
