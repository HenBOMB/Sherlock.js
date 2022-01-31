const Sherlock = require('./sherlock');
const { writeFileSync } = require('fs');

const target = "miravespania";

const sherlock = new Sherlock();

sherlock.loadData('./data.json');

sherlock.search(target);

sherlock.on('found', data => {
    console.log(`[+] ${data.url}`);
})

sherlock.on('end', results => {
    console.clear();
    console.log("Found " + results.length + " matches");
    writeFileSync('./out.json', JSON.stringify(results, null, 2));
})