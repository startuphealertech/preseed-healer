/**
 * PM2 process file for a VPS deployment.
 *   npm ci && npm run build
 *   pm2 start ecosystem.config.cjs && pm2 save
 */
module.exports = {
  apps: [
    {
      name: "preseedhealer-api",
      cwd: "./apps/api",
      script: "dist/server.js",
      node_args: "--env-file-if-exists=.env --enable-source-maps",
      env: { NODE_ENV: "production" },
      instances: 1,
      max_memory_restart: "400M",
    },
    {
      name: "preseedhealer-web",
      cwd: "./apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3100",
      env: { NODE_ENV: "production" },
      instances: 1,
      max_memory_restart: "700M",
    },
  ],
};
