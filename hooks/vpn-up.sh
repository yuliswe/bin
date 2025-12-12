#!/bin/sh

mkdir -p /tmp/user/logs/
echo "[$(date)] VPN up"
echo "[$(date)] Adding routes"

findIpAddress() {
  local ip_address=$(dig +short $1 | tail -n1)
  echo $ip_address
}

vpnClientIp=192.168.231.22

set -x

sudo /sbin/route delete -net 172.31.0.0/16 $vpnClientIp
sudo /sbin/route add -net 172.31.0.0/16 $vpnClientIp

sudo /sbin/route delete -host prodcopy-latest.toolbxops.net $vpnClientIp
sudo /sbin/route add -host prodcopy-latest.toolbxops.net $vpnClientIp

sudo /sbin/route delete -host production-db-replica.c9sgfrlcftod.us-east-1.rds.amazonaws.com $vpnClientIp
sudo /sbin/route add -host production-db-replica.c9sgfrlcftod.us-east-1.rds.amazonaws.com $vpnClientIp
