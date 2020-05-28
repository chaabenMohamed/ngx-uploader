import { __decorate, __metadata } from "tslib";
import { Directive, ElementRef, EventEmitter, Input, Output, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NgUploaderService } from './ngx-uploader.class';
let NgFileDropDirective = class NgFileDropDirective {
    constructor(elementRef) {
        this.elementRef = elementRef;
        this.stopEvent = (e) => {
            e.stopPropagation();
            e.preventDefault();
        };
        this.uploadOutput = new EventEmitter();
    }
    ngOnInit() {
        this._sub = [];
        const concurrency = this.options && this.options.concurrency || Number.POSITIVE_INFINITY;
        const allowedContentTypes = this.options && this.options.allowedContentTypes || ['*'];
        const maxUploads = this.options && this.options.maxUploads || Number.POSITIVE_INFINITY;
        const maxFileSize = this.options && this.options.maxFileSize || Number.POSITIVE_INFINITY;
        this.upload = new NgUploaderService(concurrency, allowedContentTypes, maxUploads, maxFileSize);
        this.el = this.elementRef.nativeElement;
        this._sub.push(this.upload.serviceEvents.subscribe((event) => {
            this.uploadOutput.emit(event);
        }));
        if (this.uploadInput instanceof EventEmitter) {
            this._sub.push(this.upload.initInputEvents(this.uploadInput));
        }
        this.el.addEventListener('drop', this.stopEvent, false);
        this.el.addEventListener('dragenter', this.stopEvent, false);
        this.el.addEventListener('dragover', this.stopEvent, false);
    }
    ngOnDestroy() {
        this._sub.forEach(sub => sub.unsubscribe());
    }
    onDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        const event = { type: 'drop' };
        this.uploadOutput.emit(event);
        this.upload.handleFiles(e.dataTransfer.files);
    }
    onDragOver(e) {
        if (!e) {
            return;
        }
        const event = { type: 'dragOver' };
        this.uploadOutput.emit(event);
    }
    onDragLeave(e) {
        if (!e) {
            return;
        }
        const event = { type: 'dragOut' };
        this.uploadOutput.emit(event);
    }
};
NgFileDropDirective.ctorParameters = () => [
    { type: ElementRef }
];
__decorate([
    Input(),
    __metadata("design:type", Object)
], NgFileDropDirective.prototype, "options", void 0);
__decorate([
    Input(),
    __metadata("design:type", EventEmitter)
], NgFileDropDirective.prototype, "uploadInput", void 0);
__decorate([
    Output(),
    __metadata("design:type", EventEmitter)
], NgFileDropDirective.prototype, "uploadOutput", void 0);
__decorate([
    HostListener('drop', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NgFileDropDirective.prototype, "onDrop", null);
__decorate([
    HostListener('dragover', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Event]),
    __metadata("design:returntype", void 0)
], NgFileDropDirective.prototype, "onDragOver", null);
__decorate([
    HostListener('dragleave', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Event]),
    __metadata("design:returntype", void 0)
], NgFileDropDirective.prototype, "onDragLeave", null);
NgFileDropDirective = __decorate([
    Directive({
        selector: '[ngFileDrop]'
    }),
    __metadata("design:paramtypes", [ElementRef])
], NgFileDropDirective);
export { NgFileDropDirective };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmlsZS1kcm9wLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC11cGxvYWRlci8iLCJzb3VyY2VzIjpbImxpYi9uZy1maWxlLWRyb3AuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUVwSCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQU16RCxJQUFhLG1CQUFtQixHQUFoQyxNQUFhLG1CQUFtQjtJQVU5QixZQUFtQixVQUFzQjtRQUF0QixlQUFVLEdBQVYsVUFBVSxDQUFZO1FBaUN6QyxjQUFTLEdBQUcsQ0FBQyxDQUFRLEVBQUUsRUFBRTtZQUN2QixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDcEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQTtRQW5DQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFnQixDQUFDO0lBQ3ZELENBQUM7SUFFRCxRQUFRO1FBQ04sSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztRQUN6RixNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDO1FBQ3ZGLE1BQU0sV0FBVyxH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V0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7O3FDQUNoQixLQUFLOztzREFPMUI7QUE1RVUsbUJBQW1CO0lBSC9CLFNBQVMsQ0FBQztRQUNULFFBQVEsRUFBRSxjQUFjO0tBQ3pCLENBQUM7cUNBVytCLFVBQVU7R0FWOUIsbUJBQW1CLENBNkUvQjtTQTdFWSxtQkFBbUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE91dHB1dCwgT25Jbml0LCBPbkRlc3Ryb3ksIEhvc3RMaXN0ZW5lciB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgVXBsb2FkT3V0cHV0LCBVcGxvYWRJbnB1dCwgVXBsb2FkZXJPcHRpb25zIH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7IE5nVXBsb2FkZXJTZXJ2aWNlIH0gZnJvbSAnLi9uZ3gtdXBsb2FkZXIuY2xhc3MnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tuZ0ZpbGVEcm9wXSdcbn0pXG5leHBvcnQgY2xhc3MgTmdGaWxlRHJvcERpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgQElucHV0KCkgb3B0aW9uczogVXBsb2FkZXJPcHRpb25zO1xuICBASW5wdXQoKSB1cGxvYWRJbnB1dDogRXZlbnRFbWl0dGVyPFVwbG9hZElucHV0PjtcbiAgQE91dHB1dCgpIHVwbG9hZE91dHB1dDogRXZlbnRFbWl0dGVyPFVwbG9hZE91dHB1dD47XG5cbiAgdXBsb2FkOiBOZ1VwbG9hZGVyU2VydmljZTtcbiAgZWw6IEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgX3N1YjogU3Vic2NyaXB0aW9uW107XG5cbiAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICB0aGlzLnVwbG9hZE91dHB1dCA9IG5ldyBFdmVudEVtaXR0ZXI8VXBsb2FkT3V0cHV0PigpO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5fc3ViID0gW107XG4gICAgY29uc3QgY29uY3VycmVuY3kgPSB0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLmNvbmN1cnJlbmN5IHx8IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICBjb25zdCBhbGxvd2VkQ29udGVudFR5cGVzID0gdGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5hbGxvd2VkQ29udGVudFR5cGVzIHx8IFsnKiddO1xuICAgIGNvbnN0IG1heFVwbG9hZHMgPSB0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLm1heFVwbG9hZHMgfHwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGNvbnN0IG1heEZpbGVTaXplID0gdGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5tYXhGaWxlU2l6ZSB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgdGhpcy51cGxvYWQgPSBuZXcgTmdVcGxvYWRlclNlcnZpY2UoY29uY3VycmVuY3ksIGFsbG93ZWRDb250ZW50VHlwZXMsIG1heFVwbG9hZHMsIG1heEZpbGVTaXplKTtcblxuICAgIHRoaXMuZWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgIHRoaXMuX3N1Yi5wdXNoKFxuICAgICAgdGhpcy51cGxvYWQuc2VydmljZUV2ZW50cy5zdWJzY3JpYmUoKGV2ZW50OiBVcGxvYWRPdXRwdXQpID0+IHtcbiAgICAgICAgdGhpcy51cGxvYWRPdXRwdXQuZW1pdChldmVudCk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICBpZiAodGhpcy51cGxvYWRJbnB1dCBpbnN0YW5jZW9mIEV2ZW50RW1pdHRlcikge1xuICAgICAgdGhpcy5fc3ViLnB1c2godGhpcy51cGxvYWQuaW5pdElucHV0RXZlbnRzKHRoaXMudXBsb2FkSW5wdXQpKTtcbiAgICB9XG5cbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLnN0b3BFdmVudCwgZmFsc2UpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgdGhpcy5zdG9wRXZlbnQsIGZhbHNlKTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5zdG9wRXZlbnQsIGZhbHNlKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3N1Yi5mb3JFYWNoKHN1YiA9PiBzdWIudW5zdWJzY3JpYmUoKSk7XG4gIH1cblxuICBzdG9wRXZlbnQgPSAoZTogRXZlbnQpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2Ryb3AnLCBbJyRldmVudCddKVxuICBwdWJsaWMgb25Ecm9wKGU6IGFueSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgY29uc3QgZXZlbnQ6IFVwbG9hZE91dHB1dCA9IHsgdHlwZTogJ2Ryb3AnIH07XG4gICAgdGhpcy51cGxvYWRPdXRwdXQuZW1pdChldmVudCk7XG4gICAgdGhpcy51cGxvYWQuaGFuZGxlRmlsZXMoZS5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZHJhZ292ZXInLCBbJyRldmVudCddKVxuICBwdWJsaWMgb25EcmFnT3ZlcihlOiBFdmVudCkge1xuICAgIGlmICghZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV2ZW50OiBVcGxvYWRPdXRwdXQgPSB7IHR5cGU6ICdkcmFnT3ZlcicgfTtcbiAgICB0aGlzLnVwbG9hZE91dHB1dC5lbWl0KGV2ZW50KTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIFsnJGV2ZW50J10pXG4gIHB1YmxpYyBvbkRyYWdMZWF2ZShlOiBFdmVudCkge1xuICAgIGlmICghZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV2ZW50OiBVcGxvYWRPdXRwdXQgPSB7IHR5cGU6ICdkcmFnT3V0JyB9O1xuICAgIHRoaXMudXBsb2FkT3V0cHV0LmVtaXQoZXZlbnQpO1xuICB9XG59XG4iXX0=