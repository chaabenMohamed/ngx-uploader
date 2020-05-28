import { __decorate, __metadata } from "tslib";
import { Directive, ElementRef, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { NgUploaderService } from './ngx-uploader.class';
var NgFileSelectDirective = /** @class */ (function () {
    function NgFileSelectDirective(elementRef) {
        var _this = this;
        this.elementRef = elementRef;
        this.fileListener = function () {
            if (_this.el.files) {
                _this.upload.handleFiles(_this.el.files);
            }
        };
        this.uploadOutput = new EventEmitter();
    }
    NgFileSelectDirective.prototype.ngOnInit = function () {
        var _this = this;
        this._sub = [];
        var concurrency = this.options && this.options.concurrency || Number.POSITIVE_INFINITY;
        var allowedContentTypes = this.options && this.options.allowedContentTypes || ['*'];
        var maxUploads = this.options && this.options.maxUploads || Number.POSITIVE_INFINITY;
        var maxFileSize = this.options && this.options.maxFileSize || Number.POSITIVE_INFINITY;
        this.upload = new NgUploaderService(concurrency, allowedContentTypes, maxUploads, maxFileSize);
        this.el = this.elementRef.nativeElement;
        this.el.addEventListener('change', this.fileListener, false);
        this._sub.push(this.upload.serviceEvents.subscribe(function (event) {
            _this.uploadOutput.emit(event);
        }));
        if (this.uploadInput instanceof EventEmitter) {
            this._sub.push(this.upload.initInputEvents(this.uploadInput));
        }
    };
    NgFileSelectDirective.prototype.ngOnDestroy = function () {
        if (this.el) {
            this.el.removeEventListener('change', this.fileListener, false);
            this._sub.forEach(function (sub) { return sub.unsubscribe(); });
        }
    };
    NgFileSelectDirective.ctorParameters = function () { return [
        { type: ElementRef }
    ]; };
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], NgFileSelectDirective.prototype, "options", void 0);
    __decorate([
        Input(),
        __metadata("design:type", EventEmitter)
    ], NgFileSelectDirective.prototype, "uploadInput", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], NgFileSelectDirective.prototype, "uploadOutput", void 0);
    NgFileSelectDirective = __decorate([
        Directive({
            selector: '[ngFileSelect]'
        }),
        __metadata("design:paramtypes", [ElementRef])
    ], NgFileSelectDirective);
    return NgFileSelectDirective;
}());
export { NgFileSelectDirective };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmlsZS1zZWxlY3QuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXVwbG9hZGVyLyIsInNvdXJjZXMiOlsibGliL25nLWZpbGUtc2VsZWN0LmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUV0RyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQU16RDtJQVVFLCtCQUFtQixVQUFzQjtRQUF6QyxpQkFFQztRQUZrQixlQUFVLEdBQVYsVUFBVSxDQUFZO1FBaUN6QyxpQkFBWSxHQUFHO1lBQ2IsSUFBSSxLQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRTtnQkFDakIsS0FBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN4QztRQUNILENBQUMsQ0FBQTtRQXBDQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFnQixDQUFDO0lBQ3ZELENBQUM7SUFFRCx3Q0FBUSxHQUFSO1FBQUEsaUJBb0JDO1FBbkJDLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUM7UUFDekYsSUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0RixJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztRQUN2RixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztRQUN6RixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksaUJBQWlCLENBQUMsV0FBVyxFQUFFLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUUvRixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFN0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLFVBQUMsS0FBbUI7WUFDdEQsS0FBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUVGLElBQUksSUFBSSxDQUFDLFdBQVcsWUFBWSxZQUFZLEVBQUU7WUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7U0FDL0Q7SUFDSCxDQUFDO0lBRUQsMkNBQVcsR0FBWDtRQUNFLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBQztZQUNWLElBQUksQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQWpCLENBQWlCLENBQUMsQ0FBQztTQUM3QztJQUNILENBQUM7O2dCQS9COEIsVUFBVTs7SUFUaEM7UUFBUixLQUFLLEVBQUU7OzBEQUEwQjtJQUN6QjtRQUFSLEtBQUssRUFBRTtrQ0FBYyxZQUFZOzhEQUFNO0lBQzlCO1FBQVQsTUFBTSxFQUFFO2tDQUFlLFlBQVk7K0RBQWU7SUFIeEMscUJBQXFCO1FBSGpDLFNBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxnQkFBZ0I7U0FDM0IsQ0FBQzt5Q0FXK0IsVUFBVTtPQVY5QixxQkFBcUIsQ0FnRGpDO0lBQUQsNEJBQUM7Q0FBQSxBQWhERCxJQWdEQztTQWhEWSxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE91dHB1dCwgT25Jbml0LCBPbkRlc3Ryb3kgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFVwbG9hZE91dHB1dCwgVXBsb2FkZXJPcHRpb25zIH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7IE5nVXBsb2FkZXJTZXJ2aWNlIH0gZnJvbSAnLi9uZ3gtdXBsb2FkZXIuY2xhc3MnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tuZ0ZpbGVTZWxlY3RdJ1xufSlcbmV4cG9ydCBjbGFzcyBOZ0ZpbGVTZWxlY3REaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7XG4gIEBJbnB1dCgpIG9wdGlvbnM6IFVwbG9hZGVyT3B0aW9ucztcbiAgQElucHV0KCkgdXBsb2FkSW5wdXQ6IEV2ZW50RW1pdHRlcjxhbnk+O1xuICBAT3V0cHV0KCkgdXBsb2FkT3V0cHV0OiBFdmVudEVtaXR0ZXI8VXBsb2FkT3V0cHV0PjtcblxuICB1cGxvYWQ6IE5nVXBsb2FkZXJTZXJ2aWNlO1xuICBlbDogSFRNTElucHV0RWxlbWVudDtcblxuICBfc3ViOiBTdWJzY3JpcHRpb25bXTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikge1xuICAgIHRoaXMudXBsb2FkT3V0cHV0ID0gbmV3IEV2ZW50RW1pdHRlcjxVcGxvYWRPdXRwdXQ+KCk7XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLl9zdWIgPSBbXTtcbiAgICBjb25zdCBjb25jdXJyZW5jeSA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuY29uY3VycmVuY3kgfHwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGNvbnN0IGFsbG93ZWRDb250ZW50VHlwZXMgPSB0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLmFsbG93ZWRDb250ZW50VHlwZXMgfHwgWycqJ107XG4gICAgY29uc3QgbWF4VXBsb2FkcyA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMubWF4VXBsb2FkcyB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgY29uc3QgbWF4RmlsZVNpemUgPSB0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLm1heEZpbGVTaXplIHx8IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICB0aGlzLnVwbG9hZCA9IG5ldyBOZ1VwbG9hZGVyU2VydmljZShjb25jdXJyZW5jeSwgYWxsb3dlZENvbnRlbnRUeXBlcywgbWF4VXBsb2FkcywgbWF4RmlsZVNpemUpO1xuXG4gICAgdGhpcy5lbCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5maWxlTGlzdGVuZXIsIGZhbHNlKTtcblxuICAgIHRoaXMuX3N1Yi5wdXNoKFxuICAgICAgdGhpcy51cGxvYWQuc2VydmljZUV2ZW50cy5zdWJzY3JpYmUoKGV2ZW50OiBVcGxvYWRPdXRwdXQpID0+IHtcbiAgICAgICAgdGhpcy51cGxvYWRPdXRwdXQuZW1pdChldmVudCk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICBpZiAodGhpcy51cGxvYWRJbnB1dCBpbnN0YW5jZW9mIEV2ZW50RW1pdHRlcikge1xuICAgICAgdGhpcy5fc3ViLnB1c2godGhpcy51cGxvYWQuaW5pdElucHV0RXZlbnRzKHRoaXMudXBsb2FkSW5wdXQpKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5lbCl7XG4gICAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuZmlsZUxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICB0aGlzLl9zdWIuZm9yRWFjaChzdWIgPT4gc3ViLnVuc3Vic2NyaWJlKCkpO1xuICAgIH1cbiAgfVxuXG4gIGZpbGVMaXN0ZW5lciA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5lbC5maWxlcykge1xuICAgICAgdGhpcy51cGxvYWQuaGFuZGxlRmlsZXModGhpcy5lbC5maWxlcyk7XG4gICAgfVxuICB9XG59XG4iXX0=