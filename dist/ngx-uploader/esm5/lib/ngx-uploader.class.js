import { __read, __spread } from "tslib";
import { EventEmitter } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { mergeMap, finalize } from 'rxjs/operators';
import { UploadStatus } from './interfaces';
export function humanizeBytes(bytes) {
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
export { NgUploaderService };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXVwbG9hZGVyLmNsYXNzLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXVwbG9hZGVyLyIsInNvdXJjZXMiOlsibGliL25neC11cGxvYWRlci5jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBZ0IsTUFBTSxNQUFNLENBQUM7QUFDekQsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQXlDLFlBQVksRUFBWSxNQUFNLGNBQWMsQ0FBQztBQUU3RixNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQWE7SUFDekMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2YsT0FBTyxRQUFRLENBQUM7S0FDakI7SUFFRCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDZixJQUFNLEtBQUssR0FBYSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDaEUsSUFBTSxDQUFDLEdBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU1RCxPQUFPLFVBQVUsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQztBQUVEO0lBU0UsMkJBQ0UsV0FBOEMsRUFDOUMsWUFBOEIsRUFDOUIsVUFBNkMsRUFDN0MsV0FBOEM7UUFKaEQsaUJBbUJDO1FBbEJDLDRCQUFBLEVB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Q0FBQyxFQUFqQixDQUFpQixDQUFDO2FBQ3JDLE1BQU0sQ0FBQyxVQUFDLENBQVcsSUFBSyxPQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBSixDQUFJLENBQUM7YUFDN0IsTUFBTSxDQUFDLFVBQUMsR0FBVyxFQUFFLENBQVc7WUFDL0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNYLENBQUM7SUFDSCx3QkFBQztBQUFELENBQUMsQUFyVUQsSUFxVUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWVyZ2VNYXAsIGZpbmFsaXplIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgVXBsb2FkRmlsZSwgVXBsb2FkT3V0cHV0LCBVcGxvYWRJbnB1dCwgVXBsb2FkU3RhdHVzLCBCbG9iRmlsZSB9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBodW1hbml6ZUJ5dGVzKGJ5dGVzOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoYnl0ZXMgPT09IDApIHtcbiAgICByZXR1cm4gJzAgQnl0ZSc7XG4gIH1cblxuICBjb25zdCBrID0gMTAyNDtcbiAgY29uc3Qgc2l6ZXM6IHN0cmluZ1tdID0gWydCeXRlcycsICdLQicsICdNQicsICdHQicsICdUQicsICdQQiddO1xuICBjb25zdCBpOiBudW1iZXIgPSBNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKTtcblxuICByZXR1cm4gcGFyc2VGbG9hdCgoYnl0ZXMgLyBNYXRoLnBvdyhrLCBpKSkudG9GaXhlZCgyKSkgKyAnICcgKyBzaXplc1tpXTtcbn1cblxuZXhwb3J0IGNsYXNzIE5nVXBsb2FkZXJTZXJ2aWNlIHtcbiAgcXVldWU6IFVwbG9hZEZpbGVbXTtcbiAgc2VydmljZUV2ZW50czogRXZlbnRFbWl0dGVyPFVwbG9hZE91dHB1dD47XG4gIHVwbG9hZFNjaGVkdWxlcjogU3ViamVjdDx7IGZpbGU6IFVwbG9hZEZpbGUsIGV2ZW50OiBVcGxvYWRJbnB1dCB9PjtcbiAgc3ViczogeyBpZDogc3RyaW5nLCBzdWI6IFN1YnNjcmlwdGlvbiB9W107XG4gIGNvbnRlbnRUeXBlczogc3RyaW5nW107XG4gIG1heFVwbG9hZHM6IG51bWJlcjtcbiAgbWF4RmlsZVNpemU6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBjb25jdXJyZW5jeTogbnVtYmVyID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxuICAgIGNvbnRlbnRUeXBlczogc3RyaW5nW10gPSBbJyonXSxcbiAgICBtYXhVcGxvYWRzOiBudW1iZXIgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgbWF4RmlsZVNpemU6IG51bWJlciA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWVxuICApIHtcbiAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgdGhpcy5zZXJ2aWNlRXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjxVcGxvYWRPdXRwdXQ+KCk7XG4gICAgdGhpcy51cGxvYWRTY2hlZHVsZXIgPSBuZXcgU3ViamVjdCgpO1xuICAgIHRoaXMuc3VicyA9IFtdO1xuICAgIHRoaXMuY29udGVudFR5cGVzID0gY29udGVudFR5cGVzO1xuICAgIHRoaXMubWF4VXBsb2FkcyA9IG1heFVwbG9hZHM7XG4gICAgdGhpcy5tYXhGaWxlU2l6ZSA9IG1heEZpbGVTaXplO1xuXG4gICAgdGhpcy51cGxvYWRTY2hlZHVsZXJcbiAgICAgIC5waXBlKFxuICAgICAgICBtZXJnZU1hcCh1cGxvYWQgPT4gdGhpcy5zdGFydFVwbG9hZCh1cGxvYWQpLCBjb25jdXJyZW5jeSlcbiAgICAgIClcbiAgICAgIC5zdWJzY3JpYmUodXBsb2FkT3V0cHV0ID0+IHRoaXMuc2VydmljZUV2ZW50cy5lbWl0KHVwbG9hZE91dHB1dCkpO1xuICB9XG5cbiAgaGFuZGxlRmlsZXMoaW5jb21pbmdGaWxlczogRmlsZUxpc3QpOiB2b2lkIHtcbiAgICBjb25zdCBhbGxvd2VkSW5jb21pbmdGaWxlczogRmlsZVtdID0gW10ucmVkdWNlLmNhbGwoaW5jb21pbmdGaWxlcywgKGFjYzogRmlsZVtdLCBjaGVja0ZpbGU6IEZpbGUsIGk6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgZnV0dXJlUXVldWVMZW5ndGggPSBhY2MubGVuZ3RoICsgdGhpcy5xdWV1ZS5sZW5ndGggKyAxO1xuICAgICAgaWYgKHRoaXMuaXNDb250ZW50VHlwZUFsbG93ZWQoY2hlY2tGaWxlLnR5cGUpICYmIGZ1dHVyZVF1ZXVlTGVuZ3RoIDw9IHRoaXMubWF4VXBsb2FkcyAmJiB0aGlzLmlzRmlsZVNpemVBbGxvd2VkKGNoZWNrRmlsZS5zaXplKSkge1xuICAgICAgICBhY2MgPSBhY2MuY29uY2F0KGNoZWNrRmlsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCByZWplY3RlZEZpbGU6IFVwbG9hZEZpbGUgPSB0aGlzLm1ha2VVcGxvYWRGaWxlKGNoZWNrRmlsZSwgaSk7XG4gICAgICAgIHRoaXMuc2VydmljZUV2ZW50cy5lbWl0KHsgdHlwZTogJ3JlamVjdGVkJywgZmlsZTogcmVqZWN0ZWRGaWxlIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIFtdKTtcblxuICAgIHRoaXMucXVldWUucHVzaCguLi5bXS5tYXAuY2FsbChhbGxvd2VkSW5jb21pbmdGaWxlcywgKGZpbGU6IEZpbGUsIGk6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgdXBsb2FkRmlsZTogVXBsb2FkRmlsZSA9IHRoaXMubWFrZVVwbG9hZEZpbGUoZmlsZSwgaSk7XG4gICAgICB0aGlzLnNlcnZpY2VFdmVudHMuZW1pdCh7IHR5cGU6ICdhZGRlZFRvUXVldWUnLCBmaWxlOiB1cGxvYWRGaWxlIH0pO1xuICAgICAgcmV0dXJuIHVwbG9hZEZpbGU7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5zZXJ2aWNlRXZlbnRzLmVtaXQoeyB0eXBlOiAnYWxsQWRkZWRUb1F1ZXVlJyB9KTtcbiAgfVxuXG4gIGluaXRJbnB1dEV2ZW50cyhpbnB1dDogRXZlbnRFbWl0dGVyPFVwbG9hZElucHV0Pik6IFN1YnNjcmlwdGlvbiB7XG4gICAgcmV0dXJuIGlucHV0LnN1YnNjcmliZSgoZXZlbnQ6IFVwbG9hZElucHV0KSA9PiB7XG4gICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgY2FzZSAndXBsb2FkRmlsZSc6XG4gICAgICAgICAgY29uc3QgdXBsb2FkRmlsZUluZGV4ID0gdGhpcy5xdWV1ZS5maW5kSW5kZXgoZmlsZSA9PiBmaWxlID09PSBldmVudC5maWxlKTtcbiAgICAgICAgICBpZiAodXBsb2FkRmlsZUluZGV4ICE9PSAtMSAmJiBldmVudC5maWxlKSB7XG4gICAgICAgICAgICB0aGlzLnVwbG9hZFNjaGVkdWxlci5uZXh0KHsgZmlsZTogdGhpcy5xdWV1ZVt1cGxvYWRGaWxlSW5kZXhdLCBldmVudDogZXZlbnQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd1cGxvYWRBbGwnOlxuICAgICAgICAgIGNvbnN0IGZpbGVzID0gdGhpcy5xdWV1ZS5maWx0ZXIoZmlsZSA9PiBmaWxlLnByb2dyZXNzLnN0YXR1cyA9PT0gVXBsb2FkU3RhdHVzLlF1ZXVlKTtcbiAgICAgICAgICBmaWxlcy5mb3JFYWNoKGZpbGUgPT4gdGhpcy51cGxvYWRTY2hlZHVsZXIubmV4dCh7IGZpbGU6IGZpbGUsIGV2ZW50OiBldmVudCB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NhbmNlbCc6XG4gICAgICAgICAgY29uc3QgaWQgPSBldmVudC5pZCB8fCBudWxsO1xuICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qgc3VicyA9IHRoaXMuc3Vicy5maWx0ZXIoc3ViID0+IHN1Yi5pZCA9PT0gaWQpO1xuICAgICAgICAgIHN1YnMuZm9yRWFjaChzdWIgPT4ge1xuICAgICAgICAgICAgaWYgKHN1Yi5zdWIpIHtcbiAgICAgICAgICAgICAgc3ViLnN1Yi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICBjb25zdCBmaWxlSW5kZXggPSB0aGlzLnF1ZXVlLmZpbmRJbmRleChmaWxlID0+IGZpbGUuaWQgPT09IGlkKTtcbiAgICAgICAgICAgICAgaWYgKGZpbGVJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnF1ZXVlW2ZpbGVJbmRleF0ucHJvZ3Jlc3Muc3RhdHVzID0gVXBsb2FkU3RhdHVzLkNhbmNlbGxlZDtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VFdmVudHMuZW1pdCh7IHR5cGU6ICdjYW5jZWxsZWQnLCBmaWxlOiB0aGlzLnF1ZXVlW2ZpbGVJbmRleF0gfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY2FuY2VsQWxsJzpcbiAgICAgICAgICB0aGlzLnN1YnMuZm9yRWFjaChzdWIgPT4ge1xuICAgICAgICAgICAgaWYgKHN1Yi5zdWIpIHtcbiAgICAgICAgICAgICAgc3ViLnN1Yi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5xdWV1ZS5maW5kKHVwbG9hZEZpbGUgPT4gdXBsb2FkRmlsZS5pZCA9PT0gc3ViLmlkKTtcbiAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgIGZpbGUucHJvZ3Jlc3Muc3RhdHVzID0gVXBsb2FkU3RhdHVzLkNhbmNlbGxlZDtcbiAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlRXZlbnRzLmVtaXQoeyB0eXBlOiAnY2FuY2VsbGVkJywgZmlsZTogZmlsZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVtb3ZlJzpcbiAgICAgICAgICBpZiAoIWV2ZW50LmlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaSA9IHRoaXMucXVldWUuZmluZEluZGV4KGZpbGUgPT4gZmlsZS5pZCA9PT0gZXZlbnQuaWQpO1xuICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMucXVldWVbaV07XG4gICAgICAgICAgICB0aGlzLnF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHRoaXMuc2VydmljZUV2ZW50cy5lbWl0KHsgdHlwZTogJ3JlbW92ZWQnLCBmaWxlOiBmaWxlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVtb3ZlQWxsJzpcbiAgICAgICAgICBpZiAodGhpcy5xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuc2VydmljZUV2ZW50cy5lbWl0KHsgdHlwZTogJ3JlbW92ZWRBbGwnIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXJ0VXBsb2FkKHVwbG9hZDogeyBmaWxlOiBVcGxvYWRGaWxlLCBldmVudDogVXBsb2FkSW5wdXQgfSk6IE9ic2VydmFibGU8VXBsb2FkT3V0cHV0PiB7XG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKG9ic2VydmVyID0+IHtcbiAgICAgIGNvbnN0IHN1YiA9IHRoaXMudXBsb2FkRmlsZSh1cGxvYWQuZmlsZSwgdXBsb2FkLmV2ZW50KVxuICAgICAgICAucGlwZShmaW5hbGl6ZSgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFvYnNlcnZlci5jbG9zZWQpIHtcbiAgICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgICAgLnN1YnNjcmliZShvdXRwdXQgPT4ge1xuICAgICAgICAgIG9ic2VydmVyLm5leHQob3V0cHV0KTtcbiAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICBvYnNlcnZlci5lcnJvcihlcnIpO1xuICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgdGhpcy5zdWJzLnB1c2goeyBpZDogdXBsb2FkLmZpbGUuaWQsIHN1Yjogc3ViIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgdXBsb2FkRmlsZShmaWxlOiBVcGxvYWRGaWxlLCBldmVudDogVXBsb2FkSW5wdXQpOiBPYnNlcnZhYmxlPFVwbG9hZE91dHB1dD4ge1xuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnNlcnZlciA9PiB7XG4gICAgICBjb25zdCB1cmwgPSBldmVudC51cmwgfHwgJyc7XG4gICAgICBjb25zdCBtZXRob2QgPSBldmVudC5tZXRob2QgfHwgJ1BPU1QnO1xuICAgICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGEgfHwge307XG4gICAgICBjb25zdCBoZWFkZXJzID0gZXZlbnQuaGVhZGVycyB8fCB7fTtcblxuICAgICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICBjb25zdCB0aW1lOiBudW1iZXIgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIGxldCBwcm9ncmVzc1N0YXJ0VGltZTogbnVtYmVyID0gKGZpbGUucHJvZ3Jlc3MuZGF0YSAmJiBmaWxlLnByb2dyZXNzLmRhdGEuc3RhcnRUaW1lKSB8fCB0aW1lO1xuICAgICAgbGV0IHNwZWVkID0gMDtcbiAgICAgIGxldCBldGE6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICB4aHIudXBsb2FkLmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgKGU6IFByb2dyZXNzRXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgIGNvbnN0IHBlcmNlbnRhZ2UgPSBNYXRoLnJvdW5kKChlLmxvYWRlZCAqIDEwMCkgLyBlLnRvdGFsKTtcbiAgICAgICAgICBjb25zdCBkaWZmID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aW1lO1xuICAgICAgICAgIHNwZWVkID0gTWF0aC5yb3VuZChlLmxvYWRlZCAvIGRpZmYgKiAxMDAwKTtcbiAgICAgICAgICBwcm9ncmVzc1N0YXJ0VGltZSA9IChmaWxlLnByb2dyZXNzLmRhdGEgJiYgZmlsZS5wcm9ncmVzcy5kYXRhLnN0YXJ0VGltZSkgfHwgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgZXRhID0gTWF0aC5jZWlsKChlLnRvdGFsIC0gZS5sb2FkZWQpIC8gc3BlZWQpO1xuXG4gICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IHtcbiAgICAgICAgICAgIHN0YXR1czogVXBsb2FkU3RhdHVzLlVwbG9hZGluZyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcGVyY2VudGFnZTogcGVyY2VudGFnZSxcbiAgICAgICAgICAgICAgc3BlZWQ6IHNwZWVkLFxuICAgICAgICAgICAgICBzcGVlZEh1bWFuOiBgJHtodW1hbml6ZUJ5dGVzKHNwZWVkKX0vc2AsXG4gICAgICAgICAgICAgIHN0YXJ0VGltZTogcHJvZ3Jlc3NTdGFydFRpbWUsXG4gICAgICAgICAgICAgIGVuZFRpbWU6IG51bGwsXG4gICAgICAgICAgICAgIGV0YTogZXRhLFxuICAgICAgICAgICAgICBldGFIdW1hbjogdGhpcy5zZWNvbmRzVG9IdW1hbihldGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIG9ic2VydmVyLm5leHQoeyB0eXBlOiAndXBsb2FkaW5nJywgZmlsZTogZmlsZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICB4aHIudXBsb2FkLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGU6IEV2ZW50KSA9PiB7XG4gICAgICAgIG9ic2VydmVyLmVycm9yKGUpO1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgfSk7XG5cbiAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gWE1MSHR0cFJlcXVlc3QuRE9ORSkge1xuICAgICAgICAgIGNvbnN0IHNwZWVkQXZlcmFnZSA9IE1hdGgucm91bmQoZmlsZS5zaXplIC8gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gcHJvZ3Jlc3NTdGFydFRpbWUpICogMTAwMCk7XG4gICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IHtcbiAgICAgICAgICAgIHN0YXR1czogVXBsb2FkU3RhdHVzLkRvbmUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHBlcmNlbnRhZ2U6IDEwMCxcbiAgICAgICAgICAgICAgc3BlZWQ6IHNwZWVkQXZlcmFnZSxcbiAgICAgICAgICAgICAgc3BlZWRIdW1hbjogYCR7aHVtYW5pemVCeXRlcyhzcGVlZEF2ZXJhZ2UpfS9zYCxcbiAgICAgICAgICAgICAgc3RhcnRUaW1lOiBwcm9ncmVzc1N0YXJ0VGltZSxcbiAgICAgICAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgICAgICAgIGV0YTogZXRhLFxuICAgICAgICAgICAgICBldGFIdW1hbjogdGhpcy5zZWNvbmRzVG9IdW1hbihldGEgfHwgMClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZmlsZS5yZXNwb25zZVN0YXR1cyA9IHhoci5zdGF0dXM7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZmlsZS5yZXNwb25zZSA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBmaWxlLnJlc3BvbnNlID0geGhyLnJlc3BvbnNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZpbGUucmVzcG9uc2VIZWFkZXJzID0gdGhpcy5wYXJzZVJlc3BvbnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpO1xuXG4gICAgICAgICAgb2JzZXJ2ZXIubmV4dCh7IHR5cGU6ICdkb25lJywgZmlsZTogZmlsZSB9KTtcblxuICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHhoci5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSBldmVudC53aXRoQ3JlZGVudGlhbHMgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHVwbG9hZEZpbGUgPSA8QmxvYkZpbGU+ZmlsZS5uYXRpdmVGaWxlO1xuICAgICAgICBjb25zdCB1cGxvYWRJbmRleCA9IHRoaXMucXVldWUuZmluZEluZGV4KG91dEZpbGUgPT4gb3V0RmlsZS5uYXRpdmVGaWxlID09PSB1cGxvYWRGaWxlKTtcblxuICAgICAgICBpZiAodGhpcy5xdWV1ZVt1cGxvYWRJbmRleF0ucHJvZ3Jlc3Muc3RhdHVzID09PSBVcGxvYWRTdGF0dXMuQ2FuY2VsbGVkKSB7XG4gICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5rZXlzKGhlYWRlcnMpLmZvckVhY2goa2V5ID0+IHhoci5zZXRSZXF1ZXN0SGVhZGVyKGtleSwgaGVhZGVyc1trZXldKSk7XG5cbiAgICAgICAgbGV0IGJvZHlUb1NlbmQ6IEZvcm1EYXRhIHwgQmxvYkZpbGU7XG5cbiAgICAgICAgaWYgKGV2ZW50LmluY2x1ZGVXZWJLaXRGb3JtQm91bmRhcnkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChrZXkgPT4gZmlsZS5mb3JtLmFwcGVuZChrZXksIGRhdGFba2V5XSkpO1xuICAgICAgICAgIGZpbGUuZm9ybS5hcHBlbmQoZXZlbnQuZmllbGROYW1lIHx8ICdmaWxlJywgdXBsb2FkRmlsZSwgdXBsb2FkRmlsZS5uYW1lKTtcbiAgICAgICAgICBib2R5VG9TZW5kID0gZmlsZS5mb3JtO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJvZHlUb1NlbmQgPSB1cGxvYWRGaWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlRXZlbnRzLmVtaXQoeyB0eXBlOiAnc3RhcnQnLCBmaWxlOiBmaWxlIH0pO1xuICAgICAgICB4aHIuc2VuZChib2R5VG9TZW5kKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgc2Vjb25kc1RvSHVtYW4oc2VjOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZShzZWMgKiAxMDAwKS50b0lTT1N0cmluZygpLnN1YnN0cigxMSwgOCk7XG4gIH1cblxuICBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgfVxuXG4gIHNldENvbnRlbnRUeXBlcyhjb250ZW50VHlwZXM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiBjb250ZW50VHlwZXMgIT09ICd1bmRlZmluZWQnICYmIGNvbnRlbnRUeXBlcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBpZiAoY29udGVudFR5cGVzLmZpbmQoKHR5cGU6IHN0cmluZykgPT4gdHlwZSA9PT0gJyonKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuY29udGVudFR5cGVzID0gWycqJ107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbnRlbnRUeXBlcyA9IGNvbnRlbnRUeXBlcztcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb250ZW50VHlwZXMgPSBbJyonXTtcbiAgfVxuXG4gIGFsbENvbnRlbnRUeXBlc0FsbG93ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY29udGVudFR5cGVzLmZpbmQoKHR5cGU6IHN0cmluZykgPT4gdHlwZSA9PT0gJyonKSAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgaXNDb250ZW50VHlwZUFsbG93ZWQobWltZXR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLmFsbENvbnRlbnRUeXBlc0FsbG93ZWQoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbnRlbnRUeXBlcy5maW5kKCh0eXBlOiBzdHJpbmcpID0+IHR5cGUgPT09IG1pbWV0eXBlKSAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgaXNGaWxlU2l6ZUFsbG93ZWQoZmlsZVNpemU6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5tYXhGaWxlU2l6ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmaWxlU2l6ZSA8PSB0aGlzLm1heEZpbGVTaXplO1xuICB9XG5cbiAgbWFrZVVwbG9hZEZpbGUoZmlsZTogRmlsZSwgaW5kZXg6IG51bWJlcik6IFVwbG9hZEZpbGUge1xuICAgIHJldHVybiB7XG4gICAgICBmaWxlSW5kZXg6IGluZGV4LFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgc2l6ZTogZmlsZS5zaXplLFxuICAgICAgdHlwZTogZmlsZS50eXBlLFxuICAgICAgZm9ybTogbmV3IEZvcm1EYXRhKCksXG4gICAgICBwcm9ncmVzczoge1xuICAgICAgICBzdGF0dXM6IFVwbG9hZFN0YXR1cy5RdWV1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHBlcmNlbnRhZ2U6IDAsXG4gICAgICAgICAgc3BlZWQ6IDAsXG4gICAgICAgICAgc3BlZWRIdW1hbjogYCR7aHVtYW5pemVCeXRlcygwKX0vc2AsXG4gICAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxuICAgICAgICAgIGVuZFRpbWU6IG51bGwsXG4gICAgICAgICAgZXRhOiBudWxsLFxuICAgICAgICAgIGV0YUh1bWFuOiBudWxsXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBsYXN0TW9kaWZpZWREYXRlOiBuZXcgRGF0ZShmaWxlLmxhc3RNb2RpZmllZCksXG4gICAgICBzdWI6IHVuZGVmaW5lZCxcbiAgICAgIG5hdGl2ZUZpbGU6IGZpbGVcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVJlc3BvbnNlSGVhZGVycyhodHRwSGVhZGVyczogc3RyaW5nKSB7XG4gICAgaWYgKCFodHRwSGVhZGVycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBodHRwSGVhZGVycy5zcGxpdCgnXFxuJylcbiAgICAgIC5tYXAoKHg6IHN0cmluZykgPT4geC5zcGxpdCgvOiAqLywgMikpXG4gICAgICAuZmlsdGVyKCh4OiBzdHJpbmdbXSkgPT4geFswXSlcbiAgICAgIC5yZWR1Y2UoKGFjYzogT2JqZWN0LCB4OiBzdHJpbmdbXSkgPT4ge1xuICAgICAgICBhY2NbeFswXV0gPSB4WzFdO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSwge30pO1xuICB9XG59XG4iXX0=