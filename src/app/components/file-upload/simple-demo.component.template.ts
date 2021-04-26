export const string = "import { Component } from '@angular/core'"+
"\nimport { Subscription } from 'rxjs'"+
"\nimport { string as template } from \"./simple-demo.template\""+
"\nimport {"+
"\n  HttpClient, HttpRequest,"+
"\n  HttpResponse, HttpEvent"+
"\n} from '@angular/common/http'"+
"\n"+
"\n@Component({ selector: 'simple-demo', template: template })"+
"\nexport class SimpleDemoComponent {"+
"\n  accept = '*'"+
"\n  files:File[] = []"+
"\n  progress:number"+
"\n  //url = 'https://evening-anchorage-3159.herokuapp.com/api/'"+
"\n  url = 'https://jquery-file-upload.appspot.com/'"+
"\n  hasBaseDropZoneOver:boolean = false"+
"\n  httpEmitter:Subscription"+
"\n  httpEvent:HttpEvent<{}>"+
"\n  lastFileAt:Date"+
"\n"+
"\n  sendableFormData:FormData//populated via ngfFormData directive"+
"\n"+
"\n  dragFiles:any"+
"\n  validComboDrag:any"+
"\n  lastInvalids:any"+
"\n  fileDropDisabled:any"+
"\n  maxSize:any"+
"\n  baseDropValid:any"+
"\n"+
"\n  constructor(public HttpClient:HttpClient){}"+
"\n"+
"\n  cancel(){"+
"\n    this.progress = 0"+
"\n    if( this.httpEmitter ){"+
"\n      console.log('cancelled')"+
"\n      this.httpEmitter.unsubscribe()"+
"\n    }"+
"\n  }"+
"\n"+
"\n  uploadFiles():Subscription{"+
"\n    const req = new HttpRequest<FormData>("+
"\n      'POST',"+
"\n      this.url,"+
"\n      this.sendableFormData, {"+
"\n      reportProgress: true//, responseType: 'text'"+
"\n    })"+
"\n"+
"\n    return this.httpEmitter = this.HttpClient.request(req)"+
"\n    .subscribe("+
"\n      event=>{"+
"\n        this.httpEvent = event"+
"\n"+
"\n        if (event instanceof HttpResponse) {"+
"\n          delete this.httpEmitter"+
"\n          console.log('request done', event)"+
"\n        }"+
"\n      },"+
"\n      error=>alert('Error Uploading Files: '+error.message)"+
"\n    )"+
"\n  }"+
"\n"+
"\n  getDate(){"+
"\n    return new Date()"+
"\n  }"+
"\n}"+
"\n"