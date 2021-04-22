import { Component } from '@angular/core';
import { string as template } from "./file-upload-section.template"
import { string as doc } from "./doc.template"
import { string as tsString } from "./file-upload/simple-demo.component.template"
import { string as htmlString } from "./file-upload/simple-demo.template"

let tabDesc:any ={
  ts: tsString,
  html: htmlString
}

@Component({
  selector: 'file-upload-section',
  //templateUrl: './file-upload-section.html'
  template: template
})
export class FileUploadSectionComponent {
  public name:string = 'File Upload';
  public currentHeading:string = 'Simple';
  public doc:string = doc;
  public tabs:any = tabDesc;

  public select(e:any):void {
    if (e.heading) {
      this.currentHeading = e.heading;
    }
  }
}
