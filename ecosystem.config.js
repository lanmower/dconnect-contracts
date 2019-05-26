module.exports = {
  apps : [{
    name: 'contracts',
    script: 'exchange.js',

    instances: 1,
    autorestart: true,
    watch: true,
    max_memory_restart: '1G',
    env_hook: {
        command: 'git pull && npm i && pm2 restart discord',
    }
  }],

  deploy : {
  }
};

