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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNrZXJhcHBsZS9Qcm9qZWN0cy93ZWIvYW5ndWxhci9hbmd1bGFyLWZpbGUvZGV2ZWxvcG1lbnQvcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUEyQixNQUFNLGVBQWUsQ0FBQztBQUMxSCxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ25HLE9BQU8sRUFDTCxVQUFVLEVBQ1YsaUJBQWlCLEVBQUUsT0FBTyxFQUMzQixNQUFNLGFBQWEsQ0FBQTtBQU9wQjs7RUFFRTtBQUtGLE1BQU0sT0FBTyxHQUFHO0lBK0JkLFlBQW1CLE9BQWtCO1FBQWxCLFlBQU8sR0FBUCxPQUFPLENBQVc7UUE3QnJDLFlBQU8sR0FBNEMsRUFBRSxDQUFBO1FBQ3JELGtCQUFhLEdBQVEsQ0FBQyxDQUFBO1FBS3RCLCtCQUErQjtRQUMvQiwrQkFBK0I7UUFDdEIsc0JBQWlCLEdBQVcsSUFBSSxDQUFBO1FBRWhDLHFCQUFnQixHQUFXLEtBQUssQ0FBQTtRQUNoQyxlQUFVLEdBQVcsS0FBSyxDQUFBO1FBQ25CLGtCQUFhLEdBQXFCLElBQUksWUFBWSxFQUFFLENBQUE7UUFFM0QsaUJBQVksR0FBcUIsRUFBRSxDQUFBO1FBQ2xDLHVCQUFrQixHQUEyQyxJQUFJLFlBQVksRUFBRSxDQUFBO1FBRy9FLHNCQUFpQixHQUF3QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRzNELGVBQVUsR0FBc0IsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUVuRCxVQUFLLEdBQVUsRUFBRSxDQUFBO1FBQ2hCLGdCQUFXLEdBQXdCLElBQUks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TSxTQUFDLE1BQU07MkJBRWIsS0FBSztpQ0FDTCxNQUFNOzBCQUVOLEtBQUs7Z0NBQ0wsTUFBTTttQkFFTixLQUFLO3lCQUNMLE1BQU07b0JBRU4sS0FBSzswQkFDTCxNQUFNOzJCQUVOLEtBQUs7dUJBbVJMLFlBQVksU0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgRWxlbWVudFJlZiwgSW5wdXQsIE91dHB1dCwgSG9zdExpc3RlbmVyLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgY3JlYXRlSW52aXNpYmxlRmlsZUlucHV0V3JhcCwgaXNGaWxlSW5wdXQsIGRldGVjdFN3aXBlIH0gZnJvbSBcIi4vZG9jLWV2ZW50LWhlbHAuZnVuY3Rpb25zXCJcbmltcG9ydCB7XG4gIGFjY2VwdFR5cGUsIEludmFsaWRGaWxlSXRlbSxcbiAgYXBwbHlFeGlmUm90YXRpb24sIGRhdGFVcmxcbn0gZnJvbSBcIi4vZmlsZVRvb2xzXCJcblxuZXhwb3J0IGludGVyZmFjZSBkcmFnTWV0YXtcbiAgdHlwZTpzdHJpbmdcbiAga2luZDpzdHJpbmdcbn1cblxuLyoqIEEgbWFzdGVyIGJhc2Ugc2V0IG9mIGxvZ2ljIGludGVuZGVkIHRvIHN1cHBvcnQgZmlsZSBzZWxlY3QvZHJhZy9kcm9wIG9wZXJhdGlvbnNcbiBOT1RFOiBVc2UgbmdmRHJvcCBmb3IgZnVsbCBkcmFnL2Ryb3AuIFVzZSBuZ2ZTZWxlY3QgZm9yIHNlbGVjdGluZ1xuKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogXCJbbmdmXVwiLFxuICBleHBvcnRBczpcIm5nZlwiXG59KVxuZXhwb3J0IGNsYXNzIG5nZiB7XG4gIGZpbGVFbG06YW55XG4gIGZpbHRlcnM6e25hbWU6c3RyaW5nLCBmbjooZmlsZTpGaWxlKT0+Ym9vbGVhbn1bXSA9IFtdXG4gIGxhc3RGaWxlQ291bnQ6bnVtYmVyPTBcblxuICBASW5wdXQoKSBtdWx0aXBsZSAhOnN0cmluZ1xuICBASW5wdXQoKSBhY2NlcHQgICAhOnN0cmluZ1xuICBASW5wdXQoKSBtYXhTaXplICAhOm51bWJlclxuICAvL0BJbnB1dCgpIGZvcmNlRmlsZW5hbWU6c3RyaW5nXG4gIC8vQElucHV0KCkgZm9yY2VQb3N0bmFtZTpzdHJpbmdcbiAgQElucHV0KCkgbmdmRml4T3JpZW50YXRpb246Ym9vbGVhbiA9IHRydWVcblxuICBASW5wdXQoKSBmaWxlRHJvcERpc2FibGVkOmJvb2xlYW4gPSBmYWxzZVxuICBASW5wdXQoKSBzZWxlY3RhYmxlOmJvb2xlYW4gPSBmYWxzZVxuICBAT3V0cHV0KCdpbml0JykgZGlyZWN0aXZlSW5pdDpFdmVudEVtaXR0ZXI8bmdmPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGxhc3RJbnZhbGlkczpJbnZhbGlkRmlsZUl0ZW1bXSA9IFtdXG4gIEBPdXRwdXQoKSBsYXN0SW52YWxpZHNDaGFuZ2U6RXZlbnRFbWl0dGVyPHtmaWxlOkZpbGUsdHlwZTpzdHJpbmd9W10+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgbGFzdEJhc2VVcmwgITogc3RyaW5nLy9iYXNlNjQgbGFzdCBmaWxlIHVwbG9hZGVkIHVybFxuICBAT3V0cHV0KCkgbGFzdEJhc2VVcmxDaGFuZ2U6RXZlbnRFbWl0dGVyPHN0cmluZz4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBmaWxlICE6IEZpbGUvL2xhc3QgZmlsZSB1cGxvYWRlZFxuICBAT3V0cHV0KCkgZmlsZUNoYW5nZTpFdmVudEVtaXR0ZXI8RmlsZT4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBmaWxlczpGaWxlW10gPSBbXVxuICBAT3V0cHV0KCkgZmlsZXNDaGFuZ2U6RXZlbnRFbWl0dGVyPEZpbGVbXT4gPSBuZXcgRXZlbnRFbWl0dGVyPEZpbGVbXT4oKTtcblxuICBASW5wdXQoKSBjYXB0dXJlUGFzdGU6IGJvb2xlYW47IC8vIHdpbmRvdyBwYXN0ZSBmaWxlIHdhdGNoaW5nIChlbXB0eSBzdHJpbmcgdHVybnMgb24pXG4gIHBhc3RlQ2FwdHVyZXIgITogKGU6IEV2ZW50KSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlbGVtZW50OkVsZW1lbnRSZWYpe1xuICAgIHRoaXMuaW5pdEZpbHRlcnMoKVxuICB9XG5cbiAgaW5pdEZpbHRlcnMoKXtcbiAgICAvLyB0aGUgb3JkZXIgaXMgaW1wb3J0YW50XG4gICAgdGhpcy5maWx0ZXJzLnB1c2goe25hbWU6ICdhY2NlcHQnLCBmbjogdGhpcy5fYWNjZXB0RmlsdGVyfSlcbiAgICB0aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2ZpbGVTaXplJywgZm46IHRoaXMuX2ZpbGVTaXplRmlsdGVyfSlcblxuICAgIC8vdGhpcy5maWx0ZXJzLnB1c2goe25hbWU6ICdmaWxlVHlwZScsIGZuOiB0aGlzLl9maWxlVHlwZUZpbHRlcn0pXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ3F1ZXVlTGltaXQnLCBmbjogdGhpcy5fcXVldWVMaW1pdEZpbHRlcn0pXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ21pbWVUeXBlJywgZm46IHRoaXMuX21pbWVUeXBlRmlsdGVyfSlcbiAgfVxuXG4gIG5nT25EZXN0cm95KCl7XG4gICAgZGVsZXRlIHRoaXMuZmlsZUVsbS8vZmFzdGVyIG1lbW9yeSByZWxlYXNlIG9mIGRvbSBlbGVtZW50XG4gICAgdGhpcy5kZXN0cm95UGFzdGVMaXN0ZW5lcigpO1xuICB9XG5cbiAgbmdPbkluaXQoKXtcbiAgICBpZiggdGhpcy5zZWxlY3RhYmxlICl7XG4gICAgICB0aGlzLmVuYWJsZVNlbGVjdGluZygpXG4gICAgfVxuXG4gICAgaWYoIHRoaXMubXVsdGlwbGUgKXtcbiAgICAgIHRoaXMucGFyYW1GaWxlRWxtKCkuc2V0QXR0cmlidXRlKCdtdWx0aXBsZScsIHRoaXMubXVsdGlwbGUpXG4gICAgfVxuXG4gICAgdGhpcy5ldmFsQ2FwdHVyZVBhc3RlKCk7XG5cbiAgICAvL2NyZWF0ZSByZWZlcmVuY2UgdG8gdGhpcyBjbGFzcyB3aXRoIG9uZSBjeWNsZSBkZWxheSB0byBhdm9pZCBFeHByZXNzaW9uQ2hhbmdlZEFmdGVySXRIYXNCZWVuQ2hlY2tlZEVycm9yXG4gICAgc2V0VGltZW91dCgoKT0+e1xuICAgICAgdGhpcy5kaXJlY3RpdmVJbml0LmVtaXQodGhpcylcbiAgICB9LCAwKVxuICB9XG5cbiAgbmdPbkNoYW5nZXMoIGNoYW5nZXMgKXtcbiAgICBpZiggY2hhbmdlcy5hY2NlcHQgKXtcbiAgICAgIHRoaXMucGFyYW1GaWxlRWxtKCkuc2V0QXR0cmlidXRlKCdhY2NlcHQnLCBjaGFuZ2VzLmFjY2VwdC5jdXJyZW50VmFsdWUgfHwgJyonKVxuICAgIH1cblxuICAgIGlmIChjaGFuZ2VzLmNhcHR1cmVQYXN0ZSkge1xuICAgICAgdGhpcy5ldmFsQ2FwdHVyZVBhc3RlKCk7XG4gICAgfVxuICB9XG5cbiAgZXZhbENhcHR1cmVQYXN0ZSgpIHtcbiAgICBjb25zdCBpc0FjdGl2ZSA9IHRoaXMuY2FwdHVyZVBhc3RlIHx8ICh0aGlzLmNhcHR1cmVQYXN0ZSBhcyBhbnkpPT09JycgfHwgWydmYWxzZScsICcwJywgJ251bGwnXS5pbmNsdWRlcyh0aGlzLmNhcHR1cmVQYXN0ZSBhcyBhbnkpO1xuXG4gICAgaWYgKGlzQWN0aXZlKSB7XG4gICAgICBpZiAodGhpcy5wYXN0ZUNhcHR1cmVyKSB7XG4gICAgICAgIHJldHVybjsgLy8gYWxyZWFkeSBsaXN0ZW5pbmdcbiAgICAgIH1cblxuICAgICAgdGhpcy5wYXN0ZUNhcHR1cmVyID0gKGU6IGFueSkgPT4ge1xuICAgICAgICBjb25zdCBjbGlwID0gZS5jbGlwYm9hcmREYXRhO1xuICAgICAgICBpZiAoY2xpcCAmJiBjbGlwLmZpbGVzKSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVGaWxlcyhjbGlwLmZpbGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCB0aGlzLnBhc3RlQ2FwdHVyZXIpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5kZXN0cm95UGFzdGVMaXN0ZW5lcigpO1xuICB9XG5cbiAgZGVzdHJveVBhc3RlTGlzdGVuZXIoKSB7XG4gICAgaWYgKHRoaXMucGFzdGVDYXB0dXJlcikge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgdGhpcy5wYXN0ZUNhcHR1cmVyKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnBhc3RlQ2FwdHVyZXI7XG4gICAgfVxuICB9XG5cbiAgcGFyYW1GaWxlRWxtKCl7XG4gICAgaWYoIHRoaXMuZmlsZUVsbSApcmV0dXJuIHRoaXMuZmlsZUVsbS8vYWxyZWFkeSBkZWZpbmVkXG5cbiAgICAvL2VsbSBpcyBhIGZpbGUgaW5wdXRcbiAgICBjb25zdCBpc0ZpbGUgPSBpc0ZpbGVJbnB1dCggdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQgKVxuICAgIGlmKGlzRmlsZSlyZXR1cm4gdGhpcy5maWxlRWxtID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnRcblxuICAgIC8vY3JlYXRlIGZvbyBmaWxlIGlucHV0XG4gICAgY29uc3QgbGFiZWwgPSBjcmVhdGVJbnZpc2libGVGaWxlSW5wdXRXcmFwKClcbiAgICB0aGlzLmZpbGVFbG0gPSBsYWJlbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKVswXVxuICAgIHRoaXMuZmlsZUVsbS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmNoYW5nZUZuLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmFwcGVuZENoaWxkKCBsYWJlbCApXG4gICAgcmV0dXJuIHRoaXMuZmlsZUVsbVxuICB9XG5cbiAgZW5hYmxlU2VsZWN0aW5nKCl7XG4gICAgbGV0IGVsbSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50XG5cbiAgICBpZiggaXNGaWxlSW5wdXQoZWxtKSApe1xuICAgICAgY29uc3QgYmluZGVkSGFuZGxlciA9IF9ldj0+dGhpcy5iZWZvcmVTZWxlY3QoKVxuICAgICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYmluZGVkSGFuZGxlcilcbiAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgYmluZGVkSGFuZGxlcilcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGJpbmRlZEhhbmRsZXIgPSBldj0+dGhpcy5jbGlja0hhbmRsZXIoZXYpXG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYmluZGVkSGFuZGxlcilcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGJpbmRlZEhhbmRsZXIpXG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgYmluZGVkSGFuZGxlcilcbiAgfVxuXG4gIGdldFZhbGlkRmlsZXMoIGZpbGVzOkZpbGVbXSApOkZpbGVbXXtcbiAgICBjb25zdCBydG46RmlsZVtdID0gW11cbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIGlmKCB0aGlzLmlzRmlsZVZhbGlkKGZpbGVzW3hdKSApe1xuICAgICAgICBydG4ucHVzaCggZmlsZXNbeF0gKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnRuXG4gIH1cblxuICBnZXRJbnZhbGlkRmlsZXMoZmlsZXM6RmlsZVtdKTpJbnZhbGlkRmlsZUl0ZW1bXXtcbiAgICBjb25zdCBydG46SW52YWxpZEZpbGVJdGVtW10gPSBbXVxuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgbGV0IGZhaWxSZWFzb24gPSB0aGlzLmdldEZpbGVGaWx0ZXJGYWlsTmFtZShmaWxlc1t4XSlcbiAgICAgIGlmKCBmYWlsUmVhc29uICl7XG4gICAgICAgIHJ0bi5wdXNoKHtcbiAgICAgICAgICBmaWxlIDogZmlsZXNbeF0sXG4gICAgICAgICAgdHlwZSA6IGZhaWxSZWFzb25cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ0blxuICB9XG5cbiAgLy8gUHJpbWFyeSBoYW5kbGVyIG9mIGZpbGVzIGNvbWluZyBpblxuICBoYW5kbGVGaWxlcyhmaWxlczpGaWxlW10pe1xuICAgIGNvbnN0IHZhbGlkcyA9IHRoaXMuZ2V0VmFsaWRGaWxlcyhmaWxlcylcblxuICAgIGlmKGZpbGVzLmxlbmd0aCE9dmFsaWRzLmxlbmd0aCl7XG4gICAgICB0aGlzLmxhc3RJbnZhbGlkcyA9IHRoaXMuZ2V0SW52YWxpZEZpbGVzKGZpbGVzKVxuICAgIH1lbHNle1xuICAgICAgZGVsZXRlIHRoaXMubGFzdEludmFsaWRzXG4gICAgfVxuXG4gICAgdGhpcy5sYXN0SW52YWxpZHNDaGFuZ2UuZW1pdCh0aGlzLmxhc3RJbnZhbGlkcylcblxuICAgIGlmKCB2YWxpZHMubGVuZ3RoICl7XG4gICAgICBpZiggdGhpcy5uZ2ZGaXhPcmllbnRhdGlvbiApe1xuICAgICAgICB0aGlzLmFwcGx5RXhpZlJvdGF0aW9ucyh2YWxpZHMpXG4gICAgICAgIC50aGVuKCBmaXhlZEZpbGVzPT50aGlzLnF1ZShmaXhlZEZpbGVzKSApXG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5xdWUodmFsaWRzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmlzRW1wdHlBZnRlclNlbGVjdGlvbigpKSB7XG4gICAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC52YWx1ZSA9ICcnXG4gICAgfVxuICB9XG5cbiAgcXVlKCBmaWxlczpGaWxlW10gKXtcbiAgICB0aGlzLmZpbGVzID0gdGhpcy5maWxlcyB8fCBbXVxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMuZmlsZXMsIGZpbGVzKVxuXG4gICAgLy9iZWxvdyBicmVhayBtZW1vcnkgcmVmIGFuZCBkb2VzbnQgYWN0IGxpa2UgYSBxdWVcbiAgICAvL3RoaXMuZmlsZXMgPSBmaWxlcy8vY2F1c2VzIG1lbW9yeSBjaGFuZ2Ugd2hpY2ggdHJpZ2dlcnMgYmluZGluZ3MgbGlrZSA8bmdmRm9ybURhdGEgW2ZpbGVzXT1cImZpbGVzXCI+PC9uZ2ZGb3JtRGF0YT5cblxuICAgIHRoaXMuZmlsZXNDaGFuZ2UuZW1pdCggdGhpcy5maWxlcyApXG5cbiAgICBpZihmaWxlcy5sZW5ndGgpe1xuICAgICAgdGhpcy5maWxlQ2hhbmdlLmVtaXQoIHRoaXMuZmlsZT1maWxlc1swXSApXG5cbiAgICAgIGlmKHRoaXMubGFzdEJhc2VVcmxDaGFuZ2Uub2JzZXJ2ZXJzLmxlbmd0aCl7XG4gICAgICAgIGRhdGFVcmwoIGZpbGVzWzBdIClcbiAgICAgICAgLnRoZW4oIHVybD0+dGhpcy5sYXN0QmFzZVVybENoYW5nZS5lbWl0KHVybCkgKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vd2lsbCBiZSBjaGVja2VkIGZvciBpbnB1dCB2YWx1ZSBjbGVhcmluZ1xuICAgIHRoaXMubGFzdEZpbGVDb3VudCA9IHRoaXMuZmlsZXMubGVuZ3RoXG4gIH1cblxuICAvKiogY2FsbGVkIHdoZW4gaW5wdXQgaGFzIGZpbGVzICovXG4gIGNoYW5nZUZuKGV2ZW50OmFueSkge1xuICAgIHZhciBmaWxlTGlzdCA9IGV2ZW50Ll9fZmlsZXNfIHx8IChldmVudC50YXJnZXQgJiYgZXZlbnQudGFyZ2V0LmZpbGVzKVxuXG4gICAgaWYgKCFmaWxlTGlzdCkgcmV0dXJuO1xuXG4gICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgIHRoaXMuaGFuZGxlRmlsZXMoZmlsZUxpc3QpXG4gIH1cblxuICBjbGlja0hhbmRsZXIoZXZ0OmFueSl7XG4gICAgY29uc3QgZWxtID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnRcbiAgICBpZiAoZWxtLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSB8fCB0aGlzLmZpbGVEcm9wRGlzYWJsZWQpe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciByID0gZGV0ZWN0U3dpcGUoZXZ0KTtcbiAgICAvLyBwcmV2ZW50IHRoZSBjbGljayBpZiBpdCBpcyBhIHN3aXBlXG4gICAgaWYgKCByIT09ZmFsc2UgKSByZXR1cm4gcjtcblxuICAgIGNvbnN0IGZpbGVFbG0gPSB0aGlzLnBhcmFtRmlsZUVsbSgpXG4gICAgZmlsZUVsbS5jbGljaygpXG4gICAgLy9maWxlRWxtLmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudCgnY2xpY2snKSApO1xuICAgIHRoaXMuYmVmb3JlU2VsZWN0KClcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGJlZm9yZVNlbGVjdCgpe1xuICAgIGlmKCB0aGlzLmZpbGVzICYmIHRoaXMubGFzdEZpbGVDb3VudD09PXRoaXMuZmlsZXMubGVuZ3RoIClyZXR1cm5cblxuICAgIC8vaWYgbm8gZmlsZXMgaW4gYXJyYXksIGJlIHN1cmUgYnJvd3NlciBkb2VzbnQgcHJldmVudCByZXNlbGVjdCBvZiBzYW1lIGZpbGUgKHNlZSBnaXRodWIgaXNzdWUgMjcpXG4gICAgdGhpcy5maWxlRWxtLnZhbHVlID0gbnVsbFxuICB9XG5cbiAgaXNFbXB0eUFmdGVyU2VsZWN0aW9uKCk6Ym9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuYXR0cmlidXRlcy5tdWx0aXBsZTtcbiAgfVxuXG4gIGV2ZW50VG9UcmFuc2ZlcihldmVudDphbnkpOmFueSB7XG4gICAgaWYoZXZlbnQuZGF0YVRyYW5zZmVyKXJldHVybiBldmVudC5kYXRhVHJhbnNmZXJcbiAgICByZXR1cm4gIGV2ZW50Lm9yaWdpbmFsRXZlbnQgPyBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2ZlciA6IG51bGxcbiAgfVxuXG4gIHN0b3BFdmVudChldmVudDphbnkpOmFueSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHRyYW5zZmVySGFzRmlsZXModHJhbnNmZXI6YW55KTphbnkge1xuICAgIGlmICghdHJhbnNmZXIudHlwZXMpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodHJhbnNmZXIudHlwZXMuaW5kZXhPZikge1xuICAgICAgcmV0dXJuIHRyYW5zZmVyLnR5cGVzLmluZGV4T2YoJ0ZpbGVzJykgIT09IC0xO1xuICAgIH0gZWxzZSBpZiAodHJhbnNmZXIudHlwZXMuY29udGFpbnMpIHtcbiAgICAgIHJldHVybiB0cmFuc2Zlci50eXBlcy5jb250YWlucygnRmlsZXMnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGV2ZW50VG9GaWxlcyhldmVudDpFdmVudCl7XG4gICAgY29uc3QgdHJhbnNmZXIgPSB0aGlzLmV2ZW50VG9UcmFuc2ZlcihldmVudCk7XG4gICAgaWYoIHRyYW5zZmVyICl7XG4gICAgICBpZih0cmFuc2Zlci5maWxlcyAmJiB0cmFuc2Zlci5maWxlcy5sZW5ndGgpe1xuICAgICAgICByZXR1cm4gdHJhbnNmZXIuZmlsZXNcbiAgICAgIH1cbiAgICAgIGlmKHRyYW5zZmVyLml0ZW1zICYmIHRyYW5zZmVyLml0ZW1zLmxlbmd0aCl7XG4gICAgICAgIHJldHVybiB0cmFuc2Zlci5pdGVtc1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIGFwcGx5RXhpZlJvdGF0aW9ucyhcbiAgICBmaWxlczpGaWxlW11cbiAgKTpQcm9taXNlPEZpbGVbXT57XG4gICAgY29uc3QgbWFwcGVyID0gKFxuICAgICAgZmlsZTpGaWxlLGluZGV4Om51bWJlclxuICAgICk6UHJvbWlzZTxhbnk+PT57XG4gICAgICByZXR1cm4gYXBwbHlFeGlmUm90YXRpb24oZmlsZSlcbiAgICAgIC50aGVuKCBmaXhlZEZpbGU9PmZpbGVzLnNwbGljZShpbmRleCwgMSwgZml4ZWRGaWxlKSApXG4gICAgfVxuXG4gICAgY29uc3QgcHJvbXM6UHJvbWlzZTxhbnk+W10gPSBbXVxuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgcHJvbXNbeF0gPSBtYXBwZXIoIGZpbGVzW3hdLCB4IClcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKCBwcm9tcyApLnRoZW4oICgpPT5maWxlcyApXG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdjaGFuZ2UnLCBbJyRldmVudCddKVxuICBvbkNoYW5nZShldmVudDpFdmVudCk6dm9pZCB7XG4gICAgbGV0IGZpbGVzID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuZmlsZXMgfHwgdGhpcy5ldmVudFRvRmlsZXMoZXZlbnQpXG5cbiAgICBpZighZmlsZXMubGVuZ3RoKXJldHVyblxuXG4gICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgIHRoaXMuaGFuZGxlRmlsZXMoZmlsZXMpXG4gIH1cblxuICBnZXRGaWxlRmlsdGVyRmFpbE5hbWUoXG4gICAgZmlsZTpGaWxlXG4gICk6c3RyaW5nIHwgdW5kZWZpbmVke1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLmZpbHRlcnMubGVuZ3RoOyBpKyspe1xuICAgICAgaWYoICF0aGlzLmZpbHRlcnNbaV0uZm4uY2FsbCh0aGlzLCBmaWxlKSApe1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW2ldLm5hbWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgaXNGaWxlVmFsaWQoZmlsZTpGaWxlKTpib29sZWFue1xuICAgIGNvbnN0IG5vRmlsdGVycyA9ICF0aGlzLmFjY2VwdCAmJiAoIXRoaXMuZmlsdGVycyB8fCAhdGhpcy5maWx0ZXJzLmxlbmd0aClcbiAgICBpZiggbm9GaWx0ZXJzICl7XG4gICAgICByZXR1cm4gdHJ1ZS8vd2UgaGF2ZSBubyBmaWx0ZXJzIHNvIGFsbCBmaWxlcyBhcmUgdmFsaWRcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5nZXRGaWxlRmlsdGVyRmFpbE5hbWUoZmlsZSkgPyBmYWxzZSA6IHRydWVcbiAgfVxuXG4gIGlzRmlsZXNWYWxpZChmaWxlczpGaWxlW10pe1xuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgaWYoICF0aGlzLmlzRmlsZVZhbGlkKGZpbGVzW3hdKSApe1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHByb3RlY3RlZCBfYWNjZXB0RmlsdGVyKGl0ZW06RmlsZSk6Ym9vbGVhbiB7XG4gICAgcmV0dXJuIGFjY2VwdFR5cGUodGhpcy5hY2NlcHQsIGl0ZW0udHlwZSwgaXRlbS5uYW1lKVxuICB9XG5cbiAgcHJvdGVjdGVkIF9maWxlU2l6ZUZpbHRlcihpdGVtOkZpbGUpOmJvb2xlYW4ge1xuICAgIHJldHVybiAhKHRoaXMubWF4U2l6ZSAmJiBpdGVtLnNpemUgPiB0aGlzLm1heFNpemUpO1xuICB9XG5cbiAgLyoqIGJyb3dzZXJzIHRyeSBoYXJkIHRvIGNvbmNlYWwgZGF0YSBhYm91dCBmaWxlIGRyYWdzLCB0aGlzIHRlbmRzIHRvIHVuZG8gdGhhdCAqL1xuICBmaWxlc1RvV3JpdGVhYmxlT2JqZWN0KCBmaWxlczpGaWxlW10gKTpkcmFnTWV0YVtde1xuICAgIGNvbnN0IGpzb25GaWxlczpkcmFnTWV0YVtdID0gW11cbiAgICBmb3IobGV0IHg9MDsgeCA8IGZpbGVzLmxlbmd0aDsgKyt4KXtcbiAgICAgIGpzb25GaWxlcy5wdXNoKHtcbiAgICAgICAgdHlwZTpmaWxlc1t4XS50eXBlLFxuICAgICAgICBraW5kOmZpbGVzW3hdW1wia2luZFwiXVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIGpzb25GaWxlc1xuICB9XG59XG4iXX0=