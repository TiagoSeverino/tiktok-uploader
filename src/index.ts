/* eslint-disable camelcase */
/* eslint-disable no-empty */

import { ElementHandle, Protocol } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

interface VideoDetails {
	path: string;
	title: string;
}

puppeteer.use(StealthPlugin());

const getBrowser = async (cookies: Protocol.Network.CookieParam[] = []) => {
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-gpu',
			'--hide-scrollbars',
			'--disable-web-security',
		],
	});

	const page = await browser.newPage();

	await page.setDefaultNavigationTimeout(0);

	await Promise.all(
		cookies.map(async (cookie) => {
			try {
				await page.setCookie(cookie);
			} catch {}
		})
	);

	await page.setCookie();

	await page.setViewport({
		width: 1920,
		height: 1080,
	});

	return {
		browser,
		page,
	};
};

export default async (
	videoDetails: VideoDetails,
	cookies: Protocol.Network.CookieParam[] = []
): Promise<string | undefined> => {
	const { browser, page } = await getBrowser(cookies);

	try {
		await page.goto(`https://www.tiktok.com/upload?lang=en`, {
			waitUntil: 'networkidle2',
		});

		// Select upload iframe
		const iframe = page
			.frames()
			.find((frame) =>
				frame.url().toLowerCase().includes('tiktok.com/creator')
			);

		if (!iframe) throw new Error('Could not find upload iframe');

		// Get title Input, upload button
		const [captionInput, selectFileButton] = await Promise.all([
			iframe.waitForXPath(`//*[contains(@class, 'editorContainer')]/div`),
			iframe.waitForXPath(
				`//*[contains(@class, 'file-select-button')]/button`
			) as Promise<ElementHandle<Element> | undefined>,
		]);

		if (!captionInput) throw new Error('Could not find tiktok title input');

		if (!selectFileButton)
			throw new Error('Could not find tiktok select file button');

		await captionInput?.type(videoDetails.title);

		// Upload Video
		const [fileChooser] = await Promise.all([
			page.waitForFileChooser(),
			selectFileButton.click(),
		]);

		await fileChooser.accept([videoDetails.path]);

		const postButton = (await iframe.waitForXPath(
			`//button[not(@disabled)]/div/div[text()='Post']`,
			{
				timeout: 60000,
			}
		)) as ElementHandle<Element> | undefined;

		if (!postButton) throw new Error('Could not find tiktok post button');

		const [createVideoResponse] = await Promise.all([
			page.waitForResponse(
				(res) =>
					res
						.url()
						.toLowerCase()
						.includes('tiktok.com/api/v1/item/create/?video_id'),
				{
					timeout: 60000,
				}
			),
			postButton.click(),
		]);

		const { item_id, status_msg } = (await createVideoResponse.json()) as {
			item_id?: string;
			status_msg?: string;
		};

		if (!item_id)
			throw new Error(status_msg || 'Could not create tiktok video');

		await browser.close();
		return item_id;
	} catch (e) {
		await browser.close();

		throw e;
	}
};
