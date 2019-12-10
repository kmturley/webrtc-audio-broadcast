import { Component, Input, OnInit, ViewChild } from '@angular/core';

import { ListenerService } from '../shared/services/listener.service';
import { RadioService } from '../shared/services/radio.service';
import { StationService } from '../shared/services/station.service';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss']
})
export class VisualizerComponent implements OnInit {
  analyzerNode: AnalyserNode;
  context: AudioContext;
  interval: any;
  myStation: StationService;
  vizFreqDomainData: Uint8Array;
  vizAnimationFrameId: number;
  vizualizerOpt = 'line'; // bar
  vizCtx: any;

  @Input() set station(station: StationService) {
    if (station) {
      this.myStation = station;
      console.log('station', station);
      this.initVizualizer();
    }
  }

  @ViewChild('visualizerCanvas', {static: false}) visualizerCanvas: any;

  constructor(
    public radio: RadioService
  ) { }

  ngOnInit() { }

  initVizualizer() {
    console.log('initVizualizer', this);
    this.analyzerNode = this.radio.context.createAnalyser();
    this.analyzerNode.smoothingTimeConstant = 0.6;
    this.analyzerNode.fftSize = 2048;
    this.analyzerNode.minDecibels = -100;
    this.analyzerNode.maxDecibels = -10;
    this.vizFreqDomainData = new Uint8Array(this.analyzerNode.frequencyBinCount);
    this.vizCtx = this.visualizerCanvas.nativeElement.getContext('2d');
    this.radio.incoming.connect(this.analyzerNode);
    this.myStation.outgoingGain.connect(this.analyzerNode);

    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.updateVizualizer();
    }, 1000);
  }

  updateVizualizer() {
    console.log('updateVizualizer', this.analyzerNode, this.vizFreqDomainData);
    if (this.analyzerNode && this.vizCtx) {
      this.analyzerNode.getByteFrequencyData(this.vizFreqDomainData);
      const width = this.visualizerCanvas.width;
      const height = this.visualizerCanvas.height;
      const barWidth = (width / (this.analyzerNode.frequencyBinCount / 9.3)); // Estimation for now
      this.vizCtx.clearRect(0, 0, width, height);
      this.vizCtx.fillStyle = 'black';
      this.vizCtx.fillRect(0, 0, width, height);
      this.vizCtx.strokeStyle = 'yellow';
      this.vizCtx.fillStyle = 'yellow';
      this.vizCtx.beginPath();
      this.vizCtx.moveTo(0, height);
      let xval = 0;
      const t = 1;
      let next = 1;
      for (let i = 0; i < this.analyzerNode.frequencyBinCount; i += next) {
          // Rounding doesn't go so well...
          next += i / (this.analyzerNode.frequencyBinCount / 16);
          next = next - (next % 1);
          if (this.vizualizerOpt === 'bar') {
            this.vizCtx.fillRect(xval, height - this.vizFreqDomainData[i], barWidth, this.vizFreqDomainData[i]);
          } else {
            const p0 = (i > 0) ? { x: xval - barWidth, y: height - this.vizFreqDomainData[i - 1] } : { x: 0, y: 0 };
            const p1 = { x: xval, y: height - this.vizFreqDomainData[i] };
            const p2 = (i < this.analyzerNode.frequencyBinCount - 1) ? {
              x: xval + barWidth, y: height - this.vizFreqDomainData[i + 1]
            } : p1;
            const p3 = (i < this.analyzerNode.frequencyBinCount - 2) ? {
              x: xval + 2 * barWidth, y: height - this.vizFreqDomainData[i + 2]
            } : p1;
            const cp1x = p1.x + (p2.x - p0.x) / 6 * t;
            const cp1y = p1.y + (p2.y - p0.y) / 6 * t;
            const cp2x = p2.x - (p3.x - p1.x) / 6 * t;
            const cp2y = p2.y - (p3.y - p1.y) / 6 * t;
            this.vizCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
          }
          xval += barWidth + 1;
      }
      this.vizCtx.stroke();
    }
  }
}
