import { globalDrupalStateStores } from '../../lib/stores';

const preview = async (req, res) => {
	// Check the secret and next parameters
	// This secret should only be known to this API route and the CMS
	if (req.query.secret !== process.env.PREVIEW_SECRET) {
		return res.redirect(
			`/preview-error/?error=${encodeURIComponent(
				`Preview secret does not match`,
			)}&message=${encodeURIComponent(
				`Check that your PREVIEW_SECRET environment variable matches the preview secret generated when creating the preview site in Drupal.`,
			)}`,
		);
	}

	if (!req.query.slug) {
		return res.redirect(
			`/preview-error/?error=${encodeURIComponent(
				`No path to the content preview was received`,
			)}`,
		);
	}

	// returns the store that matches the locale found in the requested url
	// or the only store if using a monolingual backend
	const [store] = globalDrupalStateStores.filter(({ defaultLocale }) => {
		const regex = new RegExp(`/${defaultLocale}/`);
		return defaultLocale ? regex.test(req.url) : true;
	});
	const objectName = req.query.objectName;
	// verify the content exists
	let content;
	try {
		content = await store.getObjectByPath({
			objectName: objectName,
			path: req.query.slug,
		});
	} catch (error) {
		process.env.DEBUG_MODE &&
			console.error('Error verifying preview content: ', error);
		return res.redirect(
			`/preview-error/?error=${encodeURIComponent(
				`Requested preview path does not match`,
			)}&message=${encodeURIComponent(`Ensure the content URL is valid`)}`,
		);
	}

	// If the content doesn't exist prevent preview mode from being enabled
	if (!content) {
		return res.redirect(
			`/preview-error/?error=${encodeURIComponent(
				`Requested preview path does not exist`,
			)}&message=${encodeURIComponent(
				`Check that the desired content to be previewed is published`,
			)}`,
		);
	}

	// Enable Preview Mode by setting a cookie
	if (req.query.resourceVersionId) {
		res.setPreviewData({
			key: req.query.key,
			resourceVersionId: req.query.resourceVersionId,
			previewLang: store.defaultLocale || 'en',
		});
	} else if (req.query.key) {
		res.setPreviewData({
			key: req.query.key,
			previewLang: store.defaultLocale || 'en',
		});
	} else {
		res.setPreviewData({});
	}

	// Redirect to the path from the fetched content
	res.redirect(`${content.path.alias}?timestamp=${Date.now()}`);
};

export default preview;
