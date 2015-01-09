var m3u8downloader = require('./');
var downloader = new m3u8downloader("http://www.nacentapps.com/m3u8/index.m3u8", "destination",
function(err, data)
{
    if(err)
        console.log(err);
    else
        console.dir(data)
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


downloader.on('complete', function(d) {
    console.log('done');
})