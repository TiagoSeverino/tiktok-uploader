/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable consistent-return */
import uploadTiktok from '.';

const cookies = require('../cookies.json');

uploadTiktok(
	{
		path: 'test.mp4',
		title: 'Test upload',
	},
	cookies
)
	.then((id) => {
		if (!id) return console.log('Failed to upload tiktok');

		console.log(`Uploaded tiktok, id: ${id}`);
	})
	.catch(console.error);
