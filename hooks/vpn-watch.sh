#!/bin/sh
# Runs vpn-up.sh once each time the Pritunl VPN interface comes up.
#
# The VPN client (Pritunl/OpenVPN) brings up a utun interface with the
# address below directly, rather than a native macOS VPN, so there is no
# scutil --nc hook to attach to. Instead we poll for the address on a
# rising edge (absent -> present) and fire the hook exactly once per
# reconnect.

VPN_IP=192.168.231.22
HOOK="$(cd "$(dirname "$0")" && pwd)/vpn-up.sh"

prev=down
while :; do
  if ifconfig 2>/dev/null | grep -q "inet $VPN_IP "; then
    cur=up
  else
    cur=down
  fi

  if [ "$cur" = up ] && [ "$prev" = down ]; then
    echo "[$(date)] VPN interface up, running $HOOK"
    /bin/sh "$HOOK"
  fi

  prev=$cur
  sleep 5
done
