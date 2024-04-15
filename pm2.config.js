/**
 * this is a pm2 starter config file
 * @type {{apps: [{watch: boolean, name: string, env: {NODE_ENV: string}, script: string}]}}
 */
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
