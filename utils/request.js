export default async (options) => {
	if (!options.url) {
		return console.warn('请传入url');
	}
	const r = await uni.request(options);
	return (r && r.data) ? r.data : (r[1] ? r[1].data : {});
}