module.exports = {
  apps: [{
    name: 'bustime-api',
    script: './src/app.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    // 自动重启配置
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    // 优雅关闭
    kill_timeout: 5000,
    listen_timeout: 3000,
    // 健康检查
    exp_backoff_restart_delay: 100
  }]
};
