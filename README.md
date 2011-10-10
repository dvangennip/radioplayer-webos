This app enables you to add streaming audio to the tuner list and play those streams. It is as simple as that. If the stream is supported by webOS it should play. You have to supply the URL of the desired stream yourself. No search ability for streams is to be found in this program. One way is to try and open an online stream with the browser (which will open the built-in audio player) and copy the stream URL from there. Then you it should work in this app as well.

Note that streaming audio requires a reliable and not-so-slow internet connection. Depending on a stream's quality (bitrate) data usage and battery drain may need your attention.

###Installation
One way is to get the source code and use the webOS SDK tools to package it and then install it onto your webOS device. A bit cumbersome if you just want to use it. A simpler method using a custom feed via Preware will be provided shortly.

###License
Source code is available under a MIT style license, so you are free to do with it as you desire. It would be kind (but not necessary) to let me know.

The very nice application icon was made by [Gary Leleu](http://www.leleugary.com/) @ [DeviantArt.com](http://dunedhel.deviantart.com/). It is available under a [CC BY-NC-ND 3.0 license](http://creativecommons.org/licenses/by-nc-nd/3.0/). Please check out his website if you're interested.

###Some coding notes
It is a Mojo framework-based application and should work with webOS 1.4+

At its core this app is just a wrapper around the HTML5 Audio element with some ability to store streams for later use. So all info and functions exposed by this element within webOS can be used. Currently no *now playing* info can be fetched through this means.

####Changelog

#####0.1.0
* First public release, including TouchPad compatibility.

####Issues

* No information about a stream (e.g. bitrate, current song) can be shown yet.
* Textfield in Edit scene behave and look odd.