import handler from './api/youtube/search.js';
handler({ query: { q: "cuica ptazeta quevedo" }, method: 'GET' }, { setHeader: () => {}, json: (data) => console.log(data.slice(0, 5).map(d => d.id)), status: () => ({ json: console.log }) });
