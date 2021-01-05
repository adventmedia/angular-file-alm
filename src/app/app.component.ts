import { Component } from '@angular/core';
import {version} from 'angular-file/package.json'

declare var PR: any;

@Component({
  selector: 'app',
  templateUrl: './app.component.html'
})
export class AppComponent {
  version:string = version
  //gettingStarted:string = gettingStarted;

  ngAfterViewInit(){
    console.log('angular-file version', version)
    setTimeout(()=>{
      if (typeof PR !== 'undefined') {
        // google code-prettify
        PR.prettyPrint();
      }
    }, 150);
  }
}
