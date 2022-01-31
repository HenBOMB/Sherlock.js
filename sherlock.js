const { http, https } = require('follow-redirects');
const { readFileSync } = require("fs");
const EventEmitter = require('events');

class SitesHandler
{
    static async loadFromUrl(url)
    {
        if (!url.toLowerCase().endsWith(".json"))
            throw FileNotFoundError(`Incorrect JSON file extension for data file '${url}'.`);

        if(url.match(/http.+\/\/.+\.com/i) === null)
            throw Error(`Invalid URL '${url}'.`);

        return await new Promise(resolve => {
            https.get(url, (res) => {
                var data = "";
    
                res.on('data', d => {
                    data += d;
                });
    
                res.on('end', () => {
                    resolve(SitesHandler.removeBlocked(JSON.parse(readFileSync(data))));
                });
    
            }).on('error', e => { 
                console.error(`Problem while attempting to access data file URL '${url}': ${e}`); 
                resolve(); 
            });
        })
    }

    static async loadFromRepo()
    {
        return await SitesHandler.loadFromUrl("https://raw.githubusercontent.com/sherlock-project/sherlock/master/sherlock/resources/data.json");
    }

    static loadFromFile(path)
    {
        if (!path.toLowerCase().endsWith(".json"))
            throw FileNotFoundError(`Incorrect JSON file extension for data file '${path}'.`);
        
        try
        {
            return SitesHandler.removeBlocked(JSON.parse(readFileSync(path)));
        }
        catch(e)
        {
            console.log(e);
        }
    }

    static removeBlocked(siteData)
    {
        if(siteData === undefined)
            return;

        const blocked = [
            "3dnews", "VK", "Velomania", "Football", "BOOTH", "prog.hu", "Packagist",
            "ChaturBate", "YouPic", "babyblogRU", "forumhouseRU", "hunting", "igromania", "zoomit"];
        const blockedIncluded = ["Porn"];

        blocked.forEach(key => {
            delete siteData[key];
        });

        for(const key in siteData)
        {
            for (let i = 0; i < blockedIncluded.length; i++) {
                if(key.includes(blockedIncluded[i]))
                    delete siteData[key]
            }
        }

        return siteData;
    }
}

class Sherlock extends EventEmitter
{
    constructor()
    {
        super();
        this.sites = {};
    }

    async loadData(siteDataPath)
    {
        if(siteDataPath.match(/http.+\/\/.+\.com/i) !== null)
            this.sites = await SitesHandler.loadFromUrl(siteDataPath);
        else
            this.sites = SitesHandler.loadFromFile(siteDataPath);
    }

    async search(username)
    {
        return await new Promise(resolve => {

            const results = [];
            const enqueue_list = {};

            const dequeue = (key, keep = false) => {
                if(keep)
                {
                    this.found(enqueue_list[key]);
                    results.push(enqueue_list[key]);
                }

                delete enqueue_list[key];

                if(Object.keys(enqueue_list).length === 0)
                {
                    this.end(results);
                    resolve(results);
                }
            }

            const enqueue = (key, value = undefined) => {
                if(enqueue_list[key] != undefined)
                    return dequeue(key, true);
                enqueue_list[key] = value;
            }
            
            for(const key in this.sites)
            {
                const net_info = this.sites[key];
    
                const regex_check = net_info.regexCheck;

                // Not allowed
                if(regex_check != undefined && username.match(regex_check) === null)
                    continue;

                const url = net_info.url.replace('{}', username);
                
                const options = { headers: { } };

                const allow_redirects = net_info.errorType !== 'response_url';

                const callback = (allow_redirects? http : https).get;

                let url_probe = net_info.urlProbe == undefined ? url : net_info.urlProbe.replace('{}', username);

                if(allow_redirects)
                    url_probe = url_probe.replace('https','http');

                //  //  //

                if(net_info.headers != undefined)
                    options['headers'] = net_info.headers;
                
                options['headers']['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:55.0) Gecko/20100101 Firefox/55.0';

                if(net_info.errorType == 'status_code' && (net_info.request_head_only != undefined && net_info.request_head_only === true))
                    options["method"] = 'HEAD';
                else
                    options["method"] = 'GET';

                //  //  //

                enqueue(key, {
                    url: url,
                    title: key
                });

                (() => {
                    const k = key;
                    const o = options;
                    callback(url_probe, options, r =>
                    {
                        if(r.statusCode >= 400)
                            return dequeue(k);

                        if(net_info.errorType === 'status_code')
                        {
                            if(!(r.statusCode >= 300) || r.statusCode < 200)
                                return enqueue(k);
                            else
                                return dequeue(k);
                        }
                        
                        else if(net_info.errorType === 'response_url')
                        {
                            if(r.responseUrl === net_info.errorUrl)
                                return dequeue(k);
                            if(200 <= r.statusCode < 300)
                                return dequeue(k);
                            else
                                return enqueue(k);
                        }
    
                        var data = "";
    
                        r.on('data', chunk => data += chunk);
    
                        r.on('end', () => 
                        {
                            if(typeof net_info.errorMsg === "object")
                            {
                                for (let i = 0; i < net_info.errorMsg.length; i++) 
                                {
                                    if(data.indexOf(net_info.errorMsg[i]) != -1)
                                        return dequeue(k);
                                }
                            }
                            else if(data.indexOf(net_info.errorMsg) != -1)
                                return dequeue(k);
                            
                            enqueue(k);
                        })
                    }).on('error', () => dequeue(k));
                })();
            }
        });
    }

    found(data) {
        this.emit("found", data);
    }

    end(results) {
        this.emit("end", results);
    }
}

module.exports = Sherlock;