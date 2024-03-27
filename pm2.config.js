module.exports = {
  apps: [
    {
      name: 'comfyServer',
      script: './dist/main.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
