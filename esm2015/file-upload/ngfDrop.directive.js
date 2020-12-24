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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmRHJvcC5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZkRyb3AuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxTQUFTLEVBQUUsWUFBWSxFQUN2QixZQUFZLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDNUIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLEdBQUcsRUFBWSxNQUFNLGlCQUFpQixDQUFBO0FBTS9DLE1BQU0sT0FBTyxPQUFRLFNBQVEsR0FBRztJQUpoQzs7UUFLWSxhQUFRLEdBQXFCLElBQUksWUFBWSxFQUFFLENBQUM7UUFFakQsY0FBUyxHQUFXLEtBQUssQ0FBQTtRQUN4QixvQkFBZSxHQUF5QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRTNELGdCQUFXLEdBQUcsS0FBSyxDQUFBO1FBQ2xCLHNCQUFpQixHQUF5QixJQUFJLFlBQVksRUFBRSxDQUFBO1FBRzVELG9CQUFlLEdBQTRCLElBQUksWUFBWSxFQUFFLENBQUE7SUFpRnpFLENBQUM7SUE5RUMsTUFBTSxDQUFDLEtBQVc7UUFDaEIsSUFBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUM7WUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QixPQUFNO1NBQ1A7UUFFRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7UUFDakIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUVwQyxJQUFHLENBQUMsS0FBSyxDQUFDLE1BQU07WUFBQyxPQUFNO1FBRXZCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUN6QixDQUFDO0lBRUQsV0FBVyxDQUFDLEtBQVk7UUFDdEIsSUFB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WSxTQUFDLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQzswQkF3Q25DLFlBQVksU0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlcixcbiAgSG9zdExpc3RlbmVyLCBJbnB1dCwgT3V0cHV0XG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgbmdmLCBkcmFnTWV0YSB9IGZyb20gXCIuL25nZi5kaXJlY3RpdmVcIlxuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6IFwiW25nZkRyb3BdXCIsXG4gIGV4cG9ydEFzOiBcIm5nZkRyb3BcIlxufSlcbmV4cG9ydCBjbGFzcyBuZ2ZEcm9wIGV4dGVuZHMgbmdmIHtcbiAgQE91dHB1dCgpIGZpbGVPdmVyOkV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIEBJbnB1dCgpIHZhbGlkRHJhZzpib29sZWFuID0gZmFsc2VcbiAgQE91dHB1dCgpIHZhbGlkRHJhZ0NoYW5nZTpFdmVudEVtaXR0ZXI8Ym9vbGVhbj4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBpbnZhbGlkRHJhZyA9IGZhbHNlXG4gIEBPdXRwdXQoKSBpbnZhbGlkRHJhZ0NoYW5nZTpFdmVudEVtaXR0ZXI8Ym9vbGVhbj4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASW5wdXQoKSBkcmFnRmlsZXMgITogZHJhZ01ldGFbXVxuICBAT3V0cHV0KCkgZHJhZ0ZpbGVzQ2hhbmdlOkV2ZW50RW1pdHRlcjxkcmFnTWV0YVtdPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2Ryb3AnLCBbJyRldmVudCddKVxuICBvbkRyb3AoZXZlbnQ6RXZlbnQpOnZvaWQge1xuICAgIGlmKHRoaXMuZmlsZURyb3BEaXNhYmxlZCl7XG4gICAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmNsb3NlRHJhZ3MoKVxuICAgIGxldCBmaWxlcyA9IHRoaXMuZXZlbnRUb0ZpbGVzKGV2ZW50KVxuXG4gICAgaWYoIWZpbGVzLmxlbmd0aClyZXR1cm5cblxuICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICB0aGlzLmhhbmRsZUZpbGVzKGZpbGVzKVxuICB9XG5cbiAgaGFuZGxlRmlsZXMoZmlsZXM6RmlsZVtdKXtcbiAgICB0aGlzLmZpbGVPdmVyLmVtaXQoZmFsc2UpLy90dXJuLW9mZiBkcmFnb3ZlclxuICAgIHN1cGVyLmhhbmRsZUZpbGVzKGZpbGVzKVxuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZHJhZ292ZXInLCBbJyRldmVudCddKVxuICBvbkRyYWdPdmVyKGV2ZW50OkV2ZW50KTp2b2lkIHtcbiAgICBpZih0aGlzLmZpbGVEcm9wRGlzYWJsZWQpe1xuICAgICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNmZXIgPSB0aGlzLmV2ZW50VG9UcmFuc2ZlcihldmVudClcblxuICAgIGxldCBmaWxlcyA9IHRoaXMuZXZlbnRUb0ZpbGVzKGV2ZW50KVxuXG4gICAgbGV0IGpzb25GaWxlcyA9IHRoaXMuZmlsZXNUb1dyaXRlYWJsZU9iamVjdChmaWxlcylcbiAgICB0aGlzLmRyYWdGaWxlc0NoYW5nZS5lbWl0KCB0aGlzLmRyYWdGaWxlcz1qc29uRmlsZXMgKVxuXG4gICAgaWYoIGZpbGVzLmxlbmd0aCApe1xuICAgICAgdGhpcy52YWxpZERyYWcgPSB0aGlzLmlzRmlsZXNWYWxpZChmaWxlcylcbiAgICB9ZWxzZXtcbiAgICAgIC8vU2FmYXJpLCBJRTExICYgc29tZSBicm93c2VycyBkbyBOT1QgdGVsbCB5b3UgYWJvdXQgZHJhZ2dlZCBmaWxlcyB1bnRpbCBkcm9wcGVkLiBBbHdheXMgY29uc2lkZXIgYSB2YWxpZCBkcmFnXG4gICAgICB0aGlzLnZhbGlkRHJhZyA9IHRydWVcbiAgICB9XG5cbiAgICB0aGlzLnZhbGlkRHJhZ0NoYW5nZS5lbWl0KHRoaXMudmFsaWREcmFnKVxuXG4gICAgdGhpcy5pbnZhbGlkRHJhZyA9ICF0aGlzLnZhbGlkRHJhZ1xuICAgIHRoaXMuaW52YWxpZERyYWdDaGFuZ2UuZW1pdCh0aGlzLmludmFsaWREcmFnKVxuXG4gICAgdHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdjb3B5Jy8vY2hhbmdlIGN1cnNvciBhbmQgc3VjaFxuICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KVxuICAgIHRoaXMuZmlsZU92ZXIuZW1pdCh0cnVlKVxuICB9XG5cbiAgY2xvc2VEcmFncygpe1xuICAgIGRlbGV0ZSB0aGlzLnZhbGlkRHJhZ1xuICAgIHRoaXMudmFsaWREcmFnQ2hhbmdlLmVtaXQodGhpcy52YWxpZERyYWcpXG4gICAgdGhpcy5pbnZhbGlkRHJhZyA9IGZhbHNlXG4gICAgdGhpcy5pbnZhbGlkRHJhZ0NoYW5nZS5lbWl0KHRoaXMuaW52YWxpZERyYWcpXG4gICAgZGVsZXRlIHRoaXMuZHJhZ0ZpbGVzXG4gICAgdGhpcy5kcmFnRmlsZXNDaGFuZ2UuZW1pdCggdGhpcy5kcmFnRmlsZXMgKVxuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZHJhZ2xlYXZlJywgWyckZXZlbnQnXSlcbiAgb25EcmFnTGVhdmUoZXZlbnQ6RXZlbnQpOmFueSB7XG4gICAgaWYodGhpcy5maWxlRHJvcERpc2FibGVkKXtcbiAgICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBcbiAgICB0aGlzLmNsb3NlRHJhZ3MoKVxuXG4gICAgaWYgKCh0aGlzIGFzIGFueSkuZWxlbWVudCkge1xuICAgICAgaWYgKGV2ZW50LmN1cnJlbnRUYXJnZXQgPT09ICh0aGlzIGFzIGFueSkuZWxlbWVudFswXSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgIHRoaXMuZmlsZU92ZXIuZW1pdChmYWxzZSk7XG4gIH1cbn0iXX0=