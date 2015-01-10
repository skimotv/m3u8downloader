// m3u8downloader.js
// =================

var async = require('async');
var fs = require('fs');
var util = require('util');
var request = require('request');
var EventEmitter = require('events').EventEmitter;
exports.version = "0.2.5";

var endsWith = function(str, suffix) 
{
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var m3u8downloader = function(masterPlayListURL, destination, callback) 
{
    var self = this;
    var res = masterPlayListURL.split("/");
    var site = masterPlayListURL.replace(res[res.length - 1], '');
    request.get(masterPlayListURL, handleResponse);
    var out = {};

    function handleResponse(error, response, body) 
    {
        if (error || response.statusCode !== 200)   
        {
            return done(error || new Error('Bad status code: ' + response.statusCode));
        }
        self.emit('start');
        var masterResponse = response.req.path.split("/");
        try 
        {
            fs.mkdirSync(destination + '/' + masterResponse[1]);
        }
        catch (err) 
        {
            return done(err);
        }
        var fileMasterPlayList = destination + response.req.path;
        fs.writeFile(fileMasterPlayList, body, afterWrite);

        function afterWrite(err) 
        {
            if (err) 
            {
                return done(err);
            }
            self.emit('progress', 'Created Master Playlist ' + fileMasterPlayList);
            out.master = fileMasterPlayList;
            out.media = [];
            var masterPlayListContents = body.split("\n");
            async.eachSeries(masterPlayListContents, handleContent, done);

            function handleContent(part, asyncCb) 
            {
                if (!endsWith(part, "m3u8")) 
                {
                    return asyncCb();
                }
                var res2 = part.split("/");
                var mediaPlayListFile = '';
                try 
                {
                    if (part.indexOf("://") > -1) 
                    {
                        fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[res2.length - 2]);
                        mediaPlayListFile = part;
                    }
                    else 
                    {
                        fs.mkdirSync(destination + "/" + masterResponse[1] + '/' + res2[0]);
                        mediaPlayListFile = site + part;
                    }
                }
                catch (err) 
                {
                    return asyncCb(err);
                }
                request.get(mediaPlayListFile, handleResponse);

                function handleResponse(error, response, body) 
                {
                    if (error || response.statusCode !== 200) 
                    {
                        return asyncCb(error || new Error('Bad status code: ' + response.statusCode));
                    }
                    var fileMediaPlayList = destination + response.req.path;
                    var mediaResponse = response.req.path.split('/');
                    fs.writeFile(fileMediaPlayList, body, afterWrite);

                    function afterWrite(err) 
                    {
                        if (err) 
                        {
                            return asyncCb(err);
                        }
                        var media = 
                        {
                            index: fileMediaPlayList
                        }
                        self.emit('progress', 'Created Media Playlist ' + fileMediaPlayList);
                        var mediaPlayListContents = body.split("\n");
                        async.eachSeries(mediaPlayListContents, handleSubContent, innerDone);

                        function handleSubContent(subpart, asyncCbInner) 
                        {
                            if (!endsWith(subpart, "ts")) 
                            {
                                return asyncCbInner();
                            }
                            var mediaSegmentFile = '';
                            if (subpart.indexOf("://") > -1) 
                            {
                                mediaSegmentFile = subpart;
                            }
                            else 
                            {
                                mediaSegmentFile = site + mediaResponse[2] + '/' + subpart;
                            }
                            request.get(mediaSegmentFile, { encoding: null }, handleResponse);

                            function handleResponse(error, response, body) 
                            {
                                if (error || response.statusCode !== 200) 
                                {
                                    return asyncCbInner(error || new Error('Bad status code: ' + response.statusCode));
                                }
                                var fileMediaSegment = destination + response.req.path;
                                fs.writeFile(fileMediaSegment, body, afterWrite);

                                function afterWrite(err) 
                                {
                                    if (err) 
                                    {
                                        asyncCbInner(err);
                                    }
                                    else 
                                    {
                                        self.emit('downloaded', fileMediaSegment);
                                        if (media.segments) 
                                        {
                                            media.segments.push(fileMediaSegment);
                                        }
                                        else 
                                        {
                                            media.segments = [fileMediaSegment];
                                        }
                                        asyncCbInner();
                                    }
                                }
                            }
                        }

                        function innerDone(err) 
                        {
                            if (err) 
                            {
                                asyncCb(err);
                            }
                            else 
                            {
                                out.media.push(media);
                                asyncCb();
                            }
                        }
                    }
                }
            }
        }
    }

    function done(err) 
    {
        if (err) 
        {
            self.emit('error', err);
            callback(err);
        }
        else 
        {
            self.emit('complete', out);
            callback(null, out);
        }
    }
}
util.inherits(m3u8downloader, EventEmitter);
module.exports = m3u8downloader;
