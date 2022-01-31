const { http, https } = require('follow-redirects');
const fs = require('fs');

const options = {
    headers: {
        'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
    },
    method: 'GET'
}

const url = 'https://www.clozemaster.com/players/miravespania';

https.get(url, options, r =>
{
    console.log(r.statusCode)
    console.log(r.statusMessage)

    var data = "";

    r.on('data', chunk => data += chunk);

    r.on('end', () => {
        fs.writeFileSync('./tmp.tmp', data)
        console.log(data.indexOf('profileNotFound'))
    })
});