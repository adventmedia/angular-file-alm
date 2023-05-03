import { EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import { InvalidFileItem } from "./fileTools";
export interface dragMeta {
    type: string;
    kind: string;
}
/** A master base set of logic intended to support file select/drag/drop operations
 NOTE: Use ngfDrop for full drag/drop. Use ngfSelect for selecting
*/
export declare class ngf {
    element: ElementRef;
    fileElm: any;
    filters: {
        name: string;
        fn: (file: File) => boolean;
    }[];
    lastFileCount: number;
    multiple: string;
    accept: string;
    maxSize: number;
    ngfFixOrientation: boolean;
    fileDropDisabled: boolean;
    selectable: boolean | string;
    directiveInit: EventEmitter<ngf>;
    lastInvalids: InvalidFileItem[];
    lastInvalidsChange: EventEmitter<{
        file: File;
        type: string;
    }[]>;
    lastBaseUrl: string;
    lastBaseUrlChange: EventEmitter<string>;
    file?: File;
    fileChange: EventEmitter<File>;
    files: File[];
    filesChange: EventEmitter<File[]>;
    fileSelectStart: EventEmitter<Event>;
    capturePaste: boolean;
    pasteCapturer: (e: Event) => void;
    constructor(element: ElementRef);
    initFilters(): void;
    ngOnDestroy(): void;
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    evalCapturePaste(): void;
    destroyPasteListener(): void;
    paramFileElm(): any;
    /** Only used when host element we are attached to is NOT a fileElement */
    createFileElm({ change }: {
        change: () => any;
    }): HTMLInputElement;
    enableSelecting(): void;
    getValidFiles(files: File[]): File[];
    getInvalidFiles(files: File[]): InvalidFileItem[];
    handleFiles(files: File[]): void;
    que(files: File[]): void;
    /** called when input has files */
    changeFn(event: any): void;
    clickHandler(evt: Event): boolean;
    beforeSelect(event: Event): void;
    clearFileElmValue(): void;
    isEmptyAfterSelection(): boolean;
    stopEvent(event: any): any;
    transferHasFiles(transfer: any): any;
    eventToFiles(event: Event): any[];
    applyExifRotations(files: File[]): Promise<File[]>;
    onChange(event: Event): void;
    getFileFilterFailName(file: File): string | undefined;
    isFileValid(file: File): boolean;
    isFilesValid(files: File[]): boolean;
    protected _acceptFilter(item: File): boolean;
    protected _fileSizeFilter(item: File): boolean;
}
/** browsers try hard to conceal data about file drags, this tends to undo that */
export declare function filesToWriteableObject(files: File[]): dragMeta[];
export declare function eventToTransfer(event: any): TransferObject;
interface TransferObject {
    items?: any[];
    files?: any[];
    dropEffect?: 'copy';
}
export {};
