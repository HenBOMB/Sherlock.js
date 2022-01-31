const https = require('https');
const { readFileSync } = require('fs');

const blocked = ["ChaturBate", "YouPic", "babyblogRU", "forumhouseRU", "hunting", "igromania", "zoomit"];
const blocked_included = ["Porn"];

// class SiteInformation
// {
//     constructor(name, url_home, url_username_format, username_claimed, username_unclaimed, information)
//     {
//         this.name                = name
//         this.url_home            = url_home
//         this.url_username_format = url_username_format
//         this.username_claimed    = username_claimed
//         this.username_unclaimed  = username_unclaimed
//         this.information         = information
//     }

//     toString()
//     {
//         return `${self.name} (${self.url_home})`;
//     }
// }

class SitesInformation
{
    constructor()
    {
        this.site_data = {};
    }

    async loadFromUrl(data_file_path)
    {
        if (!data_file_path.toLowerCase().endsWith(".json"))
            throw FileNotFoundError(`Incorrect JSON file extension for data file '${data_file_path}'.`);

        if(data_file_path.match(/http.+\/\/.+\.com/i) === null)
            throw Error(`Invalid URL '${data_file_path}'.`);

        return await new Promise(resolve => {
            https.get(data_file_path, (res) => {
                var data = "";
    
                res.on('data', d => {
                    data += d;
                });
    
                res.on('end', () => {
                    this.site_data = JSON.parse(data);
                    this.removeBlocked();
                    resolve();
                });
    
            }).on('error', e => { 
                console.error(`Problem while attempting to access data file URL '${data_file_path}': ${e}`); 
                resolve(undefined); 
            });
        })
    }

    async loadFromRepo()
    {
        return await this.loadFromUrl("https://raw.githubusercontent.com/sherlock-project/sherlock/master/sherlock/resources/data.json");
    }

    loadFromFile(data_file_path)
    {
        if (!data_file_path.toLowerCase().endsWith(".json"))
            throw FileNotFoundError(`Incorrect JSON file extension for data file '${data_file_path}'.`);
        try
        {
            this.site_data = JSON.parse(readFileSync(data_file_path));
            this.removeBlocked();
        }
        catch(e)
        {
            console.log(e);
        }
    }

    removeBlocked()
    {
        if(site_data === undefined)
            return;

        blocked.forEach(key => {
            delete this.site_data[key];
        });

        for(const key in this.site_data)
        {
            for (let i = 0; i < blocked_included.length; i++) {
                if(key.includes(blocked_included[i]))
                    delete this.site_data[key]
            }
        }
    }
}

module.exports = 
{
    SitesInformation
};