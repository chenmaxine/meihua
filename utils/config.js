let API;
if(process.env.NODE_ENV === 'development') {
	API = 'https://app.beautyshe.life/';
} else {
	API = 'https://app.beautyshe.life/';
}
export default {
	API
}