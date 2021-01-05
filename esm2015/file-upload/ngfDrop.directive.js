import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ngf } from "./ngf.directive";
export class ngfDrop extends ngf {
    constructor() {
        super(...arguments);
        this.fileOver = new EventEmitter();
        this.validDrag = false;
        this.validDragChange = new EventEmitter();
        this.invalidDrag = false;
        this.invalidDragChange = new EventEmitter();
        this.dragFilesChange = new EventEmitter();
    }
    onDrop(event) {
        if (this.fileDropDisabled) {
            this.stopEvent(event);
            return;
        }
        this.closeDrags();
        let files = this.eventToFiles(event);
        if (!files.length)
            return;
        this.stopEvent(event);
        this.handleFiles(files);
    }
    handleFiles(files) {
        this.fileOver.emit(false); //turn-off dragover
        super.handleFiles(files);
    }
    onDragOver(event) {
        if (this.fileDropDisabled) {
            this.stopEvent(event);
            return;
        }
        const transfer = this.eventToTransfer(event);
        let files = this.eventToFiles(event);
        let jsonFiles = this.filesToWriteableObject(files);
        this.dragFilesChange.emit(this.dragFiles = jsonFiles);
        if (files.length) {
            this.validDrag = this.isFilesValid(files);
        }
        else {
            //Safari, IE11 & some browsers do NOT tell you about dragged files until dropped. Always consider a valid drag
            this.validDrag = true;
        }
        this.validDragChange.emit(this.validDrag);
        this.invalidDrag = !this.validDrag;
        this.invalidDragChange.emit(this.invalidDrag);
        transfer.dropEffect = 'copy'; //change cursor and such
        this.stopEvent(event);
        this.fileOver.emit(true);
    }
    closeDrags() {
        delete this.validDrag;
        this.validDragChange.emit(this.validDrag);
        this.invalidDrag = false;
        this.invalidDragChange.emit(this.invalidDrag);
        delete this.dragFiles;
        this.dragFilesChange.emit(this.dragFiles);
    }
    onDragLeave(event) {
        if (this.fileDropDisabled) {
            this.stopEvent(event);
            return;
        }
        this.closeDrags();
        if (this.element) {
            if (event.currentTarget === this.element[0]) {
                return;
            }
        }
        this.stopEvent(event);
        this.fileOver.emit(false);
    }
}
ngfDrop.decorators = [
    { type: Directive, args: [{
                selector: "[ngfDrop]",
                exportAs: "ngfDrop"
            },] }
];
ngfDrop.propDecorators = {
    fileOver: [{ type: Output }],
    validDrag: [{ type: Input }],
    validDragChange: [{ type: Output }],
    invalidDrag: [{ type: Input }],
    invalidDragChange: [{ type: Output }],
    dragFiles: [{ type: Input }],
    dragFilesChange: [{ type: Output }],
    onDrop: [{ type: HostListener, args: ['drop', ['$event'],] }],
    onDragOver: [{ type: HostListener, args: ['dragover', ['$event'],] }],
    onDragLeave: [{ type: HostListener, args: ['dragleave', ['$event'],] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmRHJvcC5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vc3JjLyIsInNvdXJjZXMiOlsiZmlsZS11cGxvYWQvbmdmRHJvcC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFBRSxZQUFZLEVBQ3ZCLFlBQVksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUM1QixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUUsR0FBRyxFQUFZLE1BQU0saUJBQWlCLENBQUE7QUFNL0MsTUFBTSxPQUFPLE9BQVEsU0FBUSxHQUFHO0lBSmhDOztRQUtZLGFBQVEsR0FBcUIsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUVqRCxjQUFTLEdBQVcsS0FBSyxDQUFBO1FBQ3hCLG9CQUFlLEdBQXlCLElBQUksWUFBWSxFQUFFLENBQUE7UUFFM0QsZ0JBQVcsR0FBRyxLQUFLLENBQUE7UUFDbEIsc0JBQWlCLEdBQXlCLElBQUksWUFBWSxFQUFFLENBQUE7UUFHNUQsb0JBQWUsR0FBNEIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtJQWlGekUsQ0FBQztJQTlFQyxNQUFNLENBQUMsS0FBVztRQUNoQixJQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBQztZQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RCLE9BQU07U0FDUDtRQUVELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtRQUNqQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXBDLElBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUFDLE9BQU07UUFFdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3pCLENBQUM7SUFFRCxXQUFXLENBQUMsS0FBWTtRQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUks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UUFBUSxDQUFDOzBCQXdDbkMsWUFBWSxTQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIERpcmVjdGl2ZSwgRXZlbnRFbWl0dGVyLFxuICBIb3N0TGlzdGVuZXIsIElucHV0LCBPdXRwdXRcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBuZ2YsIGRyYWdNZXRhIH0gZnJvbSBcIi4vbmdmLmRpcmVjdGl2ZVwiXG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogXCJbbmdmRHJvcF1cIixcbiAgZXhwb3J0QXM6IFwibmdmRHJvcFwiXG59KVxuZXhwb3J0IGNsYXNzIG5nZkRyb3AgZXh0ZW5kcyBuZ2Yge1xuICBAT3V0cHV0KCkgZmlsZU92ZXI6RXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgQElucHV0KCkgdmFsaWREcmFnOmJvb2xlYW4gPSBmYWxzZVxuICBAT3V0cHV0KCkgdmFsaWREcmFnQ2hhbmdlOkV2ZW50RW1pdHRlcjxib29sZWFuPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGludmFsaWREcmFnID0gZmFsc2VcbiAgQE91dHB1dCgpIGludmFsaWREcmFnQ2hhbmdlOkV2ZW50RW1pdHRlcjxib29sZWFuPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBJbnB1dCgpIGRyYWdGaWxlcyAhOiBkcmFnTWV0YVtdXG4gIEBPdXRwdXQoKSBkcmFnRmlsZXNDaGFuZ2U6RXZlbnRFbWl0dGVyPGRyYWdNZXRhW10+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQEhvc3RMaXN0ZW5lcignZHJvcCcsIFsnJGV2ZW50J10pXG4gIG9uRHJvcChldmVudDpFdmVudCk6dm9pZCB7XG4gICAgaWYodGhpcy5maWxlRHJvcERpc2FibGVkKXtcbiAgICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuY2xvc2VEcmFncygpXG4gICAgbGV0IGZpbGVzID0gdGhpcy5ldmVudFRvRmlsZXMoZXZlbnQpXG5cbiAgICBpZighZmlsZXMubGVuZ3RoKXJldHVyblxuXG4gICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgIHRoaXMuaGFuZGxlRmlsZXMoZmlsZXMpXG4gIH1cblxuICBoYW5kbGVGaWxlcyhmaWxlczpGaWxlW10pe1xuICAgIHRoaXMuZmlsZU92ZXIuZW1pdChmYWxzZSkvL3R1cm4tb2ZmIGRyYWdvdmVyXG4gICAgc3VwZXIuaGFuZGxlRmlsZXMoZmlsZXMpXG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdkcmFnb3ZlcicsIFsnJGV2ZW50J10pXG4gIG9uRHJhZ092ZXIoZXZlbnQ6RXZlbnQpOnZvaWQge1xuICAgIGlmKHRoaXMuZmlsZURyb3BEaXNhYmxlZCl7XG4gICAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2ZlciA9IHRoaXMuZXZlbnRUb1RyYW5zZmVyKGV2ZW50KVxuXG4gICAgbGV0IGZpbGVzID0gdGhpcy5ldmVudFRvRmlsZXMoZXZlbnQpXG5cbiAgICBsZXQganNvbkZpbGVzID0gdGhpcy5maWxlc1RvV3JpdGVhYmxlT2JqZWN0KGZpbGVzKVxuICAgIHRoaXMuZHJhZ0ZpbGVzQ2hhbmdlLmVtaXQoIHRoaXMuZHJhZ0ZpbGVzPWpzb25GaWxlcyApXG5cbiAgICBpZiggZmlsZXMubGVuZ3RoICl7XG4gICAgICB0aGlzLnZhbGlkRHJhZyA9IHRoaXMuaXNGaWxlc1ZhbGlkKGZpbGVzKVxuICAgIH1lbHNle1xuICAgICAgLy9TYWZhcmksIElFMTEgJiBzb21lIGJyb3dzZXJzIGRvIE5PVCB0ZWxsIHlvdSBhYm91dCBkcmFnZ2VkIGZpbGVzIHVudGlsIGRyb3BwZWQuIEFsd2F5cyBjb25zaWRlciBhIHZhbGlkIGRyYWdcbiAgICAgIHRoaXMudmFsaWREcmFnID0gdHJ1ZVxuICAgIH1cblxuICAgIHRoaXMudmFsaWREcmFnQ2hhbmdlLmVtaXQodGhpcy52YWxpZERyYWcpXG5cbiAgICB0aGlzLmludmFsaWREcmFnID0gIXRoaXMudmFsaWREcmFnXG4gICAgdGhpcy5pbnZhbGlkRHJhZ0NoYW5nZS5lbWl0KHRoaXMuaW52YWxpZERyYWcpXG5cbiAgICB0cmFuc2Zlci5kcm9wRWZmZWN0ID0gJ2NvcHknLy9jaGFuZ2UgY3Vyc29yIGFuZCBzdWNoXG4gICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpXG4gICAgdGhpcy5maWxlT3Zlci5lbWl0KHRydWUpXG4gIH1cblxuICBjbG9zZURyYWdzKCl7XG4gICAgZGVsZXRlIHRoaXMudmFsaWREcmFnXG4gICAgdGhpcy52YWxpZERyYWdDaGFuZ2UuZW1pdCh0aGlzLnZhbGlkRHJhZylcbiAgICB0aGlzLmludmFsaWREcmFnID0gZmFsc2VcbiAgICB0aGlzLmludmFsaWREcmFnQ2hhbmdlLmVtaXQodGhpcy5pbnZhbGlkRHJhZylcbiAgICBkZWxldGUgdGhpcy5kcmFnRmlsZXNcbiAgICB0aGlzLmRyYWdGaWxlc0NoYW5nZS5lbWl0KCB0aGlzLmRyYWdGaWxlcyApXG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdkcmFnbGVhdmUnLCBbJyRldmVudCddKVxuICBvbkRyYWdMZWF2ZShldmVudDpFdmVudCk6YW55IHtcbiAgICBpZih0aGlzLmZpbGVEcm9wRGlzYWJsZWQpe1xuICAgICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIFxuICAgIHRoaXMuY2xvc2VEcmFncygpXG5cbiAgICBpZiAoKHRoaXMgYXMgYW55KS5lbGVtZW50KSB7XG4gICAgICBpZiAoZXZlbnQuY3VycmVudFRhcmdldCA9PT0gKHRoaXMgYXMgYW55KS5lbGVtZW50WzBdKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgdGhpcy5maWxlT3Zlci5lbWl0KGZhbHNlKTtcbiAgfVxufSJdfQ==