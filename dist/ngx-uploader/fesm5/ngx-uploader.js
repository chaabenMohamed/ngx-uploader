import { __spread, __decorate, __metadata } from 'tslib';
import { EventEmitter, ElementRef, Input, Output, HostListener, Directive, NgModule } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { mergeMap, finalize } from 'rxjs/operators';

var UploadStatus;
(function (UploadStatus) {
    UploadStatus[UploadStatus["Queue"] = 0] = "Queue";
    UploadStatus[UploadStatus["Uploading"] = 1] = "Uploading";
    UploadStatus[UploadStatus["Done"] = 2] = "Done";
    UploadStatus[UploadStatus["Cancelled"] = 3] = "Cancelled";
})(UploadStatus || (UploadStatus = {}));

function humanizeBytes(bytes) {
    if (bytes === 0) {
        return '0 Byte';
    }
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
var NgUploaderService = /** @class */ (function () {
    function NgUploaderService(concurrency, contentTypes, maxUploads, maxFileSize) {
        var _this = this;
        if (concurrency === void 0) { concurrency = Number.POSITIVE_INFINITY; }
        if (contentTypes === void 0) { contentTypes = ['*']; }
        if (maxUploads === void 0) { maxUploads = Number.POSITIVE_INFINITY; }
        if (maxFileSize === void 0) { maxFileSize = Number.POSITIVE_INFINITY; }
        this.queue = [];
        this.serviceEvents = new EventEmitter();
        this.uploadScheduler = new Subject();
        this.subs = [];
        this.contentTypes = contentTypes;
        this.maxUploads = maxUploads;
        this.maxFileSize = maxFileSize;
        this.uploadScheduler
            .pipe(mergeMap(function (upload) { return _this.startUpload(upload); }, concurrency))
            .subscribe(function (uploadOutput) { return _this.serviceEvents.emit(uploadOutput); });
    }
    NgUploaderService.prototype.handleFiles = function (incomingFiles) {
        var _a;
        var _this = this;
        var allowedIncomingFiles = [].reduce.call(incomingFiles, function (acc, checkFile, i) {
            var futureQueueLength = acc.length + _this.queue.length + 1;
            if (_this.isContentTypeAllowed(checkFile.type) && futureQueueLength <= _this.maxUploads && _this.isFileSizeAllowed(checkFile.size)) {
                acc = acc.concat(checkFile);
            }
            else {
                var rejectedFile = _this.makeUploadFile(checkFile, i);
                _this.serviceEvents.emit({ type: 'rejected', file: rejectedFile });
            }
            return acc;
        }, []);
        (_a = this.queue).push.apply(_a, __spread([].map.call(allowedIncomingFiles, function (file, i) {
            var uploadFile = _this.makeUploadFile(file, i);
            _this.serviceEvents.emit({ type: 'addedToQueue', file: uploadFile });
            return uploadFile;
        })));
        this.serviceEvents.emit({ type: 'allAddedToQueue' });
    };
    NgUploaderService.prototype.initInputEvents = function (input) {
        var _this = this;
        return input.subscribe(function (event) {
            switch (event.type) {
                case 'uploadFile':
                    var uploadFileIndex = _this.queue.findIndex(function (file) { return file === event.file; });
                    if (uploadFileIndex !== -1 && event.file) {
                        _this.uploadScheduler.next({ file: _this.queue[uploadFileIndex], event: event });
                    }
                    break;
                case 'uploadAll':
                    var files = _this.queue.filter(function (file) { return file.progress.status === UploadStatus.Queue; });
                    files.forEach(function (file) { return _this.uploadScheduler.next({ file: file, event: event }); });
                    break;
                case 'cancel':
                    var id_1 = event.id || null;
                    if (!id_1) {
                        return;
                    }
                    var subs = _this.subs.filter(function (sub) { return sub.id === id_1; });
                    subs.forEach(function (sub) {
                        if (sub.sub) {
                            sub.sub.unsubscribe();
                            var fileIndex = _this.queue.findIndex(function (file) { return file.id === id_1; });
                            if (fileIndex !== -1) {
                                _this.queue[fileIndex].progress.status = UploadStatus.Cancelled;
                                _this.serviceEvents.emit({ type: 'cancelled', file: _this.queue[fileIndex] });
                            }
                        }
                    });
                    break;
                case 'cancelAll':
                    _this.subs.forEach(function (sub) {
                        if (sub.sub) {
                            sub.sub.unsubscribe();
                        }
                        var file = _this.queue.find(function (uploadFile) { return uploadFile.id === sub.id; });
                        if (file) {
                            file.progress.status = UploadStatus.Cancelled;
                            _this.serviceEvents.emit({ type: 'cancelled', file: file });
                        }
                    });
                    break;
                case 'remove':
                    if (!event.id) {
                        return;
                    }
                    var i = _this.queue.findIndex(function (file) { return file.id === event.id; });
                    if (i !== -1) {
                        var file = _this.queue[i];
                        _this.queue.splice(i, 1);
                        _this.serviceEvents.emit({ type: 'removed', file: file });
                    }
                    break;
                case 'removeAll':
                    if (_this.queue.length) {
                        _this.queue = [];
                        _this.serviceEvents.emit({ type: 'removedAll' });
                    }
                    break;
            }
        });
    };
    NgUploaderService.prototype.startUpload = function (upload) {
        var _this = this;
        return new Observable(function (observer) {
            var sub = _this.uploadFile(upload.file, upload.event)
                .pipe(finalize(function () {
                if (!observer.closed) {
                    observer.complete();
                }
            }))
                .subscribe(function (output) {
                observer.next(output);
            }, function (err) {
                observer.error(err);
                observer.complete();
            }, function () {
                observer.complete();
            });
            _this.subs.push({ id: upload.file.id, sub: sub });
        });
    };
    NgUploaderService.prototype.uploadFile = function (file, event) {
        var _this = this;
        return new Observable(function (observer) {
            var url = event.url || '';
            var method = event.method || 'POST';
            var data = event.data || {};
            var headers = event.headers || {};
            var xhr = new XMLHttpRequest();
            var time = new Date().getTime();
            var progressStartTime = (file.progress.data && file.progress.data.startTime) || time;
            var speed = 0;
            var eta = null;
            xhr.upload.addEventListener('progress', function (e) {
                if (e.lengthComputable) {
                    var percentage = Math.round((e.loaded * 100) / e.total);
                    var diff = new Date().getTime() - time;
                    speed = Math.round(e.loaded / diff * 1000);
                    progressStartTime = (file.progress.data && file.progress.data.startTime) || new Date().getTime();
                    eta = Math.ceil((e.total - e.loaded) / speed);
                    file.progress = {
                        status: UploadStatus.Uploading,
                        data: {
                            percentage: percentage,
                            speed: speed,
                            speedHuman: humanizeBytes(speed) + "/s",
                            startTime: progressStartTime,
                            endTime: null,
                            eta: eta,
                            etaHuman: _this.secondsToHuman(eta)
                        }
                    };
                    observer.next({ type: 'uploading', file: file });
                }
            }, false);
            xhr.upload.addEventListener('error', function (e) {
                observer.error(e);
                observer.complete();
            });
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    var speedAverage = Math.round(file.size / (new Date().getTime() - progressStartTime) * 1000);
                    file.progress = {
                        status: UploadStatus.Done,
                        data: {
                            percentage: 100,
                            speed: speedAverage,
                            speedHuman: humanizeBytes(speedAverage) + "/s",
                            startTime: progressStartTime,
                            endTime: new Date().getTime(),
                            eta: eta,
                            etaHuman: _this.secondsToHuman(eta || 0)
                        }
                    };
                    file.responseStatus = xhr.status;
                    try {
                        file.response = JSON.parse(xhr.response);
                    }
                    catch (e) {
                        file.response = xhr.response;
                    }
                    file.responseHeaders = _this.parseResponseHeaders(xhr.getAllResponseHeaders());
                    observer.next({ type: 'done', file: file });
                    observer.complete();
                }
            };
            xhr.open(method, url, true);
            xhr.withCredentials = event.withCredentials ? true : false;
            try {
                var uploadFile_1 = file.nativeFile;
                var uploadIndex = _this.queue.findIndex(function (outFile) { return outFile.nativeFile === uploadFile_1; });
                if (_this.queue[uploadIndex].progress.status === UploadStatus.Cancelled) {
                    observer.complete();
                }
                Object.keys(headers).forEach(function (key) { return xhr.setRequestHeader(key, headers[key]); });
                var bodyToSend = void 0;
                if (event.includeWebKitFormBoundary !== false) {
                    Object.keys(data).forEach(function (key) { return file.form.append(key, data[key]); });
                    file.form.append(event.fieldName || 'file', uploadFile_1, uploadFile_1.name);
                    bodyToSend = file.form;
                }
                else {
                    bodyToSend = uploadFile_1;
                }
                _this.serviceEvents.emit({ type: 'start', file: file });
                xhr.send(bodyToSend);
            }
            catch (e) {
                observer.complete();
            }
            return function () {
                xhr.abort();
            };
        });
    };
    NgUploaderService.prototype.secondsToHuman = function (sec) {
        return new Date(sec * 1000).toISOString().substr(11, 8);
    };
    NgUploaderService.prototype.generateId = function () {
        return Math.random().toString(36).substring(7);
    };
    NgUploaderService.prototype.setContentTypes = function (contentTypes) {
        if (typeof contentTypes !== 'undefined' && contentTypes instanceof Array) {
            if (contentTypes.find(function (type) { return type === '*'; }) !== undefined) {
                this.contentTypes = ['*'];
            }
            else {
                this.contentTypes = contentTypes;
            }
            return;
        }
        this.contentTypes = ['*'];
    };
    NgUploaderService.prototype.allContentTypesAllowed = function () {
        return this.contentTypes.find(function (type) { return type === '*'; }) !== undefined;
    };
    NgUploaderService.prototype.isContentTypeAllowed = function (mimetype) {
        if (this.allContentTypesAllowed()) {
            return true;
        }
        return this.contentTypes.find(function (type) { return type === mimetype; }) !== undefined;
    };
    NgUploaderService.prototype.isFileSizeAllowed = function (fileSize) {
        if (!this.maxFileSize) {
            return true;
        }
        return fileSize <= this.maxFileSize;
    };
    NgUploaderService.prototype.makeUploadFile = function (file, index) {
        return {
            fileIndex: index,
            id: this.generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            form: new FormData(),
            progress: {
                status: UploadStatus.Queue,
                data: {
                    percentage: 0,
                    speed: 0,
                    speedHuman: humanizeBytes(0) + "/s",
                    startTime: null,
                    endTime: null,
                    eta: null,
                    etaHuman: null
                }
            },
            lastModifiedDate: new Date(file.lastModified),
            sub: undefined,
            nativeFile: file
        };
    };
    NgUploaderService.prototype.parseResponseHeaders = function (httpHeaders) {
        if (!httpHeaders) {
            return;
        }
        return httpHeaders.split('\n')
            .map(function (x) { return x.split(/: */, 2); })
            .filter(function (x) { return x[0]; })
            .reduce(function (acc, x) {
            acc[x[0]] = x[1];
            return acc;
        }, {});
    };
    return NgUploaderService;
}());

