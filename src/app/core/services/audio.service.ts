import { Injectable } from '@angular/core';
import { Howl } from 'howler';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  ready: boolean = false;
  playing: boolean = false;
  duration: number = 0;

  audio = new Howl({
    preload: 'metadata',
    src: ['assets/audio/notify.mp3'],
    format: ['mp3'],
    onload: () => {
      this.duration = this.audio.duration() * 1000;
      this.ready = true;
    },
    onplay: () => {
      this.playing = true;
    },
    onend: () => {
      this.playing = false;
    },
  });

  playNotification(): void {
    if (!this.ready || this.playing) {
      return;
    }

    this.audio.play();
  }
}
