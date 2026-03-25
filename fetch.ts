const res = await fetch('https://raw.githubusercontent.com/IthacaBen-design/Zenbear/main/index.html');
const text = await res.text();
console.log(text);
