// m3u8downloader.js
// =================

var fs = require('fs');
var request = require('request');

exports.version = "0.1.0";

var endsWith = function(str, suffix) 
{
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

exports.download = function(masterPlayListURL, destination,callback)
{
    var res = masterPlayListURL.split("/");
    var site = masterPlayListURL.replace(res[res.length-1],'');
    request.get(masterPlayListURL, function (error, response, body) 
    {
        if (!error && response.statusCode == 200) 
        {
            callback('obtained master playlist');
            var masterResponse = response.req.path.split("/");
            try
            {
                fs.mkdirSync(destination + '/' + masterResponse[1]);
            }
            catch(err)
            {
                callback('error creating directory',err);
            }
            var fileMasterPlayList = destination + response.req.path;
            fs.writeFile(fileMasterPlayList, body, function(err) 
            {
                if(err) 
                {
                    callback('error in creating file ', err);
                } 
                else 
                {
                    callback('created master playlist ' + fileMasterPlayList);
                    var masterPlayListContents = body.split("\n");
                    for(i in masterPlayListContents) 
                    {
                        if(endsWith(masterPlayListContents[i],"m3u8"))
                        {
                            var res2 = masterPlayListContents[i].split("/");
                            try
                            {
                                fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[0]);
                            }
                            catch(err)
                            {
                                callback('error in creating master playlist file ' , err);
                                return;
                            }
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
                                            callback('error in creating media playlist' , err);
                                        } 
                                        else 
                                        {
                                           callback('created media playlist ' + fileMediaPlayList); 
                                           var mediaPlayListContents = body.split("\n");
                                           for(j in mediaPlayListContents) 
                                           {
                                               if(endsWith(mediaPlayListContents[j],"ts"))
                                               {
                                                    var mediaSegment = site +  mediaResponse[2] + '/' + mediaPlayListContents[j];
                                                    request.get(mediaSegment, { encoding: null }, function (error, response, body) 
                                                    {
                                                        if (!error && response.statusCode == 200) 
                                                        {
                                                            var fileMediaSegment = destination + response.req.path;
                                                            fs.writeFile(fileMediaSegment , body, function(err) 
                                                            {
                                                                if(err) 
                                                                {
                                                                    callback('error creating file ' , err);
                                                                }
                                                                else
                                                                {
                                                                    callback('created media segment ' + fileMediaSegment);
                                                                }
                                                            }); 
                                                        }
                                                        else
                                                        {
                                                            callback('error getting media segments', error);
                                                        }
                                                    });
                                               }
                                           }
                                        } 
                                   });
                               }
                               else
                               {
                                   callback('error getting master playlist' ,error);
                               }
                           });
                        }
                    }
                }
            });
        }
        else
        {
            callback(error);
        }
    });
}
