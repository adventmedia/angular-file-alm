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
        const selectable = (this.selectable || this.selectable === '') && !['false', 'null', '0'].includes(this.selectable);
        if (selectable) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNrZXJhcHBsZS9Qcm9qZWN0cy93ZWIvYW5ndWxhci9hbmd1bGFyLWZpbGUvZGV2ZWxvcG1lbnQvcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUEyQixNQUFNLGVBQWUsQ0FBQztBQUMxSCxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ25HLE9BQU8sRUFDTCxVQUFVLEVBQ1YsaUJBQWlCLEVBQUUsT0FBTyxFQUMzQixNQUFNLGFBQWEsQ0FBQTtBQU9wQjs7RUFFRTtBQUtGLE1BQU0sT0FBTyxHQUFHO0lBK0JkLFlBQW1CLE9BQWtCO1FBQWxCLFlBQU8sR0FBUCxPQUFPLENBQVc7UUE3QnJDLFlBQU8sR0FBNEMsRUFBRSxDQUFBO1FBQ3JELGtCQUFhLEdBQVEsQ0FBQyxDQUFBO1FBS3RCLCtCQUErQjtRQUMvQiwrQkFBK0I7UUFDdEIsc0JBQWlCLEdBQVcsSUFBSSxDQUFBO1FBRWhDLHFCQUFnQixHQUFXLEtBQUssQ0FBQTtRQUNoQyxlQUFVLEdBQXFCLEtBQUssQ0FBQTtRQUM3QixrQkFBYSxHQUFxQixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRTNELGlCQUFZLEdBQXFCLEVBQUUsQ0FBQTtRQUNsQyx1QkFBa0IsR0FBMkMsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUcvRSxzQkFBaUIsR0FBd0IsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUczRCxlQUFVLEdBQXNCLElBQUksWUFBWSxFQUFFLENBQUE7UUFFbkQsVUFBSyxHQUFVLEVBQUUsQ0FBQTtRQUNoQixnQkFBVyxHQUF3QixJQUFJLFlBQVksRUFBVSxDQUFDO1FBTXRFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNwQixDQUFDO0lBRUQsV0FBVztRQUNULHlCQUF5QjtRQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUMsQ0FBQyxDQUFBO1FBQzNELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBQyxDQUFDLENBQUE7UUFFL0QsaUVBQWlFO1FBQ2pFLHFFQUFxRTtRQUNyRSxpRUFBaUU7SUFDbkUsQ0FBQztJQUVELFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUEsQ0FBQSxzQ0FBc0M7UUFDekQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELFFBQVE7UUFDTixNQUFNLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQW9CLENBQUMsQ0FBQztRQUM1SCxJQUFJLFVBQVUsRUFBRTtZQUNkLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtTQUN2QjtRQUVELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7U0FDNUQ7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUV4QiwwR0FBMEc7UUFDMUcsVUFBVSxDQUFDLEdBQUUsRUFBRTtZQUNiLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQy9CLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUNQLENBQUM7SUFFRCxXQUFXLENBQUUsT0FBTztRQUNsQixJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLENBQUE7U0FDL0U7UUFFRCxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDeEIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7U0FDekI7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ2QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksSUFBSyxJQUFJLENBQUMsWUFBb0IsS0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBbUIsQ0FBQyxDQUFDO1FBRW5JLElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUN0QixPQUFPLENBQUMsb0JBQW9CO2FBQzdCO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQVEsRUFBRSxFQUFFO2dCQUNoQyxNQUFNLElBQUksR0FBSSxDQUFTLENBQUMsYUFBYSxDQUFDO2dCQUN0QyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFO29CQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDN0IsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO2lCQUNwQjtZQUNILENBQUMsQ0FBQTtZQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXJELE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFRCxvQkFBb0I7UUFDbEIsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztTQUMzQjtJQUNILENBQUM7SUFFRCxZQUFZO1FBQ1YsSUFBSSxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQSxDQUFBLGlCQUFpQjtRQUV0RCxxQkFBcUI7UUFDckIsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFFLENBQUE7UUFDeEQsSUFBRyxNQUFNO1lBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFBO1FBRTFELHVCQUF1QjtRQUN2QixNQUFNLEtBQUssR0FBRyw0QkFBNEIsRUFBRSxDQUFBO1FBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3JELElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFBO1FBQy9DLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQsZUFBZTtRQUNiLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFBO1FBRXBDLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3BCLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQSxFQUFFLENBQUEsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1lBQzlDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7WUFDNUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQTtZQUNqRCxPQUFNO1NBQ1A7UUFFRCxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUEsRUFBRSxDQUFBLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDL0MsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtRQUM1QyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDakQsQ0FBQztJQUVELGFBQWEsQ0FBRSxLQUFZO1FBQ3pCLE1BQU0sR0FBRyxHQUFVLEVBQUUsQ0FBQTtRQUNyQixLQUFJLElBQUksQ0FBQyxHQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUM7WUFDcEMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM5QixHQUFHLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFBO2FBQ3JCO1NBQ0Y7UUFDRCxPQUFPLEdBQUcsQ0FBQTtJQUNaLENBQUM7SUFFRCxlQUFlLENBQUMsS0FBWTtRQUMxQixNQUFNLEdBQUcsR0FBcUIsRUFBRSxDQUFBO1FBQ2hDLEtBQUksSUFBSSxDQUFDLEdBQUMsS0FBSyxDQUFDLE1BQU0sR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBQztZQUNwQyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDckQsSUFBSSxVQUFVLEVBQUU7Z0JBQ2QsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDUCxJQUFJLEVBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDZixJQUFJLEVBQUcsVUFBVTtpQkFDbEIsQ0FBQyxDQUFBO2FBQ0g7U0FDRjtRQUNELE9BQU8sR0FBRyxDQUFBO0lBQ1osQ0FBQztJQUVELHFDQUFxQztJQUNyQyxXQUFXLENBQUMsS0FBWTtRQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXhDLElBQUcsS0FBSyxDQUFDLE1BQU0sSUFBRSxNQUFNLENBQUMsTUFBTSxFQUFDO1lBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUNoRDthQUFJO1lBQ0gsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFBO1NBQ3pCO1FBRUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7UUFFL0MsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2pCLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUMxQixJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDO3FCQUM5QixJQUFJLENBQUUsVUFBVSxDQUFBLEVBQUUsQ0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFFLENBQUE7YUFDMUM7aUJBQUk7Z0JBQ0gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTthQUNqQjtTQUNGO1FBRUQsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRTtZQUNoQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFBO1NBQ3RDO0lBQ0gsQ0FBQztJQUVELEdBQUcsQ0FBRSxLQUFZO1FBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQTtRQUM3QixLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUU3QyxrREFBa0Q7UUFDbEQsbUhBQW1IO1FBRW5ILElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQTtRQUVuQyxJQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUM7WUFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsSUFBSSxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFBO1lBRTFDLElBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUM7Z0JBQ3pDLE9BQU8sQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUU7cUJBQ2xCLElBQUksQ0FBRSxHQUFHLENBQUEsRUFBRSxDQUFBLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQTthQUMvQztTQUNGO1FBRUQsMENBQTBDO1FBQzFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUE7SUFDeEMsQ0FBQztJQUVELGtDQUFrQztJQUNsQyxRQUFRLENBQUMsS0FBUztRQUNoQixJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXJFLElBQUksQ0FBQyxRQUFRO1lBQUUsT0FBTztRQUV0QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUVELFlBQVksQ0FBQyxHQUFPO1FBQ2xCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFBO1FBQ3RDLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUM7WUFDeEQsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixxQ0FBcUM7UUFDckMsSUFBSyxDQUFDLEtBQUcsS0FBSztZQUFHLE9BQU8sQ0FBQyxDQUFDO1FBRTFCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUNuQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDZiw4Q0FBOEM7UUFDOUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1FBRW5CLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELFlBQVk7UUFDVixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLGFBQWEsS0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07WUFBRSxPQUFNO1FBRWhFLGtHQUFrRztRQUNsRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7SUFDM0IsQ0FBQztJQUVELHFCQUFxQjtRQUNuQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO0lBQzFELENBQUM7SUFFRCxlQUFlLENBQUMsS0FBUztRQUN2QixJQUFHLEtBQUssQ0FBQyxZQUFZO1lBQUMsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFBO1FBQy9DLE9BQVEsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtJQUN2RSxDQUFDO0lBRUQsU0FBUyxDQUFDLEtBQVM7UUFDakIsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsZ0JBQWdCLENBQUMsUUFBWTtRQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRTtZQUNuQixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUMxQixPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQy9DO2FBQU0sSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtZQUNsQyxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3pDO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVELFlBQVksQ0FBQyxLQUFXO1FBQ3RCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsSUFBSSxRQUFRLEVBQUU7WUFDWixJQUFHLFFBQVEsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUM7Z0JBQ3pDLE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQTthQUN0QjtZQUNELElBQUcsUUFBUSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBQztnQkFDekMsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFBO2FBQ3RCO1NBQ0Y7UUFDRCxPQUFPLEVBQUUsQ0FBQTtJQUNYLENBQUM7SUFFRCxrQkFBa0IsQ0FDaEIsS0FBWTtRQUVaLE1BQU0sTUFBTSxHQUFHLENBQ2IsSUFBUyxFQUFDLEtBQVksRUFDVixFQUFFO1lBQ2QsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7aUJBQzdCLElBQUksQ0FBRSxTQUFTLENBQUEsRUFBRSxDQUFBLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBRSxDQUFBO1FBQ3ZELENBQUMsQ0FBQTtRQUVELE1BQU0sS0FBSyxHQUFrQixFQUFFLENBQUE7UUFDL0IsS0FBSSxJQUFJLENBQUMsR0FBQyxLQUFLLENBQUMsTUFBTSxHQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFDO1lBQ3BDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBO1NBQ2pDO1FBQ0QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFFLEtBQUssQ0FBRSxDQUFDLElBQUksQ0FBRSxHQUFFLEVBQUUsQ0FBQSxLQUFLLENBQUUsQ0FBQTtJQUMvQyxDQUFDO0lBR0QsUUFBUSxDQUFDLEtBQVc7UUFDbEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFeEUsSUFBRyxDQUFDLEtBQUssQ0FBQyxNQUFNO1lBQUMsT0FBTTtRQUV2QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDekIsQ0FBQztJQUVELHFCQUFxQixDQUNuQixJQUFTO1FBRVQsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFDO1lBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUN4QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO2FBQzVCO1NBQ0Y7UUFDRCxPQUFPLFNBQVMsQ0FBQTtJQUNsQixDQUFDO0lBRUQsV0FBVyxDQUFDLElBQVM7UUFDbkIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN6RSxJQUFJLFNBQVMsRUFBRTtZQUNiLE9BQU8sSUFBSSxDQUFBLENBQUEsMkNBQTJDO1NBQ3ZEO1FBRUQsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO0lBQ3hELENBQUM7SUFFRCxZQUFZLENBQUMsS0FBWTtRQUN2QixLQUFJLElBQUksQ0FBQyxHQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUM7WUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sS0FBSyxDQUFBO2FBQ2I7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVTLGFBQWEsQ0FBQyxJQUFTO1FBQy9CLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdEQsQ0FBQztJQUVTLGVBQWUsQ0FBQyxJQUFTO1FBQ2pDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELGtGQUFrRjtJQUNsRixzQkFBc0IsQ0FBRSxLQUFZO1FBQ2xDLE1BQU0sU0FBUyxHQUFjLEVBQUUsQ0FBQTtRQUMvQixLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBQztZQUNqQyxTQUFTLENBQUMsSUFBSSxDQUFDO2dCQUNiLElBQUksRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtnQkFDbEIsSUFBSSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7YUFDdEIsQ0FBQyxDQUFBO1NBQ0g7UUFDRCxPQUFPLFNBQVMsQ0FBQTtJQUNsQixDQUFDOzs7WUE5V0YsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxPQUFPO2dCQUNqQixRQUFRLEVBQUMsS0FBSzthQUNmOzs7WUFsQmlDLFVBQVU7Ozt1QkF3QnpDLEtBQUs7cUJBQ0wsS0FBSztzQkFDTCxLQUFLO2dDQUdMLEtBQUs7K0JBRUwsS0FBSzt5QkFDTCxLQUFLOzRCQUNMLE1BQU0sU0FBQyxNQUFNOzJCQUViLEtBQUs7aUNBQ0wsTUFBTTswQkFFTixLQUFLO2dDQUNMLE1BQU07bUJBRU4sS0FBSzt5QkFDTCxNQUFNO29CQUVOLEtBQUs7MEJBQ0wsTUFBTTsyQkFFTixLQUFLO3VCQXFSTCxZQUFZLFNBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFdmVudEVtaXR0ZXIsIEVsZW1lbnRSZWYsIElucHV0LCBPdXRwdXQsIEhvc3RMaXN0ZW5lciwgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGNyZWF0ZUludmlzaWJsZUZpbGVJbnB1dFdyYXAsIGlzRmlsZUlucHV0LCBkZXRlY3RTd2lwZSB9IGZyb20gXCIuL2RvYy1ldmVudC1oZWxwLmZ1bmN0aW9uc1wiXG5pbXBvcnQge1xuICBhY2NlcHRUeXBlLCBJbnZhbGlkRmlsZUl0ZW0sXG4gIGFwcGx5RXhpZlJvdGF0aW9uLCBkYXRhVXJsXG59IGZyb20gXCIuL2ZpbGVUb29sc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgZHJhZ01ldGF7XG4gIHR5cGU6c3RyaW5nXG4gIGtpbmQ6c3RyaW5nXG59XG5cbi8qKiBBIG1hc3RlciBiYXNlIHNldCBvZiBsb2dpYyBpbnRlbmRlZCB0byBzdXBwb3J0IGZpbGUgc2VsZWN0L2RyYWcvZHJvcCBvcGVyYXRpb25zXG4gTk9URTogVXNlIG5nZkRyb3AgZm9yIGZ1bGwgZHJhZy9kcm9wLiBVc2UgbmdmU2VsZWN0IGZvciBzZWxlY3RpbmdcbiovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6IFwiW25nZl1cIixcbiAgZXhwb3J0QXM6XCJuZ2ZcIlxufSlcbmV4cG9ydCBjbGFzcyBuZ2Yge1xuICBmaWxlRWxtOmFueVxuICBmaWx0ZXJzOntuYW1lOnN0cmluZywgZm46KGZpbGU6RmlsZSk9PmJvb2xlYW59W10gPSBbXVxuICBsYXN0RmlsZUNvdW50Om51bWJlcj0wXG5cbiAgQElucHV0KCkgbXVsdGlwbGUgITpzdHJpbmdcbiAgQElucHV0KCkgYWNjZXB0ICAgITpzdHJpbmdcbiAgQElucHV0KCkgbWF4U2l6ZSAgITpudW1iZXJcbiAgLy9ASW5wdXQoKSBmb3JjZUZpbGVuYW1lOnN0cmluZ1xuICAvL0BJbnB1dCgpIGZvcmNlUG9zdG5hbWU6c3RyaW5nXG4gIEBJbnB1dCgpIG5nZkZpeE9yaWVudGF0aW9uOmJvb2xlYW4gPSB0cnVlXG5cbiAgQElucHV0KCkgZmlsZURyb3BEaXNhYmxlZDpib29sZWFuID0gZmFsc2VcbiAgQElucHV0KCkgc2VsZWN0YWJsZTogYm9vbGVhbiB8IHN0cmluZyA9IGZhbHNlXG4gIEBPdXRwdXQoJ2luaXQnKSBkaXJlY3RpdmVJbml0OkV2ZW50RW1pdHRlcjxuZ2Y+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgbGFzdEludmFsaWRzOkludmFsaWRGaWxlSXRlbVtdID0gW11cbiAgQE91dHB1dCgpIGxhc3RJbnZhbGlkc0NoYW5nZTpFdmVudEVtaXR0ZXI8e2ZpbGU6RmlsZSx0eXBlOnN0cmluZ31bXT4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBsYXN0QmFzZVVybCAhOiBzdHJpbmcvL2Jhc2U2NCBsYXN0IGZpbGUgdXBsb2FkZWQgdXJsXG4gIEBPdXRwdXQoKSBsYXN0QmFzZVVybENoYW5nZTpFdmVudEVtaXR0ZXI8c3RyaW5nPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGZpbGUgITogRmlsZS8vbGFzdCBmaWxlIHVwbG9hZGVkXG4gIEBPdXRwdXQoKSBmaWxlQ2hhbmdlOkV2ZW50RW1pdHRlcjxGaWxlPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGZpbGVzOkZpbGVbXSA9IFtdXG4gIEBPdXRwdXQoKSBmaWxlc0NoYW5nZTpFdmVudEVtaXR0ZXI8RmlsZVtdPiA9IG5ldyBFdmVudEVtaXR0ZXI8RmlsZVtdPigpO1xuXG4gIEBJbnB1dCgpIGNhcHR1cmVQYXN0ZTogYm9vbGVhbjsgLy8gd2luZG93IHBhc3RlIGZpbGUgd2F0Y2hpbmcgKGVtcHR5IHN0cmluZyB0dXJucyBvbilcbiAgcGFzdGVDYXB0dXJlciAhOiAoZTogRXZlbnQpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnQ6RWxlbWVudFJlZil7XG4gICAgdGhpcy5pbml0RmlsdGVycygpXG4gIH1cblxuICBpbml0RmlsdGVycygpe1xuICAgIC8vIHRoZSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICB0aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2FjY2VwdCcsIGZuOiB0aGlzLl9hY2NlcHRGaWx0ZXJ9KVxuICAgIHRoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnZmlsZVNpemUnLCBmbjogdGhpcy5fZmlsZVNpemVGaWx0ZXJ9KVxuXG4gICAgLy90aGlzLmZpbHRlcnMucHVzaCh7bmFtZTogJ2ZpbGVUeXBlJywgZm46IHRoaXMuX2ZpbGVUeXBlRmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAncXVldWVMaW1pdCcsIGZuOiB0aGlzLl9xdWV1ZUxpbWl0RmlsdGVyfSlcbiAgICAvL3RoaXMuZmlsdGVycy5wdXNoKHtuYW1lOiAnbWltZVR5cGUnLCBmbjogdGhpcy5fbWltZVR5cGVGaWx0ZXJ9KVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKXtcbiAgICBkZWxldGUgdGhpcy5maWxlRWxtLy9mYXN0ZXIgbWVtb3J5IHJlbGVhc2Ugb2YgZG9tIGVsZW1lbnRcbiAgICB0aGlzLmRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCk7XG4gIH1cblxuICBuZ09uSW5pdCgpe1xuICAgIGNvbnN0IHNlbGVjdGFibGUgPSAodGhpcy5zZWxlY3RhYmxlIHx8IHRoaXMuc2VsZWN0YWJsZT09PScnKSAmJiAhWydmYWxzZScsICdudWxsJywgJzAnXS5pbmNsdWRlcyh0aGlzLnNlbGVjdGFibGUgYXMgc3RyaW5nKTtcbiAgICBpZiggc2VsZWN0YWJsZSApe1xuICAgICAgdGhpcy5lbmFibGVTZWxlY3RpbmcoKVxuICAgIH1cblxuICAgIGlmKCB0aGlzLm11bHRpcGxlICl7XG4gICAgICB0aGlzLnBhcmFtRmlsZUVsbSgpLnNldEF0dHJpYnV0ZSgnbXVsdGlwbGUnLCB0aGlzLm11bHRpcGxlKVxuICAgIH1cblxuICAgIHRoaXMuZXZhbENhcHR1cmVQYXN0ZSgpO1xuXG4gICAgLy9jcmVhdGUgcmVmZXJlbmNlIHRvIHRoaXMgY2xhc3Mgd2l0aCBvbmUgY3ljbGUgZGVsYXkgdG8gYXZvaWQgRXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvclxuICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgIHRoaXMuZGlyZWN0aXZlSW5pdC5lbWl0KHRoaXMpXG4gICAgfSwgMClcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKCBjaGFuZ2VzICl7XG4gICAgaWYoIGNoYW5nZXMuYWNjZXB0ICl7XG4gICAgICB0aGlzLnBhcmFtRmlsZUVsbSgpLnNldEF0dHJpYnV0ZSgnYWNjZXB0JywgY2hhbmdlcy5hY2NlcHQuY3VycmVudFZhbHVlIHx8ICcqJylcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlcy5jYXB0dXJlUGFzdGUpIHtcbiAgICAgIHRoaXMuZXZhbENhcHR1cmVQYXN0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIGV2YWxDYXB0dXJlUGFzdGUoKSB7XG4gICAgY29uc3QgaXNBY3RpdmUgPSB0aGlzLmNhcHR1cmVQYXN0ZSB8fCAodGhpcy5jYXB0dXJlUGFzdGUgYXMgYW55KT09PScnIHx8IFsnZmFsc2UnLCAnMCcsICdudWxsJ10uaW5jbHVkZXModGhpcy5jYXB0dXJlUGFzdGUgYXMgYW55KTtcblxuICAgIGlmIChpc0FjdGl2ZSkge1xuICAgICAgaWYgKHRoaXMucGFzdGVDYXB0dXJlcikge1xuICAgICAgICByZXR1cm47IC8vIGFscmVhZHkgbGlzdGVuaW5nXG4gICAgICB9XG5cbiAgICAgIHRoaXMucGFzdGVDYXB0dXJlciA9IChlOiBFdmVudCkgPT4ge1xuICAgICAgICBjb25zdCBjbGlwID0gKGUgYXMgYW55KS5jbGlwYm9hcmREYXRhO1xuICAgICAgICBpZiAoY2xpcCAmJiBjbGlwLmZpbGVzICYmIGNsaXAuZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVGaWxlcyhjbGlwLmZpbGVzKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgdGhpcy5wYXN0ZUNhcHR1cmVyKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZGVzdHJveVBhc3RlTGlzdGVuZXIoKTtcbiAgfVxuXG4gIGRlc3Ryb3lQYXN0ZUxpc3RlbmVyKCkge1xuICAgIGlmICh0aGlzLnBhc3RlQ2FwdHVyZXIpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMucGFzdGVDYXB0dXJlcik7XG4gICAgICBkZWxldGUgdGhpcy5wYXN0ZUNhcHR1cmVyO1xuICAgIH1cbiAgfVxuXG4gIHBhcmFtRmlsZUVsbSgpe1xuICAgIGlmKCB0aGlzLmZpbGVFbG0gKXJldHVybiB0aGlzLmZpbGVFbG0vL2FscmVhZHkgZGVmaW5lZFxuXG4gICAgLy9lbG0gaXMgYSBmaWxlIGlucHV0XG4gICAgY29uc3QgaXNGaWxlID0gaXNGaWxlSW5wdXQoIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50IClcbiAgICBpZihpc0ZpbGUpcmV0dXJuIHRoaXMuZmlsZUVsbSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50XG5cbiAgICAvL2NyZWF0ZSBmb28gZmlsZSBpbnB1dFxuICAgIGNvbnN0IGxhYmVsID0gY3JlYXRlSW52aXNpYmxlRmlsZUlucHV0V3JhcCgpXG4gICAgdGhpcy5maWxlRWxtID0gbGFiZWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JylbMF1cbiAgICB0aGlzLmZpbGVFbG0uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5jaGFuZ2VGbi5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZCggbGFiZWwgKVxuICAgIHJldHVybiB0aGlzLmZpbGVFbG1cbiAgfVxuXG4gIGVuYWJsZVNlbGVjdGluZygpe1xuICAgIGxldCBlbG0gPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudFxuXG4gICAgaWYoIGlzRmlsZUlucHV0KGVsbSkgKXtcbiAgICAgIGNvbnN0IGJpbmRlZEhhbmRsZXIgPSBfZXY9PnRoaXMuYmVmb3JlU2VsZWN0KClcbiAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJpbmRlZEhhbmRsZXIpXG4gICAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGJpbmRlZEhhbmRsZXIpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBiaW5kZWRIYW5kbGVyID0gZXY9PnRoaXMuY2xpY2tIYW5kbGVyKGV2KVxuICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJpbmRlZEhhbmRsZXIpXG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBiaW5kZWRIYW5kbGVyKVxuICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGJpbmRlZEhhbmRsZXIpXG4gIH1cblxuICBnZXRWYWxpZEZpbGVzKCBmaWxlczpGaWxlW10gKTpGaWxlW117XG4gICAgY29uc3QgcnRuOkZpbGVbXSA9IFtdXG4gICAgZm9yKGxldCB4PWZpbGVzLmxlbmd0aC0xOyB4ID49IDA7IC0teCl7XG4gICAgICBpZiggdGhpcy5pc0ZpbGVWYWxpZChmaWxlc1t4XSkgKXtcbiAgICAgICAgcnRuLnB1c2goIGZpbGVzW3hdIClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ0blxuICB9XG5cbiAgZ2V0SW52YWxpZEZpbGVzKGZpbGVzOkZpbGVbXSk6SW52YWxpZEZpbGVJdGVtW117XG4gICAgY29uc3QgcnRuOkludmFsaWRGaWxlSXRlbVtdID0gW11cbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIGxldCBmYWlsUmVhc29uID0gdGhpcy5nZXRGaWxlRmlsdGVyRmFpbE5hbWUoZmlsZXNbeF0pXG4gICAgICBpZiggZmFpbFJlYXNvbiApe1xuICAgICAgICBydG4ucHVzaCh7XG4gICAgICAgICAgZmlsZSA6IGZpbGVzW3hdLFxuICAgICAgICAgIHR5cGUgOiBmYWlsUmVhc29uXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydG5cbiAgfVxuXG4gIC8vIFByaW1hcnkgaGFuZGxlciBvZiBmaWxlcyBjb21pbmcgaW5cbiAgaGFuZGxlRmlsZXMoZmlsZXM6RmlsZVtdKXtcbiAgICBjb25zdCB2YWxpZHMgPSB0aGlzLmdldFZhbGlkRmlsZXMoZmlsZXMpXG5cbiAgICBpZihmaWxlcy5sZW5ndGghPXZhbGlkcy5sZW5ndGgpe1xuICAgICAgdGhpcy5sYXN0SW52YWxpZHMgPSB0aGlzLmdldEludmFsaWRGaWxlcyhmaWxlcylcbiAgICB9ZWxzZXtcbiAgICAgIGRlbGV0ZSB0aGlzLmxhc3RJbnZhbGlkc1xuICAgIH1cblxuICAgIHRoaXMubGFzdEludmFsaWRzQ2hhbmdlLmVtaXQodGhpcy5sYXN0SW52YWxpZHMpXG5cbiAgICBpZiggdmFsaWRzLmxlbmd0aCApe1xuICAgICAgaWYoIHRoaXMubmdmRml4T3JpZW50YXRpb24gKXtcbiAgICAgICAgdGhpcy5hcHBseUV4aWZSb3RhdGlvbnModmFsaWRzKVxuICAgICAgICAudGhlbiggZml4ZWRGaWxlcz0+dGhpcy5xdWUoZml4ZWRGaWxlcykgKVxuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMucXVlKHZhbGlkcylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0VtcHR5QWZ0ZXJTZWxlY3Rpb24oKSkge1xuICAgICAgdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQudmFsdWUgPSAnJ1xuICAgIH1cbiAgfVxuXG4gIHF1ZSggZmlsZXM6RmlsZVtdICl7XG4gICAgdGhpcy5maWxlcyA9IHRoaXMuZmlsZXMgfHwgW11cbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLmZpbGVzLCBmaWxlcylcblxuICAgIC8vYmVsb3cgYnJlYWsgbWVtb3J5IHJlZiBhbmQgZG9lc250IGFjdCBsaWtlIGEgcXVlXG4gICAgLy90aGlzLmZpbGVzID0gZmlsZXMvL2NhdXNlcyBtZW1vcnkgY2hhbmdlIHdoaWNoIHRyaWdnZXJzIGJpbmRpbmdzIGxpa2UgPG5nZkZvcm1EYXRhIFtmaWxlc109XCJmaWxlc1wiPjwvbmdmRm9ybURhdGE+XG5cbiAgICB0aGlzLmZpbGVzQ2hhbmdlLmVtaXQoIHRoaXMuZmlsZXMgKVxuXG4gICAgaWYoZmlsZXMubGVuZ3RoKXtcbiAgICAgIHRoaXMuZmlsZUNoYW5nZS5lbWl0KCB0aGlzLmZpbGU9ZmlsZXNbMF0gKVxuXG4gICAgICBpZih0aGlzLmxhc3RCYXNlVXJsQ2hhbmdlLm9ic2VydmVycy5sZW5ndGgpe1xuICAgICAgICBkYXRhVXJsKCBmaWxlc1swXSApXG4gICAgICAgIC50aGVuKCB1cmw9PnRoaXMubGFzdEJhc2VVcmxDaGFuZ2UuZW1pdCh1cmwpIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL3dpbGwgYmUgY2hlY2tlZCBmb3IgaW5wdXQgdmFsdWUgY2xlYXJpbmdcbiAgICB0aGlzLmxhc3RGaWxlQ291bnQgPSB0aGlzLmZpbGVzLmxlbmd0aFxuICB9XG5cbiAgLyoqIGNhbGxlZCB3aGVuIGlucHV0IGhhcyBmaWxlcyAqL1xuICBjaGFuZ2VGbihldmVudDphbnkpIHtcbiAgICB2YXIgZmlsZUxpc3QgPSBldmVudC5fX2ZpbGVzXyB8fCAoZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5maWxlcylcblxuICAgIGlmICghZmlsZUxpc3QpIHJldHVybjtcblxuICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICB0aGlzLmhhbmRsZUZpbGVzKGZpbGVMaXN0KVxuICB9XG5cbiAgY2xpY2tIYW5kbGVyKGV2dDphbnkpe1xuICAgIGNvbnN0IGVsbSA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50XG4gICAgaWYgKGVsbS5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgfHwgdGhpcy5maWxlRHJvcERpc2FibGVkKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgciA9IGRldGVjdFN3aXBlKGV2dCk7XG4gICAgLy8gcHJldmVudCB0aGUgY2xpY2sgaWYgaXQgaXMgYSBzd2lwZVxuICAgIGlmICggciE9PWZhbHNlICkgcmV0dXJuIHI7XG5cbiAgICBjb25zdCBmaWxlRWxtID0gdGhpcy5wYXJhbUZpbGVFbG0oKVxuICAgIGZpbGVFbG0uY2xpY2soKVxuICAgIC8vZmlsZUVsbS5kaXNwYXRjaEV2ZW50KCBuZXcgRXZlbnQoJ2NsaWNrJykgKTtcbiAgICB0aGlzLmJlZm9yZVNlbGVjdCgpXG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBiZWZvcmVTZWxlY3QoKXtcbiAgICBpZiggdGhpcy5maWxlcyAmJiB0aGlzLmxhc3RGaWxlQ291bnQ9PT10aGlzLmZpbGVzLmxlbmd0aCApcmV0dXJuXG5cbiAgICAvL2lmIG5vIGZpbGVzIGluIGFycmF5LCBiZSBzdXJlIGJyb3dzZXIgZG9lc250IHByZXZlbnQgcmVzZWxlY3Qgb2Ygc2FtZSBmaWxlIChzZWUgZ2l0aHViIGlzc3VlIDI3KVxuICAgIHRoaXMuZmlsZUVsbS52YWx1ZSA9IG51bGxcbiAgfVxuXG4gIGlzRW1wdHlBZnRlclNlbGVjdGlvbigpOmJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmF0dHJpYnV0ZXMubXVsdGlwbGU7XG4gIH1cblxuICBldmVudFRvVHJhbnNmZXIoZXZlbnQ6YW55KTphbnkge1xuICAgIGlmKGV2ZW50LmRhdGFUcmFuc2ZlcilyZXR1cm4gZXZlbnQuZGF0YVRyYW5zZmVyXG4gICAgcmV0dXJuICBldmVudC5vcmlnaW5hbEV2ZW50ID8gZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIgOiBudWxsXG4gIH1cblxuICBzdG9wRXZlbnQoZXZlbnQ6YW55KTphbnkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICB0cmFuc2Zlckhhc0ZpbGVzKHRyYW5zZmVyOmFueSk6YW55IHtcbiAgICBpZiAoIXRyYW5zZmVyLnR5cGVzKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRyYW5zZmVyLnR5cGVzLmluZGV4T2YpIHtcbiAgICAgIHJldHVybiB0cmFuc2Zlci50eXBlcy5pbmRleE9mKCdGaWxlcycpICE9PSAtMTtcbiAgICB9IGVsc2UgaWYgKHRyYW5zZmVyLnR5cGVzLmNvbnRhaW5zKSB7XG4gICAgICByZXR1cm4gdHJhbnNmZXIudHlwZXMuY29udGFpbnMoJ0ZpbGVzJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBldmVudFRvRmlsZXMoZXZlbnQ6RXZlbnQpe1xuICAgIGNvbnN0IHRyYW5zZmVyID0gdGhpcy5ldmVudFRvVHJhbnNmZXIoZXZlbnQpO1xuICAgIGlmKCB0cmFuc2ZlciApe1xuICAgICAgaWYodHJhbnNmZXIuZmlsZXMgJiYgdHJhbnNmZXIuZmlsZXMubGVuZ3RoKXtcbiAgICAgICAgcmV0dXJuIHRyYW5zZmVyLmZpbGVzXG4gICAgICB9XG4gICAgICBpZih0cmFuc2Zlci5pdGVtcyAmJiB0cmFuc2Zlci5pdGVtcy5sZW5ndGgpe1xuICAgICAgICByZXR1cm4gdHJhbnNmZXIuaXRlbXNcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICBhcHBseUV4aWZSb3RhdGlvbnMoXG4gICAgZmlsZXM6RmlsZVtdXG4gICk6UHJvbWlzZTxGaWxlW10+e1xuICAgIGNvbnN0IG1hcHBlciA9IChcbiAgICAgIGZpbGU6RmlsZSxpbmRleDpudW1iZXJcbiAgICApOlByb21pc2U8YW55Pj0+e1xuICAgICAgcmV0dXJuIGFwcGx5RXhpZlJvdGF0aW9uKGZpbGUpXG4gICAgICAudGhlbiggZml4ZWRGaWxlPT5maWxlcy5zcGxpY2UoaW5kZXgsIDEsIGZpeGVkRmlsZSkgKVxuICAgIH1cblxuICAgIGNvbnN0IHByb21zOlByb21pc2U8YW55PltdID0gW11cbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIHByb21zW3hdID0gbWFwcGVyKCBmaWxlc1t4XSwgeCApXG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLmFsbCggcHJvbXMgKS50aGVuKCAoKT0+ZmlsZXMgKVxuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignY2hhbmdlJywgWyckZXZlbnQnXSlcbiAgb25DaGFuZ2UoZXZlbnQ6RXZlbnQpOnZvaWQge1xuICAgIGxldCBmaWxlcyA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmZpbGVzIHx8IHRoaXMuZXZlbnRUb0ZpbGVzKGV2ZW50KVxuXG4gICAgaWYoIWZpbGVzLmxlbmd0aClyZXR1cm5cblxuICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICB0aGlzLmhhbmRsZUZpbGVzKGZpbGVzKVxuICB9XG5cbiAgZ2V0RmlsZUZpbHRlckZhaWxOYW1lKFxuICAgIGZpbGU6RmlsZVxuICApOnN0cmluZyB8IHVuZGVmaW5lZHtcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGhpcy5maWx0ZXJzLmxlbmd0aDsgaSsrKXtcbiAgICAgIGlmKCAhdGhpcy5maWx0ZXJzW2ldLmZuLmNhbGwodGhpcywgZmlsZSkgKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1tpXS5uYW1lXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuXG4gIGlzRmlsZVZhbGlkKGZpbGU6RmlsZSk6Ym9vbGVhbntcbiAgICBjb25zdCBub0ZpbHRlcnMgPSAhdGhpcy5hY2NlcHQgJiYgKCF0aGlzLmZpbHRlcnMgfHwgIXRoaXMuZmlsdGVycy5sZW5ndGgpXG4gICAgaWYoIG5vRmlsdGVycyApe1xuICAgICAgcmV0dXJuIHRydWUvL3dlIGhhdmUgbm8gZmlsdGVycyBzbyBhbGwgZmlsZXMgYXJlIHZhbGlkXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RmlsZUZpbHRlckZhaWxOYW1lKGZpbGUpID8gZmFsc2UgOiB0cnVlXG4gIH1cblxuICBpc0ZpbGVzVmFsaWQoZmlsZXM6RmlsZVtdKXtcbiAgICBmb3IobGV0IHg9ZmlsZXMubGVuZ3RoLTE7IHggPj0gMDsgLS14KXtcbiAgICAgIGlmKCAhdGhpcy5pc0ZpbGVWYWxpZChmaWxlc1t4XSkgKXtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBwcm90ZWN0ZWQgX2FjY2VwdEZpbHRlcihpdGVtOkZpbGUpOmJvb2xlYW4ge1xuICAgIHJldHVybiBhY2NlcHRUeXBlKHRoaXMuYWNjZXB0LCBpdGVtLnR5cGUsIGl0ZW0ubmFtZSlcbiAgfVxuXG4gIHByb3RlY3RlZCBfZmlsZVNpemVGaWx0ZXIoaXRlbTpGaWxlKTpib29sZWFuIHtcbiAgICByZXR1cm4gISh0aGlzLm1heFNpemUgJiYgaXRlbS5zaXplID4gdGhpcy5tYXhTaXplKTtcbiAgfVxuXG4gIC8qKiBicm93c2VycyB0cnkgaGFyZCB0byBjb25jZWFsIGRhdGEgYWJvdXQgZmlsZSBkcmFncywgdGhpcyB0ZW5kcyB0byB1bmRvIHRoYXQgKi9cbiAgZmlsZXNUb1dyaXRlYWJsZU9iamVjdCggZmlsZXM6RmlsZVtdICk6ZHJhZ01ldGFbXXtcbiAgICBjb25zdCBqc29uRmlsZXM6ZHJhZ01ldGFbXSA9IFtdXG4gICAgZm9yKGxldCB4PTA7IHggPCBmaWxlcy5sZW5ndGg7ICsreCl7XG4gICAgICBqc29uRmlsZXMucHVzaCh7XG4gICAgICAgIHR5cGU6ZmlsZXNbeF0udHlwZSxcbiAgICAgICAga2luZDpmaWxlc1t4XVtcImtpbmRcIl1cbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiBqc29uRmlsZXNcbiAgfVxufVxuIl19