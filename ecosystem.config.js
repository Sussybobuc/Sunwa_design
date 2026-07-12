// pm2 run configuration for the self-hosted Mac Mini.
// Start with: pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: 'sunwa',
      script: 'server.js',
      max_memory_restart: '500M',
      time: true,
    },
  ],
};
