#!/bin/sh
# Installs the VPN-up watcher as a root LaunchDaemon.
#
# The plist is copied (not symlinked) into /Library/LaunchDaemons/ because
# launchd requires it to be owned by root:wheel and not writable by group
# or other. The daemon points at vpn-watch.sh in this repo by absolute
# path, so editing vpn-watch.sh or vpn-up.sh takes effect on the next
# reconnect with no reinstall; re-run this script only when the plist
# itself changes.
#
# Run with sudo:  sudo /bin/sh install.sh

set -e

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST=com.yuli.vpn-up.plist
DEST=/Library/LaunchDaemons/$PLIST

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root: sudo /bin/sh $0" >&2
  exit 1
fi

# Unload any previous copy so we can reload cleanly.
if launchctl list | grep -q com.yuli.vpn-up; then
  launchctl unload -w "$DEST" 2>/dev/null || true
fi

cp "$SRC_DIR/$PLIST" "$DEST"
chown root:wheel "$DEST"
chmod 644 "$DEST"

mkdir -p /tmp/user/logs/

launchctl load -w "$DEST"

echo "Installed and loaded $DEST"
echo "Watching for VPN interface; logs at /tmp/user/logs/vpn-up.log"
