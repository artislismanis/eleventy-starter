/**
 * Build Metadata
 *
 * Captures build-time information like git SHA and timestamp.
 * Available in templates as {{ build.gitSha }}, {{ build.gitShaShort }}, etc.
 */

import { execSync } from 'child_process';

export default function () {
	let gitSha = '';
	let gitShaShort = '';

	try {
		gitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
		gitShaShort = gitSha.substring(0, 7);
	} catch {
		// Not a git repo or git not available
		gitSha = 'unknown';
		gitShaShort = 'dev';
	}

	return {
		gitSha,
		gitShaShort,
		timestamp: new Date().toISOString(),
	};
}
