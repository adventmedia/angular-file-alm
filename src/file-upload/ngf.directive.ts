import { Directive, EventEmitter, ElementRef, Input, Output, HostListener, SimpleChanges } from '@angular/core';
import { createInvisibleFileInputWrap, isFileInput, detectSwipe } from "./doc-event-help.functions"
import {
  acceptType, InvalidFileItem,
  applyExifRotation, dataUrl
} from "./fileTools"

export interface dragMeta{
  type:string
  kind:string
}

/** A master base set of logic intended to support file select/drag/drop operations
 NOTE: Use ngfDrop for full drag/drop. Use ngfSelect for selecting
*/
@Directive({
  selector: "[ngf]",
  exportAs:"ngf"
})
export class ngf {
  fileElm: any
  filters: {name: string, fn: (file:File)=>boolean}[] = []
  lastFileCount: number = 0

  @Input() multiple !:string
  @Input() accept   !:string
  @Input() maxSize  !:number
  @Input() ngfFixOrientation: boolean = true

  @Input() fileDropDisabled: boolean = false
  @Input() selectable: boolean | string = false
  @Output('init') directiveInit:EventEmitter<ngf> = new EventEmitter()

  @Input() lastInvalids:InvalidFileItem[] = []
  @Output() lastInvalidsChange:EventEmitter<{file:File,type:string}[]> = new EventEmitter()

  @Input() lastBaseUrl!: string//base64 last file uploaded url
  @Output() lastBaseUrlChange:EventEmitter<string> = new EventEmitter()

  @Input() file: File | null//last file uploaded
  @Output() fileChange: EventEmitter<File> = new EventEmitter()

  @Input() files:File[] = []
  @Output() filesChange:EventEmitter<File[]> = new EventEmitter<File[]>();

  @Output() fileSelectStart:EventEmitter<Event> = new EventEmitter()

  @Input() capturePaste: boolean // window paste file watching (empty string turns on)

  pasteCapturer!: (e: Event) => void // goes with capturePaste

  constructor(public element:ElementRef){
    this.initFilters()
  }

  initFilters(){
    // the order is important
    this.filters.push({name: 'accept', fn: this._acceptFilter})
    this.filters.push({name: 'fileSize', fn: this._fileSizeFilter})

    //this.filters.push({name: 'fileType', fn: this._fileTypeFilter})
    //this.filters.push({name: 'queueLimit', fn: this._queueLimitFilter})
    //this.filters.push({name: 'mimeType', fn: this._mimeTypeFilter})
  }

  ngOnDestroy(){
    delete this.fileElm//faster memory release of dom element
    this.destroyPasteListener();
  }

