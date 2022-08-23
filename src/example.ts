/* eslint-disable consistent-return */
import uploadTiktok from './index';
import cookies from './cookies.json';

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
