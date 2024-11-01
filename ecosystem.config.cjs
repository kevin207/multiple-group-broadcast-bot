module.exports = {
  apps: [
    {
      name: "tm-broadcast-bot",
      script: "dist/bot.js",
      instances: "1",
      exec_mode: "cluster",
      watch: false,
      ignore_watch: ["node_modules"],
    },
  ],
};