var NgFileDropDirective = /** @class */ (function () {
    function NgFileDropDirective(elementRef) {
        this.elementRef = elementRef;
        this.stopEvent = function (e) {
            e.stopPropagation();
            e.preventDefault();
        };
        this.uploadOutput = new EventEmitter();
    }
    NgFileDropDirective.prototype.ngOnInit = function () {
        var _this = this;
        this._sub = [];
        var concurrency = this.options && this.options.concurrency || Number.POSITIVE_INFINITY;
        var allowedContentTypes = this.options && this.options.allowedContentTypes || ['*'];
        var maxUploads = this.options && this.options.maxUploads || Number.POSITIVE_INFINITY;
        var maxFileSize = this.options && this.options.maxFileSize || Number.POSITIVE_INFINITY;
        this.upload = new NgUploaderService(concurrency, allowedContentTypes, maxUploads, maxFileSize);
        this.el = this.elementRef.nativeElement;
        this._sub.push(this.upload.serviceEvents.subscribe(function (event) {
            _this.uploadOutput.emit(event);
        }));
        if (this.uploadInput instanceof EventEmitter) {
            this._sub.push(this.upload.initInputEvents(this.uploadInput));
        }
        this.el.addEventListener('drop', this.stopEvent, false);
        this.el.addEventListener('dragenter', this.stopEvent, false);
        this.el.addEventListener('dragover', this.stopEvent, false);
    };
    NgFileDropDirective.prototype.ngOnDestroy = function () {
        this._sub.forEach(function (sub) { return sub.unsubscribe(); });
    };
    NgFileDropDirective.prototype.onDrop = function (e) {
        e.stopPropagation();
        e.preventDefault();
        var event = { type: 'drop' };
        this.uploadOutput.emit(event);
        this.upload.handleFiles(e.dataTransfer.files);
    };
    NgFileDropDirective.prototype.onDragOver = function (e) {
        if (!e) {
            return;
        }
        var event = { type: 'dragOver' };
        this.uploadOutput.emit(event);
    };
    NgFileDropDirective.prototype.onDragLeave = function (e) {
        if (!e) {
            return;
        }
        var event = { type: 'dragOut' };
        this.uploadOutput.emit(event);
    };
    NgFileDropDirective.ctorParameters = function () { return [
        { type: ElementRef }
    ]; };
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
    return NgFileDropDirective;
}());

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

var NgxUploaderModule = /** @class */ (function () {
    function NgxUploaderModule() {
    }
    NgxUploaderModule = __decorate([
        NgModule({
            declarations: [NgFileDropDirective, NgFileSelectDirective],
            exports: [NgFileDropDirective, NgFileSelectDirective]
        })
    ], NgxUploaderModule);
    return NgxUploaderModule;
}());

/*
 * Public API Surface of ngx-uploader
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgFileDropDirective, NgFileSelectDirective, NgUploaderService, NgxUploaderModule, UploadStatus, humanizeBytes };
//# sourceMappingURL=ngx-uploader.js.map
