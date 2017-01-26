function SoundEngine(sounds, context, loader) {
    this.sounds = sounds;
    this.context = context;
    this.nextSound = false;
    this.playing = false;
    this.bufferLoader = loader;
}

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
    this.volume = context.createGain();
    this.volume.connect(context.destination);
    this.volume.gain.value = 0.2;
}

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i) {
        this.loadBuffer(this.urlList[i], i);
    }
};

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    };

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    };

    request.send();
};

SoundEngine.prototype.playSound = function(key){
    if(this.playing){
        this.nextSound = key;
        return;
    }
    if(typeof this.sounds[key].buffer !== 'undefined'){
        this.playing = true;
        var source = this.context.createBufferSource();
        source.buffer = this.sounds[key].buffer;
        //source.connect(this.context.destination);
        source.connect(this.bufferLoader.volume);
        source.start(0);
        //this.soundSource.buffer = this.sounds[key].buffer;
        //this.soundSource.connect(this.context.destination);
        //this.soundSource.start(0);
        var that = this;
        window.setTimeout(function(){
            that.playing = false;
            if(that.nextSound !== false){
                that.playSound(that.nextSound);
                that.nextSound = false;
            }
        }, this.sounds[key].duration);
    }
};