  ngOnInit(){
    const selectable = (this.selectable || this.selectable==='') && !['false', 'null', '0'].includes(this.selectable as string);
    if( selectable ){
      this.enableSelecting()
    }

    if( this.multiple ){
      this.paramFileElm().setAttribute('multiple', this.multiple)
    }

    this.evalCapturePaste();

    // create reference to this class with one cycle delay to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(()=>{
      this.directiveInit.emit(this)
    }, 0)
  }

  ngOnChanges( changes: SimpleChanges ){
    if( changes.accept ){
      this.paramFileElm().setAttribute('accept', changes.accept.currentValue || '*')
    }

    if (changes.capturePaste) {
      this.evalCapturePaste();
    }

    // Did we go from having a file to not having a file? Clear file element then
    if (changes.file && changes.file.previousValue && !changes.file.currentValue) {
      this.clearFileElmValue()
    }

    // Did we go from having files to not having files? Clear file element then
    if (changes.files) {
      const filesWentToZero = changes.files.previousValue?.length && !changes.files.currentValue?.length

      if (filesWentToZero) {
        this.clearFileElmValue()
      }
    }
  }

  evalCapturePaste() {
    const isActive = this.capturePaste || (this.capturePaste as any)==='' || ['false', '0', 'null'].includes(this.capturePaste as any);

    if (isActive) {
      if (this.pasteCapturer) {
        return; // already listening
      }

      this.pasteCapturer = (e: Event) => {
        const clip = (e as any).clipboardData;
        if (clip && clip.files && clip.files.length) {
          this.handleFiles(clip.files);
          e.preventDefault();
        }
      }

      window.addEventListener('paste', this.pasteCapturer);

      return;
    }

    this.destroyPasteListener();
  }

  destroyPasteListener() {
    if (this.pasteCapturer) {
      window.removeEventListener('paste', this.pasteCapturer);
      delete this.pasteCapturer;
    }
  }

  paramFileElm(){
    if( this.fileElm )return this.fileElm // already defined

    // elm already is a file input
    const isFile = isFileInput( this.element.nativeElement )
    if(isFile){
      return this.fileElm = this.element.nativeElement
    }

    // the host elm is NOT a file input
    return this.fileElm = this.createFileElm({
      change: this.changeFn.bind(this)
    })
  }

  /** Only used when host element we are attached to is NOT a fileElement */
  createFileElm({change}: {change:() => any}) {
    // use specific technique to hide file element within
    const label = createInvisibleFileInputWrap()
    const fileElm = label.getElementsByTagName('input')[0]

    fileElm.addEventListener('change', change);
    this.element.nativeElement.appendChild( label ) // put on html stage

    return fileElm
  }

  enableSelecting(){
    let elm = this.element.nativeElement

    if( isFileInput(elm) ){
      const bindedHandler = event => this.beforeSelect(event)
      elm.addEventListener('click', bindedHandler)
      elm.addEventListener('touchstart', bindedHandler)
      return
    }

    const bindedHandler = ev => this.clickHandler(ev)
    elm.addEventListener('click', bindedHandler)
    elm.addEventListener('touchstart', bindedHandler)
    elm.addEventListener('touchend', bindedHandler)
  }

  getValidFiles( files:File[] ):File[]{
    const rtn:File[] = []
    for(let x=files.length-1; x >= 0; --x){
      if( this.isFileValid(files[x]) ){
        rtn.push( files[x] )
      }
    }
    return rtn
  }

  getInvalidFiles(files:File[]):InvalidFileItem[]{
    const rtn:InvalidFileItem[] = []
    for(let x=files.length-1; x >= 0; --x){
      let failReason = this.getFileFilterFailName(files[x])
      if( failReason ){
        rtn.push({
          file : files[x],
          type : failReason
        })
      }
    }
    return rtn
  }

  // Primary handler of files coming in
  handleFiles(files:File[]){
    const valids = this.getValidFiles(files)

    if(files.length!=valids.length){
      this.lastInvalids = this.getInvalidFiles(files)
    }else{
      delete this.lastInvalids
    }

    this.lastInvalidsChange.emit(this.lastInvalids)

    if( valids.length ){
      if( this.ngfFixOrientation ){
        this.applyExifRotations(valids)
        .then( fixedFiles=>this.que(fixedFiles) )
      }else{
        this.que(valids)
      }
    }

    if (this.isEmptyAfterSelection()) {
      this.element.nativeElement.value = ''
    }
  }

  que( files:File[] ){
    this.files = this.files || []
    Array.prototype.push.apply(this.files, files)

    //below break memory ref and doesnt act like a que
    //this.files = files//causes memory change which triggers bindings like <ngfFormData [files]="files"></ngfFormData>

    this.filesChange.emit( this.files )

    if(files.length){
      this.fileChange.emit( this.file=files[0] )

      if(this.lastBaseUrlChange.observers.length){
        dataUrl( files[0] )
        .then( url=>this.lastBaseUrlChange.emit(url) )
      }
    }

    //will be checked for input value clearing
    this.lastFileCount = this.files.length
  }

  /** called when input has files */
  changeFn(event:any) {
    var fileList = event.__files_ || (event.target && event.target.files)

    if (!fileList) return;

    this.stopEvent(event);
    this.handleFiles(fileList)
  }

  clickHandler(evt: Event){
    const elm = this.element.nativeElement
    if (elm.getAttribute('disabled') || this.fileDropDisabled){
      return false;
    }

    var r = detectSwipe(evt);
    // prevent the click if it is a swipe
    if ( r!==false ) return r;

    const fileElm = this.paramFileElm()
    fileElm.click()
    //fileElm.dispatchEvent( new Event('click') );
    this.beforeSelect(evt)

    return false;
  }

  beforeSelect(event: Event){
    this.fileSelectStart.emit(event)

    if( this.files && this.lastFileCount===this.files.length )return

    // if no files in array, be sure browser does not prevent reselect of same file (see github issue 27)
    this.clearFileElmValue()
  }

  clearFileElmValue() {
    if (!this.fileElm) return

    this.fileElm.value = null
  }

  isEmptyAfterSelection():boolean {
    return !!this.element.nativeElement.attributes.multiple;
  }

  stopEvent(event:any):any {
    event.preventDefault();
    event.stopPropagation();
  }

  transferHasFiles(transfer:any):any {
    if (!transfer.types) {
      return false;
    }

    if (transfer.types.indexOf) {
      return transfer.types.indexOf('Files') !== -1;
    } else if (transfer.types.contains) {
      return transfer.types.contains('Files');
    } else {
      return false;
    }
  }

  eventToFiles(event:Event){
    const transfer = eventToTransfer(event);
    if( transfer ){
      if(transfer.files && transfer.files.length){
        return transfer.files
      }
      if(transfer.items && transfer.items.length){
        return transfer.items
      }
    }
    return []
  }

  applyExifRotations(
    files:File[]
  ):Promise<File[]>{
    const mapper = (
      file:File,index:number
    ):Promise<any>=>{
      return applyExifRotation(file)
      .then( fixedFile=>files.splice(index, 1, fixedFile) )
    }

    const proms:Promise<any>[] = []
    for(let x=files.length-1; x >= 0; --x){
      proms[x] = mapper( files[x], x )
    }
    return Promise.all( proms ).then( ()=>files )
  }

  @HostListener('change', ['$event'])
  onChange(event:Event):void {
    let files = this.element.nativeElement.files || this.eventToFiles(event)

    if(!files.length)return

    this.stopEvent(event);
    this.handleFiles(files)
  }

  getFileFilterFailName(
    file:File
  ):string | undefined{
    for(let i = 0; i < this.filters.length; i++){
      if( !this.filters[i].fn.call(this, file) ){
        return this.filters[i].name
      }
    }
    return undefined
  }

  isFileValid(file:File):boolean{
    const noFilters = !this.accept && (!this.filters || !this.filters.length)
    if( noFilters ){
      return true//we have no filters so all files are valid
    }

    return this.getFileFilterFailName(file) ? false : true
  }

  isFilesValid(files:File[]){
    for(let x=files.length-1; x >= 0; --x){
      if( !this.isFileValid(files[x]) ){
        return false
      }
    }
    return true
  }

  protected _acceptFilter(item:File):boolean {
    return acceptType(this.accept, item.type, item.name)
  }

  protected _fileSizeFilter(item:File):boolean {
    return !(this.maxSize && item.size > this.maxSize);
  }
}


/** browsers try hard to conceal data about file drags, this tends to undo that */
export function filesToWriteableObject( files:File[] ):dragMeta[]{
  const jsonFiles:dragMeta[] = []
  for(let x=0; x < files.length; ++x){
    jsonFiles.push({
      type:files[x].type,
      kind:files[x]["kind"]
    })
  }
  return jsonFiles
}

export function eventToTransfer(event: any): TransferObject {
  if(event.dataTransfer)return event.dataTransfer
  return  event.originalEvent ? event.originalEvent.dataTransfer : null
}


interface TransferObject {
  items?: any[]
  files?: any[]
  dropEffect?: 'copy' // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/dropEffect
}
