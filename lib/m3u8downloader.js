// m3u8downloader.js
// =================

var fs = require('fs');
var request = require('request');

exports.version = "0.1.0";

var endsWith = function(str, suffix) 
{
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

exports.download = function(masterPlayListURL, destination)
{
    var res = masterPlayListURL.split("/");
    var site = masterPlayListURL.replace(res[res.length-1],'');
    console.log('site is ' + site);
    request.get(masterPlayListURL, function (error, response, body) 
    {
        if (!error && response.statusCode == 200) 
        {
            var masterResponse = response.req.path.split("/");
            fs.mkdirSync(destination + '/' + masterResponse[1]);
            var fileMasterPlayList = destination + response.req.path;
            fs.writeFile(fileMasterPlayList, body, function(err) 
            {
                if(err) 
                {
                    console.log(err);
                } 
                else 
                {
                    var masterPlayListContents = body.split("\n");
                    for(i in masterPlayListContents) 
                    {
                        if(endsWith(masterPlayListContents[i],"m3u8"))
                        {
                            var res2 = masterPlayListContents[i].split("/");
                            fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[0]);
                            var mediaPlayList = site + res2[0] + '/' + res2[1];
                            request.get(site + masterPlayListContents[i], function (error, response, body) 
                            {
                                if (!error && response.statusCode == 200) 
                                {
                                    var fileMediaPlayList = destination + response.req.path;
                                    var mediaResponse = response.req.path.split('/');
                                    fs.writeFile(fileMediaPlayList, body, function(err) 
                                    {
                                        if(err) 
                                        {
                                            console.log(err);
                                        } 
                                        else 
                                        {
                                           var mediaPlayListContents = body.split("\n");
                                           for(j in mediaPlayListContents) 
                                           {
                                               if(endsWith(mediaPlayListContents[j],"ts"))
                                               {
                                                    var mediaSegment = site +  mediaResponse[2] + '/' + mediaPlayListContents[j];
                                                    request.get(mediaSegment, function (error, response, body) 
                                                    {
                                                        if (!error && response.statusCode == 200) 
                                                        {
                                                            var fileMediaSegment = destination + response.req.path;
                                                            console.log('Trying to write to file ' + fileMediaSegment);
                                                            fs.writeFile(fileMediaSegment , body, function(err) 
                                                            {
                                                                if(err) 
                                                                {
                                                                    console.log(err);
                                                                }
                                                            }); 
                                                        }
                                                    });
                                               }
                                           }
                                        } 
                                   });
                               }
                           });
                        }
                    }
                }
            }); 
        }
    });
}
