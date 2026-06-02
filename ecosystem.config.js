module.exports = {
  apps: [{
    name: 'mcn-web',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: './apps/web',
    instances: 4,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    out_file: '/var/log/mcn-platform/out.log',
    error_file: '/var/log/mcn-platform/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
