class Station {
  constraints = {
    audio: {
      autoGainControl: false,
      channelCount: 2,
      echoCancellation: false,
      latency: 0,
      noiseSuppression: false,
      sampleRate: 48000,
      sampleSize: 16,
      volume: 1.0
    }
  };

  constructor(context, outgoingDestNode) {
    this.context = context;
    this.outgoingGain = this.context.createGain();
    this.outgoingGain.connect(outgoingDestNode);
  }

  async start() {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia(this.constraints).then((stream) => {
        if (this.mySource) {
          this.mySource.disconnect();
        }
        this.mySource = this.context.createMediaStreamSource(stream);
        this.mySource.connect(this.outgoingGain);
        resolve();
      }).catch((e) => {
        console.warn(`Failed to obtain local media stream: ${e}`);
        reject();
      });
    });
  }

  stop() {
    if (this.mySource) {
      this.mySource.disconnect();
    }
  }
}
