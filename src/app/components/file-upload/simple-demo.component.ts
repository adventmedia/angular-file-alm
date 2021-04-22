import { Component } from '@angular/core'
import { Subscription } from 'rxjs'
import { string as template } from "./simple-demo.template"
import {
  HttpClient, HttpRequest,
  HttpResponse, HttpEvent
} from '@angular/common/http'

@Component({ selector: 'simple-demo', template: template })
export class SimpleDemoComponent {
  accept = '*'
  files:File[] = []
  progress:number
  //url = 'https://evening-anchorage-3159.herokuapp.com/api/'
  url = 'https://jquery-file-upload.appspot.com/'
  hasBaseDropZoneOver:boolean = false
  httpEmitter:Subscription
  httpEvent:HttpEvent<{}>
  lastFileAt:Date

  sendableFormData:FormData//populated via ngfFormData directive

  dragFiles:any
  validComboDrag:any
  lastInvalids:any
  fileDropDisabled:any
  maxSize:any
  baseDropValid:any

  constructor(public HttpClient:HttpClient){}

  cancel(){
    this.progress = 0
    if( this.httpEmitter ){
      console.log('cancelled')
      this.httpEmitter.unsubscribe()
    }
  }

  uploadFiles():Subscription{
    const req = new HttpRequest<FormData>(
      'POST',
      this.url,
      this.sendableFormData, {
      reportProgress: true//, responseType: 'text'
    })

    return this.httpEmitter = this.HttpClient.request(req)
    .subscribe(
      event=>{
        this.httpEvent = event

        if (event instanceof HttpResponse) {
          delete this.httpEmitter
          console.log('request done', event)
        }
      },
      error=>alert('Error Uploading Files: '+error.message)
    )
  }

  getDate(){
    return new Date()
  }
}
