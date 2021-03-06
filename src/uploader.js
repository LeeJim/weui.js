(function ($) {
    const oldFnUploader = $.fn.uploader;

    $.fn.uploader = function (options) {
        options = $.extend({
            title: '图片上传',
            maxCount: 4,
            compress: true,
            maxWidth: 500,
            auto: true,
            field: 'file',
            url: '/upload.php',
            method: 'POST',
            accept: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
            headers: {},

            // event
            onChange: $.noop, // alias `onAddedFile`
            onAddedFile: $.noop,
            onRemovedfile: $.noop,
            onError: $.noop,
            onSuccess: $.noop,
            onComplete: $.noop

        }, options);

        const html = `<div class="weui-uploader">
                        <div class="weui-uploader__hd">
                            <div class="weui-uploader__title">${options.title}</div>
                            <div class="weui-uploader__info">0/${options.maxCount}</div>
                        </div>
                        <div class="weui-uploader__bd">
                            <ul class="weui-uploader__files">
                            </ul>
                            <div class="weui-uploader__input-box">
                                <input class="weui-uploader__input" type="file" accept="${options.accept.join(',')}">
                            </div>
                        </div>
                    </div>`;
        this.html(html);

        const $uploader = this;
        const $files = this.find('.weui-uploader__files');
        const $file = this.find('.weui-uploader__input');
        let blobs = [];

        /**
         * dataURI to blob, ref to https://gist.github.com/fupslot/5015897
         * @param dataURI
         */
        function dataURItoBlob(dataURI) {
            var byteString = atob(dataURI.split(',')[1]);
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], {type: mimeString});
        }

        /**
         * error
         */
        function error(index) {
            const $preview = $files.find('.weui-uploader__file').eq(index);
            $preview.addClass('weui-uploader__file_status');
            $preview.html(`<div class="weui-uploader__file-content"><i class="weui-icon-warn"></i></div>`);
        }

        /**
         * success
         */
       function success(index,res) {
            var $preview = $files.find('.weui-uploader__file_status').eq(index);
            $preview.removeClass('weui-uploader__file-content');
            $preview.html('');
            var $preview1 = $files.find('.weui-uploader__file').eq(index);
            $preview1.html('<input name="weui_uploader__file" value="' + res + '" type="hidden" />');
        }

        /**
         * update
         * @param msg
         */
        function update(msg) {
            const $preview = $files.find('.weui-uploader__file').last();
            $preview.addClass('weui-uploader__file_status');
            $preview.html(`<div class="weui-uploader__file-content">${msg}</div>`);
        }

        /**
         * 上传
         */
        function upload(file, index) {
            const fd = new FormData();
            fd.append(options.field, file.blob, file.name);
            $.ajax({
                type: options.method,
                url: options.url,
                data: fd,
                processData: false,
                contentType: false
            }).success((res) => {
                success(index,res);
                options.onSuccess(res);
            }).error((err) => {
                error(index);
                options.onError(err);
            }).always(() => {
                options.onComplete();
            });
        }

        $file.on('change', function (event) {
            const files = event.target.files;

            if (files.length === 0) {
                return;
            }

            if (blobs.length >= options.maxCount) {
                return;
            }

            $.each(files, (idx, file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        // 不要超出最大宽度
                        const w = options.compress ? Math.min(options.maxWidth, img.width) : img.width;
                        // 高度按比例计算
                        const h = img.height * (w / img.width);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        // 设置 canvas 的宽度和高度
                        canvas.width = w;
                        canvas.height = h;

                        const iphone = navigator.userAgent.match(/iPhone OS ([^\s]*)/);
                        if (iphone && iphone[1].substr(0, 1) == 7) {
                            if (img.width == 3264 && img.height == 2448) { // IOS7的拍照或选照片会被莫名地压缩，所以画板要height要*2
                                ctx.drawImage(img, 0, 0, w, h * 2);
                            } else {
                                ctx.drawImage(img, 0, 0, w, h);
                            }
                        } else {
                            ctx.drawImage(img, 0, 0, w, h);
                        }

                        const dataURL = canvas.toDataURL();
                        const blob = dataURItoBlob(dataURL);
                        blobs.push({name: file.name, blob: blob});
                        const blobUrl = URL.createObjectURL(blob);

                        $files.append(`<li class="weui-uploader__file " style="background-image:url(${blobUrl})"></li>`);
                        //$uploader.find('.weui-uploader__hd .weui-cell__ft').text(`${blobs.length}/${options.maxCount}`);
                         $('.weui-uploader__info').last().text(blobs.length + '/' + options.maxCount);
                        
                        // trigger onAddedfile event
                        options.onAddedFile({
                            lastModified: file.lastModified,
                            lastModifiedDate: file.lastModifiedDate,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: dataURL, // rename to `dataURL`, data will be remove later
                            dataURL: dataURL
                        });

                        // 如果是自动上传
                        if (options.auto) {
                            upload({name: file.name, blob: blob}, blobs.length - 1);
                        }

                        // 如果数量达到最大, 隐藏起选择文件按钮
                        if (blobs.length >= options.maxCount) {
                            $uploader.find('.weui-uploader__input-box').hide();
                        }
                    };

                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        });

        this.on('click', '.weui-uploader__file', () => {
            $.weui.confirm('确定删除该图片?', () => {
                const index = $(this).index();
                this.remove(index);
            });
        });

        /**
         * 主动调用上传
         */
        this.upload = function () {
            // 逐个上传
            blobs.map(upload);
        };

        /**
         * 删除第 ${index} 张图片
         * @param index
         */
        this.remove = function (index) {
            const $preview = $files.find('.weui-uploader__file').eq(index);
            $preview.remove();
            blobs.splice(index, 1);
            options.onRemovedfile(index);

            // 如果数量达到最大, 隐藏起选择文件按钮
            if (blobs.length < options.maxCount) {
                $uploader.find('.weui-uploader__input-box').show();
            }
            // 重新统计数量
            $('.weui-uploader__info').last().text(blobs.length + '/' + options.maxCount);
        };

        return this;
    };
    $.fn.uploader.noConflict = function () {
        return oldFnUploader;
    };
})($);
