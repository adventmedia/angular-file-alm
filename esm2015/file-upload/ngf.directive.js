import { Directive, EventEmitter, ElementRef, Input, Output, HostListener } from '@angular/core';
import { createInvisibleFileInputWrap, isFileInput, detectSwipe } from "./doc-event-help.functions";
import { acceptType, applyExifRotation, dataUrl } from "./fileTools";
/** A master base set of logic intended to support file select/drag/drop operations
 NOTE: Use ngfDrop for full drag/drop. Use ngfSelect for selecting
*/
export class ngf {
    constructor(element) {
        this.element = element;
        this.filters = [];
        this.lastFileCount = 0;
        //@Input() forceFilename:string
        //@Input() forcePostname:string
        this.ngfFixOrientation = true;
        this.fileDropDisabled = false;
        this.selectable = false;
        this.directiveInit = new EventEmitter();
        this.lastInvalids = [];
        this.lastInvalidsChange = new EventEmitter();
        this.lastBaseUrlChange = new EventEmitter();
        this.fileChange = new EventEmitter();
        this.files = [];
        this.filesChange = new EventEmitter();
        this.initFilters();
    }
    initFilters() {
        // the order is important
        this.filters.push({ name: 'accept', fn: this._acceptFilter });
        this.filters.push({ name: 'fileSize', fn: this._fileSizeFilter });
        //this.filters.push({name: 'fileType', fn: this._fileTypeFilter})
        //this.filters.push({name: 'queueLimit', fn: this._queueLimitFilter})
        //this.filters.push({name: 'mimeType', fn: this._mimeTypeFilter})
    }
    ngOnDestroy() {
        delete this.fileElm; //faster memory release of dom element
        this.destroyPasteListener();
    }
    ngOnInit() {
        if (this.selectable) {
            this.enableSelecting();
        }
        if (this.multiple) {
            this.paramFileElm().setAttribute('multiple', this.multiple);
        }
        this.evalCapturePaste();
        //create reference to this class with one cycle delay to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
            this.directiveInit.emit(this);
        }, 0);
    }
    ngOnChanges(changes) {
        if (changes.accept) {
            this.paramFileElm().setAttribute('accept', changes.accept.currentValue || '*');
        }
        if (changes.capturePaste) {
            this.evalCapturePaste();
        }
    }
    evalCapturePaste() {
        const isActive = this.capturePaste || this.capturePaste === '' || ['false', '0', 'null'].includes(this.capturePaste);
        if (isActive) {
            if (this.pasteCapturer) {
                return; // already listening
            }
            this.pasteCapturer = (e) => {
                const clip = e.clipboardData;
                if (clip && clip.files) {
                    this.handleFiles(clip.files);
                    e.preventDefault();
                }
            };
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
    paramFileElm() {
        if (this.fileElm)
            return this.fileElm; //already defined
        //elm is a file input
        const isFile = isFileInput(this.element.nativeElement);
        if (isFile)
            return this.fileElm = this.element.nativeElement;
        //create foo file input
        const label = createInvisibleFileInputWrap();
        this.fileElm = label.getElementsByTagName('input')[0];
        this.fileElm.addEventListener('change', this.changeFn.bind(this));
        this.element.nativeElement.appendChild(label);
        return this.fileElm;
    }
    enableSelecting() {
        let elm = this.element.nativeElement;
        if (isFileInput(elm)) {
            const bindedHandler = _ev => this.beforeSelect();
            elm.addEventListener('click', bindedHandler);
            elm.addEventListener('touchstart', bindedHandler);
            return;
        }
        const bindedHandler = ev => this.clickHandler(ev);
        elm.addEventListener('click', bindedHandler);
        elm.addEventListener('touchstart', bindedHandler);
        elm.addEventListener('touchend', bindedHandler);
    }
    getValidFiles(files) {
        const rtn = [];
        for (let x = files.length - 1; x >= 0; --x) {
            if (this.isFileValid(files[x])) {
                rtn.push(files[x]);
            }
        }
        return rtn;
    }
    getInvalidFiles(files) {
        const rtn = [];
        for (let x = files.length - 1; x >= 0; --x) {
            let failReason = this.getFileFilterFailName(files[x]);
            if (failReason) {
                rtn.push({
                    file: files[x],
                    type: failReason
                });
            }
        }
        return rtn;
    }
    // Primary handler of files coming in
    handleFiles(files) {
        const valids = this.getValidFiles(files);
        if (files.length != valids.length) {
            this.lastInvalids = this.getInvalidFiles(files);
        }
        else {
            delete this.lastInvalids;
        }
        this.lastInvalidsChange.emit(this.lastInvalids);
        if (valids.length) {
            if (this.ngfFixOrientation) {
                this.applyExifRotations(valids)
                    .then(fixedFiles => this.que(fixedFiles));
            }
            else {
                this.que(valids);
            }
        }
        if (this.isEmptyAfterSelection()) {
            this.element.nativeElement.value = '';
        }
    }
    que(files) {
        this.files = this.files || [];
        Array.prototype.push.apply(this.files, files);
        //below break memory ref and doesnt act like a que
        //this.files = files//causes memory change which triggers bindings like <ngfFormData [files]="files"></ngfFormData>
        this.filesChange.emit(this.files);
        if (files.length) {
            this.fileChange.emit(this.file = files[0]);
            if (this.lastBaseUrlChange.observers.length) {
                dataUrl(files[0])
                    .then(url => this.lastBaseUrlChange.emit(url));
            }
        }
        //will be checked for input value clearing
        this.lastFileCount = this.files.length;
    }
    /** called when input has files */
    changeFn(event) {
        var fileList = event.__files_ || (event.target && event.target.files);
        if (!fileList)
            return;
        this.stopEvent(event);
        this.handleFiles(fileList);
    }
    clickHandler(evt) {
        const elm = this.element.nativeElement;
        if (elm.getAttribute('disabled') || this.fileDropDisabled) {
            return false;
        }
        var r = detectSwipe(evt);
        // prevent the click if it is a swipe
        if (r !== false)
            return r;
        const fileElm = this.paramFileElm();
        fileElm.click();
        //fileElm.dispatchEvent( new Event('click') );
        this.beforeSelect();
        return false;
    }
    beforeSelect() {
        if (this.files && this.lastFileCount === this.files.length)
            return;
        //if no files in array, be sure browser doesnt prevent reselect of same file (see github issue 27)
        this.fileElm.value = null;
    }
    isEmptyAfterSelection() {
        return !!this.element.nativeElement.attributes.multiple;
    }
    eventToTransfer(event) {
        if (event.dataTransfer)
            return event.dataTransfer;
        return event.originalEvent ? event.originalEvent.dataTransfer : null;
    }
    stopEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    transferHasFiles(transfer) {
        if (!transfer.types) {
            return false;
        }
        if (transfer.types.indexOf) {
            return transfer.types.indexOf('Files') !== -1;
        }
        else if (transfer.types.contains) {
            return transfer.types.contains('Files');
        }
        else {
            return false;
        }
    }
    eventToFiles(event) {
        const transfer = this.eventToTransfer(event);
        if (transfer) {
            if (transfer.files && transfer.files.length) {
                return transfer.files;
            }
            if (transfer.items && transfer.items.length) {
                return transfer.items;
            }
        }
        return [];
    }
    applyExifRotations(files) {
        const mapper = (file, index) => {
            return applyExifRotation(file)
                .then(fixedFile => files.splice(index, 1, fixedFile));
        };
        const proms = [];
        for (let x = files.length - 1; x >= 0; --x) {
            proms[x] = mapper(files[x], x);
        }
        return Promise.all(proms).then(() => files);
    }
    onChange(event) {
        let files = this.element.nativeElement.files || this.eventToFiles(event);
        if (!files.length)
            return;
        this.stopEvent(event);
        this.handleFiles(files);
    }
    getFileFilterFailName(file) {
        for (let i = 0; i < this.filters.length; i++) {
            if (!this.filters[i].fn.call(this, file)) {
                return this.filters[i].name;
            }
        }
        return undefined;
    }
    isFileValid(file) {
        const noFilters = !this.accept && (!this.filters || !this.filters.length);
        if (noFilters) {
            return true; //we have no filters so all files are valid
        }
        return this.getFileFilterFailName(file) ? false : true;
    }
    isFilesValid(files) {
        for (let x = files.length - 1; x >= 0; --x) {
            if (!this.isFileValid(files[x])) {
                return false;
            }
        }
        return true;
    }
    _acceptFilter(item) {
        return acceptType(this.accept, item.type, item.name);
    }
    _fileSizeFilter(item) {
        return !(this.maxSize && item.size > this.maxSize);
    }
    /** browsers try hard to conceal data about file drags, this tends to undo that */
    filesToWriteableObject(files) {
        const jsonFiles = [];
        for (let x = 0; x < files.length; ++x) {
            jsonFiles.push({
                type: files[x].type,
                kind: files[x]["kind"]
            });
        }
        return jsonFiles;
    }
}
ngf.decorators = [
    { type: Directive, args: [{
                selector: "[ngf]",
                exportAs: "ngf"
            },] }
];
ngf.ctorParameters = () => [
    { type: ElementRef }
];
ngf.propDecorators = {
    multiple: [{ type: Input }],
    accept: [{ type: Input }],
    maxSize: [{ type: Input }],
    ngfFixOrientation: [{ type: Input }],
    fileDropDisabled: [{ type: Input }],
    selectable: [{ type: Input }],
    directiveInit: [{ type: Output, args: ['init',] }],
    lastInvalids: [{ type: Input }],
    lastInvalidsChange: [{ type: Output }],
    lastBaseUrl: [{ type: Input }],
    lastBaseUrlChange: [{ type: Output }],
    file: [{ type: Input }],
    fileChange: [{ type: Output }],
    files: [{ type: Input }],
    filesChange: [{ type: Output }],
    capturePaste: [{ type: Input }],
    onChange: [{ type: HostListener, args: ['change', ['$event'],] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNrZXJhcHBsZS9Qcm9qZWN0cy93ZWIvYW5ndWxhci9hbmd1bGFyLWZpbGUvZGV2ZWxvcG1lbnQvcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUEyQixNQUFNLGVBQWUsQ0FBQztBQUMxSCxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ25HLE9BQU8sRUFDTCxVQUFVLEVBQ1YsaUJBQWlCLEVBQUUsT0FBTyxFQUMzQixNQUFNLGFBQWEsQ0FBQTtBQU9wQjs7RUFFRTtBQUtGLE1BQU0sT0FBTyxHQUFHO0lBK0JkLFlBQW1CLE9BQWtCO1FBQWxCLFlBQU8sR0FBUCxPQUFPLENBQVc7UUE3QnJDLFlBQU8sR0FBNEMsRUFBRSxDQUFBO1FBQ3JELGtCQUFhLEdBQVEsQ0FBQyxDQUFBO1FBS3RCLCtCQUErQjtRQUMvQiwrQkFBK0I7UUFDdEIsc0JBQWlCLEdBQVcsSUFBSSxDQUFBO1FBRWhDLHFCQUFnQixHQUFXLEtBQUssQ0FBQTtRQUNoQyxlQUFVLEdBQVcsS0FBSyxDQUFBO1FBQ25CLGtCQUFhLEdBQXFCLElBQUksWUFBWSxFQUFFLENBQUE7UUFFM0QsaUJBQVksR0FBcUIsRUFBRSxDQUFBO1FBQ2xDLHVCQUFrQixHQUEyQyxJQUFJLFlBQVksRUFBRSxDQUFBO1FBRy9FLHNCQUFpQixHQUF3QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRzNELGVBQVUsR0FBc0IsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUVuRCxVQUFLLEdBQVUsRUFBRSxDQUFBO1FBQ2hCLGdCQUFXLEdBQXdCLElBQUks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OytCQUVMLEtBQUs7eUJBQ0wsS0FBSzs0QkFDTCxNQUFNLFNBQUMsTUFBTTsyQkFFYixLQUFLO2lDQUNMLE1BQU07MEJBRU4sS0FBSztnQ0FDTCxNQUFNO21CQUVOLEtBQUs7eUJBQ0wsTUFBTTtvQkFFTixLQUFLOzBCQUNMLE1BQU07MkJBRU4sS0FBSzt1QkFvUkwsWUFBWSxTQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRXZlbnRFbWl0dGVyLCBFbGVtZW50UmVmLCBJbnB1dCwgT3V0cHV0LCBIb3N0TGlzdGVuZXIsIENoYW5nZURldGVjdGlvblN0cmF0ZWd5IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBjcmVhdGVJbnZpc2libGVGaWxlSW5wdXRXcmFwLCBpc0ZpbGVJbnB1dCwgZGV0ZWN0U3dpcGUgfSBmcm9tIFwiLi9kb2MtZXZlbnQtaGVscC5mdW5jdGlvbnNcIlxuaW1wb3J0IHtcbiAgYWNjZXB0VHlwZSwgSW52YWxpZEZpbGVJdGVtLFxuICBhcHBseUV4aWZSb3RhdGlvbiwgZGF0YVVybFxufSBmcm9tIFwiLi9maWxlVG9vbHNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIGRyYWdNZXRhe1xuICB0eXBlOnN0cmluZ1xuICBraW5kOnN0cmluZ1xufVxuXG4vKiogQSBtYXN0ZXIgYmFzZSBzZXQgb2YgbG9naWMgaW50ZW5kZWQgdG8gc3VwcG9ydCBmaWxlIHNlbGVjdC9kcmFnL2Ryb3Agb3BlcmF0aW9uc1xuIE5PVEU6IFVzZSBuZ2ZEcm9wIGZvciBmdWxsIGRyYWcvZHJvcC4gVXNlIG5nZlNlbGVjdCBmb3Igc2VsZWN0aW5nXG4qL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiBcIltuZ2ZdXCIsXG4gIGV4cG9ydEFzOlwibmdmXCJcbn0pXG5leHBvcnQgY2xhc3MgbmdmIHtcbiAgZmlsZUVsbTphbnlcbiAgZmlsdGVyczp7bmFtZTpzdHJpbmcsIGZuOihmaWxlOkZpbGUpPT5ib29sZWFufVtdID0gW11cbiAgbGFzdEZpbGVDb3VudDpudW1iZXI9MFxuXG4gIEBJbnB1dCgpIG11bHRpcGxlICE6c3RyaW5nXG4gIEBJbnB1dCgpIGFjY2VwdCAgICE6c3RyaW5nXG4gIEBJbnB1dCgpIG1heFNpemUgICE6bnVtYmVyXG4gIC8vQElucHV0KCkgZm9yY2VGaWxlbmFtZTpzdHJpbmdcbiAgLy9ASW5wdXQoKSBmb3JjZVBvc3RuYW1lOnN0cmluZ1xuICBASW5wdXQoKSBuZ2ZGaXhPcmllbnRhdGlvbjpib29sZWFuID0gdHJ1ZVxuXG4gIEBJbnB1dCgpIGZpbGVEcm9wRGlzYWJsZWQ6Ym9vbGVhbiA9IGZhbHNlXG4gIEBJbnB1dCgpIHNlbGVjdGFibGU6Ym9vbGVhbiA9IGZhbHNlXG4gIEBPdXRwdXQoJ2luaXQnKSBkaXJlY3RpdmVJbml0OkV2ZW50RW1pdHRlcjxuZ2Y+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgbGFzdEludmFsaWRzOkludmFsaWRGaWxlSXRlbVtdID0gW11cbiAgQE91dHB1dCgpIGxhc3RJbnZhbGlkc0NoYW5nZTpFdmVudEVtaXR0ZXI8e2ZpbGU6RmlsZSx0eXBlOnN0cmluZ31bXT4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBsYXN0QmFzZVVybCAhOiBzdHJpbmcvL2Jhc2U2NCBsYXN0IGZpbGUgdXBsb2FkZWQgdXJsXG4gIEBPdXRwdXQoKSBsYXN0QmFzZVVybENoYW5nZTpFdmVudEVtaXR0ZXI8c3RyaW5nPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGZpbGUgITogRmlsZS8vbGFzdCBmaWxlIHVwbG9hZGVkXG4gIEBPdXRwdXQoKSBmaWxlQ2hhbmdlOkV2ZW50RW1pdHRlcjxGaWxlPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGZpbGVzOkZpbGVbXSA9IFtdXG4gIEBPdXRwdXQoKSBmaWxlc0NoYW5nZTpFdmVudEVtaXR0ZXI8RmlsZVtdPiA9IG5ldyBFdmVudEVtaXR0ZXI8RmlsZVtdPigpO1xuXG4gIEBJbnB1dCgpIGNhcHR1cmVQYXN0ZTogYm9vbGVhbjsgLy8gd2luZG93IHBhc3RlIGZpbGUgd2F0Y2hpbmcgKGVtcHR5IHN0cmluZyB0dXJucyBvbilcbiAgcGFzdGVDYXB0dXJlciAhOiAoZTogRXZlbnQpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnQ6RWxlbWVudFJlZil7XG4gICAgdGhpcy5pbml0RmlsdGVycygpXG4gIH1cblxuICBpbml0RmlsdGVycygpe1xuICAgIC8vIHRoZSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICB0aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2FjY2VwdCcsIGZuOiB0aGlzLl9hY2NlcHRGaWx0ZXJ9KVxuICAgIHRoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnZmlsZVNpemUnLCBmbjogdGhpcy5fZmlsZVNpemVGaWx0ZXJ9KVxuXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2ZpbGVUeXBlJywgZm46IHRoaXMuX2ZpbGVUeXBlRmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAncXVldWVMaW1pdCcsIGZuOiB0aGlzLl9xdWV1ZUxpbWl0RmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnbWltZVR5cGUnLCBmbjogdGhpcy5fbWltZVR5cGVGaWx0ZXJ9KVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKXtcbiAgICBkZWxldGUgdGhpcy5maWxlRWxtLy9mYXN0ZXIgbWVtb3J5IHJlbGVhc2Ugb2YgZG9tIGVsZW1lbnRcbiAgICB0aGlzLmRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCk7XG4gIH1cblxuICBuZ09uSW5pdCgpe1xuICAgIGlmKCB0aGlzLnNlbGVjdGFibGUgKXtcbiAgICAgIHRoaXMuZW5hYmxlU2VsZWN0aW5nKClcbiAgICB9XG5cbiAgICBpZiggdGhpcy5tdWx0aXBsZSApe1xuICAgICAgdGhpcy5wYXJhbUZpbGVFbG0oKS5zZXRBdHRyaWJ1dGUoJ211bHRpcGxlJywgdGhpcy5tdWx0aXBsZSlcbiAgICB9XG5cbiAgICB0aGlzLmV2YWxDYXB0dXJlUGFzdGUoKTtcblxuICAgIC8vY3JlYXRlIHJlZmVyZW5jZSB0byB0aGlzIGNsYXNzIHdpdGggb25lIGN5Y2xlIGRlbGF5IHRvIGF2b2lkIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3JcbiAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICB0aGlzLmRpcmVjdGl2ZUluaXQuZW1pdCh0aGlzKVxuICAgIH0sIDApXG4gIH1cblxuICBuZ09uQ2hhbmdlcyggY2hhbmdlcyApe1xuICAgIGlmKCBjaGFuZ2VzLmFjY2VwdCApe1xuICAgICAgdGhpcy5wYXJhbUZpbGVFbG0oKS5zZXRBdHRyaWJ1dGUoJ2FjY2VwdCcsIGNoYW5nZXMuYWNjZXB0LmN1cnJlbnRWYWx1ZSB8fCAnKicpXG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXMuY2FwdHVyZVBhc3RlKSB7XG4gICAgICB0aGlzLmV2YWxDYXB0dXJlUGFzdGUoKTtcbiAgICB9XG4gIH1cblxuICBldmFsQ2FwdHVyZVBhc3RlKCkge1xuICAgIGNvbnN0IGlzQWN0aXZlID0gdGhpcy5jYXB0dXJlUGFzdGUgfHwgKHRoaXMuY2FwdHVyZVBhc3RlIGFzIGFueSk9PT0nJyB8fCBbJ2ZhbHNlJywgJzAnLCAnbnVsbCddLmluY2x1ZGVzKHRoaXMuY2FwdHVyZVBhc3RlIGFzIGFueSk7XG5cbiAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgIGlmICh0aGlzLnBhc3RlQ2FwdHVyZXIpIHtcbiAgICAgICAgcmV0dXJuOyAvLyBhbHJlYWR5IGxpc3RlbmluZ1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBhc3RlQ2FwdHVyZXIgPSAoZTogRXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgY2xpcCA9IChlIGFzIGFueSkuY2xpcGJvYXJkRGF0YTtcbiAgICAgICAgaWYgKGNsaXAgJiYgY2xpcC5maWxlcykge1xuICAgICAgICAgIHRoaXMuaGFuZGxlRmlsZXMoY2xpcC5maWxlcyk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMucGFzdGVDYXB0dXJlcik7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCk7XG4gIH1cblxuICBkZXN0cm95UGFzdGVMaXN0ZW5lcigpIHtcbiAgICBpZiAodGhpcy5wYXN0ZUNhcHR1cmVyKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncGFzdGUnLCB0aGlzLnBhc3RlQ2FwdHVyZXIpO1xuICAgICAgZGVsZXRlIHRoaXMucGFzdGVDYXB0dXJlcjtcbiAgICB9XG4gIH1cblxuICBwYXJhbUZpbGVFbG0oKXtcbiAgICBpZiggdGhpcy5maWxlRWxtIClyZXR1cm4gdGhpcy5maWxlRWxtLy9hbHJlYWR5IGRlZmluZWRcblxuICAgIC8vZWxtIGlzIGEgZmlsZSBpbnB1dFxuICAgIGNvbnN0IGlzRmlsZSA9IGlzRmlsZUlucHV0KCB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCApXG4gICAgaWYoaXNGaWxlKXJldHVybiB0aGlzLmZpbGVFbG0gPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudFxuXG4gICAgLy9jcmVhdGUgZm9vIGZpbGUgaW5wdXRcbiAgICBjb25zdCBsYWJlbCA9IGNyZWF0ZUludmlzaWJsZUZpbGVJbnB1dFdyYXAoKVxuICAgIHRoaXMuZmlsZUVsbSA9IGxhYmVsLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpWzBdXG4gICAgdGhpcy5maWxlRWxtLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuY2hhbmdlRm4uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuYXBwZW5kQ2hpbGQoIGxhYmVsIClcbiAgICByZXR1cm4gdGhpcy5maWxlRWxtXG4gIH1cblxuICBlbmFibGVTZWxlY3RpbmcoKXtcbiAgICBsZXQgZWxtID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnRcblxuICAgIGlmKCBpc0ZpbGVJbnB1dChlbG0pICl7XG4gICAgICBjb25zdCBiaW5kZWRIYW5kbGVyID0gX2V2PT50aGlzLmJlZm9yZVNlbGVjdCgpXG4gICAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBiaW5kZWRIYW5kbGVyKVxuICAgICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBiaW5kZWRIYW5kbGVyKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgYmluZGVkSGFuZGxlciA9IGV2PT50aGlzLmNsaWNrSGFuZGxlcihldilcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBiaW5kZWRIYW5kbGVyKVxuICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgYmluZGVkSGFuZGxlcilcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBiaW5kZWRIYW5kbGVyKVxuICB9XG5cbiAgZ2V0VmFsaWRGaWxlcyggZmlsZXM6RmlsZVtdICk6RmlsZVtde1xuICAgIGNvbnN0IHJ0bjpGaWxlW10gPSBbXVxuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgaWYoIHRoaXMuaXNGaWxlVmFsaWQoZmlsZXNbeF0pICl7XG4gICAgICAgIHJ0bi5wdXNoKCBmaWxlc1t4XSApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydG5cbiAgfVxuXG4gIGdldEludmFsaWRGaWxlcyhmaWxlczpGaWxlW10pOkludmFsaWRGaWxlSXRlbVtde1xuICAgIGNvbnN0IHJ0bjpJbnZhbGlkRmlsZUl0ZW1bXSA9IFtdXG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBsZXQgZmFpbFJlYXNvbiA9IHRoaXMuZ2V0RmlsZUZpbHRlckZhaWxOYW1lKGZpbGVzW3hdKVxuICAgICAgaWYoIGZhaWxSZWFzb24gKXtcbiAgICAgICAgcnRuLnB1c2goe1xuICAgICAgICAgIGZpbGUgOiBmaWxlc1t4XSxcbiAgICAgICAgICB0eXBlIDogZmFpbFJlYXNvblxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnRuXG4gIH1cblxuICAvLyBQcmltYXJ5IGhhbmRsZXIgb2YgZmlsZXMgY29taW5nIGluXG4gIGhhbmRsZUZpbGVzKGZpbGVzOkZpbGVbXSl7XG4gICAgY29uc3QgdmFsaWRzID0gdGhpcy5nZXRWYWxpZEZpbGVzKGZpbGVzKVxuXG4gICAgaWYoZmlsZXMubGVuZ3RoIT12YWxpZHMubGVuZ3RoKXtcbiAgICAgIHRoaXMubGFzdEludmFsaWRzID0gdGhpcy5nZXRJbnZhbGlkRmlsZXMoZmlsZXMpXG4gICAgfWVsc2V7XG4gICAgICBkZWxldGUgdGhpcy5sYXN0SW52YWxpZHNcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RJbnZhbGlkc0NoYW5nZS5lbWl0KHRoaXMubGFzdEludmFsaWRzKVxuXG4gICAgaWYoIHZhbGlkcy5sZW5ndGggKXtcbiAgICAgIGlmKCB0aGlzLm5nZkZpeE9yaWVudGF0aW9uICl7XG4gICAgICAgIHRoaXMuYXBwbHlFeGlmUm90YXRpb25zKHZhbGlkcylcbiAgICAgICAgLnRoZW4oIGZpeGVkRmlsZXM9PnRoaXMucXVlKGZpeGVkRmlsZXMpIClcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLnF1ZSh2YWxpZHMpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNFbXB0eUFmdGVyU2VsZWN0aW9uKCkpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LnZhbHVlID0gJydcbiAgICB9XG4gIH1cblxuICBxdWUoIGZpbGVzOkZpbGVbXSApe1xuICAgIHRoaXMuZmlsZXMgPSB0aGlzLmZpbGVzIHx8IFtdXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcy5maWxlcywgZmlsZXMpXG5cbiAgICAvL2JlbG93IGJyZWFrIG1lbW9yeSByZWYgYW5kIGRvZXNudCBhY3QgbGlrZSBhIHF1ZVxuICAgIC8vdGhpcy5maWxlcyA9IGZpbGVzLy9jYXVzZXMgbWVtb3J5IGNoYW5nZSB3aGljaCB0cmlnZ2VycyBiaW5kaW5ncyBsaWtlIDxuZ2ZGb3JtRGF0YSBbZmlsZXNdPVwiZmlsZXNcIj48L25nZkZvcm1EYXRhPlxuXG4gICAgdGhpcy5maWxlc0NoYW5nZS5lbWl0KCB0aGlzLmZpbGVzIClcblxuICAgIGlmKGZpbGVzLmxlbmd0aCl7XG4gICAgICB0aGlzLmZpbGVDaGFuZ2UuZW1pdCggdGhpcy5maWxlPWZpbGVzWzBdIClcblxuICAgICAgaWYodGhpcy5sYXN0QmFzZVVybENoYW5nZS5vYnNlcnZlcnMubGVuZ3RoKXtcbiAgICAgICAgZGF0YVVybCggZmlsZXNbMF0gKVxuICAgICAgICAudGhlbiggdXJsPT50aGlzLmxhc3RCYXNlVXJsQ2hhbmdlLmVtaXQodXJsKSApXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy93aWxsIGJlIGNoZWNrZWQgZm9yIGlucHV0IHZhbHVlIGNsZWFyaW5nXG4gICAgdGhpcy5sYXN0RmlsZUNvdW50ID0gdGhpcy5maWxlcy5sZW5ndGhcbiAgfVxuXG4gIC8qKiBjYWxsZWQgd2hlbiBpbnB1dCBoYXMgZmlsZXMgKi9cbiAgY2hhbmdlRm4oZXZlbnQ6YW55KSB7XG4gICAgdmFyIGZpbGVMaXN0ID0gZXZlbnQuX19maWxlc18gfHwgKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQuZmlsZXMpXG5cbiAgICBpZiAoIWZpbGVMaXN0KSByZXR1cm47XG5cbiAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgdGhpcy5oYW5kbGVGaWxlcyhmaWxlTGlzdClcbiAgfVxuXG4gIGNsaWNrSGFuZGxlcihldnQ6YW55KXtcbiAgICBjb25zdCBlbG0gPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudFxuICAgIGlmIChlbG0uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpIHx8IHRoaXMuZmlsZURyb3BEaXNhYmxlZCl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHIgPSBkZXRlY3RTd2lwZShldnQpO1xuICAgIC8vIHByZXZlbnQgdGhlIGNsaWNrIGlmIGl0IGlzIGEgc3dpcGVcbiAgICBpZiAoIHIhPT1mYWxzZSApIHJldHVybiByO1xuXG4gICAgY29uc3QgZmlsZUVsbSA9IHRoaXMucGFyYW1GaWxlRWxtKClcbiAgICBmaWxlRWxtLmNsaWNrKClcbiAgICAvL2ZpbGVFbG0uZGlzcGF0Y2hFdmVudCggbmV3IEV2ZW50KCdjbGljaycpICk7XG4gICAgdGhpcy5iZWZvcmVTZWxlY3QoKVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgYmVmb3JlU2VsZWN0KCl7XG4gICAgaWYoIHRoaXMuZmlsZXMgJiYgdGhpcy5sYXN0RmlsZUNvdW50PT09dGhpcy5maWxlcy5sZW5ndGggKXJldHVyblxuXG4gICAgLy9pZiBubyBmaWxlcyBpbiBhcnJheSwgYmUgc3VyZSBicm93c2VyIGRvZXNudCBwcmV2ZW50IHJlc2VsZWN0IG9mIHNhbWUgZmlsZSAoc2VlIGdpdGh1YiBpc3N1ZSAyNylcbiAgICB0aGlzLmZpbGVFbG0udmFsdWUgPSBudWxsXG4gIH1cblxuICBpc0VtcHR5QWZ0ZXJTZWxlY3Rpb24oKTpib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5hdHRyaWJ1dGVzLm11bHRpcGxlO1xuICB9XG5cbiAgZXZlbnRUb1RyYW5zZmVyKGV2ZW50OmFueSk6YW55IHtcbiAgICBpZihldmVudC5kYXRhVHJhbnNmZXIpcmV0dXJuIGV2ZW50LmRhdGFUcmFuc2ZlclxuICAgIHJldHVybiAgZXZlbnQub3JpZ2luYWxFdmVudCA/IGV2ZW50Lm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyIDogbnVsbFxuICB9XG5cbiAgc3RvcEV2ZW50KGV2ZW50OmFueSk6YW55IHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgdHJhbnNmZXJIYXNGaWxlcyh0cmFuc2ZlcjphbnkpOmFueSB7XG4gICAgaWYgKCF0cmFuc2Zlci50eXBlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0cmFuc2Zlci50eXBlcy5pbmRleE9mKSB7XG4gICAgICByZXR1cm4gdHJhbnNmZXIudHlwZXMuaW5kZXhPZignRmlsZXMnKSAhPT0gLTE7XG4gICAgfSBlbHNlIGlmICh0cmFuc2Zlci50eXBlcy5jb250YWlucykge1xuICAgICAgcmV0dXJuIHRyYW5zZmVyLnR5cGVzLmNvbnRhaW5zKCdGaWxlcycpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgZXZlbnRUb0ZpbGVzKGV2ZW50OkV2ZW50KXtcbiAgICBjb25zdCB0cmFuc2ZlciA9IHRoaXMuZXZlbnRUb1RyYW5zZmVyKGV2ZW50KTtcbiAgICBpZiggdHJhbnNmZXIgKXtcbiAgICAgIGlmKHRyYW5zZmVyLmZpbGVzICYmIHRyYW5zZmVyLmZpbGVzLmxlbmd0aCl7XG4gICAgICAgIHJldHVybiB0cmFuc2Zlci5maWxlc1xuICAgICAgfVxuICAgICAgaWYodHJhbnNmZXIuaXRlbXMgJiYgdHJhbnNmZXIuaXRlbXMubGVuZ3RoKXtcbiAgICAgICAgcmV0dXJuIHRyYW5zZmVyLml0ZW1zXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbXVxuICB9XG5cbiAgYXBwbHlFeGlmUm90YXRpb25zKFxuICAgIGZpbGVzOkZpbGVbXVxuICApOlByb21pc2U8RmlsZVtdPntcbiAgICBjb25zdCBtYXBwZXIgPSAoXG4gICAgICBmaWxlOkZpbGUsaW5kZXg6bnVtYmVyXG4gICAgKTpQcm9taXNlPGFueT49PntcbiAgICAgIHJldHVybiBhcHBseUV4aWZSb3RhdGlvbihmaWxlKVxuICAgICAgLnRoZW4oIGZpeGVkRmlsZT0+ZmlsZXMuc3BsaWNlKGluZGV4LCAxLCBmaXhlZEZpbGUpIClcbiAgICB9XG5cbiAgICBjb25zdCBwcm9tczpQcm9taXNlPGFueT5bXSA9IFtdXG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBwcm9tc1t4XSA9IG1hcHBlciggZmlsZXNbeF0sIHggKVxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoIHByb21zICkudGhlbiggKCk9PmZpbGVzIClcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2NoYW5nZScsIFsnJGV2ZW50J10pXG4gIG9uQ2hhbmdlKGV2ZW50OkV2ZW50KTp2b2lkIHtcbiAgICBsZXQgZmlsZXMgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5maWxlcyB8fCB0aGlzLmV2ZW50VG9GaWxlcyhldmVudClcblxuICAgIGlmKCFmaWxlcy5sZW5ndGgpcmV0dXJuXG5cbiAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgdGhpcy5oYW5kbGVGaWxlcyhmaWxlcylcbiAgfVxuXG4gIGdldEZpbGVGaWx0ZXJGYWlsTmFtZShcbiAgICBmaWxlOkZpbGVcbiAgKTpzdHJpbmcgfCB1bmRlZmluZWR7XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMuZmlsdGVycy5sZW5ndGg7IGkrKyl7XG4gICAgICBpZiggIXRoaXMuZmlsdGVyc1tpXS5mbi5jYWxsKHRoaXMsIGZpbGUpICl7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbaV0ubmFtZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cblxuICBpc0ZpbGVWYWxpZChmaWxlOkZpbGUpOmJvb2xlYW57XG4gICAgY29uc3Qgbm9GaWx0ZXJzID0gIXRoaXMuYWNjZXB0ICYmICghdGhpcy5maWx0ZXJzIHx8ICF0aGlzLmZpbHRlcnMubGVuZ3RoKVxuICAgIGlmKCBub0ZpbHRlcnMgKXtcbiAgICAgIHJldHVybiB0cnVlLy93ZSBoYXZlIG5vIGZpbHRlcnMgc28gYWxsIGZpbGVzIGFyZSB2YWxpZFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldEZpbGVGaWx0ZXJGYWlsTmFtZShmaWxlKSA/IGZhbHNlIDogdHJ1ZVxuICB9XG5cbiAgaXNGaWxlc1ZhbGlkKGZpbGVzOkZpbGVbXSl7XG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBpZiggIXRoaXMuaXNGaWxlVmFsaWQoZmlsZXNbeF0pICl7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgcHJvdGVjdGVkIF9hY2NlcHRGaWx0ZXIoaXRlbTpGaWxlKTpib29sZWFuIHtcbiAgICByZXR1cm4gYWNjZXB0VHlwZSh0aGlzLmFjY2VwdCwgaXRlbS50eXBlLCBpdGVtLm5hbWUpXG4gIH1cblxuICBwcm90ZWN0ZWQgX2ZpbGVTaXplRmlsdGVyKGl0ZW06RmlsZSk6Ym9vbGVhbiB7XG4gICAgcmV0dXJuICEodGhpcy5tYXhTaXplICYmIGl0ZW0uc2l6ZSA+IHRoaXMubWF4U2l6ZSk7XG4gIH1cblxuICAvKiogYnJvd3NlcnMgdHJ5IGhhcmQgdG8gY29uY2VhbCBkYXRhIGFib3V0IGZpbGUgZHJhZ3MsIHRoaXMgdGVuZHMgdG8gdW5kbyB0aGF0ICovXG4gIGZpbGVzVG9Xcml0ZWFibGVPYmplY3QoIGZpbGVzOkZpbGVbXSApOmRyYWdNZXRhW117XG4gICAgY29uc3QganNvbkZpbGVzOmRyYWdNZXRhW10gPSBbXVxuICAgIGZvcihsZXQgeD0wOyB4IDwgZmlsZXMubGVuZ3RoOyArK3gpe1xuICAgICAganNvbkZpbGVzLnB1c2goe1xuICAgICAgICB0eXBlOmZpbGVzW3hdLnR5cGUsXG4gICAgICAgIGtpbmQ6ZmlsZXNbeF1bXCJraW5kXCJdXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4ganNvbkZpbGVzXG4gIH1cbn1cbiJdfQ==