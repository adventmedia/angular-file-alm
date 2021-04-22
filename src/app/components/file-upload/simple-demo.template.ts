export const string = "<style>"+"\r"+
"\n  .my-drop-zone { border: dotted 3px lightgray; }"+"\r"+
"\n  /* Default class applied to drop zones on over */"+"\r"+
"\n  .invalid-drag { border: dotted 3px red; }"+"\r"+
"\n  .valid-drag { border: dotted 3px green; }"+"\r"+
"\n  html, body { height: 100%; }"+"\r"+
"\n  .previewIcon{"+"\r"+
"\n    width:100px;height:100px;"+"\r"+
"\n    background-size:cover;"+"\r"+
"\n    background-repeat:no-repeat;"+"\r"+
"\n  }"+"\r"+
"\n"+"\r"+
"\n  .inline-block{"+"\r"+
"\n    display:inline-block;"+"\r"+
"\n  }"+"\r"+
"\n"+"\r"+
"\n  .margin {margin:.15em;padding:.15em;}"+"\r"+
"\n"+"\r"+
"\n  .flex {display:flex;}"+"\r"+
"\n  .flex-wrap {display:flex;flex-wrap:wrap}"+"\r"+
"\n</style>"+"\r"+
"\n"+"\r"+
"\n<ngfFormData"+"\r"+
"\n  [files]      = \"files\""+"\r"+
"\n  postName     = \"file\""+"\r"+
"\n  [(FormData)] = \"sendableFormData\""+"\r"+
"\n></ngfFormData>"+"\r"+
"\n"+"\r"+
"\n<ngfUploadStatus"+"\r"+
"\n  [(percent)] = \"progress\""+"\r"+
"\n  [httpEvent] = \"httpEvent\""+"\r"+
"\n></ngfUploadStatus>"+"\r"+
"\n"+"\r"+
"\n"+"\r"+
"\n<h3>Select Files</h3>"+"\r"+
"\n<div class=\"flex-wrap margin\">"+"\r"+
"\n  <div class=\"flex-wrap\">"+"\r"+
"\n    <div class=\"margin\">"+"\r"+
"\n      Multiple"+"\r"+
"\n      <div class=\"flex margin\" style=\"border:1px solid #555;border-radius: 5px;\">"+"\r"+
"\n        <input"+"\r"+
"\n          ngfSelect"+"\r"+
"\n          multiple"+"\r"+
"\n          type      = \"file\""+"\r"+
"\n          [(files)] = \"files\""+"\r"+
"\n          [accept]  = \"accept\""+"\r"+
"\n          [maxSize]  = \"maxSize\""+"\r"+
"\n          [(lastInvalids)] = \"lastInvalids\""+"\r"+
"\n          (filesChange) = \"lastFileAt=getDate()\""+"\r"+
"\n          capturePaste = \"1\""+"\r"+
"\n        />"+"\r"+
"\n        <button *ngIf=\"files.length\" type=\"button\" (click)=\"files.length = 0\">clear</button>"+"\r"+
"\n      </div>"+"\r"+
"\n    </div>"+"\r"+
"\n"+"\r"+
"\n    <div class=\"margin\">"+"\r"+
"\n      Single"+"\r"+
"\n      <div class=\"flex margin\" style=\"border:1px solid #555;border-radius: 5px;\">"+"\r"+
"\n        <input"+"\r"+
"\n          ngfSelect"+"\r"+
"\n          type       = \"file\""+"\r"+
"\n          [(files)]  = \"files\""+"\r"+
"\n          [accept]   = \"accept\""+"\r"+
"\n          [maxSize]  = \"maxSize\""+"\r"+
"\n          [(lastInvalids)] = \"lastInvalids\""+"\r"+
"\n          (filesChange) = \"lastFileAt=getDate()\""+"\r"+
"\n        />"+"\r"+
"\n        <button *ngIf=\"files.length\" type=\"button\" (click)=\"files.length = 0\">clear</button>"+"\r"+
"\n      </div>"+"\r"+
"\n    </div>"+"\r"+
"\n"+"\r"+
"\n    <div class=\"inline-block margin\">"+"\r"+
"\n      Element"+"\r"+
"\n      <div"+"\r"+
"\n        ngfSelect"+"\r"+
"\n        multiple  = \"1\""+"\r"+
"\n        [accept]  = \"accept\""+"\r"+
"\n        [maxSize] = \"maxSize\""+"\r"+
"\n        [(files)] = \"files\""+"\r"+
"\n        class     = \"well my-drop-zone\""+"\r"+
"\n        style     = \"border-style:groove;padding:0.5em;text-align:center;width:150px;\""+"\r"+
"\n        [(lastInvalids)] = \"lastInvalids\""+"\r"+
"\n        (filesChange) = \"lastFileAt=getDate()\""+"\r"+
"\n      >"+"\r"+
"\n        Tap to Select"+"\r"+
"\n      </div>"+"\r"+
"\n    </div>"+"\r"+
"\n"+"\r"+
"\n    <div class=\"inline-block margin\">"+"\r"+
"\n      <strong>Images</strong> Only"+"\r"+
"\n      <div"+"\r"+
"\n        ngfSelect"+"\r"+
"\n        accept    = \"image/*\""+"\r"+
"\n        multiple  = \"1\""+"\r"+
"\n        [maxSize] = \"maxSize\""+"\r"+
"\n        [(files)] = \"files\""+"\r"+
"\n        class     = \"well my-drop-zone\""+"\r"+
"\n        style     = \"border-style:groove;padding:0.5em;text-align:center;width:150px;\""+"\r"+
"\n        [(lastInvalids)] = \"lastInvalids\""+"\r"+
"\n        (filesChange) = \"lastFileAt=getDate()\""+"\r"+
"\n      >"+"\r"+
"\n        Tap to Select"+"\r"+
"\n      </div>"+"\r"+
"\n    </div>"+"\r"+
"\n  </div>"+"\r"+
"\n</div>"+"\r"+
"\n"+"\r"+
"\n<div>"+"\r"+
"\n  <h3>Drop Files</h3>"+"\r"+
"\n  <div class=\"inline-block margin\">"+"\r"+
"\n    <div"+"\r"+
"\n      ngfDrop"+"\r"+
"\n      [(validDrag)]    = \"baseDropValid\""+"\r"+
"\n      (fileOver)       = \"hasBaseDropZoneOver=$event\""+"\r"+
"\n      [(files)]        = \"files\""+"\r"+
"\n      [accept]         = \"accept\""+"\r"+
"\n      [maxSize]        = \"maxSize\""+"\r"+
"\n      [(dragFiles)]    = \"dragFiles\""+"\r"+
"\n      [(lastInvalids)] = \"lastInvalids\""+"\r"+
"\n      class            = \"well my-drop-zone\""+"\r"+
"\n      [class.invalid-drag] = \"baseDropValid===false\""+"\r"+
"\n      [class.valid-drag]   = \"baseDropValid\""+"\r"+
"\n      (filesChange) = \"lastFileAt=getDate()\""+"\r"+
"\n      [fileDropDisabled] = \"fileDropDisabled\""+"\r"+
"\n    >"+"\r"+
"\n      Base drop zone"+"\r"+
"\n    </div>"+"\r"+
"\n    <strong>accept:</strong>"+"\r"+
"\n    <div>"+"\r"+
"\n      <input type=\"text\" [(ngModel)]=\"accept\" />"+"\r"+
"\n    </div>"+"\r"+
"\n  </div>"+"\r"+
"\n"+"\r"+
"\n  <div class=\"inline-block margin\">"+"\r"+
"\n    <div"+"\r"+
"\n      ngfDrop"+"\r"+
"\n      multiple         = \"1\""+"\r"+
"\n      selectable       = \"1\""+"\r"+
"\n      [(validDrag)]    = \"validComboDrag\""+"\r"+
"\n      [(files)]        = \"files\""+"\r"+
"\n      accept           = \"image/*\""+"\r"+
"\n      [maxSize]        = \"maxSize\""+"\r"+
"\n      [(lastInvalids)] = \"lastInvalids\""+"\r"+
"\n      [(dragFiles)]    = \"dragFiles\""+"\r"+
"\n      class            = \"well my-drop-zone\""+"\r"+
"\n      [class.invalid-drag] = \"validComboDrag===false\""+"\r"+
"\n      [class.valid-drag]   = \"validComboDrag\""+"\r"+
"\n      (filesChange) = \"lastFileAt=getDate()\""+"\r"+
"\n      [fileDropDisabled] = \"fileDropDisabled\""+"\r"+
"\n    >"+"\r"+
"\n      Combo drop/select <strong>image</strong> only zone"+"\r"+
"\n    </div>"+"\r"+
"\n    <strong>accept:</strong>"+"\r"+
"\n    <div>"+"\r"+
"\n      <input type=\"text\" value=\"image/*\" disabled readonly=\"\" style=\"width:100%\" />"+"\r"+
"\n    </div>"+"\r"+
"\n  </div>"+"\r"+
"\n"+"\r"+
"\n  <div class=\"inline-block margin\">"+"\r"+
"\n    <strong>maxSize byte</strong>"+"\r"+
"\n    <div>"+"\r"+
"\n      <input type=\"number\" [(ngModel)]=\"maxSize\" placeholder=\"1024 == 1mb\" />"+"\r"+
"\n    </div>"+"\r"+
"\n  </div>"+"\r"+
"\n"+"\r"+
"\n  <div class=\"inline-block margin\">"+"\r"+
"\n    <strong>fileDropDisabled</strong>"+"\r"+
"\n    <div>"+"\r"+
"\n      <input type=\"checkbox\" [(ngModel)]=\"fileDropDisabled\" name=\"fileDropDisabled\" id=\"fileDropDisabled\" />"+"\r"+
"\n    </div>"+"\r"+
"\n  </div>"+"\r"+
"\n</div>"+"\r"+
"\n"+"\r"+
"\n"+"\r"+
"\n<div *ngIf=\"dragFiles\">"+"\r"+
"\n  <h3 style=\"margin:0\">Drag Files</h3>"+"\r"+
"\n  <p *ngIf=\"!dragFiles.length\" style=\"color:red;\">"+"\r"+
"\n    This browser does NOT release metadata for files being dragged. All files will be considered valid drags until dropped."+"\r"+
"\n  </p>"+"\r"+
"\n  <pre>{{ dragFiles | json }}</pre>"+"\r"+
"\n</div>"+"\r"+
"\n"+"\r"+
"\n<div class=\"bg-warning\" *ngIf=\"lastInvalids?.length\" style=\"margin-bottom: 40px\">"+"\r"+
"\n  <h3 style=\"color:red;\">Last {{ lastInvalids.length }} Invalid Selected Files</h3>"+"\r"+
"\n"+"\r"+
"\n  <table class=\"table\">"+"\r"+
"\n    <thead>"+"\r"+
"\n      <tr>"+"\r"+
"\n        <th>Name</th>"+"\r"+
"\n        <th>Error</th>"+"\r"+
"\n        <th>Type</th>"+"\r"+
"\n        <th>Size</th>"+"\r"+
"\n        <th>Actions</th>"+"\r"+
"\n      </tr>"+"\r"+
"\n    </thead>"+"\r"+
"\n    <tbody>"+"\r"+
"\n      <tr *ngFor=\"let item of lastInvalids;let i=index\">"+"\r"+
"\n        <td>"+"\r"+
"\n          <div *ngIf=\"['image/gif','image/png','image/jpeg'].indexOf(item.file.type)>=0\">"+"\r"+
"\n            <div class=\"previewIcon\" [ngfBackground]=\"item.File\"></div>"+"\r"+
"\n          </div>"+"\r"+
"\n          <strong>{{ item.file.name }}</strong>"+"\r"+
"\n        </td>"+"\r"+
"\n        <td nowrap>"+"\r"+
"\n          {{ item.type }}"+"\r"+
"\n        </td>"+"\r"+
"\n        <td nowrap>"+"\r"+
"\n          {{ item.file.type }}"+"\r"+
"\n        </td>"+"\r"+
"\n        <td nowrap>"+"\r"+
"\n          {{ item.file.size/1024/1024 | number:'.2' }} MB"+"\r"+
"\n        </td>"+"\r"+
"\n        <td nowrap>"+"\r"+
"\n          <button type=\"button\""+"\r"+
"\n            class=\"btn btn-danger btn-xs\""+"\r"+
"\n            (click)=\"lastInvalids.splice(i,1)\""+"\r"+
"\n          >"+"\r"+
"\n            <span class=\"glyphicon glyphicon-trash\"></span>"+"\r"+
"\n          </button>"+"\r"+
"\n        </td>"+"\r"+
"\n      </tr>"+"\r"+
"\n    </tbody>"+"\r"+
"\n  </table>"+"\r"+
"\n</div>"+"\r"+
"\n"+"\r"+
"\n<div style=\"margin-bottom: 40px\">"+"\r"+
"\n  <h3>{{ files.length }} Queued Files</h3>"+"\r"+
"\n  <table class=\"table\">"+"\r"+
"\n    <thead>"+"\r"+
"\n      <tr>"+"\r"+
"\n        <th>Name</th>"+"\r"+
"\n        <th>Type</th>"+"\r"+
"\n        <th>Size</th>"+"\r"+
"\n        <th>Actions</th>"+"\r"+
"\n      </tr>"+"\r"+
"\n    </thead>"+"\r"+
"\n    <tbody>"+"\r"+
"\n      <tr *ngFor=\"let item of files;let i=index\">"+"\r"+
"\n        <td>"+"\r"+
"\n          <div *ngIf=\"['image/gif','image/png','image/jpeg'].indexOf(item.type)>=0\">"+"\r"+
"\n            <div class=\"previewIcon\" [ngfBackground]=\"item\"></div>"+"\r"+
"\n          </div>"+"\r"+
"\n          <strong>{{ item.name }}</strong>"+"\r"+
"\n        </td>"+"\r"+
"\n        <td nowrap>"+"\r"+
"\n          {{ item.type }}"+"\r"+
"\n        </td>"+"\r"+
"\n        <td nowrap>"+"\r"+
"\n          {{ item.size/1024/1024 | number:'.2' }} MB"+"\r"+
"\n        </td>"+"\r"+
"\n        <td nowrap>"+"\r"+
"\n          <button type=\"button\""+"\r"+
"\n            class=\"btn btn-danger btn-xs\""+"\r"+
"\n            (click)=\"files.splice(i,1)\""+"\r"+
"\n          >"+"\r"+
"\n            <span class=\"glyphicon glyphicon-trash\"></span>"+"\r"+
"\n          </button>"+"\r"+
"\n        </td>"+"\r"+
"\n      </tr>"+"\r"+
"\n    </tbody>"+"\r"+
"\n  </table>"+"\r"+
"\n"+"\r"+
"\n  <div>"+"\r"+
"\n    <div>"+"\r"+
"\n      Queue progress:"+"\r"+
"\n      <div class=\"progress\" style=\"\">"+"\r"+
"\n        <div class=\"progress-bar\""+"\r"+
"\n          role=\"progressbar\""+"\r"+
"\n          [ngStyle]=\"{ 'width': progress + '%' }\""+"\r"+
"\n        ></div>"+"\r"+
"\n      </div>"+"\r"+
"\n    </div>"+"\r"+
"\n"+"\r"+
"\n    <ng-container *ngIf=\"lastFileAt\">"+"\r"+
"\n      <p>"+"\r"+
"\n        <strong>Last file(s) selected At:</strong> {{ lastFileAt | date : 'longTime' }}"+"\r"+
"\n      </p>"+"\r"+
"\n    </ng-container>"+"\r"+
"\n"+"\r"+
"\n    <ng-container *ngIf=\"progress==100\">"+"\r"+
"\n      <i class=\"glyphicon glyphicon-ok\"></i>"+"\r"+
"\n      &nbsp;Upload Complete"+"\r"+
"\n    </ng-container>"+"\r"+
"\n"+"\r"+
"\n    <button type=\"button\""+"\r"+
"\n      class=\"btn btn-success btn-s\""+"\r"+
"\n      (click)=\"uploadFiles()\""+"\r"+
"\n      [disabled]=\"!files.length\""+"\r"+
"\n    >"+"\r"+
"\n      <span class=\"glyphicon glyphicon-upload\"></span> Upload all"+"\r"+
"\n    </button>"+"\r"+
"\n"+"\r"+
"\n    <button type=\"button\""+"\r"+
"\n      class=\"btn btn-warning btn-s\""+"\r"+
"\n      (click)=\"cancel()\""+"\r"+
"\n      [disabled]=\"!httpEmitter\""+"\r"+
"\n    >"+"\r"+
"\n      <span class=\"glyphicon glyphicon-ban-circle\"></span> Cancel all"+"\r"+
"\n    </button>"+"\r"+
"\n    <button type=\"button\""+"\r"+
"\n      class=\"btn btn-danger btn-s\""+"\r"+
"\n      (click)=\"files.length=0\""+"\r"+
"\n      [disabled]=\"!files.length\""+"\r"+
"\n    >"+"\r"+
"\n      <span class=\"glyphicon glyphicon-trash\"></span> Remove all"+"\r"+
"\n    </button>"+"\r"+
"\n  </div>"+"\r"+
"\n</div>"+"\r"+
"\n"