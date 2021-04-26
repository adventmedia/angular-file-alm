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
        var _a;
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
            const filesWentToZero = changes.files.previousValue.length && !((_a = changes.files.currentValue) === null || _a === void 0 ? void 0 : _a.length);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9maWxlLXVwbG9hZC9uZ2YuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDaEgsT0FBTyxFQUFFLDRCQUE0QixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTtBQUNuRyxPQUFPLEVBQ0wsVUFBVSxFQUNWLGlCQUFpQixFQUFFLE9BQU8sRUFDM0IsTUFBTSxhQUFhLENBQUE7QUFPcEI7O0VBRUU7QUFLRixNQUFNLE9BQU8sR0FBRztJQWdDZCxZQUFtQixPQUFrQjtRQUFsQixZQUFPLEdBQVAsT0FBTyxDQUFXO1FBOUJyQyxZQUFPLEdBQStDLEVBQUUsQ0FBQTtRQUN4RCxrQkFBYSxHQUFXLENBQUMsQ0FBQTtRQUtoQixzQkFBaUIsR0FBWSxJQUFJLENBQUE7UUFFakMscUJBQWdCLEdBQVksS0FBSyxDQUFBO1FBQ2pDLGVBQVUsR0FBcUIsS0FBSyxDQUFBO1FBQzdCLGtCQUFhLEdBQXFCLElBQUksWUFBWSxFQUFFLENBQUE7UUFFM0QsaUJBQVksR0FBcUIsRUFBRSxDQUFBO1FBQ2xDLHVCQUFrQixHQUEyQyxJQUFJLFlBQVksRUFBRSxDQUFBO1FBRy9FLHNCQUFpQixHQUF3QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRzNELGVBQVUsR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUVwRCxVQUFLLEdBQVUsRUFBRSxDQUFBO1FBQ2hCLGdCQUFXLEdBQXdCLElBQUksWUFBWSxFQUFVLENBQUM7UUFFOUQsb0JBQWUsR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQU9oRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDcEIsQ0FBQztJQUVELFdB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LEtBQUssQ0FBQyxZQUFZLENBQUE7SUFDL0MsT0FBUSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO0FBQ3ZFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgRWxlbWVudFJlZiwgSW5wdXQsIE91dHB1dCwgSG9zdExpc3RlbmVyLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBjcmVhdGVJbnZpc2libGVGaWxlSW5wdXRXcmFwLCBpc0ZpbGVJbnB1dCwgZGV0ZWN0U3dpcGUgfSBmcm9tIFwiLi9kb2MtZXZlbnQtaGVscC5mdW5jdGlvbnNcIlxuaW1wb3J0IHtcbiAgYWNjZXB0VHlwZSwgSW52YWxpZEZpbGVJdGVtLFxuICBhcHBseUV4aWZSb3RhdGlvbiwgZGF0YVVybFxufSBmcm9tIFwiLi9maWxlVG9vbHNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIGRyYWdNZXRhe1xuICB0eXBlOnN0cmluZ1xuICBraW5kOnN0cmluZ1xufVxuXG4vKiogQSBtYXN0ZXIgYmFzZSBzZXQgb2YgbG9naWMgaW50ZW5kZWQgdG8gc3VwcG9ydCBmaWxlIHNlbGVjdC9kcmFnL2Ryb3Agb3BlcmF0aW9uc1xuIE5PVEU6IFVzZSBuZ2ZEcm9wIGZvciBmdWxsIGRyYWcvZHJvcC4gVXNlIG5nZlNlbGVjdCBmb3Igc2VsZWN0aW5nXG4qL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiBcIltuZ2ZdXCIsXG4gIGV4cG9ydEFzOlwibmdmXCJcbn0pXG5leHBvcnQgY2xhc3MgbmdmIHtcbiAgZmlsZUVsbTogYW55XG4gIGZpbHRlcnM6IHtuYW1lOiBzdHJpbmcsIGZuOiAoZmlsZTpGaWxlKT0+Ym9vbGVhbn1bXSA9IFtdXG4gIGxhc3RGaWxlQ291bnQ6IG51bWJlciA9IDBcblxuICBASW5wdXQoKSBtdWx0aXBsZSAhOnN0cmluZ1xuICBASW5wdXQoKSBhY2NlcHQgICAhOnN0cmluZ1xuICBASW5wdXQoKSBtYXhTaXplICAhOm51bWJlclxuICBASW5wdXQoKSBuZ2ZGaXhPcmllbnRhdGlvbjogYm9vbGVhbiA9IHRydWVcblxuICBASW5wdXQoKSBmaWxlRHJvcERpc2FibGVkOiBib29sZWFuID0gZmFsc2VcbiAgQElucHV0KCkgc2VsZWN0YWJsZTogYm9vbGVhbiB8IHN0cmluZyA9IGZhbHNlXG4gIEBPdXRwdXQoJ2luaXQnKSBkaXJlY3RpdmVJbml0OkV2ZW50RW1pdHRlcjxuZ2Y+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgbGFzdEludmFsaWRzOkludmFsaWRGaWxlSXRlbVtdID0gW11cbiAgQE91dHB1dCgpIGxhc3RJbnZhbGlkc0NoYW5nZTpFdmVudEVtaXR0ZXI8e2ZpbGU6RmlsZSx0eXBlOnN0cmluZ31bXT4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBsYXN0QmFzZVVybCE6IHN0cmluZy8vYmFzZTY0IGxhc3QgZmlsZSB1cGxvYWRlZCB1cmxcbiAgQE91dHB1dCgpIGxhc3RCYXNlVXJsQ2hhbmdlOkV2ZW50RW1pdHRlcjxzdHJpbmc+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgZmlsZSE6IEZpbGUvL2xhc3QgZmlsZSB1cGxvYWRlZFxuICBAT3V0cHV0KCkgZmlsZUNoYW5nZTogRXZlbnRFbWl0dGVyPEZpbGU+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgZmlsZXM6RmlsZVtdID0gW11cbiAgQE91dHB1dCgpIGZpbGVzQ2hhbmdlOkV2ZW50RW1pdHRlcjxGaWxlW10+ID0gbmV3IEV2ZW50RW1pdHRlcjxGaWxlW10+KCk7XG5cbiAgQE91dHB1dCgpIGZpbGVTZWxlY3RTdGFydDpFdmVudEVtaXR0ZXI8RXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgY2FwdHVyZVBhc3RlOiBib29sZWFuIC8vIHdpbmRvdyBwYXN0ZSBmaWxlIHdhdGNoaW5nIChlbXB0eSBzdHJpbmcgdHVybnMgb24pXG5cbiAgcGFzdGVDYXB0dXJlciE6IChlOiBFdmVudCkgPT4gdm9pZCAvLyBnb2VzIHdpdGggY2FwdHVyZVBhc3RlXG5cbiAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnQ6RWxlbWVudFJlZil7XG4gICAgdGhpcy5pbml0RmlsdGVycygpXG4gIH1cblxuICBpbml0RmlsdGVycygpe1xuICAgIC8vIHRoZSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICB0aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2FjY2VwdCcsIGZuOiB0aGlzLl9hY2NlcHRGaWx0ZXJ9KVxuICAgIHRoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnZmlsZVNpemUnLCBmbjogdGhpcy5fZmlsZVNpemVGaWx0ZXJ9KVxuXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2ZpbGVUeXBlJywgZm46IHRoaXMuX2ZpbGVUeXBlRmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAncXVldWVMaW1pdCcsIGZuOiB0aGlzLl9xdWV1ZUxpbWl0RmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnbWltZVR5cGUnLCBmbjogdGhpcy5fbWltZVR5cGVGaWx0ZXJ9KVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKXtcbiAgICBkZWxldGUgdGhpcy5maWxlRWxtLy9mYXN0ZXIgbWVtb3J5IHJlbGVhc2Ugb2YgZG9tIGVsZW1lbnRcbiAgICB0aGlzLmRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCk7XG4gIH1cblxuICBuZ09uSW5pdCgpe1xuICAgIGNvbnN0IHNlbGVjdGFibGUgPSAodGhpcy5zZWxlY3RhYmxlIHx8IHRoaXMuc2VsZWN0YWJsZT09PScnKSAmJiAhWydmYWxzZScsICdudWxsJywgJzAnXS5pbmNsdWRlcyh0aGlzLnNlbGVjdGFibGUgYXMgc3RyaW5nKTtcbiAgICBpZiggc2VsZWN0YWJsZSApe1xuICAgICAgdGhpcy5lbmFibGVTZWxlY3RpbmcoKVxuICAgIH1cblxuICAgIGlmKCB0aGlzLm11bHRpcGxlICl7XG4gICAgICB0aGlzLnBhcmFtRmlsZUVsbSgpLnNldEF0dHJpYnV0ZSgnbXVsdGlwbGUnLCB0aGlzLm11bHRpcGxlKVxuICAgIH1cblxuICAgIHRoaXMuZXZhbENhcHR1cmVQYXN0ZSgpO1xuXG4gICAgLy8gY3JlYXRlIHJlZmVyZW5jZSB0byB0aGlzIGNsYXNzIHdpdGggb25lIGN5Y2xlIGRlbGF5IHRvIGF2b2lkIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3JcbiAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICB0aGlzLmRpcmVjdGl2ZUluaXQuZW1pdCh0aGlzKVxuICAgIH0sIDApXG4gIH1cblxuICBuZ09uQ2hhbmdlcyggY2hhbmdlczogU2ltcGxlQ2hhbmdlcyApe1xuICAgIGlmKCBjaGFuZ2VzLmFjY2VwdCApe1xuICAgICAgdGhpcy5wYXJhbUZpbGVFbG0oKS5zZXRBdHRyaWJ1dGUoJ2FjY2VwdCcsIGNoYW5nZXMuYWNjZXB0LmN1cnJlbnRWYWx1ZSB8fCAnKicpXG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXMuY2FwdHVyZVBhc3RlKSB7XG4gICAgICB0aGlzLmV2YWxDYXB0dXJlUGFzdGUoKTtcbiAgICB9XG5cbiAgICAvLyBEaWQgd2UgZ28gZnJvbSBoYXZpbmcgYSBmaWxlIHRvIG5vdCBoYXZpbmcgYSBmaWxlPyBDbGVhciBmaWxlIGVsZW1lbnQgdGhlblxuICAgIGlmIChjaGFuZ2VzLmZpbGUgJiYgY2hhbmdlcy5maWxlLnByZXZpb3VzVmFsdWUgJiYgIWNoYW5nZXMuZmlsZS5jdXJyZW50VmFsdWUpIHtcbiAgICAgIHRoaXMuY2xlYXJGaWxlRWxtVmFsdWUoKVxuICAgIH1cblxuICAgIC8vIERpZCB3ZSBnbyBmcm9tIGhhdmluZyBmaWxlcyB0byBub3QgaGF2aW5nIGZpbGVzPyBDbGVhciBmaWxlIGVsZW1lbnQgdGhlblxuICAgIGlmIChjaGFuZ2VzLmZpbGVzKSB7XG4gICAgICBjb25zdCBmaWxlc1dlbnRUb1plcm8gPSBjaGFuZ2VzLmZpbGVzLnByZXZpb3VzVmFsdWUubGVuZ3RoICYmICFjaGFuZ2VzLmZpbGVzLmN1cnJlbnRWYWx1ZT8ubGVuZ3RoXG5cbiAgICAgIGlmIChmaWxlc1dlbnRUb1plcm8pIHtcbiAgICAgICAgdGhpcy5jbGVhckZpbGVFbG1WYWx1ZSgpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZXZhbENhcHR1cmVQYXN0ZSgpIHtcbiAgICBjb25zdCBpc0FjdGl2ZSA9IHRoaXMuY2FwdHVyZVBhc3RlIHx8ICh0aGlzLmNhcHR1cmVQYXN0ZSBhcyBhbnkpPT09JycgfHwgWydmYWxzZScsICcwJywgJ251bGwnXS5pbmNsdWRlcyh0aGlzLmNhcHR1cmVQYXN0ZSBhcyBhbnkpO1xuXG4gICAgaWYgKGlzQWN0aXZlKSB7XG4gICAgICBpZiAodGhpcy5wYXN0ZUNhcHR1cmVyKSB7XG4gICAgICAgIHJldHVybjsgLy8gYWxyZWFkeSBsaXN0ZW5pbmdcbiAgICAgIH1cblxuICAgICAgdGhpcy5wYXN0ZUNhcHR1cmVyID0gKGU6IEV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGNsaXAgPSAoZSBhcyBhbnkpLmNsaXBib2FyZERhdGE7XG4gICAgICAgIGlmIChjbGlwICYmIGNsaXAuZmlsZXMgJiYgY2xpcC5maWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLmhhbmRsZUZpbGVzKGNsaXAuZmlsZXMpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCB0aGlzLnBhc3RlQ2FwdHVyZXIpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5kZXN0cm95UGFzdGVMaXN0ZW5lcigpO1xuICB9XG5cbiAgZGVzdHJveVBhc3RlTGlzdGVuZXIoKSB7XG4gICAgaWYgKHRoaXMucGFzdGVDYXB0dXJlcikge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgdGhpcy5wYXN0ZUNhcHR1cmVyKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnBhc3RlQ2FwdHVyZXI7XG4gICAgfVxuICB9XG5cbiAgcGFyYW1GaWxlRWxtKCl7XG4gICAgaWYoIHRoaXMuZmlsZUVsbSApcmV0dXJuIHRoaXMuZmlsZUVsbSAvLyBhbHJlYWR5IGRlZmluZWRcblxuICAgIC8vIGVsbSBhbHJlYWR5IGlzIGEgZmlsZSBpbnB1dFxuICAgIGNvbnN0IGlzRmlsZSA9IGlzRmlsZUlucHV0KCB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCApXG4gICAgaWYoaXNGaWxlKXtcbiAgICAgIHJldHVybiB0aGlzLmZpbGVFbG0gPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudFxuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGVsbSBpcyBOT1QgYSBmaWxlIGlucHV0XG4gICAgcmV0dXJuIHRoaXMuZmlsZUVsbSA9IHRoaXMuY3JlYXRlRmlsZUVsbSh7XG4gICAgICBjaGFuZ2U6IHRoaXMuY2hhbmdlRm4uYmluZCh0aGlzKVxuICAgIH0pXG4gIH1cblxuICAvKiogT25seSB1c2VkIHdoZW4gaG9zdCBlbGVtZW50IHdlIGFyZSBhdHRhY2hlZCB0byBpcyBOT1QgYSBmaWxlRWxlbWVudCAqL1xuICBjcmVhdGVGaWxlRWxtKHtjaGFuZ2V9OiB7Y2hhbmdlOigpID0+IGFueX0pIHtcbiAgICAvLyB1c2Ugc3BlY2lmaWMgdGVjaG5pcXVlIHRvIGhpZGUgZmlsZSBlbGVtZW50IHdpdGhpblxuICAgIGNvbnN0IGxhYmVsID0gY3JlYXRlSW52aXNpYmxlRmlsZUlucHV0V3JhcCgpXG5cbiAgICB0aGlzLmZpbGVFbG0gPSBsYWJlbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKVswXVxuICAgIHRoaXMuZmlsZUVsbS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBjaGFuZ2UpO1xuXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmFwcGVuZENoaWxkKCBsYWJlbCApIC8vIHB1dCBvbiBodG1sIHN0YWdlXG4gIH1cblxuICBlbmFibGVTZWxlY3RpbmcoKXtcbiAgICBsZXQgZWxtID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnRcblxuICAgIGlmKCBpc0ZpbGVJbnB1dChlbG0pICl7XG4gICAgICBjb25zdCBiaW5kZWRIYW5kbGVyID0gZXZlbnQgPT4gdGhpcy5iZWZvcmVTZWxlY3QoZXZlbnQpXG4gICAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBiaW5kZWRIYW5kbGVyKVxuICAgICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBiaW5kZWRIYW5kbGVyKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgYmluZGVkSGFuZGxlciA9IGV2ID0+IHRoaXMuY2xpY2tIYW5kbGVyKGV2KVxuICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJpbmRlZEhhbmRsZXIpXG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBiaW5kZWRIYW5kbGVyKVxuICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGJpbmRlZEhhbmRsZXIpXG4gIH1cblxuICBnZXRWYWxpZEZpbGVzKCBmaWxlczpGaWxlW10gKTpGaWxlW117XG4gICAgY29uc3QgcnRuOkZpbGVbXSA9IFtdXG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBpZiggdGhpcy5pc0ZpbGVWYWxpZChmaWxlc1t4XSkgKXtcbiAgICAgICAgcnRuLnB1c2goIGZpbGVzW3hdIClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ0blxuICB9XG5cbiAgZ2V0SW52YWxpZEZpbGVzKGZpbGVzOkZpbGVbXSk6SW52YWxpZEZpbGVJdGVtW117XG4gICAgY29uc3QgcnRuOkludmFsaWRGaWxlSXRlbVtdID0gW11cbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIGxldCBmYWlsUmVhc29uID0gdGhpcy5nZXRGaWxlRmlsdGVyRmFpbE5hbWUoZmlsZXNbeF0pXG4gICAgICBpZiggZmFpbFJlYXNvbiApe1xuICAgICAgICBydG4ucHVzaCh7XG4gICAgICAgICAgZmlsZSA6IGZpbGVzW3hdLFxuICAgICAgICAgIHR5cGUgOiBmYWlsUmVhc29uXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydG5cbiAgfVxuXG4gIC8vIFByaW1hcnkgaGFuZGxlciBvZiBmaWxlcyBjb21pbmcgaW5cbiAgaGFuZGxlRmlsZXMoZmlsZXM6RmlsZVtdKXtcbiAgICBjb25zdCB2YWxpZHMgPSB0aGlzLmdldFZhbGlkRmlsZXMoZmlsZXMpXG5cbiAgICBpZihmaWxlcy5sZW5ndGghPXZhbGlkcy5sZW5ndGgpe1xuICAgICAgdGhpcy5sYXN0SW52YWxpZHMgPSB0aGlzLmdldEludmFsaWRGaWxlcyhmaWxlcylcbiAgICB9ZWxzZXtcbiAgICAgIGRlbGV0ZSB0aGlzLmxhc3RJbnZhbGlkc1xuICAgIH1cblxuICAgIHRoaXMubGFzdEludmFsaWRzQ2hhbmdlLmVtaXQodGhpcy5sYXN0SW52YWxpZHMpXG5cbiAgICBpZiggdmFsaWRzLmxlbmd0aCApe1xuICAgICAgaWYoIHRoaXMubmdmRml4T3JpZW50YXRpb24gKXtcbiAgICAgICAgdGhpcy5hcHBseUV4aWZSb3RhdGlvbnModmFsaWRzKVxuICAgICAgICAudGhlbiggZml4ZWRGaWxlcz0+dGhpcy5xdWUoZml4ZWRGaWxlcykgKVxuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMucXVlKHZhbGlkcylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0VtcHR5QWZ0ZXJTZWxlY3Rpb24oKSkge1xuICAgICAgdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQudmFsdWUgPSAnJ1xuICAgIH1cbiAgfVxuXG4gIHF1ZSggZmlsZXM6RmlsZVtdICl7XG4gICAgdGhpcy5maWxlcyA9IHRoaXMuZmlsZXMgfHwgW11cbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLmZpbGVzLCBmaWxlcylcblxuICAgIC8vYmVsb3cgYnJlYWsgbWVtb3J5IHJlZiBhbmQgZG9lc250IGFjdCBsaWtlIGEgcXVlXG4gICAgLy90aGlzLmZpbGVzID0gZmlsZXMvL2NhdXNlcyBtZW1vcnkgY2hhbmdlIHdoaWNoIHRyaWdnZXJzIGJpbmRpbmdzIGxpa2UgPG5nZkZvcm1EYXRhIFtmaWxlc109XCJmaWxlc1wiPjwvbmdmRm9ybURhdGE+XG5cbiAgICB0aGlzLmZpbGVzQ2hhbmdlLmVtaXQoIHRoaXMuZmlsZXMgKVxuXG4gICAgaWYoZmlsZXMubGVuZ3RoKXtcbiAgICAgIHRoaXMuZmlsZUNoYW5nZS5lbWl0KCB0aGlzLmZpbGU9ZmlsZXNbMF0gKVxuXG4gICAgICBpZih0aGlzLmxhc3RCYXNlVXJsQ2hhbmdlLm9ic2VydmVycy5sZW5ndGgpe1xuICAgICAgICBkYXRhVXJsKCBmaWxlc1swXSApXG4gICAgICAgIC50aGVuKCB1cmw9PnRoaXMubGFzdEJhc2VVcmxDaGFuZ2UuZW1pdCh1cmwpIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL3dpbGwgYmUgY2hlY2tlZCBmb3IgaW5wdXQgdmFsdWUgY2xlYXJpbmdcbiAgICB0aGlzLmxhc3RGaWxlQ291bnQgPSB0aGlzLmZpbGVzLmxlbmd0aFxuICB9XG5cbiAgLyoqIGNhbGxlZCB3aGVuIGlucHV0IGhhcyBmaWxlcyAqL1xuICBjaGFuZ2VGbihldmVudDphbnkpIHtcbiAgICB2YXIgZmlsZUxpc3QgPSBldmVudC5fX2ZpbGVzXyB8fCAoZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5maWxlcylcblxuICAgIGlmICghZmlsZUxpc3QpIHJldHVybjtcblxuICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICB0aGlzLmhhbmRsZUZpbGVzKGZpbGVMaXN0KVxuICB9XG5cbiAgY2xpY2tIYW5kbGVyKGV2dDogRXZlbnQpe1xuICAgIGNvbnN0IGVsbSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50XG4gICAgaWYgKGVsbS5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgfHwgdGhpcy5maWxlRHJvcERpc2FibGVkKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgciA9IGRldGVjdFN3aXBlKGV2dCk7XG4gICAgLy8gcHJldmVudCB0aGUgY2xpY2sgaWYgaXQgaXMgYSBzd2lwZVxuICAgIGlmICggciE9PWZhbHNlICkgcmV0dXJuIHI7XG5cbiAgICBjb25zdCBmaWxlRWxtID0gdGhpcy5wYXJhbUZpbGVFbG0oKVxuICAgIGZpbGVFbG0uY2xpY2soKVxuICAgIC8vZmlsZUVsbS5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoJ2NsaWNrJykgKTtcbiAgICB0aGlzLmJlZm9yZVNlbGVjdChldnQpXG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBiZWZvcmVTZWxlY3QoZXZlbnQ6IEV2ZW50KXtcbiAgICB0aGlzLmZpbGVTZWxlY3RTdGFydC5lbWl0KGV2ZW50KVxuXG4gICAgaWYoIHRoaXMuZmlsZXMgJiYgdGhpcy5sYXN0RmlsZUNvdW50PT09dGhpcy5maWxlcy5sZW5ndGggKXJldHVyblxuXG4gICAgLy8gaWYgbm8gZmlsZXMgaW4gYXJyYXksIGJlIHN1cmUgYnJvd3NlciBkb2VzIG5vdCBwcmV2ZW50IHJlc2VsZWN0IG9mIHNhbWUgZmlsZSAoc2VlIGdpdGh1YiBpc3N1ZSAyNylcbiAgICB0aGlzLmNsZWFyRmlsZUVsbVZhbHVlKClcbiAgfVxuXG4gIGNsZWFyRmlsZUVsbVZhbHVlKCkge1xuICAgIGlmICghdGhpcy5maWxlRWxtKSByZXR1cm5cblxuICAgIHRoaXMuZmlsZUVsbS52YWx1ZSA9IG51bGxcbiAgfVxuXG4gIGlzRW1wdHlBZnRlclNlbGVjdGlvbigpOmJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmF0dHJpYnV0ZXMubXVsdGlwbGU7XG4gIH1cblxuICBzdG9wRXZlbnQoZXZlbnQ6YW55KTphbnkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICB0cmFuc2Zlckhhc0ZpbGVzKHRyYW5zZmVyOmFueSk6YW55IHtcbiAgICBpZiAoIXRyYW5zZmVyLnR5cGVzKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRyYW5zZmVyLnR5cGVzLmluZGV4T2YpIHtcbiAgICAgIHJldHVybiB0cmFuc2Zlci50eXBlcy5pbmRleE9mKCdGaWxlcycpICE9PSAtMTtcbiAgICB9IGVsc2UgaWYgKHRyYW5zZmVyLnR5cGVzLmNvbnRhaW5zKSB7XG4gICAgICByZXR1cm4gdHJhbnNmZXIudHlwZXMuY29udGFpbnMoJ0ZpbGVzJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBldmVudFRvRmlsZXMoZXZlbnQ6RXZlbnQpe1xuICAgIGNvbnN0IHRyYW5zZmVyID0gZXZlbnRUb1RyYW5zZmVyKGV2ZW50KTtcbiAgICBpZiggdHJhbnNmZXIgKXtcbiAgICAgIGlmKHRyYW5zZmVyLmZpbGVzICYmIHRyYW5zZmVyLmZpbGVzLmxlbmd0aCl7XG4gICAgICAgIHJldHVybiB0cmFuc2Zlci5maWxlc1xuICAgICAgfVxuICAgICAgaWYodHJhbnNmZXIuaXRlbXMgJiYgdHJhbnNmZXIuaXRlbXMubGVuZ3RoKXtcbiAgICAgICAgcmV0dXJuIHRyYW5zZmVyLml0ZW1zXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbXVxuICB9XG5cbiAgYXBwbHlFeGlmUm90YXRpb25zKFxuICAgIGZpbGVzOkZpbGVbXVxuICApOlByb21pc2U8RmlsZVtdPntcbiAgICBjb25zdCBtYXBwZXIgPSAoXG4gICAgICBmaWxlOkZpbGUsaW5kZXg6bnVtYmVyXG4gICAgKTpQcm9taXNlPGFueT49PntcbiAgICAgIHJldHVybiBhcHBseUV4aWZSb3RhdGlvbihmaWxlKVxuICAgICAgLnRoZW4oIGZpeGVkRmlsZT0+ZmlsZXMuc3BsaWNlKGluZGV4LCAxLCBmaXhlZEZpbGUpIClcbiAgICB9XG5cbiAgICBjb25zdCBwcm9tczpQcm9taXNlPGFueT5bXSA9IFtdXG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBwcm9tc1t4XSA9IG1hcHBlciggZmlsZXNbeF0sIHggKVxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoIHByb21zICkudGhlbiggKCk9PmZpbGVzIClcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2NoYW5nZScsIFsnJGV2ZW50J10pXG4gIG9uQ2hhbmdlKGV2ZW50OkV2ZW50KTp2b2lkIHtcbiAgICBsZXQgZmlsZXMgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5maWxlcyB8fCB0aGlzLmV2ZW50VG9GaWxlcyhldmVudClcblxuICAgIGlmKCFmaWxlcy5sZW5ndGgpcmV0dXJuXG5cbiAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgdGhpcy5oYW5kbGVGaWxlcyhmaWxlcylcbiAgfVxuXG4gIGdldEZpbGVGaWx0ZXJGYWlsTmFtZShcbiAgICBmaWxlOkZpbGVcbiAgKTpzdHJpbmcgfCB1bmRlZmluZWR7XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMuZmlsdGVycy5sZW5ndGg7IGkrKyl7XG4gICAgICBpZiggIXRoaXMuZmlsdGVyc1tpXS5mbi5jYWxsKHRoaXMsIGZpbGUpICl7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbaV0ubmFtZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cblxuICBpc0ZpbGVWYWxpZChmaWxlOkZpbGUpOmJvb2xlYW57XG4gICAgY29uc3Qgbm9GaWx0ZXJzID0gIXRoaXMuYWNjZXB0ICYmICghdGhpcy5maWx0ZXJzIHx8ICF0aGlzLmZpbHRlcnMubGVuZ3RoKVxuICAgIGlmKCBub0ZpbHRlcnMgKXtcbiAgICAgIHJldHVybiB0cnVlLy93ZSBoYXZlIG5vIGZpbHRlcnMgc28gYWxsIGZpbGVzIGFyZSB2YWxpZFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldEZpbGVGaWx0ZXJGYWlsTmFtZShmaWxlKSA/IGZhbHNlIDogdHJ1ZVxuICB9XG5cbiAgaXNGaWxlc1ZhbGlkKGZpbGVzOkZpbGVbXSl7XG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBpZiggIXRoaXMuaXNGaWxlVmFsaWQoZmlsZXNbeF0pICl7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgcHJvdGVjdGVkIF9hY2NlcHRGaWx0ZXIoaXRlbTpGaWxlKTpib29sZWFuIHtcbiAgICByZXR1cm4gYWNjZXB0VHlwZSh0aGlzLmFjY2VwdCwgaXRlbS50eXBlLCBpdGVtLm5hbWUpXG4gIH1cblxuICBwcm90ZWN0ZWQgX2ZpbGVTaXplRmlsdGVyKGl0ZW06RmlsZSk6Ym9vbGVhbiB7XG4gICAgcmV0dXJuICEodGhpcy5tYXhTaXplICYmIGl0ZW0uc2l6ZSA+IHRoaXMubWF4U2l6ZSk7XG4gIH1cbn1cblxuXG4vKiogYnJvd3NlcnMgdHJ5IGhhcmQgdG8gY29uY2VhbCBkYXRhIGFib3V0IGZpbGUgZHJhZ3MsIHRoaXMgdGVuZHMgdG8gdW5kbyB0aGF0ICovXG5leHBvcnQgZnVuY3Rpb24gZmlsZXNUb1dyaXRlYWJsZU9iamVjdCggZmlsZXM6RmlsZVtdICk6ZHJhZ01ldGFbXXtcbiAgY29uc3QganNvbkZpbGVzOmRyYWdNZXRhW10gPSBbXVxuICBmb3IobGV0IHg9MDsgeCA8IGZpbGVzLmxlbmd0aDsgKyt4KXtcbiAgICBqc29uRmlsZXMucHVzaCh7XG4gICAgICB0eXBlOmZpbGVzW3hdLnR5cGUsXG4gICAgICBraW5kOmZpbGVzW3hdW1wia2luZFwiXVxuICAgIH0pXG4gIH1cbiAgcmV0dXJuIGpzb25GaWxlc1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRUb1RyYW5zZmVyKGV2ZW50OiBhbnkpOiBUcmFuc2Zlck9iamVjdCB7XG4gIGlmKGV2ZW50LmRhdGFUcmFuc2ZlcilyZXR1cm4gZXZlbnQuZGF0YVRyYW5zZmVyXG4gIHJldHVybiAgZXZlbnQub3JpZ2luYWxFdmVudCA/IGV2ZW50Lm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyIDogbnVsbFxufVxuXG5cbmludGVyZmFjZSBUcmFuc2Zlck9iamVjdCB7XG4gIGl0ZW1zPzogYW55W11cbiAgZmlsZXM/OiBhbnlbXVxuICBkcm9wRWZmZWN0PzogJ2NvcHknIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9EYXRhVHJhbnNmZXIvZHJvcEVmZmVjdFxufSJdfQ==