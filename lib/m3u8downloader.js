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
                callback('created directory ' + destination + '/' + masterResponse[1]);
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
                            var mediaPlayListFile = '';
                            try
                            {
                                if (masterPlayListContents[i].indexOf("://") > -1)
                                {
                                    callback('trying to create media playlist directory ' + destination + '/' + masterResponse[1] + '/' + res2[res2.length-2]);
                                    fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[res2.length-2]);
                                    mediaPlayListFile = masterPlayListContents[i];
                                }
                                else 
                                {
                                    callback('trying to create media playlist directory ' + destination + '/' + masterResponse[1] + '/' + res2[0]);
                                    fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[0]);
                                    mediaPlayListFile = site + masterPlayListContents[i];
                                }
                            }
                            catch(err)
                            {
                                callback('error in creating media playlist directories' , err);
                                return;
                            }
                            var mediaPlayList = site + res2[0] + '/' + res2[1];
                            request.get(mediaPlayListFile, function (error, response, body) 
                            {
                                if (!error && response.statusCode == 200) 
                                {
                                    console.log('response.req.path ' + response.req.path);
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
                                                    var res2 = mediaPlayListContents[j].split("/");
                                                    var mediaSegmentFile = '';
                                                    if (mediaPlayListContents[j].indexOf("://") > -1)
                                                    {
                                                        mediaSegmentFile = mediaPlayListContents[j];
                                                    }
                                                    else 
                                                    {
                                                        mediaSegmentFile = site + mediaResponse[2] + '/' + mediaPlayListContents[j];
                                                    }
                                                    var mediaSegment = site +  mediaResponse[2] + '/' + mediaPlayListContents[j];
                                                    callback('Trying to create media segment' +  mediaSegmentFile);
                                                    request.get(mediaSegmentFile, { encoding: null }, function (error, response, body) 
                                                    {
                                                        if (!error && response.statusCode == 200) 
                                                        {
                                                            var fileMediaSegment = destination + response.req.path;
                                                            callback('Trying to create file media segment 1 ' + destination);
                                                            callback('Trying to create file media segment 2 ' + response.req.path);
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
                                   callback('error getting media playlist' ,error);
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
