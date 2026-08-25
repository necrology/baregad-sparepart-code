module.exports = {
  apps: [
    {
      name: "baregad-sparepart",
      cwd: __dirname,
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: "3000",
        REVIEW_MEDIA_STORAGE_DIR: "/var/lib/baregad-sparepart/review-media",
      },
    },
  ],
};
