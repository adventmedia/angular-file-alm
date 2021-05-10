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
        this.fileSelectStart = new EventEmitter();
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
        const selectable = (this.selectable || this.selectable === '') && !['false', 'null', '0'].includes(this.selectable);
        if (selectable) {
            this.enableSelecting();
        }
        if (this.multiple) {
            this.paramFileElm().setAttribute('multiple', this.multiple);
        }
        this.evalCapturePaste();
        // create reference to this class with one cycle delay to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
            this.directiveInit.emit(this);
        }, 0);
    }
    ngOnChanges(changes) {
        var _a, _b;
        if (changes.accept) {
            this.paramFileElm().setAttribute('accept', changes.accept.currentValue || '*');
        }
        if (changes.capturePaste) {
            this.evalCapturePaste();
        }
        // Did we go from having a file to not having a file? Clear file element then
        if (changes.file && changes.file.previousValue && !changes.file.currentValue) {
            this.clearFileElmValue();
        }
        // Did we go from having files to not having files? Clear file element then
        if (changes.files) {
            const filesWentToZero = ((_a = changes.files.previousValue) === null || _a === void 0 ? void 0 : _a.length) && !((_b = changes.files.currentValue) === null || _b === void 0 ? void 0 : _b.length);
            if (filesWentToZero) {
                this.clearFileElmValue();
            }
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
                if (clip && clip.files && clip.files.length) {
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
            return this.fileElm; // already defined
        // elm already is a file input
        const isFile = isFileInput(this.element.nativeElement);
        if (isFile) {
            return this.fileElm = this.element.nativeElement;
        }
        // the host elm is NOT a file input
        return this.fileElm = this.createFileElm({
            change: this.changeFn.bind(this)
        });
    }
    /** Only used when host element we are attached to is NOT a fileElement */
    createFileElm({ change }) {
        // use specific technique to hide file element within
        const label = createInvisibleFileInputWrap();
        const fileElm = label.getElementsByTagName('input')[0];
        fileElm.addEventListener('change', change);
        this.element.nativeElement.appendChild(label); // put on html stage
        return fileElm;
    }
    enableSelecting() {
        let elm = this.element.nativeElement;
        if (isFileInput(elm)) {
            const bindedHandler = event => this.beforeSelect(event);
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
        this.beforeSelect(evt);
        return false;
    }
    beforeSelect(event) {
        this.fileSelectStart.emit(event);
        if (this.files && this.lastFileCount === this.files.length)
            return;
        // if no files in array, be sure browser does not prevent reselect of same file (see github issue 27)
        this.clearFileElmValue();
    }
    clearFileElmValue() {
        if (!this.fileElm)
            return;
        this.fileElm.value = null;
    }
    isEmptyAfterSelection() {
        return !!this.element.nativeElement.attributes.multiple;
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
        const transfer = eventToTransfer(event);
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
    fileSelectStart: [{ type: Output }],
    capturePaste: [{ type: Input }],
    onChange: [{ type: HostListener, args: ['change', ['$event'],] }]
};
/** browsers try hard to conceal data about file drags, this tends to undo that */
export function filesToWriteableObject(files) {
    const jsonFiles = [];
    for (let x = 0; x < files.length; ++x) {
        jsonFiles.push({
            type: files[x].type,
            kind: files[x]["kind"]
        });
    }
    return jsonFiles;
}
export function eventToTransfer(event) {
    if (event.dataTransfer)
        return event.dataTransfer;
    return event.originalEvent ? event.originalEvent.dataTransfer : null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9maWxlLXVwbG9hZC9uZ2YuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDaEgsT0FBTyxFQUFFLDRCQUE0QixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTtBQUNuRyxPQUFPLEVBQ0wsVUFBVSxFQUNWLGlCQUFpQixFQUFFLE9BQU8sRUFDM0IsTUFBTSxhQUFhLENBQUE7QUFPcEI7O0VBRUU7QUFLRixNQUFNLE9BQU8sR0FBRztJQWdDZCxZQUFtQixPQUFrQjtRQUFsQixZQUFPLEdBQVAsT0FBTyxDQUFXO1FBOUJyQyxZQUFPLEdBQStDLEVBQUUsQ0FBQTtRQUN4RCxrQkFBYSxHQUFXLENBQUMsQ0FBQTtRQUtoQixzQkFBaUIsR0FBWSxJQUFJLENBQUE7UUFFakMscUJBQWdCLEdBQVksS0FBSyxDQUFBO1FBQ2pDLGVBQVUsR0FBcUIsS0FBSyxDQUFBO1FBQzdCLGtCQUFhLEdBQXFCLElBQUksWUFBWSxFQUFFLENBQUE7UUFFM0QsaUJBQVksR0FBcUIsRUFBRSxDQUFBO1FBQ2xDLHVCQUFrQixHQUEyQyxJQUFJLFlBQVksRUFBRSxDQUFBO1FBRy9FLHNCQUFpQixHQUF3QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRzNELGVBQVUsR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUVwRCxVQUFLLEdBQVUsRUFBRSxDQUFBO1FBQ2hCLGdCQUFXLEdBQXdCLElBQUksWUFBWSxFQUFVLENBQUM7UUFFOUQsb0JBQWUsR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQU9oRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDcEIsQ0FBQztJQUVELFdB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QUMsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFBO0lBQy9DLE9BQVEsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtBQUN2RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFdmVudEVtaXR0ZXIsIEVsZW1lbnRSZWYsIElucHV0LCBPdXRwdXQsIEhvc3RMaXN0ZW5lciwgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgY3JlYXRlSW52aXNpYmxlRmlsZUlucHV0V3JhcCwgaXNGaWxlSW5wdXQsIGRldGVjdFN3aXBlIH0gZnJvbSBcIi4vZG9jLWV2ZW50LWhlbHAuZnVuY3Rpb25zXCJcbmltcG9ydCB7XG4gIGFjY2VwdFR5cGUsIEludmFsaWRGaWxlSXRlbSxcbiAgYXBwbHlFeGlmUm90YXRpb24sIGRhdGFVcmxcbn0gZnJvbSBcIi4vZmlsZVRvb2xzXCJcblxuZXhwb3J0IGludGVyZmFjZSBkcmFnTWV0YXtcbiAgdHlwZTpzdHJpbmdcbiAga2luZDpzdHJpbmdcbn1cblxuLyoqIEEgbWFzdGVyIGJhc2Ugc2V0IG9mIGxvZ2ljIGludGVuZGVkIHRvIHN1cHBvcnQgZmlsZSBzZWxlY3QvZHJhZy9kcm9wIG9wZXJhdGlvbnNcbiBOT1RFOiBVc2UgbmdmRHJvcCBmb3IgZnVsbCBkcmFnL2Ryb3AuIFVzZSBuZ2ZTZWxlY3QgZm9yIHNlbGVjdGluZ1xuKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogXCJbbmdmXVwiLFxuICBleHBvcnRBczpcIm5nZlwiXG59KVxuZXhwb3J0IGNsYXNzIG5nZiB7XG4gIGZpbGVFbG06IGFueVxuICBmaWx0ZXJzOiB7bmFtZTogc3RyaW5nLCBmbjogKGZpbGU6RmlsZSk9PmJvb2xlYW59W10gPSBbXVxuICBsYXN0RmlsZUNvdW50OiBudW1iZXIgPSAwXG5cbiAgQElucHV0KCkgbXVsdGlwbGUgITpzdHJpbmdcbiAgQElucHV0KCkgYWNjZXB0ICAgITpzdHJpbmdcbiAgQElucHV0KCkgbWF4U2l6ZSAgITpudW1iZXJcbiAgQElucHV0KCkgbmdmRml4T3JpZW50YXRpb246IGJvb2xlYW4gPSB0cnVlXG5cbiAgQElucHV0KCkgZmlsZURyb3BEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlXG4gIEBJbnB1dCgpIHNlbGVjdGFibGU6IGJvb2xlYW4gfCBzdHJpbmcgPSBmYWxzZVxuICBAT3V0cHV0KCdpbml0JykgZGlyZWN0aXZlSW5pdDpFdmVudEVtaXR0ZXI8bmdmPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGxhc3RJbnZhbGlkczpJbnZhbGlkRmlsZUl0ZW1bXSA9IFtdXG4gIEBPdXRwdXQoKSBsYXN0SW52YWxpZHNDaGFuZ2U6RXZlbnRFbWl0dGVyPHtmaWxlOkZpbGUsdHlwZTpzdHJpbmd9W10+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgbGFzdEJhc2VVcmwhOiBzdHJpbmcvL2Jhc2U2NCBsYXN0IGZpbGUgdXBsb2FkZWQgdXJsXG4gIEBPdXRwdXQoKSBsYXN0QmFzZVVybENoYW5nZTpFdmVudEVtaXR0ZXI8c3RyaW5nPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGZpbGUhOiBGaWxlLy9sYXN0IGZpbGUgdXBsb2FkZWRcbiAgQE91dHB1dCgpIGZpbGVDaGFuZ2U6IEV2ZW50RW1pdHRlcjxGaWxlPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGZpbGVzOkZpbGVbXSA9IFtdXG4gIEBPdXRwdXQoKSBmaWxlc0NoYW5nZTpFdmVudEVtaXR0ZXI8RmlsZVtdPiA9IG5ldyBFdmVudEVtaXR0ZXI8RmlsZVtdPigpO1xuXG4gIEBPdXRwdXQoKSBmaWxlU2VsZWN0U3RhcnQ6RXZlbnRFbWl0dGVyPEV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGNhcHR1cmVQYXN0ZTogYm9vbGVhbiAvLyB3aW5kb3cgcGFzdGUgZmlsZSB3YXRjaGluZyAoZW1wdHkgc3RyaW5nIHR1cm5zIG9uKVxuXG4gIHBhc3RlQ2FwdHVyZXIhOiAoZTogRXZlbnQpID0+IHZvaWQgLy8gZ29lcyB3aXRoIGNhcHR1cmVQYXN0ZVxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlbGVtZW50OkVsZW1lbnRSZWYpe1xuICAgIHRoaXMuaW5pdEZpbHRlcnMoKVxuICB9XG5cbiAgaW5pdEZpbHRlcnMoKXtcbiAgICAvLyB0aGUgb3JkZXIgaXMgaW1wb3J0YW50XG4gICAgdGhpcy5maWx0ZXJzLnB1c2goe25hbWU6ICdhY2NlcHQnLCBmbjogdGhpcy5fYWNjZXB0RmlsdGVyfSlcbiAgICB0aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2ZpbGVTaXplJywgZm46IHRoaXMuX2ZpbGVTaXplRmlsdGVyfSlcblxuICAgIC8vdGhpcy5maWx0ZXJzLnB1c2goe25hbWU6ICdmaWxlVHlwZScsIGZuOiB0aGlzLl9maWxlVHlwZUZpbHRlcn0pXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ3F1ZXVlTGltaXQnLCBmbjogdGhpcy5fcXVldWVMaW1pdEZpbHRlcn0pXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ21pbWVUeXBlJywgZm46IHRoaXMuX21pbWVUeXBlRmlsdGVyfSlcbiAgfVxuXG4gIG5nT25EZXN0cm95KCl7XG4gICAgZGVsZXRlIHRoaXMuZmlsZUVsbS8vZmFzdGVyIG1lbW9yeSByZWxlYXNlIG9mIGRvbSBlbGVtZW50XG4gICAgdGhpcy5kZXN0cm95UGFzdGVMaXN0ZW5lcigpO1xuICB9XG5cbiAgbmdPbkluaXQoKXtcbiAgICBjb25zdCBzZWxlY3RhYmxlID0gKHRoaXMuc2VsZWN0YWJsZSB8fCB0aGlzLnNlbGVjdGFibGU9PT0nJykgJiYgIVsnZmFsc2UnLCAnbnVsbCcsICcwJ10uaW5jbHVkZXModGhpcy5zZWxlY3RhYmxlIGFzIHN0cmluZyk7XG4gICAgaWYoIHNlbGVjdGFibGUgKXtcbiAgICAgIHRoaXMuZW5hYmxlU2VsZWN0aW5nKClcbiAgICB9XG5cbiAgICBpZiggdGhpcy5tdWx0aXBsZSApe1xuICAgICAgdGhpcy5wYXJhbUZpbGVFbG0oKS5zZXRBdHRyaWJ1dGUoJ211bHRpcGxlJywgdGhpcy5tdWx0aXBsZSlcbiAgICB9XG5cbiAgICB0aGlzLmV2YWxDYXB0dXJlUGFzdGUoKTtcblxuICAgIC8vIGNyZWF0ZSByZWZlcmVuY2UgdG8gdGhpcyBjbGFzcyB3aXRoIG9uZSBjeWNsZSBkZWxheSB0byBhdm9pZCBFeHByZXNzaW9uQ2hhbmdlZEFmdGVySXRIYXNCZWVuQ2hlY2tlZEVycm9yXG4gICAgc2V0VGltZW91dCgoKT0+e1xuICAgICAgdGhpcy5kaXJlY3RpdmVJbml0LmVtaXQodGhpcylcbiAgICB9LCAwKVxuICB9XG5cbiAgbmdPbkNoYW5nZXMoIGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMgKXtcbiAgICBpZiggY2hhbmdlcy5hY2NlcHQgKXtcbiAgICAgIHRoaXMucGFyYW1GaWxlRWxtKCkuc2V0QXR0cmlidXRlKCdhY2NlcHQnLCBjaGFuZ2VzLmFjY2VwdC5jdXJyZW50VmFsdWUgfHwgJyonKVxuICAgIH1cblxuICAgIGlmIChjaGFuZ2VzLmNhcHR1cmVQYXN0ZSkge1xuICAgICAgdGhpcy5ldmFsQ2FwdHVyZVBhc3RlKCk7XG4gICAgfVxuXG4gICAgLy8gRGlkIHdlIGdvIGZyb20gaGF2aW5nIGEgZmlsZSB0byBub3QgaGF2aW5nIGEgZmlsZT8gQ2xlYXIgZmlsZSBlbGVtZW50IHRoZW5cbiAgICBpZiAoY2hhbmdlcy5maWxlICYmIGNoYW5nZXMuZmlsZS5wcmV2aW91c1ZhbHVlICYmICFjaGFuZ2VzLmZpbGUuY3VycmVudFZhbHVlKSB7XG4gICAgICB0aGlzLmNsZWFyRmlsZUVsbVZhbHVlKClcbiAgICB9XG5cbiAgICAvLyBEaWQgd2UgZ28gZnJvbSBoYXZpbmcgZmlsZXMgdG8gbm90IGhhdmluZyBmaWxlcz8gQ2xlYXIgZmlsZSBlbGVtZW50IHRoZW5cbiAgICBpZiAoY2hhbmdlcy5maWxlcykge1xuICAgICAgY29uc3QgZmlsZXNXZW50VG9aZXJvID0gY2hhbmdlcy5maWxlcy5wcmV2aW91c1ZhbHVlPy5sZW5ndGggJiYgIWNoYW5nZXMuZmlsZXMuY3VycmVudFZhbHVlPy5sZW5ndGhcblxuICAgICAgaWYgKGZpbGVzV2VudFRvWmVybykge1xuICAgICAgICB0aGlzLmNsZWFyRmlsZUVsbVZhbHVlKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBldmFsQ2FwdHVyZVBhc3RlKCkge1xuICAgIGNvbnN0IGlzQWN0aXZlID0gdGhpcy5jYXB0dXJlUGFzdGUgfHwgKHRoaXMuY2FwdHVyZVBhc3RlIGFzIGFueSk9PT0nJyB8fCBbJ2ZhbHNlJywgJzAnLCAnbnVsbCddLmluY2x1ZGVzKHRoaXMuY2FwdHVyZVBhc3RlIGFzIGFueSk7XG5cbiAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgIGlmICh0aGlzLnBhc3RlQ2FwdHVyZXIpIHtcbiAgICAgICAgcmV0dXJuOyAvLyBhbHJlYWR5IGxpc3RlbmluZ1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBhc3RlQ2FwdHVyZXIgPSAoZTogRXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgY2xpcCA9IChlIGFzIGFueSkuY2xpcGJvYXJkRGF0YTtcbiAgICAgICAgaWYgKGNsaXAgJiYgY2xpcC5maWxlcyAmJiBjbGlwLmZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuaGFuZGxlRmlsZXMoY2xpcC5maWxlcyk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMucGFzdGVDYXB0dXJlcik7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCk7XG4gIH1cblxuICBkZXN0cm95UGFzdGVMaXN0ZW5lcigpIHtcbiAgICBpZiAodGhpcy5wYXN0ZUNhcHR1cmVyKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncGFzdGUnLCB0aGlzLnBhc3RlQ2FwdHVyZXIpO1xuICAgICAgZGVsZXRlIHRoaXMucGFzdGVDYXB0dXJlcjtcbiAgICB9XG4gIH1cblxuICBwYXJhbUZpbGVFbG0oKXtcbiAgICBpZiggdGhpcy5maWxlRWxtIClyZXR1cm4gdGhpcy5maWxlRWxtIC8vIGFscmVhZHkgZGVmaW5lZFxuXG4gICAgLy8gZWxtIGFscmVhZHkgaXMgYSBmaWxlIGlucHV0XG4gICAgY29uc3QgaXNGaWxlID0gaXNGaWxlSW5wdXQoIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50IClcbiAgICBpZihpc0ZpbGUpe1xuICAgICAgcmV0dXJuIHRoaXMuZmlsZUVsbSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50XG4gICAgfVxuXG4gICAgLy8gdGhlIGhvc3QgZWxtIGlzIE5PVCBhIGZpbGUgaW5wdXRcbiAgICByZXR1cm4gdGhpcy5maWxlRWxtID0gdGhpcy5jcmVhdGVGaWxlRWxtKHtcbiAgICAgIGNoYW5nZTogdGhpcy5jaGFuZ2VGbi5iaW5kKHRoaXMpXG4gICAgfSlcbiAgfVxuXG4gIC8qKiBPbmx5IHVzZWQgd2hlbiBob3N0IGVsZW1lbnQgd2UgYXJlIGF0dGFjaGVkIHRvIGlzIE5PVCBhIGZpbGVFbGVtZW50ICovXG4gIGNyZWF0ZUZpbGVFbG0oe2NoYW5nZX06IHtjaGFuZ2U6KCkgPT4gYW55fSkge1xuICAgIC8vIHVzZSBzcGVjaWZpYyB0ZWNobmlxdWUgdG8gaGlkZSBmaWxlIGVsZW1lbnQgd2l0aGluXG4gICAgY29uc3QgbGFiZWwgPSBjcmVhdGVJbnZpc2libGVGaWxlSW5wdXRXcmFwKClcbiAgICBjb25zdCBmaWxlRWxtID0gbGFiZWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JylbMF1cblxuICAgIGZpbGVFbG0uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgY2hhbmdlKTtcbiAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZCggbGFiZWwgKSAvLyBwdXQgb24gaHRtbCBzdGFnZVxuXG4gICAgcmV0dXJuIGZpbGVFbG1cbiAgfVxuXG4gIGVuYWJsZVNlbGVjdGluZygpe1xuICAgIGxldCBlbG0gPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudFxuXG4gICAgaWYoIGlzRmlsZUlucHV0KGVsbSkgKXtcbiAgICAgIGNvbnN0IGJpbmRlZEhhbmRsZXIgPSBldmVudCA9PiB0aGlzLmJlZm9yZVNlbGVjdChldmVudClcbiAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJpbmRlZEhhbmRsZXIpXG4gICAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGJpbmRlZEhhbmRsZXIpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBiaW5kZWRIYW5kbGVyID0gZXYgPT4gdGhpcy5jbGlja0hhbmRsZXIoZXYpXG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYmluZGVkSGFuZGxlcilcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGJpbmRlZEhhbmRsZXIpXG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgYmluZGVkSGFuZGxlcilcbiAgfVxuXG4gIGdldFZhbGlkRmlsZXMoIGZpbGVzOkZpbGVbXSApOkZpbGVbXXtcbiAgICBjb25zdCBydG46RmlsZVtdID0gW11cbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIGlmKCB0aGlzLmlzRmlsZVZhbGlkKGZpbGVzW3hdKSApe1xuICAgICAgICBydG4ucHVzaCggZmlsZXNbeF0gKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnRuXG4gIH1cblxuICBnZXRJbnZhbGlkRmlsZXMoZmlsZXM6RmlsZVtdKTpJbnZhbGlkRmlsZUl0ZW1bXXtcbiAgICBjb25zdCBydG46SW52YWxpZEZpbGVJdGVtW10gPSBbXVxuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgbGV0IGZhaWxSZWFzb24gPSB0aGlzLmdldEZpbGVGaWx0ZXJGYWlsTmFtZShmaWxlc1t4XSlcbiAgICAgIGlmKCBmYWlsUmVhc29uICl7XG4gICAgICAgIHJ0bi5wdXNoKHtcbiAgICAgICAgICBmaWxlIDogZmlsZXNbeF0sXG4gICAgICAgICAgdHlwZSA6IGZhaWxSZWFzb25cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ0blxuICB9XG5cbiAgLy8gUHJpbWFyeSBoYW5kbGVyIG9mIGZpbGVzIGNvbWluZyBpblxuICBoYW5kbGVGaWxlcyhmaWxlczpGaWxlW10pe1xuICAgIGNvbnN0IHZhbGlkcyA9IHRoaXMuZ2V0VmFsaWRGaWxlcyhmaWxlcylcblxuICAgIGlmKGZpbGVzLmxlbmd0aCE9dmFsaWRzLmxlbmd0aCl7XG4gICAgICB0aGlzLmxhc3RJbnZhbGlkcyA9IHRoaXMuZ2V0SW52YWxpZEZpbGVzKGZpbGVzKVxuICAgIH1lbHNle1xuICAgICAgZGVsZXRlIHRoaXMubGFzdEludmFsaWRzXG4gICAgfVxuXG4gICAgdGhpcy5sYXN0SW52YWxpZHNDaGFuZ2UuZW1pdCh0aGlzLmxhc3RJbnZhbGlkcylcblxuICAgIGlmKCB2YWxpZHMubGVuZ3RoICl7XG4gICAgICBpZiggdGhpcy5uZ2ZGaXhPcmllbnRhdGlvbiApe1xuICAgICAgICB0aGlzLmFwcGx5RXhpZlJvdGF0aW9ucyh2YWxpZHMpXG4gICAgICAgIC50aGVuKCBmaXhlZEZpbGVzPT50aGlzLnF1ZShmaXhlZEZpbGVzKSApXG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5xdWUodmFsaWRzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmlzRW1wdHlBZnRlclNlbGVjdGlvbigpKSB7XG4gICAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC52YWx1ZSA9ICcnXG4gICAgfVxuICB9XG5cbiAgcXVlKCBmaWxlczpGaWxlW10gKXtcbiAgICB0aGlzLmZpbGVzID0gdGhpcy5maWxlcyB8fCBbXVxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMuZmlsZXMsIGZpbGVzKVxuXG4gICAgLy9iZWxvdyBicmVhayBtZW1vcnkgcmVmIGFuZCBkb2VzbnQgYWN0IGxpa2UgYSBxdWVcbiAgICAvL3RoaXMuZmlsZXMgPSBmaWxlcy8vY2F1c2VzIG1lbW9yeSBjaGFuZ2Ugd2hpY2ggdHJpZ2dlcnMgYmluZGluZ3MgbGlrZSA8bmdmRm9ybURhdGEgW2ZpbGVzXT1cImZpbGVzXCI+PC9uZ2ZGb3JtRGF0YT5cblxuICAgIHRoaXMuZmlsZXNDaGFuZ2UuZW1pdCggdGhpcy5maWxlcyApXG5cbiAgICBpZihmaWxlcy5sZW5ndGgpe1xuICAgICAgdGhpcy5maWxlQ2hhbmdlLmVtaXQoIHRoaXMuZmlsZT1maWxlc1swXSApXG5cbiAgICAgIGlmKHRoaXMubGFzdEJhc2VVcmxDaGFuZ2Uub2JzZXJ2ZXJzLmxlbmd0aCl7XG4gICAgICAgIGRhdGFVcmwoIGZpbGVzWzBdIClcbiAgICAgICAgLnRoZW4oIHVybD0+dGhpcy5sYXN0QmFzZVVybENoYW5nZS5lbWl0KHVybCkgKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vd2lsbCBiZSBjaGVja2VkIGZvciBpbnB1dCB2YWx1ZSBjbGVhcmluZ1xuICAgIHRoaXMubGFzdEZpbGVDb3VudCA9IHRoaXMuZmlsZXMubGVuZ3RoXG4gIH1cblxuICAvKiogY2FsbGVkIHdoZW4gaW5wdXQgaGFzIGZpbGVzICovXG4gIGNoYW5nZUZuKGV2ZW50OmFueSkge1xuICAgIHZhciBmaWxlTGlzdCA9IGV2ZW50Ll9fZmlsZXNfIHx8IChldmVudC50YXJnZXQgJiYgZXZlbnQudGFyZ2V0LmZpbGVzKVxuXG4gICAgaWYgKCFmaWxlTGlzdCkgcmV0dXJuO1xuXG4gICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgIHRoaXMuaGFuZGxlRmlsZXMoZmlsZUxpc3QpXG4gIH1cblxuICBjbGlja0hhbmRsZXIoZXZ0OiBFdmVudCl7XG4gICAgY29uc3QgZWxtID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnRcbiAgICBpZiAoZWxtLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSB8fCB0aGlzLmZpbGVEcm9wRGlzYWJsZWQpe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciByID0gZGV0ZWN0U3dpcGUoZXZ0KTtcbiAgICAvLyBwcmV2ZW50IHRoZSBjbGljayBpZiBpdCBpcyBhIHN3aXBlXG4gICAgaWYgKCByIT09ZmFsc2UgKSByZXR1cm4gcjtcblxuICAgIGNvbnN0IGZpbGVFbG0gPSB0aGlzLnBhcmFtRmlsZUVsbSgpXG4gICAgZmlsZUVsbS5jbGljaygpXG4gICAgLy9maWxlRWxtLmRpc3BhdGNoRXZlbnQoIG5ldyBFdmVudCgnY2xpY2snKSApO1xuICAgIHRoaXMuYmVmb3JlU2VsZWN0KGV2dClcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGJlZm9yZVNlbGVjdChldmVudDogRXZlbnQpe1xuICAgIHRoaXMuZmlsZVNlbGVjdFN0YXJ0LmVtaXQoZXZlbnQpXG5cbiAgICBpZiggdGhpcy5maWxlcyAmJiB0aGlzLmxhc3RGaWxlQ291bnQ9PT10aGlzLmZpbGVzLmxlbmd0aCApcmV0dXJuXG5cbiAgICAvLyBpZiBubyBmaWxlcyBpbiBhcnJheSwgYmUgc3VyZSBicm93c2VyIGRvZXMgbm90IHByZXZlbnQgcmVzZWxlY3Qgb2Ygc2FtZSBmaWxlIChzZWUgZ2l0aHViIGlzc3VlIDI3KVxuICAgIHRoaXMuY2xlYXJGaWxlRWxtVmFsdWUoKVxuICB9XG5cbiAgY2xlYXJGaWxlRWxtVmFsdWUoKSB7XG4gICAgaWYgKCF0aGlzLmZpbGVFbG0pIHJldHVyblxuXG4gICAgdGhpcy5maWxlRWxtLnZhbHVlID0gbnVsbFxuICB9XG5cbiAgaXNFbXB0eUFmdGVyU2VsZWN0aW9uKCk6Ym9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuYXR0cmlidXRlcy5tdWx0aXBsZTtcbiAgfVxuXG4gIHN0b3BFdmVudChldmVudDphbnkpOmFueSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHRyYW5zZmVySGFzRmlsZXModHJhbnNmZXI6YW55KTphbnkge1xuICAgIGlmICghdHJhbnNmZXIudHlwZXMpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodHJhbnNmZXIudHlwZXMuaW5kZXhPZikge1xuICAgICAgcmV0dXJuIHRyYW5zZmVyLnR5cGVzLmluZGV4T2YoJ0ZpbGVzJykgIT09IC0xO1xuICAgIH0gZWxzZSBpZiAodHJhbnNmZXIudHlwZXMuY29udGFpbnMpIHtcbiAgICAgIHJldHVybiB0cmFuc2Zlci50eXBlcy5jb250YWlucygnRmlsZXMnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGV2ZW50VG9GaWxlcyhldmVudDpFdmVudCl7XG4gICAgY29uc3QgdHJhbnNmZXIgPSBldmVudFRvVHJhbnNmZXIoZXZlbnQpO1xuICAgIGlmKCB0cmFuc2ZlciApe1xuICAgICAgaWYodHJhbnNmZXIuZmlsZXMgJiYgdHJhbnNmZXIuZmlsZXMubGVuZ3RoKXtcbiAgICAgICAgcmV0dXJuIHRyYW5zZmVyLmZpbGVzXG4gICAgICB9XG4gICAgICBpZih0cmFuc2Zlci5pdGVtcyAmJiB0cmFuc2Zlci5pdGVtcy5sZW5ndGgpe1xuICAgICAgICByZXR1cm4gdHJhbnNmZXIuaXRlbXNcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICBhcHBseUV4aWZSb3RhdGlvbnMoXG4gICAgZmlsZXM6RmlsZVtdXG4gICk6UHJvbWlzZTxGaWxlW10+e1xuICAgIGNvbnN0IG1hcHBlciA9IChcbiAgICAgIGZpbGU6RmlsZSxpbmRleDpudW1iZXJcbiAgICApOlByb21pc2U8YW55Pj0+e1xuICAgICAgcmV0dXJuIGFwcGx5RXhpZlJvdGF0aW9uKGZpbGUpXG4gICAgICAudGhlbiggZml4ZWRGaWxlPT5maWxlcy5zcGxpY2UoaW5kZXgsIDEsIGZpeGVkRmlsZSkgKVxuICAgIH1cblxuICAgIGNvbnN0IHByb21zOlByb21pc2U8YW55PltdID0gW11cbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIHByb21zW3hdID0gbWFwcGVyKCBmaWxlc1t4XSwgeCApXG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLmFsbCggcHJvbXMgKS50aGVuKCAoKT0+ZmlsZXMgKVxuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignY2hhbmdlJywgWyckZXZlbnQnXSlcbiAgb25DaGFuZ2UoZXZlbnQ6RXZlbnQpOnZvaWQge1xuICAgIGxldCBmaWxlcyA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmZpbGVzIHx8IHRoaXMuZXZlbnRUb0ZpbGVzKGV2ZW50KVxuXG4gICAgaWYoIWZpbGVzLmxlbmd0aClyZXR1cm5cblxuICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICB0aGlzLmhhbmRsZUZpbGVzKGZpbGVzKVxuICB9XG5cbiAgZ2V0RmlsZUZpbHRlckZhaWxOYW1lKFxuICAgIGZpbGU6RmlsZVxuICApOnN0cmluZyB8IHVuZGVmaW5lZHtcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGhpcy5maWx0ZXJzLmxlbmd0aDsgaSsrKXtcbiAgICAgIGlmKCAhdGhpcy5maWx0ZXJzW2ldLmZuLmNhbGwodGhpcywgZmlsZSkgKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1tpXS5uYW1lXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuXG4gIGlzRmlsZVZhbGlkKGZpbGU6RmlsZSk6Ym9vbGVhbntcbiAgICBjb25zdCBub0ZpbHRlcnMgPSAhdGhpcy5hY2NlcHQgJiYgKCF0aGlzLmZpbHRlcnMgfHwgIXRoaXMuZmlsdGVycy5sZW5ndGgpXG4gICAgaWYoIG5vRmlsdGVycyApe1xuICAgICAgcmV0dXJuIHRydWUvL3dlIGhhdmUgbm8gZmlsdGVycyBzbyBhbGwgZmlsZXMgYXJlIHZhbGlkXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RmlsZUZpbHRlckZhaWxOYW1lKGZpbGUpID8gZmFsc2UgOiB0cnVlXG4gIH1cblxuICBpc0ZpbGVzVmFsaWQoZmlsZXM6RmlsZVtdKXtcbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIGlmKCAhdGhpcy5pc0ZpbGVWYWxpZChmaWxlc1t4XSkgKXtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBwcm90ZWN0ZWQgX2FjY2VwdEZpbHRlcihpdGVtOkZpbGUpOmJvb2xlYW4ge1xuICAgIHJldHVybiBhY2NlcHRUeXBlKHRoaXMuYWNjZXB0LCBpdGVtLnR5cGUsIGl0ZW0ubmFtZSlcbiAgfVxuXG4gIHByb3RlY3RlZCBfZmlsZVNpemVGaWx0ZXIoaXRlbTpGaWxlKTpib29sZWFuIHtcbiAgICByZXR1cm4gISh0aGlzLm1heFNpemUgJiYgaXRlbS5zaXplID4gdGhpcy5tYXhTaXplKTtcbiAgfVxufVxuXG5cbi8qKiBicm93c2VycyB0cnkgaGFyZCB0byBjb25jZWFsIGRhdGEgYWJvdXQgZmlsZSBkcmFncywgdGhpcyB0ZW5kcyB0byB1bmRvIHRoYXQgKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWxlc1RvV3JpdGVhYmxlT2JqZWN0KCBmaWxlczpGaWxlW10gKTpkcmFnTWV0YVtde1xuICBjb25zdCBqc29uRmlsZXM6ZHJhZ01ldGFbXSA9IFtdXG4gIGZvcihsZXQgeD0wOyB4IDwgZmlsZXMubGVuZ3RoOyArK3gpe1xuICAgIGpzb25GaWxlcy5wdXNoKHtcbiAgICAgIHR5cGU6ZmlsZXNbeF0udHlwZSxcbiAgICAgIGtpbmQ6ZmlsZXNbeF1bXCJraW5kXCJdXG4gICAgfSlcbiAgfVxuICByZXR1cm4ganNvbkZpbGVzXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBldmVudFRvVHJhbnNmZXIoZXZlbnQ6IGFueSk6IFRyYW5zZmVyT2JqZWN0IHtcbiAgaWYoZXZlbnQuZGF0YVRyYW5zZmVyKXJldHVybiBldmVudC5kYXRhVHJhbnNmZXJcbiAgcmV0dXJuICBldmVudC5vcmlnaW5hbEV2ZW50ID8gZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIgOiBudWxsXG59XG5cblxuaW50ZXJmYWNlIFRyYW5zZmVyT2JqZWN0IHtcbiAgaXRlbXM/OiBhbnlbXVxuICBmaWxlcz86IGFueVtdXG4gIGRyb3BFZmZlY3Q/OiAnY29weScgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0RhdGFUcmFuc2Zlci9kcm9wRWZmZWN0XG59XG4iXX0=