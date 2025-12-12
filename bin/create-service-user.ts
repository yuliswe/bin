#!/usr/bin/env tsx

import { Command } from 'commander';
import { execSync } from 'node:child_process';

type CreateServiceUserOptions = {
  username: string;
  uid: number;
  gid: number;
  realName: string;
};

function execCommand(
  command: string,
  options?: { ignoreError?: boolean },
): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    if (options?.ignoreError) {
      return '';
    }
    throw error;
  }
}

function userExists(username: string): boolean {
  try {
    execCommand(`dscl . -read "/Users/${username}"`, { ignoreError: false });
    return true;
  } catch {
    return false;
  }
}

function uidInUse(uid: number): boolean {
  const output = execCommand('dscl . -list /Users UniqueID', {
    ignoreError: true,
  });
  const regex = new RegExp(`\\s${uid}$`, 'm');
  return regex.test(output);
}

function gidInUseByOtherGroup(
  gid: number,
  expectedGroup: string,
): string | null {
  const output = execCommand('dscl . -list /Groups PrimaryGroupID', {
    ignoreError: true,
  });
  const lines = output.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\S+)\s+(\d+)$/);
    if (match) {
      const [, groupName, groupId] = match;
      if (parseInt(groupId, 10) === gid && groupName !== expectedGroup) {
        return groupName;
      }
    }
  }

  return null;
}

function createServiceUser(options: CreateServiceUserOptions): void {
  const { username, uid, gid, realName } = options;
  const homeDir = `/Users/${username}`;

  console.log(`Creating service user: ${username}`);

  // Check if user already exists
  if (userExists(username)) {
    console.log(`User ${username} already exists`);
    return;
  }

  // Check if UID is already in use
  if (uidInUse(uid)) {
    console.error(`Error: UID ${uid} is already in use`);
    process.exit(1);
  }

  // Check if GID is already in use by another group
  const existingGroup = gidInUseByOtherGroup(gid, username);
  if (existingGroup) {
    console.error(
      `Error: GID ${gid} is already in use by group ${existingGroup}`,
    );
    process.exit(1);
  }

  // Create group first
  console.log(`Creating group ${username}...`);
  execCommand(`sudo dscl . -create "/Groups/${username}"`);
  execCommand(
    `sudo dscl . -create "/Groups/${username}" PrimaryGroupID "${gid}"`,
  );

  // Create user
  console.log(`Creating user ${username}...`);
  execCommand(`sudo dscl . -create "/Users/${username}"`);
  execCommand(
    `sudo dscl . -create "/Users/${username}" UserShell /usr/bin/false`,
  );
  execCommand(
    `sudo dscl . -create "/Users/${username}" RealName "${realName}"`,
  );
  execCommand(`sudo dscl . -create "/Users/${username}" UniqueID "${uid}"`);
  execCommand(
    `sudo dscl . -create "/Users/${username}" PrimaryGroupID "${gid}"`,
  );
  execCommand(`sudo dscl . -create "/Users/${username}" IsHidden 1`);

  // Create and configure home directory
  console.log(`Creating home directory ${homeDir}...`);
  execCommand(`sudo mkdir -p "${homeDir}"`);
  execCommand(
    `sudo dscl . -create "/Users/${username}" NFSHomeDirectory "${homeDir}"`,
  );
  execCommand(`sudo chown -R "${uid}:${gid}" "${homeDir}"`);
  execCommand(`sudo chmod 700 "${homeDir}"`);

  console.log(`✓ Service user ${username} created successfully`);
  console.log(`  UID: ${uid}`);
  console.log(`  GID: ${gid}`);
  console.log(`  Home: ${homeDir}`);
  console.log(`  Shell: /usr/bin/false`);
  console.log(`  Hidden: Yes`);
}

const program = new Command();

program
  .name('create-service-user')
  .description(
    'Create a hidden service user on macOS with a specified UID and GID. ' +
      'This tool creates a system user account that is hidden from the login window ' +
      'and typically used for running background services.',
  )
  .version('1.0.0')
  .requiredOption(
    '-u, --username <username>',
    'Username for the service user (must be unique)',
  )
  .requiredOption(
    '--uid <uid>',
    'User ID (UID) - must be unique and not already in use',
    value => parseInt(value, 10),
  )
  .requiredOption(
    '--gid <gid>',
    'Group ID (GID) - must be unique or match an existing group with the same name',
    value => parseInt(value, 10),
  )
  .requiredOption(
    '-n, --real-name <realName>',
    'Real name/display name for the service user',
  )
  .addHelpText(
    'after',
    `
Examples:
  $ create-service-user -u ssh-dropbox-su --uid 1003 --gid 1003 -n "SSH Dropbox Service User"
  $ create-service-user --username my-service --uid 501 --gid 501 --real-name "My Service Account"

Notes:
  - This script requires sudo privileges and will prompt for your password
  - The user will be created with /usr/bin/false as the shell (no login access)
  - The user account will be hidden from the login window
  - If the user already exists, the script will exit successfully without making changes
  - The home directory will be created at /Users/<username> with 700 permissions
  `,
  )
  .action((options: CreateServiceUserOptions) => {
    try {
      createServiceUser(options);
      process.exit(0);
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program.parse(process.argv);
