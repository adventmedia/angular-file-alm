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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmRHJvcC5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2Fja2VyYXBwbGUvUHJvamVjdHMvd2ViL2FuZ3VsYXIvYW5ndWxhci1maWxlL2RldmVsb3BtZW50L3Byb2plY3RzL2FuZ3VsYXItZmlsZS9zcmMvIiwic291cmNlcyI6WyJmaWxlLXVwbG9hZC9uZ2ZEcm9wLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUFFLFlBQVksRUFDdkIsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQzVCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxHQUFHLEVBQVksTUFBTSxpQkFBaUIsQ0FBQTtBQU0vQyxNQUFNLE9BQU8sT0FBUSxTQUFRLEdBQUc7SUFKaEM7O1FBS1ksYUFBUSxHQUFxQixJQUFJLFlBQVksRUFBRSxDQUFDO1FBRWpELGNBQVMsR0FBVyxLQUFLLENBQUE7UUFDeEIsb0JBQWUsR0FBeUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUUzRCxnQkFBVyxHQUFHLEtBQUssQ0FBQTtRQUNsQixzQkFBaUIsR0FBeUIsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUc1RCxvQkFBZSxHQUE0QixJQUFJLFlBQVksRUFBRSxDQUFBO0lBaUZ6RSxDQUFDO0lBOUVDLE1BQU0sQ0FBQyxLQUFXO1FBQ2hCLElBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsT0FBTTtTQUNQO1FBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ2pCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFcEMsSUFBRyxDQUFDLEtBQUssQ0FBQyxNQUFNO1lBQUMsT0FBTTtRQUV2QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDekIsQ0FBQztJQUVELFdBQVcsQ0FBQyxLQUFZO1FBQ3RCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBLENBQUEsbUJBQW1CO1FBQzVDLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUdELFVBQVUsQ0FBQyxLQUFXO1FBQ3BCLElBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsT0FBTTtTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUU1QyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXBDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNsRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsU0FBUyxHQUFDLFNBQVMsQ0FBRSxDQUFBO1FBRXJELElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7U0FDMUM7YUFBSTtZQUNILDhHQUE4RztZQUM5RyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTtTQUN0QjtRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUV6QyxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQTtRQUNsQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUU3QyxRQUFRLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQSxDQUFBLHdCQUF3QjtRQUNwRCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzFCLENBQUM7SUFFRCxVQUFVO1FBQ1IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFBO1FBQ3JCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUN6QyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtRQUN4QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUM3QyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUE7UUFDckIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxDQUFBO0lBQzdDLENBQUM7SUFHRCxXQUFXLENBQUMsS0FBVztRQUNyQixJQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBQztZQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RCLE9BQU07U0FDUDtRQUVELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtRQUVqQixJQUFLLElBQVksQ0FBQyxPQUFPLEVBQUU7WUFDekIsSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFNLElBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELE9BQU87YUFDUjtTQUNGO1FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixDQUFDOzs7WUE5RkYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxXQUFXO2dCQUNyQixRQUFRLEVBQUUsU0FBUzthQUNwQjs7O3VCQUVFLE1BQU07d0JBRU4sS0FBSzs4QkFDTCxNQUFNOzBCQUVOLEtBQUs7Z0NBQ0wsTUFBTTt3QkFFTixLQUFLOzhCQUNMLE1BQU07cUJBRU4sWUFBWSxTQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQzt5QkFxQi9CLFlBQVksU0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7MEJBd0NuQyxZQUFZLFNBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgRGlyZWN0aXZlLCBFdmVudEVtaXR0ZXIsXG4gIEhvc3RMaXN0ZW5lciwgSW5wdXQsIE91dHB1dFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IG5nZiwgZHJhZ01ldGEgfSBmcm9tIFwiLi9uZ2YuZGlyZWN0aXZlXCJcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiBcIltuZ2ZEcm9wXVwiLFxuICBleHBvcnRBczogXCJuZ2ZEcm9wXCJcbn0pXG5leHBvcnQgY2xhc3MgbmdmRHJvcCBleHRlbmRzIG5nZiB7XG4gIEBPdXRwdXQoKSBmaWxlT3ZlcjpFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBASW5wdXQoKSB2YWxpZERyYWc6Ym9vbGVhbiA9IGZhbHNlXG4gIEBPdXRwdXQoKSB2YWxpZERyYWdDaGFuZ2U6RXZlbnRFbWl0dGVyPGJvb2xlYW4+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgaW52YWxpZERyYWcgPSBmYWxzZVxuICBAT3V0cHV0KCkgaW52YWxpZERyYWdDaGFuZ2U6RXZlbnRFbWl0dGVyPGJvb2xlYW4+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG5cbiAgQElucHV0KCkgZHJhZ0ZpbGVzICE6IGRyYWdNZXRhW11cbiAgQE91dHB1dCgpIGRyYWdGaWxlc0NoYW5nZTpFdmVudEVtaXR0ZXI8ZHJhZ01ldGFbXT4gPSBuZXcgRXZlbnRFbWl0dGVyKClcblxuICBASG9zdExpc3RlbmVyKCdkcm9wJywgWyckZXZlbnQnXSlcbiAgb25Ecm9wKGV2ZW50OkV2ZW50KTp2b2lkIHtcbiAgICBpZih0aGlzLmZpbGVEcm9wRGlzYWJsZWQpe1xuICAgICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5jbG9zZURyYWdzKClcbiAgICBsZXQgZmlsZXMgPSB0aGlzLmV2ZW50VG9GaWxlcyhldmVudClcblxuICAgIGlmKCFmaWxlcy5sZW5ndGgpcmV0dXJuXG5cbiAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgdGhpcy5oYW5kbGVGaWxlcyhmaWxlcylcbiAgfVxuXG4gIGhhbmRsZUZpbGVzKGZpbGVzOkZpbGVbXSl7XG4gICAgdGhpcy5maWxlT3Zlci5lbWl0KGZhbHNlKS8vdHVybi1vZmYgZHJhZ292ZXJcbiAgICBzdXBlci5oYW5kbGVGaWxlcyhmaWxlcylcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RyYWdvdmVyJywgWyckZXZlbnQnXSlcbiAgb25EcmFnT3ZlcihldmVudDpFdmVudCk6dm9pZCB7XG4gICAgaWYodGhpcy5maWxlRHJvcERpc2FibGVkKXtcbiAgICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zZmVyID0gdGhpcy5ldmVudFRvVHJhbnNmZXIoZXZlbnQpXG5cbiAgICBsZXQgZmlsZXMgPSB0aGlzLmV2ZW50VG9GaWxlcyhldmVudClcblxuICAgIGxldCBqc29uRmlsZXMgPSB0aGlzLmZpbGVzVG9Xcml0ZWFibGVPYmplY3QoZmlsZXMpXG4gICAgdGhpcy5kcmFnRmlsZXNDaGFuZ2UuZW1pdCggdGhpcy5kcmFnRmlsZXM9anNvbkZpbGVzIClcblxuICAgIGlmKCBmaWxlcy5sZW5ndGggKXtcbiAgICAgIHRoaXMudmFsaWREcmFnID0gdGhpcy5pc0ZpbGVzVmFsaWQoZmlsZXMpXG4gICAgfWVsc2V7XG4gICAgICAvL1NhZmFyaSwgSUUxMSAmIHNvbWUgYnJvd3NlcnMgZG8gTk9UIHRlbGwgeW91IGFib3V0IGRyYWdnZWQgZmlsZXMgdW50aWwgZHJvcHBlZC4gQWx3YXlzIGNvbnNpZGVyIGEgdmFsaWQgZHJhZ1xuICAgICAgdGhpcy52YWxpZERyYWcgPSB0cnVlXG4gICAgfVxuXG4gICAgdGhpcy52YWxpZERyYWdDaGFuZ2UuZW1pdCh0aGlzLnZhbGlkRHJhZylcblxuICAgIHRoaXMuaW52YWxpZERyYWcgPSAhdGhpcy52YWxpZERyYWdcbiAgICB0aGlzLmludmFsaWREcmFnQ2hhbmdlLmVtaXQodGhpcy5pbnZhbGlkRHJhZylcblxuICAgIHRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weScvL2NoYW5nZSBjdXJzb3IgYW5kIHN1Y2hcbiAgICB0aGlzLnN0b3BFdmVudChldmVudClcbiAgICB0aGlzLmZpbGVPdmVyLmVtaXQodHJ1ZSlcbiAgfVxuXG4gIGNsb3NlRHJhZ3MoKXtcbiAgICBkZWxldGUgdGhpcy52YWxpZERyYWdcbiAgICB0aGlzLnZhbGlkRHJhZ0NoYW5nZS5lbWl0KHRoaXMudmFsaWREcmFnKVxuICAgIHRoaXMuaW52YWxpZERyYWcgPSBmYWxzZVxuICAgIHRoaXMuaW52YWxpZERyYWdDaGFuZ2UuZW1pdCh0aGlzLmludmFsaWREcmFnKVxuICAgIGRlbGV0ZSB0aGlzLmRyYWdGaWxlc1xuICAgIHRoaXMuZHJhZ0ZpbGVzQ2hhbmdlLmVtaXQoIHRoaXMuZHJhZ0ZpbGVzIClcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIFsnJGV2ZW50J10pXG4gIG9uRHJhZ0xlYXZlKGV2ZW50OkV2ZW50KTphbnkge1xuICAgIGlmKHRoaXMuZmlsZURyb3BEaXNhYmxlZCl7XG4gICAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgXG4gICAgdGhpcy5jbG9zZURyYWdzKClcblxuICAgIGlmICgodGhpcyBhcyBhbnkpLmVsZW1lbnQpIHtcbiAgICAgIGlmIChldmVudC5jdXJyZW50VGFyZ2V0ID09PSAodGhpcyBhcyBhbnkpLmVsZW1lbnRbMF0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICB0aGlzLmZpbGVPdmVyLmVtaXQoZmFsc2UpO1xuICB9XG59Il19