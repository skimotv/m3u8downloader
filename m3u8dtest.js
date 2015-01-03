var m3u8downloader = require('m3u8downloader');
var downloader = new m3u8downloader("http://www.nacentapps.com/m3u8/index.m3u8", "destination",
function(data,err)
{
    if(err)
        console.log(err);
    else
        console.log(data);
});

downloader.on('start', function()
{
    console.log("started downloading");
});

downloader.on('progress', function(d)
{
    console.log(d);
});


downloader.on('downloaded', function(d)
{
    console.log(d);
});
