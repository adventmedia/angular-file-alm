import { Directive, EventEmitter, Output, Input } from '@angular/core';

@Directive({selector: 'ngfUploadStatus'})
export class ngfUploadStatus {
  @Input() percent:number = 0
  @Output() percentChange:EventEmitter<number> = new EventEmitter()
  @Input() httpEvent !: Event

  ngOnChanges( changes ){
    if( changes.httpEvent && changes.httpEvent.currentValue ){
      const event = changes.httpEvent.currentValue
      if (event.loaded && event.total) {
        setTimeout(()=>{
          this.percent = Math.round(100 * event.loaded / event.total);
          this.percentChange.emit( this.percent )
        }, 0)
      }
    }
  }
}