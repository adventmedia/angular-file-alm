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
        this.fileElm = label.getElementsByTagName('input')[0];
        this.fileElm.addEventListener('change', change);
        return this.element.nativeElement.appendChild(label); // put on html stage
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9maWxlLXVwbG9hZC9uZ2YuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDaEgsT0FBTyxFQUFFLDRCQUE0QixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTtBQUNuRyxPQUFPLEVBQ0wsVUFBVSxFQUNWLGlCQUFpQixFQUFFLE9BQU8sRUFDM0IsTUFBTSxhQUFhLENBQUE7QUFPcEI7O0VBRUU7QUFLRixNQUFNLE9BQU8sR0FBRztJQWdDZCxZQUFtQixPQUFrQjtRQUFsQixZQUFPLEdBQVAsT0FBTyxDQUFXO1FBOUJyQyxZQUFPLEdBQStDLEVBQUUsQ0FBQTtRQUN4RCxrQkFBYSxHQUFXLENBQUMsQ0FBQTtRQUtoQixzQkFBaUIsR0FBWSxJQUFJLENBQUE7UUFFakMscUJBQWdCLEdBQVksS0FBSyxDQUFBO1FBQ2pDLGVBQVUsR0FBcUIsS0FBSyxDQUFBO1FBQzdCLGtCQUFhLEdBQXFCLElBQUksWUFBWSxFQUFFLENBQUE7UUFFM0QsaUJBQVksR0FBcUIsRUFBRSxDQUFBO1FBQ2xDLHVCQUFrQixHQUEyQyxJQUFJLFlBQVksRUFBRSxDQUFBO1FBRy9FLHNCQUFpQixHQUF3QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRzNELGVBQVUsR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUVwRCxVQUFLLEdBQVUsRUFBRSxDQUFBO1FBQ2hCLGdCQUFXLEdBQXdCLElBQUksWUFBWSxFQUFVLENBQUM7UUFFOUQsb0JBQWUsR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQU9oRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDcEIsQ0FBQztJQUVELFdB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QyxPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUE7SUFDL0MsT0FBUSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO0FBQ3ZFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgRWxlbWVudFJlZiwgSW5wdXQsIE91dHB1dCwgSG9zdExpc3RlbmVyLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBjcmVhdGVJbnZpc2libGVGaWxlSW5wdXRXcmFwLCBpc0ZpbGVJbnB1dCwgZGV0ZWN0U3dpcGUgfSBmcm9tIFwiLi9kb2MtZXZlbnQtaGVscC5mdW5jdGlvbnNcIlxuaW1wb3J0IHtcbiAgYWNjZXB0VHlwZSwgSW52YWxpZEZpbGVJdGVtLFxuICBhcHBseUV4aWZSb3RhdGlvbiwgZGF0YVVybFxufSBmcm9tIFwiLi9maWxlVG9vbHNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIGRyYWdNZXRhe1xuICB0eXBlOnN0cmluZ1xuICBraW5kOnN0cmluZ1xufVxuXG4vKiogQSBtYXN0ZXIgYmFzZSBzZXQgb2YgbG9naWMgaW50ZW5kZWQgdG8gc3VwcG9ydCBmaWxlIHNlbGVjdC9kcmFnL2Ryb3Agb3BlcmF0aW9uc1xuIE5PVEU6IFVzZSBuZ2ZEcm9wIGZvciBmdWxsIGRyYWcvZHJvcC4gVXNlIG5nZlNlbGVjdCBmb3Igc2VsZWN0aW5nXG4qL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiBcIltuZ2ZdXCIsXG4gIGV4cG9ydEFzOlwibmdmXCJcbn0pXG5leHBvcnQgY2xhc3MgbmdmIHtcbiAgZmlsZUVsbTogYW55XG4gIGZpbHRlcnM6IHtuYW1lOiBzdHJpbmcsIGZuOiAoZmlsZTpGaWxlKT0+Ym9vbGVhbn1bXSA9IFtdXG4gIGxhc3RGaWxlQ291bnQ6IG51bWJlciA9IDBcblxuICBASW5wdXQoKSBtdWx0aXBsZSAhOnN0cmluZ1xuICBASW5wdXQoKSBhY2NlcHQgICAhOnN0cmluZ1xuICBASW5wdXQoKSBtYXhTaXplICAhOm51bWJlclxuICBASW5wdXQoKSBuZ2ZGaXhPcmllbnRhdGlvbjogYm9vbGVhbiA9IHRydWVcblxuICBASW5wdXQoKSBmaWxlRHJvcERpc2FibGVkOiBib29sZWFuID0gZmFsc2VcbiAgQElucHV0KCkgc2VsZWN0YWJsZTogYm9vbGVhbiB8IHN0cmluZyA9IGZhbHNlXG4gIEBPdXRwdXQoJ2luaXQnKSBkaXJlY3RpdmVJbml0OkV2ZW50RW1pdHRlcjxuZ2Y+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgbGFzdEludmFsaWRzOkludmFsaWRGaWxlSXRlbVtdID0gW11cbiAgQE91dHB1dCgpIGxhc3RJbnZhbGlkc0NoYW5nZTpFdmVudEVtaXR0ZXI8e2ZpbGU6RmlsZSx0eXBlOnN0cmluZ31bXT4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBsYXN0QmFzZVVybCE6IHN0cmluZy8vYmFzZTY0IGxhc3QgZmlsZSB1cGxvYWRlZCB1cmxcbiAgQE91dHB1dCgpIGxhc3RCYXNlVXJsQ2hhbmdlOkV2ZW50RW1pdHRlcjxzdHJpbmc+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgZmlsZSE6IEZpbGUvL2xhc3QgZmlsZSB1cGxvYWRlZFxuICBAT3V0cHV0KCkgZmlsZUNoYW5nZTogRXZlbnRFbWl0dGVyPEZpbGU+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgZmlsZXM6RmlsZVtdID0gW11cbiAgQE91dHB1dCgpIGZpbGVzQ2hhbmdlOkV2ZW50RW1pdHRlcjxGaWxlW10+ID0gbmV3IEV2ZW50RW1pdHRlcjxGaWxlW10+KCk7XG5cbiAgQE91dHB1dCgpIGZpbGVTZWxlY3RTdGFydDpFdmVudEVtaXR0ZXI8RXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgY2FwdHVyZVBhc3RlOiBib29sZWFuIC8vIHdpbmRvdyBwYXN0ZSBmaWxlIHdhdGNoaW5nIChlbXB0eSBzdHJpbmcgdHVybnMgb24pXG5cbiAgcGFzdGVDYXB0dXJlciE6IChlOiBFdmVudCkgPT4gdm9pZCAvLyBnb2VzIHdpdGggY2FwdHVyZVBhc3RlXG5cbiAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnQ6RWxlbWVudFJlZil7XG4gICAgdGhpcy5pbml0RmlsdGVycygpXG4gIH1cblxuICBpbml0RmlsdGVycygpe1xuICAgIC8vIHRoZSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICB0aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2FjY2VwdCcsIGZuOiB0aGlzLl9hY2NlcHRGaWx0ZXJ9KVxuICAgIHRoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnZmlsZVNpemUnLCBmbjogdGhpcy5fZmlsZVNpemVGaWx0ZXJ9KVxuXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2ZpbGVUeXBlJywgZm46IHRoaXMuX2ZpbGVUeXBlRmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAncXVldWVMaW1pdCcsIGZuOiB0aGlzLl9xdWV1ZUxpbWl0RmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnbWltZVR5cGUnLCBmbjogdGhpcy5fbWltZVR5cGVGaWx0ZXJ9KVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKXtcbiAgICBkZWxldGUgdGhpcy5maWxlRWxtLy9mYXN0ZXIgbWVtb3J5IHJlbGVhc2Ugb2YgZG9tIGVsZW1lbnRcbiAgICB0aGlzLmRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCk7XG4gIH1cblxuICBuZ09uSW5pdCgpe1xuICAgIGNvbnN0IHNlbGVjdGFibGUgPSAodGhpcy5zZWxlY3RhYmxlIHx8IHRoaXMuc2VsZWN0YWJsZT09PScnKSAmJiAhWydmYWxzZScsICdudWxsJywgJzAnXS5pbmNsdWRlcyh0aGlzLnNlbGVjdGFibGUgYXMgc3RyaW5nKTtcbiAgICBpZiggc2VsZWN0YWJsZSApe1xuICAgICAgdGhpcy5lbmFibGVTZWxlY3RpbmcoKVxuICAgIH1cblxuICAgIGlmKCB0aGlzLm11bHRpcGxlICl7XG4gICAgICB0aGlzLnBhcmFtRmlsZUVsbSgpLnNldEF0dHJpYnV0ZSgnbXVsdGlwbGUnLCB0aGlzLm11bHRpcGxlKVxuICAgIH1cblxuICAgIHRoaXMuZXZhbENhcHR1cmVQYXN0ZSgpO1xuXG4gICAgLy8gY3JlYXRlIHJlZmVyZW5jZSB0byB0aGlzIGNsYXNzIHdpdGggb25lIGN5Y2xlIGRlbGF5IHRvIGF2b2lkIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3JcbiAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICB0aGlzLmRpcmVjdGl2ZUluaXQuZW1pdCh0aGlzKVxuICAgIH0sIDApXG4gIH1cblxuICBuZ09uQ2hhbmdlcyggY2hhbmdlczogU2ltcGxlQ2hhbmdlcyApe1xuICAgIGlmKCBjaGFuZ2VzLmFjY2VwdCApe1xuICAgICAgdGhpcy5wYXJhbUZpbGVFbG0oKS5zZXRBdHRyaWJ1dGUoJ2FjY2VwdCcsIGNoYW5nZXMuYWNjZXB0LmN1cnJlbnRWYWx1ZSB8fCAnKicpXG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXMuY2FwdHVyZVBhc3RlKSB7XG4gICAgICB0aGlzLmV2YWxDYXB0dXJlUGFzdGUoKTtcbiAgICB9XG5cbiAgICAvLyBEaWQgd2UgZ28gZnJvbSBoYXZpbmcgYSBmaWxlIHRvIG5vdCBoYXZpbmcgYSBmaWxlPyBDbGVhciBmaWxlIGVsZW1lbnQgdGhlblxuICAgIGlmIChjaGFuZ2VzLmZpbGUgJiYgY2hhbmdlcy5maWxlLnByZXZpb3VzVmFsdWUgJiYgIWNoYW5nZXMuZmlsZS5jdXJyZW50VmFsdWUpIHtcbiAgICAgIHRoaXMuY2xlYXJGaWxlRWxtVmFsdWUoKVxuICAgIH1cblxuICAgIC8vIERpZCB3ZSBnbyBmcm9tIGhhdmluZyBmaWxlcyB0byBub3QgaGF2aW5nIGZpbGVzPyBDbGVhciBmaWxlIGVsZW1lbnQgdGhlblxuICAgIGlmIChjaGFuZ2VzLmZpbGVzKSB7XG4gICAgICBjb25zdCBmaWxlc1dlbnRUb1plcm8gPSBjaGFuZ2VzLmZpbGVzLnByZXZpb3VzVmFsdWU/Lmxlbmd0aCAmJiAhY2hhbmdlcy5maWxlcy5jdXJyZW50VmFsdWU/Lmxlbmd0aFxuXG4gICAgICBpZiAoZmlsZXNXZW50VG9aZXJvKSB7XG4gICAgICAgIHRoaXMuY2xlYXJGaWxlRWxtVmFsdWUoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGV2YWxDYXB0dXJlUGFzdGUoKSB7XG4gICAgY29uc3QgaXNBY3RpdmUgPSB0aGlzLmNhcHR1cmVQYXN0ZSB8fCAodGhpcy5jYXB0dXJlUGFzdGUgYXMgYW55KT09PScnIHx8IFsnZmFsc2UnLCAnMCcsICdudWxsJ10uaW5jbHVkZXModGhpcy5jYXB0dXJlUGFzdGUgYXMgYW55KTtcblxuICAgIGlmIChpc0FjdGl2ZSkge1xuICAgICAgaWYgKHRoaXMucGFzdGVDYXB0dXJlcikge1xuICAgICAgICByZXR1cm47IC8vIGFscmVhZHkgbGlzdGVuaW5nXG4gICAgICB9XG5cbiAgICAgIHRoaXMucGFzdGVDYXB0dXJlciA9IChlOiBFdmVudCkgPT4ge1xuICAgICAgICBjb25zdCBjbGlwID0gKGUgYXMgYW55KS5jbGlwYm9hcmREYXRhO1xuICAgICAgICBpZiAoY2xpcCAmJiBjbGlwLmZpbGVzICYmIGNsaXAuZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVGaWxlcyhjbGlwLmZpbGVzKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgdGhpcy5wYXN0ZUNhcHR1cmVyKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZGVzdHJveVBhc3RlTGlzdGVuZXIoKTtcbiAgfVxuXG4gIGRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCkge1xuICAgIGlmICh0aGlzLnBhc3RlQ2FwdHVyZXIpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMucGFzdGVDYXB0dXJlcik7XG4gICAgICBkZWxldGUgdGhpcy5wYXN0ZUNhcHR1cmVyO1xuICAgIH1cbiAgfVxuXG4gIHBhcmFtRmlsZUVsbSgpe1xuICAgIGlmKCB0aGlzLmZpbGVFbG0gKXJldHVybiB0aGlzLmZpbGVFbG0gLy8gYWxyZWFkeSBkZWZpbmVkXG5cbiAgICAvLyBlbG0gYWxyZWFkeSBpcyBhIGZpbGUgaW5wdXRcbiAgICBjb25zdCBpc0ZpbGUgPSBpc0ZpbGVJbnB1dCggdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQgKVxuICAgIGlmKGlzRmlsZSl7XG4gICAgICByZXR1cm4gdGhpcy5maWxlRWxtID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnRcbiAgICB9XG5cbiAgICAvLyB0aGUgaG9zdCBlbG0gaXMgTk9UIGEgZmlsZSBpbnB1dFxuICAgIHJldHVybiB0aGlzLmZpbGVFbG0gPSB0aGlzLmNyZWF0ZUZpbGVFbG0oe1xuICAgICAgY2hhbmdlOiB0aGlzLmNoYW5nZUZuLmJpbmQodGhpcylcbiAgICB9KVxuICB9XG5cbiAgLyoqIE9ubHkgdXNlZCB3aGVuIGhvc3QgZWxlbWVudCB3ZSBhcmUgYXR0YWNoZWQgdG8gaXMgTk9UIGEgZmlsZUVsZW1lbnQgKi9cbiAgY3JlYXRlRmlsZUVsbSh7Y2hhbmdlfToge2NoYW5nZTooKSA9PiBhbnl9KSB7XG4gICAgLy8gdXNlIHNwZWNpZmljIHRlY2huaXF1ZSB0byBoaWRlIGZpbGUgZWxlbWVudCB3aXRoaW5cbiAgICBjb25zdCBsYWJlbCA9IGNyZWF0ZUludmlzaWJsZUZpbGVJbnB1dFdyYXAoKVxuXG4gICAgdGhpcy5maWxlRWxtID0gbGFiZWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JylbMF1cbiAgICB0aGlzLmZpbGVFbG0uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgY2hhbmdlKTtcblxuICAgIHJldHVybiB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZCggbGFiZWwgKSAvLyBwdXQgb24gaHRtbCBzdGFnZVxuICB9XG5cbiAgZW5hYmxlU2VsZWN0aW5nKCl7XG4gICAgbGV0IGVsbSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50XG5cbiAgICBpZiggaXNGaWxlSW5wdXQoZWxtKSApe1xuICAgICAgY29uc3QgYmluZGVkSGFuZGxlciA9IGV2ZW50ID0+IHRoaXMuYmVmb3JlU2VsZWN0KGV2ZW50KVxuICAgICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYmluZGVkSGFuZGxlcilcbiAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgYmluZGVkSGFuZGxlcilcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGJpbmRlZEhhbmRsZXIgPSBldiA9PiB0aGlzLmNsaWNrSGFuZGxlcihldilcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBiaW5kZWRIYW5kbGVyKVxuICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgYmluZGVkSGFuZGxlcilcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBiaW5kZWRIYW5kbGVyKVxuICB9XG5cbiAgZ2V0VmFsaWRGaWxlcyggZmlsZXM6RmlsZVtdICk6RmlsZVtde1xuICAgIGNvbnN0IHJ0bjpGaWxlW10gPSBbXVxuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgaWYoIHRoaXMuaXNGaWxlVmFsaWQoZmlsZXNbeF0pICl7XG4gICAgICAgIHJ0bi5wdXNoKCBmaWxlc1t4XSApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydG5cbiAgfVxuXG4gIGdldEludmFsaWRGaWxlcyhmaWxlczpGaWxlW10pOkludmFsaWRGaWxlSXRlbVtde1xuICAgIGNvbnN0IHJ0bjpJbnZhbGlkRmlsZUl0ZW1bXSA9IFtdXG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBsZXQgZmFpbFJlYXNvbiA9IHRoaXMuZ2V0RmlsZUZpbHRlckZhaWxOYW1lKGZpbGVzW3hdKVxuICAgICAgaWYoIGZhaWxSZWFzb24gKXtcbiAgICAgICAgcnRuLnB1c2goe1xuICAgICAgICAgIGZpbGUgOiBmaWxlc1t4XSxcbiAgICAgICAgICB0eXBlIDogZmFpbFJlYXNvblxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnRuXG4gIH1cblxuICAvLyBQcmltYXJ5IGhhbmRsZXIgb2YgZmlsZXMgY29taW5nIGluXG4gIGhhbmRsZUZpbGVzKGZpbGVzOkZpbGVbXSl7XG4gICAgY29uc3QgdmFsaWRzID0gdGhpcy5nZXRWYWxpZEZpbGVzKGZpbGVzKVxuXG4gICAgaWYoZmlsZXMubGVuZ3RoIT12YWxpZHMubGVuZ3RoKXtcbiAgICAgIHRoaXMubGFzdEludmFsaWRzID0gdGhpcy5nZXRJbnZhbGlkRmlsZXMoZmlsZXMpXG4gICAgfWVsc2V7XG4gICAgICBkZWxldGUgdGhpcy5sYXN0SW52YWxpZHNcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RJbnZhbGlkc0NoYW5nZS5lbWl0KHRoaXMubGFzdEludmFsaWRzKVxuXG4gICAgaWYoIHZhbGlkcy5sZW5ndGggKXtcbiAgICAgIGlmKCB0aGlzLm5nZkZpeE9yaWVudGF0aW9uICl7XG4gICAgICAgIHRoaXMuYXBwbHlFeGlmUm90YXRpb25zKHZhbGlkcylcbiAgICAgICAgLnRoZW4oIGZpeGVkRmlsZXM9PnRoaXMucXVlKGZpeGVkRmlsZXMpIClcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLnF1ZSh2YWxpZHMpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNFbXB0eUFmdGVyU2VsZWN0aW9uKCkpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LnZhbHVlID0gJydcbiAgICB9XG4gIH1cblxuICBxdWUoIGZpbGVzOkZpbGVbXSApe1xuICAgIHRoaXMuZmlsZXMgPSB0aGlzLmZpbGVzIHx8IFtdXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcy5maWxlcywgZmlsZXMpXG5cbiAgICAvL2JlbG93IGJyZWFrIG1lbW9yeSByZWYgYW5kIGRvZXNudCBhY3QgbGlrZSBhIHF1ZVxuICAgIC8vdGhpcy5maWxlcyA9IGZpbGVzLy9jYXVzZXMgbWVtb3J5IGNoYW5nZSB3aGljaCB0cmlnZ2VycyBiaW5kaW5ncyBsaWtlIDxuZ2ZGb3JtRGF0YSBbZmlsZXNdPVwiZmlsZXNcIj48L25nZkZvcm1EYXRhPlxuXG4gICAgdGhpcy5maWxlc0NoYW5nZS5lbWl0KCB0aGlzLmZpbGVzIClcblxuICAgIGlmKGZpbGVzLmxlbmd0aCl7XG4gICAgICB0aGlzLmZpbGVDaGFuZ2UuZW1pdCggdGhpcy5maWxlPWZpbGVzWzBdIClcblxuICAgICAgaWYodGhpcy5sYXN0QmFzZVVybENoYW5nZS5vYnNlcnZlcnMubGVuZ3RoKXtcbiAgICAgICAgZGF0YVVybCggZmlsZXNbMF0gKVxuICAgICAgICAudGhlbiggdXJsPT50aGlzLmxhc3RCYXNlVXJsQ2hhbmdlLmVtaXQodXJsKSApXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy93aWxsIGJlIGNoZWNrZWQgZm9yIGlucHV0IHZhbHVlIGNsZWFyaW5nXG4gICAgdGhpcy5sYXN0RmlsZUNvdW50ID0gdGhpcy5maWxlcy5sZW5ndGhcbiAgfVxuXG4gIC8qKiBjYWxsZWQgd2hlbiBpbnB1dCBoYXMgZmlsZXMgKi9cbiAgY2hhbmdlRm4oZXZlbnQ6YW55KSB7XG4gICAgdmFyIGZpbGVMaXN0ID0gZXZlbnQuX19maWxlc18gfHwgKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQuZmlsZXMpXG5cbiAgICBpZiAoIWZpbGVMaXN0KSByZXR1cm47XG5cbiAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgdGhpcy5oYW5kbGVGaWxlcyhmaWxlTGlzdClcbiAgfVxuXG4gIGNsaWNrSGFuZGxlcihldnQ6IEV2ZW50KXtcbiAgICBjb25zdCBlbG0gPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudFxuICAgIGlmIChlbG0uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpIHx8IHRoaXMuZmlsZURyb3BEaXNhYmxlZCl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHIgPSBkZXRlY3RTd2lwZShldnQpO1xuICAgIC8vIHByZXZlbnQgdGhlIGNsaWNrIGlmIGl0IGlzIGEgc3dpcGVcbiAgICBpZiAoIHIhPT1mYWxzZSApIHJldHVybiByO1xuXG4gICAgY29uc3QgZmlsZUVsbSA9IHRoaXMucGFyYW1GaWxlRWxtKClcbiAgICBmaWxlRWxtLmNsaWNrKClcbiAgICAvL2ZpbGVFbG0uZGlzcGF0Y2hFdmVudCggbmV3IEV2ZW50KCdjbGljaycpICk7XG4gICAgdGhpcy5iZWZvcmVTZWxlY3QoZXZ0KVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgYmVmb3JlU2VsZWN0KGV2ZW50OiBFdmVudCl7XG4gICAgdGhpcy5maWxlU2VsZWN0U3RhcnQuZW1pdChldmVudClcblxuICAgIGlmKCB0aGlzLmZpbGVzICYmIHRoaXMubGFzdEZpbGVDb3VudD09PXRoaXMuZmlsZXMubGVuZ3RoIClyZXR1cm5cblxuICAgIC8vIGlmIG5vIGZpbGVzIGluIGFycmF5LCBiZSBzdXJlIGJyb3dzZXIgZG9lcyBub3QgcHJldmVudCByZXNlbGVjdCBvZiBzYW1lIGZpbGUgKHNlZSBnaXRodWIgaXNzdWUgMjcpXG4gICAgdGhpcy5jbGVhckZpbGVFbG1WYWx1ZSgpXG4gIH1cblxuICBjbGVhckZpbGVFbG1WYWx1ZSgpIHtcbiAgICBpZiAoIXRoaXMuZmlsZUVsbSkgcmV0dXJuXG5cbiAgICB0aGlzLmZpbGVFbG0udmFsdWUgPSBudWxsXG4gIH1cblxuICBpc0VtcHR5QWZ0ZXJTZWxlY3Rpb24oKTpib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5hdHRyaWJ1dGVzLm11bHRpcGxlO1xuICB9XG5cbiAgc3RvcEV2ZW50KGV2ZW50OmFueSk6YW55IHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgdHJhbnNmZXJIYXNGaWxlcyh0cmFuc2ZlcjphbnkpOmFueSB7XG4gICAgaWYgKCF0cmFuc2Zlci50eXBlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0cmFuc2Zlci50eXBlcy5pbmRleE9mKSB7XG4gICAgICByZXR1cm4gdHJhbnNmZXIudHlwZXMuaW5kZXhPZignRmlsZXMnKSAhPT0gLTE7XG4gICAgfSBlbHNlIGlmICh0cmFuc2Zlci50eXBlcy5jb250YWlucykge1xuICAgICAgcmV0dXJuIHRyYW5zZmVyLnR5cGVzLmNvbnRhaW5zKCdGaWxlcycpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgZXZlbnRUb0ZpbGVzKGV2ZW50OkV2ZW50KXtcbiAgICBjb25zdCB0cmFuc2ZlciA9IGV2ZW50VG9UcmFuc2ZlcihldmVudCk7XG4gICAgaWYoIHRyYW5zZmVyICl7XG4gICAgICBpZih0cmFuc2Zlci5maWxlcyAmJiB0cmFuc2Zlci5maWxlcy5sZW5ndGgpe1xuICAgICAgICByZXR1cm4gdHJhbnNmZXIuZmlsZXNcbiAgICAgIH1cbiAgICAgIGlmKHRyYW5zZmVyLml0ZW1zICYmIHRyYW5zZmVyLml0ZW1zLmxlbmd0aCl7XG4gICAgICAgIHJldHVybiB0cmFuc2Zlci5pdGVtc1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIGFwcGx5RXhpZlJvdGF0aW9ucyhcbiAgICBmaWxlczpGaWxlW11cbiAgKTpQcm9taXNlPEZpbGVbXT57XG4gICAgY29uc3QgbWFwcGVyID0gKFxuICAgICAgZmlsZTpGaWxlLGluZGV4Om51bWJlclxuICAgICk6UHJvbWlzZTxhbnk+PT57XG4gICAgICByZXR1cm4gYXBwbHlFeGlmUm90YXRpb24oZmlsZSlcbiAgICAgIC50aGVuKCBmaXhlZEZpbGU9PmZpbGVzLnNwbGljZShpbmRleCwgMSwgZml4ZWRGaWxlKSApXG4gICAgfVxuXG4gICAgY29uc3QgcHJvbXM6UHJvbWlzZTxhbnk+W10gPSBbXVxuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgcHJvbXNbeF0gPSBtYXBwZXIoIGZpbGVzW3hdLCB4IClcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKCBwcm9tcyApLnRoZW4oICgpPT5maWxlcyApXG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdjaGFuZ2UnLCBbJyRldmVudCddKVxuICBvbkNoYW5nZShldmVudDpFdmVudCk6dm9pZCB7XG4gICAgbGV0IGZpbGVzID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuZmlsZXMgfHwgdGhpcy5ldmVudFRvRmlsZXMoZXZlbnQpXG5cbiAgICBpZighZmlsZXMubGVuZ3RoKXJldHVyblxuXG4gICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgIHRoaXMuaGFuZGxlRmlsZXMoZmlsZXMpXG4gIH1cblxuICBnZXRGaWxlRmlsdGVyRmFpbE5hbWUoXG4gICAgZmlsZTpGaWxlXG4gICk6c3RyaW5nIHwgdW5kZWZpbmVke1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLmZpbHRlcnMubGVuZ3RoOyBpKyspe1xuICAgICAgaWYoICF0aGlzLmZpbHRlcnNbaV0uZm4uY2FsbCh0aGlzLCBmaWxlKSApe1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW2ldLm5hbWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgaXNGaWxlVmFsaWQoZmlsZTpGaWxlKTpib29sZWFue1xuICAgIGNvbnN0IG5vRmlsdGVycyA9ICF0aGlzLmFjY2VwdCAmJiAoIXRoaXMuZmlsdGVycyB8fCAhdGhpcy5maWx0ZXJzLmxlbmd0aClcbiAgICBpZiggbm9GaWx0ZXJzICl7XG4gICAgICByZXR1cm4gdHJ1ZS8vd2UgaGF2ZSBubyBmaWx0ZXJzIHNvIGFsbCBmaWxlcyBhcmUgdmFsaWRcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5nZXRGaWxlRmlsdGVyRmFpbE5hbWUoZmlsZSkgPyBmYWxzZSA6IHRydWVcbiAgfVxuXG4gIGlzRmlsZXNWYWxpZChmaWxlczpGaWxlW10pe1xuICAgIGZvcihsZXQgeD1maWxlcy5sZW5ndGgtMTsgeCA+PSAwOyAtLXgpe1xuICAgICAgaWYoICF0aGlzLmlzRmlsZVZhbGlkKGZpbGVzW3hdKSApe1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHByb3RlY3RlZCBfYWNjZXB0RmlsdGVyKGl0ZW06RmlsZSk6Ym9vbGVhbiB7XG4gICAgcmV0dXJuIGFjY2VwdFR5cGUodGhpcy5hY2NlcHQsIGl0ZW0udHlwZSwgaXRlbS5uYW1lKVxuICB9XG5cbiAgcHJvdGVjdGVkIF9maWxlU2l6ZUZpbHRlcihpdGVtOkZpbGUpOmJvb2xlYW4ge1xuICAgIHJldHVybiAhKHRoaXMubWF4U2l6ZSAmJiBpdGVtLnNpemUgPiB0aGlzLm1heFNpemUpO1xuICB9XG59XG5cblxuLyoqIGJyb3dzZXJzIHRyeSBoYXJkIHRvIGNvbmNlYWwgZGF0YSBhYm91dCBmaWxlIGRyYWdzLCB0aGlzIHRlbmRzIHRvIHVuZG8gdGhhdCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbGVzVG9Xcml0ZWFibGVPYmplY3QoIGZpbGVzOkZpbGVbXSApOmRyYWdNZXRhW117XG4gIGNvbnN0IGpzb25GaWxlczpkcmFnTWV0YVtdID0gW11cbiAgZm9yKGxldCB4PTA7IHggPCBmaWxlcy5sZW5ndGg7ICsreCl7XG4gICAganNvbkZpbGVzLnB1c2goe1xuICAgICAgdHlwZTpmaWxlc1t4XS50eXBlLFxuICAgICAga2luZDpmaWxlc1t4XVtcImtpbmRcIl1cbiAgICB9KVxuICB9XG4gIHJldHVybiBqc29uRmlsZXNcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV2ZW50VG9UcmFuc2ZlcihldmVudDogYW55KTogVHJhbnNmZXJPYmplY3Qge1xuICBpZihldmVudC5kYXRhVHJhbnNmZXIpcmV0dXJuIGV2ZW50LmRhdGFUcmFuc2ZlclxuICByZXR1cm4gIGV2ZW50Lm9yaWdpbmFsRXZlbnQgPyBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2ZlciA6IG51bGxcbn1cblxuXG5pbnRlcmZhY2UgVHJhbnNmZXJPYmplY3Qge1xuICBpdGVtcz86IGFueVtdXG4gIGZpbGVzPzogYW55W11cbiAgZHJvcEVmZmVjdD86ICdjb3B5JyAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRGF0YVRyYW5zZmVyL2Ryb3BFZmZlY3Rcbn0iXX0=