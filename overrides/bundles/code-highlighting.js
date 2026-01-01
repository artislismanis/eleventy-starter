// Code highlighting bundle - only loaded on pages that need it
// Import bundle styles
import '../styles/code-highlighting.scss';

// Add copy buttons to code blocks
function addCopyButtons() {
	document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
		const button = document.createElement('button');
		button.className = 'copy-button';
		button.textContent = 'Copy';
		button.setAttribute('aria-label', 'Copy code to clipboard');

		button.addEventListener('click', async () => {
			const code = pre.querySelector('code').textContent;
			try {
				await navigator.clipboard.writeText(code);
				button.textContent = 'Copied!';
				setTimeout(() => {
					button.textContent = 'Copy';
				}, 2000);
			} catch (err) {
				console.error('Failed to copy:', err);
				button.textContent = 'Failed';
				setTimeout(() => {
					button.textContent = 'Copy';
				}, 2000);
			}
		});

		pre.appendChild(button);
	});
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', addCopyButtons);
} else {
	addCopyButtons();
}
