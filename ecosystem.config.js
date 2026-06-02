module.exports = {
  apps: [{
    name: 'mcn-web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/opt/dev/mcn-platform/apps/web',
    instances: 1,
    exec_mode: 'fork',
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
