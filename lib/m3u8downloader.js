// m3u8downloader.js
// =================

var fs = require('fs');
var mkdirp = require('mkdirp'); 
var util = require('util');
var request = require('request');
var EventEmitter = require('events').EventEmitter;

exports.version = "0.2.0";

var endsWith = function(str, suffix) 
{
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var m3u8downloader  = function(masterPlayListURL, destination,callback)
{
    var self = this;
    var res = masterPlayListURL.split("/");
    var site = masterPlayListURL.replace(res[res.length-1],'');
    request.get(masterPlayListURL, function (error, response, body) 
    {
        if (!error && response.statusCode == 200) 
        {
            self.emit('start');
            var masterResponse = response.req.path.split("/");
            try
            {
                mkdirp.sync(destination + '/' + masterResponse[1]);
            }
            catch(err)
            {
                self.emit('error',err);
            }
            var fileMasterPlayList = destination + response.req.path;
            fs.writeFile(fileMasterPlayList, body, function(err) 
            {
                if(err) 
                {
                    self.emit('error',err);
                } 
                else 
                {
                    self.emit('progress', 'Created Master Playlist ' + fileMasterPlayList);
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
                                    fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[res2.length-2]);
                                    mediaPlayListFile = masterPlayListContents[i];
                                }
                                else 
                                {
                                    fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[0]);
                                    mediaPlayListFile = site + masterPlayListContents[i];
                                }
                            }
                            catch(err)
                            {
                                self.emit('error',err);
                                return;
                            }
                            request.get(mediaPlayListFile, function (error, response, body) 
                            {
                                if (!error && response.statusCode == 200) 
                                {
                                    var fileMediaPlayList = destination + response.req.path;
                                    var mediaResponse = response.req.path.split('/');
                                    fs.writeFile(fileMediaPlayList, body, function(err) 
                                    {
                                        if(err) 
                                        {
                                            self.emit('error' , err);
                                        } 
                                        else 
                                        {
                                            self.emit('progress','Created Media Playlist ' + fileMediaPlayList); 
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
                                                    request.get(mediaSegmentFile, { encoding: null }, function (error, response, body) 
                                                    {
                                                        if (!error && response.statusCode == 200) 
                                                        {
                                                            var fileMediaSegment = destination + response.req.path;
                                                            fs.writeFile(fileMediaSegment , body, function(err) 
                                                            {
                                                                if(err) 
                                                                {
                                                                    self.emit('error' , err);
                                                                }
                                                                else
                                                                {
                                                                    self.emit('downloaded', fileMediaSegment);
                                                                }
                                                            }); 
                                                        }
                                                        else
                                                        {
                                                            self.emit('error', error);
                                                        }
                                                    });
                                               }
                                           }
                                        } 
                                   });
                               }
                               else
                               {
                                   self.emit('error' ,error);
                               }
                           });
                        }
                    }
                }
            });
        }
        else
        {
            self.emit('error',error);
        }
    });
}
util.inherits(m3u8downloader, EventEmitter);
module.exports = m3u8downloader;
